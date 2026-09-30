/**
 * ORUME 3D — Operational Sync v3
 *
 * Companion module for the existing Orume backend.
 * It DOES NOT define doGet/doPost, so it can be added to the current Apps Script
 * without replacing the web app handlers that already power catalog/admin/quotes.
 *
 * Responsibilities:
 *  - convert pending Checkouts into Pedidos + Itens do Pedido;
 *  - upsert Clientes from Pedidos;
 *  - recalculate customer order count / lifetime order value;
 *  - deduplicate by checkout ID / site ID and normalized WhatsApp;
 *  - run every minute through an installable time trigger.
 */

const ORUS_SPREADSHEET_ID = '1794QUx2drPZuuyUpuB8fBowGiUzJ-3L34qa_NwLPp1M';
const ORUS_TRIGGER_HANDLER = 'orusSyncTick_';

const ORUS_SHEETS = Object.freeze({
  orders: 'Pedidos',
  items: 'Itens do Pedido',
  clients: 'Clientes',
  checkouts: 'Checkouts',
  config: 'Config',
  history: 'Histórico',
  logs: 'Logs',
});

/**
 * Run ONCE from the Apps Script editor after pasting this file.
 * It removes older sync triggers, installs a 1-minute trigger, and runs a first sync.
 */
function orusInstallSync_() {
  orusRemoveSyncTriggers_();
  ScriptApp.newTrigger(ORUS_TRIGGER_HANDLER)
    .timeBased()
    .everyMinutes(1)
    .create();

  const result = orusSyncNow_();
  Logger.log(JSON.stringify(result));
  return result;
}

/** Run manually whenever you want an immediate synchronization. */
function orusSyncNow_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);

  try {
    const checkoutResult = orusSyncPendingCheckouts_();
    const clientResult = orusSyncClientsFromOrders_();

    return {
      ok: true,
      version: 3,
      checkouts: checkoutResult,
      clients: clientResult,
      at: new Date().toISOString(),
    };
  } finally {
    lock.releaseLock();
  }
}

/** Time-driven trigger entrypoint. */
function orusSyncTick_() {
  try {
    orusSyncNow_();
  } catch (error) {
    orusLog_(
      'Sincronização',
      'Erro',
      'Sistema',
      '',
      'Apps Script',
      'Falha na sincronização operacional',
      orusErrorMessage_(error)
    );
    console.error(error);
  }
}

/** Optional helper if you ever want to disable the automatic synchronization. */
function orusUninstallSync_() {
  const removed = orusRemoveSyncTriggers_();
  return { ok: true, removed: removed };
}

function orusRemoveSyncTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === ORUS_TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(trigger);
      removed += 1;
    }
  });

  return removed;
}

/**
 * Converts every checkout without "ID Pedido" into the operational order tables.
 * Safe to run repeatedly: ID Checkout is used as Pedidos -> ID Site.
 */
function orusSyncPendingCheckouts_() {
  const checkoutSheet = orusSheet_(ORUS_SHEETS.checkouts);
  const checkoutData = checkoutSheet.getDataRange().getValues();

  if (checkoutData.length < 2) {
    return { scanned: 0, created: 0, linked: 0, failed: 0 };
  }

  const headers = checkoutData[0];
  const hm = orusHeaderMap_(headers);
  const required = [
    'ID Checkout',
    'Criado em',
    'Atualizado em',
    'Status',
    'Nome',
    'WhatsApp',
    'CEP',
    'Cidade / UF',
    'Carrinho JSON',
    'Subtotal',
    'Frete',
    'Total',
    'Forma de pagamento',
    'ID Pedido',
    'Origem',
    'Último erro',
    'UID Pedido',
    'Email',
    'Forma de entrega',
    'Atendimento clean?',
    'Observações',
    'Resumo dos itens',
  ];

  orusRequireHeaders_(ORUS_SHEETS.checkouts, hm, required);

  let created = 0;
  let linked = 0;
  let failed = 0;
  let scanned = 0;

  for (let r = 1; r < checkoutData.length; r += 1) {
    const row = checkoutData[r];
    const checkoutId = orusString_(row[hm['ID Checkout']]);

    if (!checkoutId) continue;
    scanned += 1;

    const existingOrderId = row[hm['ID Pedido']];
    if (existingOrderId !== '' && existingOrderId !== null) continue;

    try {
      const existingOrder = orusFindOrderBySiteId_(checkoutId);

      if (existingOrder) {
        orusUpdateCheckoutLink_(
          checkoutSheet,
          r + 1,
          hm,
          existingOrder.id,
          existingOrder.uid,
          'Convertido em pedido',
          ''
        );
        linked += 1;
        continue;
      }

      const checkout = orusRowObject_(headers, row);
      const createdOrder = orusCreateOrderFromCheckout_(checkout);

      orusUpdateCheckoutLink_(
        checkoutSheet,
        r + 1,
        hm,
        createdOrder.id,
        createdOrder.uid,
        'Convertido em pedido',
        ''
      );

      created += 1;
    } catch (error) {
      failed += 1;
      const message = orusErrorMessage_(error);
      orusUpdateCheckoutLink_(checkoutSheet, r + 1, hm, '', '', 'Erro', message);
      orusLog_(
        'Checkout',
        'Erro',
        'Checkout',
        checkoutId,
        'Sync v3',
        'Falha ao converter checkout em pedido',
        message
      );
    }
  }

  return { scanned: scanned, created: created, linked: linked, failed: failed };
}

function orusCreateOrderFromCheckout_(checkout) {
  const checkoutId = orusString_(checkout['ID Checkout']);
  if (!checkoutId) throw new Error('Checkout sem ID.');

  const cart = orusParseCart_(checkout['Carrinho JSON']);
  const now = new Date();
  const createdAt = orusAsDate_(checkout['Criado em']) || now;
  const orderId = orusAllocateOrderId_();
  const uid = Utilities.getUuid();

  const quantity = cart.reduce(function (sum, item) {
    return sum + orusNumber_(item.quantity);
  }, 0);

  const productSummary =
    cart.length === 1
      ? orusString_(cart[0].name) || 'Produto do catálogo'
      : cart.length > 1
        ? cart.length + ' itens do catálogo'
        : orusString_(checkout['Resumo dos itens']) || 'Pedido do catálogo';

  const total = orusNumber_(checkout['Total'] || checkout['Subtotal']);
  const phone = orusNormalizePhone_(checkout['WhatsApp']);

  const order = {
    'ID': orderId,
    'ID Site': checkoutId,
    'Criado em': createdAt,
    'Atualizado em': now,
    'Status': 'Novo',
    'Prioridade': 'Normal',
    'Nome do Cliente': orusString_(checkout['Nome']),
    'WhatsApp': phone,
    'Cidade / UF': orusString_(checkout['Cidade / UF']),
    'CEP': orusString_(checkout['CEP']),
    'Indicado por': '',
    'Produto / Peça': productSummary,
    'Quantidade': quantity || 1,
    'Medidas aproximadas': '',
    'Cor': '',
    'Material': '',
    'Prazo desejado': '',
    'Links / Referências': '',
    'Detalhes do projeto': 'Pedido criado a partir do checkout ' + checkoutId,
    'Forma de entrega': orusString_(checkout['Forma de entrega']) || 'A combinar',
    'Atendimento clean?': orusBooleanText_(checkout['Atendimento clean?']),
    'Observações': orusString_(checkout['Observações']),
    'Valor a cobrar': total,
    'Valor pago': 0,
    'Saldo': total,
    'Forma de pagamento': orusString_(checkout['Forma de pagamento']) || 'Pix',
    'Status pagamento': total > 0 ? 'Pendente' : '',
    'Rastreio': '',
    'Origem': orusString_(checkout['Origem']) || 'Site ORUME',
    'Concluído em': '',
    'Último erro': '',
    'UID Interno': uid,
  };

  orusAppendObject_(orusSheet_(ORUS_SHEETS.orders), order);
  orusReplaceOrderItems_(orderId, uid, cart);

  orusUpsertClient_({
    id: '',
    name: order['Nome do Cliente'],
    phone: phone,
    email: orusString_(checkout['Email']),
    cep: order['CEP'],
    cityUf: order['Cidade / UF'],
    serviceState: 'pedido_aberto',
    origin: order['Origem'],
    createdAt: createdAt,
    updatedAt: now,
  });

  orusRefreshClientStats_(phone);

  orusLog_(
    'Checkout',
    'Convertido',
    'Pedido',
    orderId,
    'Sync v3',
    'Checkout convertido em pedido #' + orusPadOrderId_(orderId),
    checkoutId
  );

  return { id: orderId, uid: uid };
}

function orusUpdateCheckoutLink_(sheet, rowNumber, hm, orderId, uid, status, errorMessage) {
  const now = new Date();
  const updates = {};
  updates['Atualizado em'] = now;
  updates['Status'] = status;
  updates['ID Pedido'] = orderId;
  updates['UID Pedido'] = uid;
  updates['Último erro'] = errorMessage || '';

  Object.keys(updates).forEach(function (header) {
    const index = hm[header];
    if (index === undefined) return;
    sheet.getRange(rowNumber, index + 1).setValue(updates[header]);
  });
}

/**
 * Rebuilds/upserts Clientes from Pedidos.
 * Existing address details entered by n8n/manual work are preserved.
 */
function orusSyncClientsFromOrders_() {
  const orderSheet = orusSheet_(ORUS_SHEETS.orders);
  const values = orderSheet.getDataRange().getValues();
  if (values.length < 2) return { orders: 0, customers: 0, skipped: 0 };

  const headers = values[0];
  const hm = orusHeaderMap_(headers);
  orusRequireHeaders_(ORUS_SHEETS.orders, hm, [
    'ID',
    'Criado em',
    'Atualizado em',
    'Status',
    'Nome do Cliente',
    'WhatsApp',
    'Cidade / UF',
    'CEP',
    'Valor a cobrar',
    'Origem',
  ]);

  const groups = {};
  let skipped = 0;

  for (let r = 1; r < values.length; r += 1) {
    const order = orusRowObject_(headers, values[r]);
    const id = orusString_(order['ID']);
    if (!id) continue;

    const phone = orusNormalizePhone_(order['WhatsApp']);
    if (!phone) {
      skipped += 1;
      continue;
    }

    if (!groups[phone]) groups[phone] = [];
    groups[phone].push(order);
  }

  const phones = Object.keys(groups);

  phones.forEach(function (phone) {
    const orders = groups[phone].slice().sort(function (a, b) {
      return orusDateMs_(a['Criado em']) - orusDateMs_(b['Criado em']);
    });

    const latest = orders[orders.length - 1];
    const firstDate = orusAsDate_(orders[0]['Criado em']) || new Date();
    const lastDate = orusAsDate_(latest['Criado em']) || firstDate;

    orusUpsertClient_({
      id: '',
      name: orusString_(latest['Nome do Cliente']),
      phone: phone,
      email: '',
      cep: orusString_(latest['CEP']),
      cityUf: orusString_(latest['Cidade / UF']),
      serviceState: orusServiceStateFromOrderStatus_(latest['Status']),
      origin: orusString_(latest['Origem']) || 'Orume',
      createdAt: firstDate,
      updatedAt: orusAsDate_(latest['Atualizado em']) || new Date(),
    });

    orusRefreshClientStats_(phone);
  });

  return {
    orders: values.length - 1,
    customers: phones.length,
    skipped: skipped,
  };
}

function orusUpsertClient_(client) {
  const sheet = orusSheet_(ORUS_SHEETS.clients);
  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const hm = orusHeaderMap_(headers);

  orusRequireHeaders_(ORUS_SHEETS.clients, hm, [
    'ID Cliente',
    'Nome',
    'WhatsApp',
    'Email',
    'CEP',
    'Cidade / UF',
    'Primeiro pedido',
    'Último pedido',
    'Pedidos',
    'Total comprado',
    'Observações',
    'Estado Atendimento',
    'Rua',
    'Bairro',
    'Número da Casa',
    'Cidade',
    'Estado',
    'Origem Cadastro',
    'Criado em',
    'Atualizado em',
  ]);

  const phone = orusNormalizePhone_(client.phone);
  if (!phone) return null;

  let targetRow = 0;
  let existing = null;

  for (let r = 1; r < values.length; r += 1) {
    const rowPhone = orusNormalizePhone_(values[r][hm['WhatsApp']]);
    if (rowPhone && rowPhone === phone) {
      targetRow = r + 1;
      existing = orusRowObject_(headers, values[r]);
      break;
    }
  }

  const now = new Date();
  const split = orusSplitCityUf_(client.cityUf);
  const current = existing || {};

  const object = {
    'ID Cliente':
      orusString_(current['ID Cliente']) ||
      orusString_(client.id) ||
      'CLI-' + phone,
    'Nome': orusString_(client.name) || orusString_(current['Nome']),
    'WhatsApp': phone,
    'Email': orusString_(client.email) || orusString_(current['Email']),
    'CEP': orusString_(client.cep) || orusString_(current['CEP']),
    'Cidade / UF': orusString_(client.cityUf) || orusString_(current['Cidade / UF']),
    'Primeiro pedido': current['Primeiro pedido'] || '',
    'Último pedido': current['Último pedido'] || '',
    'Pedidos': current['Pedidos'] || 0,
    'Total comprado': current['Total comprado'] || 0,
    'Observações': orusString_(current['Observações']),
    'Estado Atendimento':
      orusString_(client.serviceState) || orusString_(current['Estado Atendimento']),
    'Rua': orusString_(client.street) || orusString_(current['Rua']),
    'Bairro': orusString_(client.neighborhood) || orusString_(current['Bairro']),
    'Número da Casa': orusString_(client.houseNumber) || orusString_(current['Número da Casa']),
    'Cidade': orusString_(client.city) || split.city || orusString_(current['Cidade']),
    'Estado': orusString_(client.state) || split.state || orusString_(current['Estado']),
    'Origem Cadastro':
      orusString_(client.origin) || orusString_(current['Origem Cadastro']) || 'Orume',
    'Criado em':
      current['Criado em'] ||
      orusAsDate_(client.createdAt) ||
      now,
    'Atualizado em': orusAsDate_(client.updatedAt) || now,
  };

  if (targetRow) {
    orusWriteObjectToRow_(sheet, targetRow, headers, object);
  } else {
    orusAppendObject_(sheet, object);
    targetRow = sheet.getLastRow();
  }

  return { row: targetRow, phone: phone, id: object['ID Cliente'] };
}

function orusRefreshClientStats_(phoneInput) {
  const phone = orusNormalizePhone_(phoneInput);
  if (!phone) return;

  const orderSheet = orusSheet_(ORUS_SHEETS.orders);
  const orderValues = orderSheet.getDataRange().getValues();
  if (orderValues.length < 2) return;

  const oh = orderValues[0];
  const om = orusHeaderMap_(oh);
  const matching = [];

  for (let r = 1; r < orderValues.length; r += 1) {
    const rowPhone = orusNormalizePhone_(orderValues[r][om['WhatsApp']]);
    if (rowPhone === phone) matching.push(orusRowObject_(oh, orderValues[r]));
  }

  if (!matching.length) return;

  matching.sort(function (a, b) {
    return orusDateMs_(a['Criado em']) - orusDateMs_(b['Criado em']);
  });

  const valid = matching.filter(function (order) {
    return orusString_(order['Status']) !== 'Cancelado';
  });

  const total = valid.reduce(function (sum, order) {
    return sum + orusNumber_(order['Valor a cobrar']);
  }, 0);

  const clientSheet = orusSheet_(ORUS_SHEETS.clients);
  const clientValues = clientSheet.getDataRange().getValues();
  const ch = clientValues[0];
  const cm = orusHeaderMap_(ch);

  for (let r = 1; r < clientValues.length; r += 1) {
    if (orusNormalizePhone_(clientValues[r][cm['WhatsApp']]) !== phone) continue;

    const updates = {
      'Primeiro pedido': orusAsDate_(matching[0]['Criado em']) || '',
      'Último pedido': orusAsDate_(matching[matching.length - 1]['Criado em']) || '',
      'Pedidos': valid.length,
      'Total comprado': total,
      'Atualizado em': new Date(),
    };

    orusWriteObjectToRow_(clientSheet, r + 1, ch, updates);
    return;
  }
}

function orusReplaceOrderItems_(orderId, uid, cart) {
  const sheet = orusSheet_(ORUS_SHEETS.items);
  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const hm = orusHeaderMap_(headers);

  orusRequireHeaders_(ORUS_SHEETS.items, hm, [
    'ID Pedido',
    'Linha',
    'ID Produto',
    'SKU',
    'Produto',
    'Variação',
    'Quantidade',
    'Preço unitário',
    'Total',
    'Observações',
    'UID Pedido',
  ]);

  for (let r = values.length - 1; r >= 1; r -= 1) {
    const rowOrderId = orusString_(values[r][hm['ID Pedido']]);
    const rowUid = orusString_(values[r][hm['UID Pedido']]);
    if (rowOrderId === orusString_(orderId) || (uid && rowUid === uid)) {
      sheet.deleteRow(r + 1);
    }
  }

  cart.forEach(function (item, index) {
    const image = orusString_(item.image);
    orusAppendObject_(sheet, {
      'ID Pedido': orderId,
      'Linha': index + 1,
      'ID Produto': orusNumber_(item.id) || '',
      'SKU': orusString_(item.sku),
      'Produto': orusString_(item.name),
      'Variação': orusString_(item.variant || item.variation),
      'Quantidade': orusNumber_(item.quantity) || 1,
      'Preço unitário': orusNumber_(item.unitPrice || item.price),
      'Total': orusNumber_(item.total) ||
        (orusNumber_(item.quantity) * orusNumber_(item.unitPrice || item.price)),
      'Observações': image ? 'Imagem: ' + image : '',
      'UID Pedido': uid,
    });
  });
}

function orusFindOrderBySiteId_(siteId) {
  const sheet = orusSheet_(ORUS_SHEETS.orders);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  const headers = values[0];
  const hm = orusHeaderMap_(headers);

  for (let r = 1; r < values.length; r += 1) {
    if (orusString_(values[r][hm['ID Site']]) === orusString_(siteId)) {
      return {
        row: r + 1,
        id: values[r][hm['ID']],
        uid: orusString_(values[r][hm['UID Interno']]),
      };
    }
  }

  return null;
}

function orusAllocateOrderId_() {
  const sheet = orusSheet_(ORUS_SHEETS.orders);
  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const hm = orusHeaderMap_(headers);
  const used = {};

  for (let r = 1; r < values.length; r += 1) {
    const id = Number(values[r][hm['ID']]);
    if (Number.isInteger(id) && id >= 0 && id <= 1000) used[id] = true;
  }

  let next = orusConfigNumber_('NEXT_ORDER_ID', 0);
  if (next < 0 || next > 1000) next = 0;

  for (let offset = 0; offset <= 1000; offset += 1) {
    const candidate = (next + offset) % 1001;
    if (!used[candidate]) {
      orusSetConfig_('NEXT_ORDER_ID', (candidate + 1) % 1001);
      return candidate;
    }
  }

  const archived = orusArchiveOldestClosedOrder_();
  if (archived === null) {
    throw new Error('Todos os IDs 0000–1000 estão ocupados e não há pedido concluído/cancelado para arquivar.');
  }

  orusSetConfig_('NEXT_ORDER_ID', (archived + 1) % 1001);
  return archived;
}

function orusArchiveOldestClosedOrder_() {
  const orderSheet = orusSheet_(ORUS_SHEETS.orders);
  const values = orderSheet.getDataRange().getValues();
  if (values.length < 2) return null;

  const headers = values[0];
  const hm = orusHeaderMap_(headers);
  let chosen = null;

  for (let r = 1; r < values.length; r += 1) {
    const status = orusString_(values[r][hm['Status']]);
    if (status !== 'Concluído' && status !== 'Cancelado') continue;

    const dateMs =
      orusDateMs_(values[r][hm['Concluído em']]) ||
      orusDateMs_(values[r][hm['Atualizado em']]) ||
      orusDateMs_(values[r][hm['Criado em']]);

    if (!chosen || dateMs < chosen.dateMs) {
      chosen = {
        row: r + 1,
        id: Number(values[r][hm['ID']]),
        uid: orusString_(values[r][hm['UID Interno']]),
        dateMs: dateMs,
        rowValues: values[r],
      };
    }
  }

  if (!chosen) return null;

  const history = orusSheet_(ORUS_SHEETS.history);
  const historyHeaders = history.getDataRange().getValues()[0] || [];
  const object = orusRowObject_(headers, chosen.rowValues);
  orusAppendObject_(history, object);

  const itemSheet = orusSheet_(ORUS_SHEETS.items);
  const itemValues = itemSheet.getDataRange().getValues();
  if (itemValues.length > 1) {
    const ih = itemValues[0];
    const im = orusHeaderMap_(ih);
    for (let r = itemValues.length - 1; r >= 1; r -= 1) {
      if (
        orusString_(itemValues[r][im['UID Pedido']]) === chosen.uid ||
        orusString_(itemValues[r][im['ID Pedido']]) === orusString_(chosen.id)
      ) {
        itemSheet.deleteRow(r + 1);
      }
    }
  }

  orderSheet.deleteRow(chosen.row);
  orusLog_(
    'Pedido',
    'Arquivado',
    'Pedido',
    chosen.id,
    'Sync v3',
    'Pedido arquivado para liberar ID visual',
    chosen.uid
  );

  return chosen.id;
}

function orusConfigNumber_(key, fallback) {
  const sheet = orusSheet_(ORUS_SHEETS.config);
  const values = sheet.getDataRange().getValues();

  for (let r = 0; r < values.length; r += 1) {
    if (orusString_(values[r][0]) === key) {
      const n = Number(values[r][1]);
      return Number.isFinite(n) ? n : fallback;
    }
  }

  return fallback;
}

function orusSetConfig_(key, value) {
  const sheet = orusSheet_(ORUS_SHEETS.config);
  const values = sheet.getDataRange().getValues();

  for (let r = 0; r < values.length; r += 1) {
    if (orusString_(values[r][0]) === key) {
      sheet.getRange(r + 1, 2).setValue(value);
      return;
    }
  }

  sheet.appendRow([key, value]);
}

function orusLog_(type, action, entity, id, origin, summary, details) {
  try {
    const sheet = orusSheet_(ORUS_SHEETS.logs);
    orusAppendObject_(sheet, {
      'Data/Hora': new Date(),
      'Tipo': type,
      'Ação': action,
      'Entidade': entity,
      'ID': id,
      'Usuário / origem': origin,
      'Resumo': summary,
      'Detalhes': details,
    });
  } catch (error) {
    console.error('Falha ao gravar log', error);
  }
}

function orusSheet_(name) {
  const ss = SpreadsheetApp.openById(ORUS_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Aba não encontrada: ' + name);
  return sheet;
}

function orusAppendObject_(sheet, object) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(object, header) ? object[header] : '';
  });
  sheet.appendRow(row);
}

function orusWriteObjectToRow_(sheet, rowNumber, headers, object) {
  Object.keys(object).forEach(function (header) {
    const index = headers.indexOf(header);
    if (index === -1) return;
    sheet.getRange(rowNumber, index + 1).setValue(object[header]);
  });
}

function orusHeaderMap_(headers) {
  const map = {};
  headers.forEach(function (header, index) {
    const key = orusString_(header);
    if (key) map[key] = index;
  });
  return map;
}

function orusRequireHeaders_(sheetName, map, required) {
  const missing = required.filter(function (header) {
    return map[header] === undefined;
  });

  if (missing.length) {
    throw new Error(
      'Aba "' + sheetName + '" sem as colunas obrigatórias: ' + missing.join(', ')
    );
  }
}

function orusRowObject_(headers, row) {
  const object = {};
  headers.forEach(function (header, index) {
    if (header !== '') object[String(header)] = row[index];
  });
  return object;
}

function orusParseCart_(raw) {
  if (Array.isArray(raw)) return raw;

  const text = orusString_(raw);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function orusNormalizePhone_(value) {
  let digits = orusString_(value).replace(/\D/g, '');
  if (!digits) return '';

  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = '55' + digits;
  }

  return digits;
}

function orusSplitCityUf_(value) {
  const text = orusString_(value);
  if (!text) return { city: '', state: '' };

  const match = text.match(/^\s*(.*?)\s*[\/\-]\s*([A-Za-z]{2})\s*$/);
  if (!match) return { city: text, state: '' };

  return {
    city: match[1].trim(),
    state: match[2].trim().toUpperCase(),
  };
}

function orusServiceStateFromOrderStatus_(statusInput) {
  const status = orusString_(statusInput);

  if (status === 'Orçamento' || status === 'Aguardando aprovação') return 'orçamento';
  if (status === 'Concluído' || status === 'Cancelado') return 'finalizado';
  if (status === 'Novo' || status === 'Aguardando pagamento') return 'pedido_aberto';
  if (status === 'Na fila' || status === 'Produção' || status === 'Pronto') return 'atendimento';

  return 'atendimento';
}

function orusBooleanText_(value) {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';

  const text = orusString_(value).toLowerCase();
  if (['sim', 'true', '1', 'yes'].indexOf(text) !== -1) return 'Sim';
  if (['não', 'nao', 'false', '0', 'no'].indexOf(text) !== -1) return 'Não';

  return text ? orusString_(value) : 'Não';
}

function orusPadOrderId_(id) {
  return ('0000' + String(id)).slice(-4);
}

function orusAsDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (!value) return null;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function orusDateMs_(value) {
  const date = orusAsDate_(value);
  return date ? date.getTime() : 0;
}

function orusNumber_(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const text = orusString_(value)
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');

  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function orusString_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function orusErrorMessage_(error) {
  if (!error) return 'Erro desconhecido';
  if (error && error.message) return String(error.message);
  return String(error);
}
