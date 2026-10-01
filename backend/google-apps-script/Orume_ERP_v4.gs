/**
 * ORUME 3D — ERP v4 (módulo complementar)
 *
 * REQUER o arquivo Orume_Operational_Sync_v3.gs no mesmo projeto Apps Script.
 * Não declara doGet/doPost. O Web App atual permanece intocado.
 *
 * O v4 adiciona:
 * - formulários internos (pedido, cliente, pagamento, produto);
 * - administração de pedido pela aba Administração;
 * - timestamps e histórico de status;
 * - CRM e deduplicação de clientes por WhatsApp/e-mail;
 * - consulta de CEP via ViaCEP;
 * - pagamentos como fonte do valor pago/saldo;
 * - estoque físico/reservado/disponível + movimentos idempotentes;
 * - integração da Calculadora com Pedido e Histórico de Preços;
 * - atualização de campos derivados e links de ação.
 */

const ORV4_SPREADSHEET_ID = '1IGZ0KY2J5E87qdl4Gza3w0v_Tz_vsESCH9EHMGZtPoI';
const ORV4_SYNC_HANDLER = 'orv4SyncTick_';
const ORV4_EDIT_HANDLER = 'orv4OnEdit_';
const ORV4_OPEN_HANDLER = 'orv4OnOpen_';

const ORV4_SHEETS = Object.freeze({
  orders: 'Pedidos',
  products: 'Produtos',
  items: 'Itens do Pedido',
  clients: 'Clientes',
  payments: 'Pagamentos',
  media: 'Mídias',
  config: 'Config',
  logs: 'Logs',
  checkouts: 'Checkouts',
  admin: 'Administração',
  newOrder: 'Novo Pedido',
  newClient: 'Novo Cliente',
  newPayment: 'Novo Pagamento',
  newProduct: 'Novo Produto',
  calculator: 'Calculadora de Preços',
  priceHistory: 'Histórico de Preços',
  statusHistory: 'Histórico de Status',
  stockMoves: 'Movimentações de Estoque',
  dashboard: 'Dashboard',
});

const ORV4_RESERVE_STATUSES = Object.freeze([
  'Aguardando pagamento',
  'Na fila',
  'Produção',
  'Pronto',
]);

/** Execute UMA VEZ após adicionar v3 + v4 ao projeto. */
function orv4Install_() {
  orv4RemoveTriggers_();

  const ss = SpreadsheetApp.openById(ORV4_SPREADSHEET_ID);
  ScriptApp.newTrigger(ORV4_SYNC_HANDLER).timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger(ORV4_EDIT_HANDLER).forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger(ORV4_OPEN_HANDLER).forSpreadsheet(ss).onOpen().create();

  orv4OnOpen_();
  const result = orv4SyncNow_();
  ss.toast('ERP v4 instalado e sincronizado.', 'Orume ERP', 6);
  return result;
}

function orv4Uninstall_() {
  return { ok: true, removed: orv4RemoveTriggers_() };
}

function orv4RemoveTriggers_() {
  const handlers = [ORV4_SYNC_HANDLER, ORV4_EDIT_HANDLER, ORV4_OPEN_HANDLER, 'orusSyncTick_'];
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (handlers.indexOf(trigger.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(trigger);
      removed += 1;
    }
  });
  return removed;
}

function orv4OnOpen_() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Orume ERP')
      .addItem('🏠 Abrir Dashboard', 'orv4OpenDashboard_')
      .addItem('⚡ Central de Ações', 'orv4OpenActions_')
      .addSeparator()
      .addItem('🔄 Sincronizar agora', 'orv4MenuSync_')
      .addItem('📦 Atualizar estoque', 'orv4MenuInventory_')
      .addItem('👥 Atualizar CRM', 'orv4MenuClients_')
      .addToUi();
  } catch (error) {
    console.error(error);
  }
}

function orv4OpenDashboard_() {
  SpreadsheetApp.openById(ORV4_SPREADSHEET_ID).getSheetByName('Dashboard').activate();
}

function orv4OpenActions_() {
  SpreadsheetApp.openById(ORV4_SPREADSHEET_ID).getSheetByName('Central de Ações').activate();
}

function orv4MenuSync_() {
  const result = orv4SyncNow_();
  SpreadsheetApp.getActive().toast('Sincronização concluída: ' + JSON.stringify(result.summary), 'Orume ERP', 8);
}

function orv4MenuInventory_() {
  orv4SyncInventory_();
  SpreadsheetApp.getActive().toast('Estoque atualizado.', 'Orume ERP', 5);
}

function orv4MenuClients_() {
  orv4RefreshAllClients_();
  SpreadsheetApp.getActive().toast('CRM atualizado.', 'Orume ERP', 5);
}

function orv4SyncTick_() {
  try {
    orv4SyncNow_();
  } catch (error) {
    orusLog_('ERP v4', 'Erro', 'Sistema', '', 'Trigger', 'Falha no sync v4', orusErrorMessage_(error));
    console.error(error);
  }
}

function orv4SyncNow_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const checkout = orusSyncPendingCheckouts_();
    const clientBase = orusSyncClientsFromOrders_();
    orv4NormalizePhones_();
    const orders = orv4RefreshAllOrders_();
    const inventory = orv4SyncInventory_();
    const clients = orv4RefreshAllClients_();
    const checkouts = orv4RefreshCheckoutDiagnostics_();
    return {
      ok: true,
      version: 4,
      summary: { checkout: checkout.created || 0, orders: orders, clients: clients, products: inventory.products },
      checkout: checkout,
      clientBase: clientBase,
      at: new Date().toISOString(),
    };
  } finally {
    lock.releaseLock();
  }
}

function orv4OnEdit_(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const name = sheet.getName();
  const row = e.range.getRow();
  const col = e.range.getColumn();
  const value = e.value;

  try {
    if (name === ORV4_SHEETS.newOrder && e.range.getA1Notation() === 'C24' && value === 'TRUE') {
      orv4CreateOrderFromForm_();
      return;
    }
    if (name === ORV4_SHEETS.newClient && e.range.getA1Notation() === 'C19' && value === 'TRUE') {
      orv4SaveClientForm_();
      return;
    }
    if (name === ORV4_SHEETS.newPayment && e.range.getA1Notation() === 'C17' && value === 'TRUE') {
      orv4SavePaymentForm_();
      return;
    }
    if (name === ORV4_SHEETS.newProduct && e.range.getA1Notation() === 'C23' && value === 'TRUE') {
      orv4SaveProductForm_();
      return;
    }
    if (name === ORV4_SHEETS.calculator) {
      if (e.range.getA1Notation() === 'B28' && value === 'TRUE') {
        orv4ApplyCalculatorToOrder_();
        return;
      }
      if (e.range.getA1Notation() === 'B29' && value === 'TRUE') {
        orv4SavePriceSnapshot_();
        return;
      }
    }
    if (name === ORV4_SHEETS.admin) {
      if (e.range.getA1Notation() === 'C5') {
        orv4AdminLoad_(e.range.getValue());
        return;
      }
      const adminActions = {
        B35: 'save',
        E35: 'complete',
        H35: 'cancel',
        K35: 'duplicate',
        N35: 'reopen',
      };
      const action = adminActions[e.range.getA1Notation()];
      if (action && value === 'TRUE') {
        orv4AdminAction_(action, e.range);
        return;
      }
    }

    if (name === ORV4_SHEETS.orders && row >= 2) {
      orv4HandleOrderEdit_(row, col, e.oldValue, e.value);
      return;
    }
    if (name === ORV4_SHEETS.clients && row >= 2) {
      orv4HandleClientEdit_(row, col);
      return;
    }
    if (name === ORV4_SHEETS.payments && row >= 2) {
      const orderId = sheet.getRange(row, 2).getValue();
      if (orderId !== '') orv4RecalcOrderFinancials_(orderId);
      return;
    }
    if (name === ORV4_SHEETS.items && row >= 2) {
      orv4RefreshItemRow_(row);
      orv4SyncInventory_();
      return;
    }
    if (name === ORV4_SHEETS.products && row >= 2) {
      orv4RefreshProductRow_(row);
      return;
    }
  } catch (error) {
    try {
      e.range.setNote('Erro ERP v4: ' + orusErrorMessage_(error));
      SpreadsheetApp.getActive().toast(orusErrorMessage_(error), 'Erro Orume ERP', 8);
    } catch (_) {}
    orusLog_('ERP v4', 'Erro', name, row, 'onEdit', 'Falha ao processar edição', orusErrorMessage_(error));
    console.error(error);
  }
}

// ----------------------------
// Formulários internos
// ----------------------------

function orv4CreateOrderFromForm_() {
  const sheet = orusSheet_(ORV4_SHEETS.newOrder);
  try {
    const v = sheet.getRange('C6:C22').getValues().flat();
    const name = orusString_(v[0]);
    const phone = orusNormalizePhone_(v[1]);
    let cityUf = orusString_(v[2]);
    const cep = orusString_(v[3]);
    const product = orusString_(v[4]);
    const quantity = Math.max(1, orusNumber_(v[5]) || 1);
    const material = orusString_(v[6]);
    const delivery = orusString_(v[7]);
    const priority = orusString_(v[8]) || 'Normal';
    const channel = orusString_(v[9]) || 'WhatsApp';
    const deadline = v[10];
    const nextAction = orusString_(v[11]);
    const nextActionDate = v[12];
    const amount = orusNumber_(v[13]);
    const referral = orusString_(v[14]);
    const recordType = orusString_(v[15]) || 'Orçamento';
    const notes = orusString_(v[16]);

    if (!name || !phone || !product) throw new Error('Preencha nome, WhatsApp e produto.');
    if (!cityUf && cep) {
      const address = orv4LookupCep_(cep);
      if (address) cityUf = [address.localidade, address.uf].filter(Boolean).join('/');
    }

    const now = new Date();
    const id = orusAllocateOrderId_();
    const uid = Utilities.getUuid();
    const status = recordType === 'Pedido' ? (amount > 0 ? 'Aguardando pagamento' : 'Novo') : 'Orçamento';
    const siteId = 'MANUAL-' + Utilities.getUuid().slice(0, 12).toUpperCase();

    const order = {
      'ID': id,
      'ID Site': siteId,
      'Criado em': now,
      'Atualizado em': now,
      'Status': status,
      'Prioridade': priority,
      'Nome do Cliente': name,
      'WhatsApp': phone,
      'Cidade / UF': cityUf,
      'CEP': cep,
      'Indicado por': referral,
      'Produto / Peça': product,
      'Quantidade': quantity,
      'Medidas aproximadas': '',
      'Cor': '',
      'Material': material,
      'Prazo desejado': deadline || '',
      'Links / Referências': '',
      'Detalhes do projeto': '',
      'Forma de entrega': delivery || 'A combinar',
      'Atendimento clean?': 'Não',
      'Observações': notes,
      'Valor a cobrar': amount,
      'Valor pago': 0,
      'Saldo': amount,
      'Forma de pagamento': 'Pix',
      'Status pagamento': amount > 0 ? 'Pendente' : '',
      'Rastreio': '',
      'Origem': 'Planilha',
      'Concluído em': '',
      'Último erro': '',
      'UID Interno': uid,
      'Responsável': '',
      'Próxima ação': nextAction || orv4DefaultNextAction_(status),
      'Data próxima ação': nextActionDate || '',
      'Prazo interno': deadline || '',
      'Início status': now,
      'Canal': channel,
      'Pedido Shopee': '',
      'Complexidade': '',
      'Impressora': orv4ConfigString_('DEFAULT_PRINTER', 'Bambu Lab X2D'),
      'Custo estimado': 0,
      'Frete cobrado': 0,
      'Custo real do frete': 0,
      'Tipo registro': recordType,
    };

    orusAppendObject_(orusSheet_(ORV4_SHEETS.orders), order);
    const orderRow = orusSheet_(ORV4_SHEETS.orders).getLastRow();
    orv4SetOrderDerivedFormulas_(orderRow);

    orusAppendObject_(orusSheet_(ORV4_SHEETS.items), {
      'ID Pedido': id,
      'Linha': 1,
      'ID Produto': '',
      'SKU': '',
      'Produto': product,
      'Variação': '',
      'Quantidade': quantity,
      'Preço unitário': quantity ? amount / quantity : amount,
      'Total': amount,
      'Observações': notes,
      'UID Pedido': uid,
      'Imagem': '',
      'Custo unitário': 0,
      'Custo total': 0,
      'Status item': 'Pendente',
      'Produzido?': 'Não',
      'Reservado em estoque?': 'Não',
    });

    orv4UpsertClientExtended_({
      name: name, phone: phone, email: '', cep: cep, cityUf: cityUf,
      origin: channel, serviceState: orusServiceStateFromOrderStatus_(status),
      nextAction: nextAction, nextActionDate: nextActionDate,
    });
    orv4TrackStatusTransition_(id, '', status, 'Formulário Novo Pedido');
    orv4RefreshOrderDerivedById_(id);
    orv4ClearForm_(sheet, 'C6:C22', 'C24');
    sheet.getRange('C11').setValue(1);
    sheet.getRange('C12').setValue('PLA');
    sheet.getRange('C13').setValue('A combinar');
    sheet.getRange('C14').setValue('Normal');
    sheet.getRange('C15').setValue('WhatsApp');
    sheet.getRange('C17').setValue('Enviar orçamento');
    sheet.getRange('C21').setValue('Orçamento');
    SpreadsheetApp.getActive().toast('Pedido #' + orusPadOrderId_(id) + ' criado.', 'Orume ERP', 6);
  } finally {
    sheet.getRange('C24').setValue(false);
  }
}

function orv4SaveClientForm_() {
  const sheet = orusSheet_(ORV4_SHEETS.newClient);
  try {
    const v = sheet.getRange('C6:C16').getValues().flat();
    const name = orusString_(v[0]);
    const phone = orusNormalizePhone_(v[1]);
    const email = orusString_(v[2]).toLowerCase();
    const cep = orusString_(v[3]);
    let cityUf = orusString_(v[4]);
    const type = orusString_(v[5]) || 'Consumidor';
    const channel = orusString_(v[6]) || 'WhatsApp';
    const partner = orusString_(v[7]);
    const nextAction = orusString_(v[8]);
    const nextDate = v[9];
    const notes = orusString_(v[10]);
    if (!name || (!phone && !email)) throw new Error('Informe nome e WhatsApp ou e-mail.');

    const addr = cep ? orv4LookupCep_(cep) : null;
    if (!cityUf && addr) cityUf = [addr.localidade, addr.uf].filter(Boolean).join('/');

    const result = orv4UpsertClientExtended_({
      name, phone, email, cep, cityUf, type, channel, partner, nextAction, nextActionDate: nextDate,
      notes, street: addr && addr.logradouro, neighborhood: addr && addr.bairro,
      city: addr && addr.localidade, state: addr && addr.uf,
      origin: channel, serviceState: 'cadastro_concluido',
    });
    orv4ClearForm_(sheet, 'C6:C16', 'C19');
    sheet.getRange('C11').setValue('Consumidor');
    sheet.getRange('C12').setValue('WhatsApp');
    sheet.getRange('C14').setValue('Nenhuma');
    SpreadsheetApp.getActive().toast('Cliente salvo: ' + result.id, 'Orume ERP', 5);
  } finally {
    sheet.getRange('C19').setValue(false);
  }
}

function orv4SavePaymentForm_() {
  const sheet = orusSheet_(ORV4_SHEETS.newPayment);
  try {
    const v = sheet.getRange('C6:C14').getValues().flat();
    const orderId = v[0];
    const type = orusString_(v[1]) || 'Pix';
    const amount = orusNumber_(v[2]);
    const status = orusString_(v[3]) || 'Pago';
    const channel = orusString_(v[4]) || 'WhatsApp';
    const reference = orusString_(v[5]);
    const proof = orusString_(v[6]);
    const responsible = orusString_(v[7]);
    const notes = orusString_(v[8]);
    if (orderId === '' || amount <= 0) throw new Error('Informe pedido e valor do pagamento.');

    const orderInfo = orv4GetOrderById_(orderId);
    if (!orderInfo) throw new Error('Pedido não encontrado.');
    const now = new Date();
    const paymentId = 'PAY-' + Utilities.getUuid().slice(0, 12).toUpperCase();
    orusAppendObject_(orusSheet_(ORV4_SHEETS.payments), {
      'ID Pagamento': paymentId,
      'ID Pedido': orderInfo.order['ID'],
      'Criado em': now,
      'Tipo': type,
      'Valor': amount,
      'Status': status,
      'Referência externa': reference,
      'Confirmado em': status === 'Pago' || status === 'Parcial' ? now : '',
      'Observações': notes,
      'UID Pedido': orderInfo.order['UID Interno'],
      'Canal': channel,
      'Comprovante / URL': proof,
      'Responsável': responsible,
      'Conciliado?': 'Não',
      'Saldo após pagamento': '',
      'Atualizado em': now,
    });
    orv4RecalcOrderFinancials_(orderInfo.order['ID']);
    const refreshed = orv4GetOrderById_(orderInfo.order['ID']);
    const paySheet = orusSheet_(ORV4_SHEETS.payments);
    const last = paySheet.getLastRow();
    const ph = orusHeaderMap_(paySheet.getRange(1, 1, 1, paySheet.getLastColumn()).getValues()[0]);
    paySheet.getRange(last, ph['Saldo após pagamento'] + 1).setValue(orusNumber_(refreshed.order['Saldo']));

    orv4ClearForm_(sheet, 'C6:C14', 'C17');
    sheet.getRange('C7').setValue('Pix');
    sheet.getRange('C9').setValue('Pago');
    sheet.getRange('C10').setValue('WhatsApp');
    SpreadsheetApp.getActive().toast('Pagamento registrado e saldo recalculado.', 'Orume ERP', 6);
  } finally {
    sheet.getRange('C17').setValue(false);
  }
}

function orv4SaveProductForm_() {
  const sheet = orusSheet_(ORV4_SHEETS.newProduct);
  try {
    const v = sheet.getRange('C6:C19').getValues().flat();
    const name = orusString_(v[0]);
    const sku = orusString_(v[1]);
    const category = orusString_(v[2]) || 'Utilidades';
    const description = orusString_(v[3]);
    const price = orusNumber_(v[4]);
    const salePrice = orusNumber_(v[5]);
    const physical = Math.max(0, orusNumber_(v[6]));
    const minStock = Math.max(0, orusNumber_(v[7]));
    const productionDays = Math.max(0, orusNumber_(v[8]));
    const modality = orusString_(v[9]) || 'Sob encomenda';
    const shopee = orusString_(v[10]);
    const image = orusString_(v[11]);
    const channel = orusString_(v[12]) || 'Shopee';
    const notes = orusString_(v[13]);
    if (!name) throw new Error('Informe o nome do produto.');

    const productSheet = orusSheet_(ORV4_SHEETS.products);
    const data = productSheet.getDataRange().getValues();
    const hm = orusHeaderMap_(data[0]);
    let maxId = 0;
    for (let r = 1; r < data.length; r += 1) maxId = Math.max(maxId, Number(data[r][hm['ID Produto']]) || 0);
    const id = maxId + 1;
    const now = new Date();
    const available = physical;
    orusAppendObject_(productSheet, {
      'ID Produto': id,
      'SKU': sku,
      'Ativo?': 'Sim',
      'Destaque?': 'Não',
      'Nome': name,
      'Slug': orv4Slug_(name),
      'Categoria': category,
      'Descrição': description,
      'Preço': price,
      'Preço promocional': salePrice,
      'Estoque': modality === 'Pronta entrega' ? available : 999,
      'Produção (dias)': productionDays,
      'URL Shopee': shopee,
      'Imagem principal': image,
      'Observações admin': notes,
      'Atualizado em': now,
      'Estoque físico': physical,
      'Reservado': 0,
      'Disponível': available,
      'Estoque mínimo': minStock,
      'Status estoque': modality === 'Sob encomenda' ? 'SOB ENCOMENDA' : (available <= 0 ? 'SEM ESTOQUE' : available <= minStock ? 'BAIXO' : 'OK'),
      'Modalidade': modality,
      'Vendas concluídas': 0,
      'Receita': 0,
      'Custo unitário estimado': 0,
      'Margem estimada': '',
      'Última venda': '',
      'Repor?': modality === 'Pronta entrega' && available <= minStock ? 'Sim' : 'Não',
      'Canal principal': channel,
    });
    orv4ClearForm_(sheet, 'C6:C19', 'C23');
    sheet.getRange('C8').setValue('Utilidades');
    sheet.getRange('C11').setValue(0);
    sheet.getRange('C12').setValue(0);
    sheet.getRange('C13').setValue(orv4ConfigNumber_('LOW_STOCK_DEFAULT', 3));
    sheet.getRange('C14').setValue(2);
    sheet.getRange('C15').setValue('Sob encomenda');
    sheet.getRange('C18').setValue('Shopee');
    SpreadsheetApp.getActive().toast('Produto #' + id + ' criado.', 'Orume ERP', 5);
  } finally {
    sheet.getRange('C23').setValue(false);
  }
}

function orv4ClearForm_(sheet, rangeA1, actionA1) {
  sheet.getRange(rangeA1).clearContent();
  sheet.getRange(actionA1).setValue(false);
}

// ----------------------------
// Administração
// ----------------------------

function orv4AdminLoad_(orderId) {
  const admin = orusSheet_(ORV4_SHEETS.admin);
  if (orderId === '' || orderId === null) {
    orv4AdminClear_();
    return;
  }
  const info = orv4GetOrderById_(orderId);
  if (!info) throw new Error('Pedido não encontrado.');
  const o = info.order;
  const map = {
    C7: o['Status'], C8: o['Prioridade'], C9: o['Nome do Cliente'], C10: o['WhatsApp'], C11: o['Cidade / UF'],
    C12: o['CEP'], C13: o['Produto / Peça'], C14: o['Quantidade'], C15: o['Cor'], C16: o['Material'],
    C17: o['Prazo desejado'], C18: o['Forma de entrega'], C19: o['Atendimento clean?'], C20: o['Indicado por'],
    C21: o['Valor a cobrar'], C22: o['Valor pago'], C23: o['Forma de pagamento'], C24: o['Status pagamento'], C25: o['Rastreio'],
    J7: o['Responsável'], J8: o['Próxima ação'], J9: o['Data próxima ação'], J10: o['Prazo interno'], J11: o['Canal'],
    J12: o['Pedido Shopee'], J13: o['Complexidade'], J14: o['Impressora'], J15: o['Frete cobrado'], J16: o['Custo real do frete'],
    J17: o['Custo estimado'], J18: o['Custo real'], J19: o['Lucro real'], J20: o['Margem real'], J21: o['Tipo registro'], J22: o['Atualizado em'],
    A28: o['Observações'], H28: o['Detalhes do projeto'],
  };
  Object.keys(map).forEach(function (a1) { admin.getRange(a1).setValue(map[a1] === undefined ? '' : map[a1]); });
  ['B35','E35','H35','K35','N35'].forEach(function(a1) { admin.getRange(a1).setValue(false); });
}

function orv4AdminClear_() {
  const admin = orusSheet_(ORV4_SHEETS.admin);
  ['C7:C25', 'J7:J22', 'A28', 'H28'].forEach(function (a1) { admin.getRange(a1).clearContent(); });
  ['B35','E35','H35','K35','N35'].forEach(function(a1) { admin.getRange(a1).setValue(false); });
}

function orv4AdminAction_(action, actionRange) {
  const admin = orusSheet_(ORV4_SHEETS.admin);
  try {
    const orderId = admin.getRange('C5').getValue();
    if (orderId === '') throw new Error('Selecione um pedido em C5.');
    if ((action === 'complete' || action === 'cancel') && !orv4ConfirmSecondClick_(action, orderId)) {
      SpreadsheetApp.getActive().toast('Marque novamente em até 30 segundos para confirmar: ' + action.toUpperCase(), 'Confirmação', 7);
      return;
    }
    if (action === 'save') orv4AdminSave_(orderId);
    if (action === 'complete') orv4SetOrderStatus_(orderId, 'Concluído', 'Administração');
    if (action === 'cancel') orv4SetOrderStatus_(orderId, 'Cancelado', 'Administração');
    if (action === 'duplicate') orv4DuplicateOrder_(orderId);
    if (action === 'reopen') orv4SetOrderStatus_(orderId, 'Aguardando aprovação', 'Administração - reaberto');
    orv4AdminLoad_(orderId);
  } finally {
    actionRange.setValue(false);
  }
}

function orv4ConfirmSecondClick_(action, orderId) {
  const props = PropertiesService.getUserProperties();
  const key = 'ORV4_CONFIRM_' + action + '_' + orderId;
  const now = Date.now();
  const previous = Number(props.getProperty(key) || 0);
  if (previous && now - previous <= 30000) {
    props.deleteProperty(key);
    return true;
  }
  props.setProperty(key, String(now));
  return false;
}

function orv4AdminSave_(orderId) {
  const admin = orusSheet_(ORV4_SHEETS.admin);
  const info = orv4GetOrderById_(orderId);
  if (!info) throw new Error('Pedido não encontrado.');
  const oldStatus = orusString_(info.order['Status']);
  const newStatus = orusString_(admin.getRange('C7').getValue()) || oldStatus;
  const object = {
    'Status': newStatus,
    'Prioridade': admin.getRange('C8').getValue(),
    'Nome do Cliente': admin.getRange('C9').getValue(),
    'WhatsApp': orusNormalizePhone_(admin.getRange('C10').getValue()),
    'Cidade / UF': admin.getRange('C11').getValue(),
    'CEP': admin.getRange('C12').getValue(),
    'Produto / Peça': admin.getRange('C13').getValue(),
    'Quantidade': admin.getRange('C14').getValue(),
    'Cor': admin.getRange('C15').getValue(),
    'Material': admin.getRange('C16').getValue(),
    'Prazo desejado': admin.getRange('C17').getValue(),
    'Forma de entrega': admin.getRange('C18').getValue(),
    'Atendimento clean?': admin.getRange('C19').getValue(),
    'Indicado por': admin.getRange('C20').getValue(),
    'Valor a cobrar': orusNumber_(admin.getRange('C21').getValue()),
    'Valor pago': orusNumber_(admin.getRange('C22').getValue()),
    'Forma de pagamento': admin.getRange('C23').getValue(),
    'Status pagamento': admin.getRange('C24').getValue(),
    'Rastreio': admin.getRange('C25').getValue(),
    'Responsável': admin.getRange('J7').getValue(),
    'Próxima ação': admin.getRange('J8').getValue(),
    'Data próxima ação': admin.getRange('J9').getValue(),
    'Prazo interno': admin.getRange('J10').getValue(),
    'Canal': admin.getRange('J11').getValue(),
    'Pedido Shopee': admin.getRange('J12').getValue(),
    'Complexidade': admin.getRange('J13').getValue(),
    'Impressora': admin.getRange('J14').getValue(),
    'Frete cobrado': orusNumber_(admin.getRange('J15').getValue()),
    'Custo real do frete': orusNumber_(admin.getRange('J16').getValue()),
    'Custo estimado': orusNumber_(admin.getRange('J17').getValue()),
    'Tipo registro': admin.getRange('J21').getValue(),
    'Observações': admin.getRange('A28').getValue(),
    'Detalhes do projeto': admin.getRange('H28').getValue(),
    'Atualizado em': new Date(),
  };
  orusWriteObjectToRow_(orusSheet_(ORV4_SHEETS.orders), info.row, info.headers, object);
  if (newStatus !== oldStatus) orv4TrackStatusTransition_(orderId, oldStatus, newStatus, 'Administração');
  orv4RecalcOrderFinancials_(orderId);
  orv4RefreshOrderDerivedById_(orderId);
  orv4UpsertClientFromOrder_(orderId);
  orv4SyncInventory_();
  SpreadsheetApp.getActive().toast('Pedido #' + orusPadOrderId_(orderId) + ' salvo.', 'Orume ERP', 5);
}

function orv4DuplicateOrder_(orderId) {
  const info = orv4GetOrderById_(orderId);
  if (!info) throw new Error('Pedido não encontrado.');
  const source = info.order;
  const newId = orusAllocateOrderId_();
  const newUid = Utilities.getUuid();
  const now = new Date();
  const copy = Object.assign({}, source, {
    'ID': newId,
    'ID Site': 'DUP-' + Utilities.getUuid().slice(0, 12).toUpperCase(),
    'Criado em': now,
    'Atualizado em': now,
    'Status': 'Orçamento',
    'Valor pago': 0,
    'Saldo': orusNumber_(source['Valor a cobrar']),
    'Status pagamento': orusNumber_(source['Valor a cobrar']) > 0 ? 'Pendente' : '',
    'Rastreio': '',
    'Concluído em': '',
    'Último erro': '',
    'UID Interno': newUid,
    'Próxima ação': 'Enviar orçamento',
    'Data próxima ação': '',
    'Início status': now,
    'Tipo registro': 'Orçamento',
  });
  orusAppendObject_(orusSheet_(ORV4_SHEETS.orders), copy);

  const itemSheet = orusSheet_(ORV4_SHEETS.items);
  const data = itemSheet.getDataRange().getValues();
  const hm = orusHeaderMap_(data[0]);
  for (let r = 1; r < data.length; r += 1) {
    if (orusString_(data[r][hm['ID Pedido']]) !== orusString_(orderId)) continue;
    const obj = orusRowObject_(data[0], data[r]);
    obj['ID Pedido'] = newId;
    obj['UID Pedido'] = newUid;
    obj['Status item'] = 'Pendente';
    obj['Produzido?'] = 'Não';
    obj['Reservado em estoque?'] = 'Não';
    orusAppendObject_(itemSheet, obj);
  }
  orv4TrackStatusTransition_(newId, '', 'Orçamento', 'Duplicação');
  orv4RefreshOrderDerivedById_(newId);
  SpreadsheetApp.getActive().toast('Duplicado como #' + orusPadOrderId_(newId), 'Orume ERP', 6);
}

// ----------------------------
// Edições diretas e status
// ----------------------------

function orv4HandleOrderEdit_(row, col, oldValue, newValue) {
  const sheet = orusSheet_(ORV4_SHEETS.orders);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const hm = orusHeaderMap_(headers);
  const orderId = sheet.getRange(row, hm['ID'] + 1).getValue();
  if (orderId === '') return;

  if (col !== hm['Atualizado em'] + 1) sheet.getRange(row, hm['Atualizado em'] + 1).setValue(new Date());
  if (col === hm['WhatsApp'] + 1) sheet.getRange(row, col).setValue(orusNormalizePhone_(newValue));
  if (col === hm['CEP'] + 1) {
    const addr = orv4LookupCep_(newValue);
    if (addr && !orusString_(sheet.getRange(row, hm['Cidade / UF'] + 1).getValue())) {
      sheet.getRange(row, hm['Cidade / UF'] + 1).setValue([addr.localidade, addr.uf].filter(Boolean).join('/'));
    }
  }
  if (col === hm['Status'] + 1 && orusString_(oldValue) !== orusString_(newValue)) {
    orv4TrackStatusTransition_(orderId, oldValue, newValue, 'Edição direta');
  }
  if ([hm['Valor a cobrar'] + 1, hm['Valor pago'] + 1].indexOf(col) !== -1) orv4RecalcOrderFinancials_(orderId);
  orv4RefreshOrderDerivedById_(orderId);
  orv4UpsertClientFromOrder_(orderId);
  if (col === hm['Status'] + 1) orv4SyncInventory_();
}

function orv4SetOrderStatus_(orderId, newStatus, origin) {
  const info = orv4GetOrderById_(orderId);
  if (!info) throw new Error('Pedido não encontrado.');
  const oldStatus = orusString_(info.order['Status']);
  if (oldStatus === newStatus) return;
  const now = new Date();
  const update = {
    'Status': newStatus,
    'Atualizado em': now,
    'Próxima ação': orv4DefaultNextAction_(newStatus),
    'Início status': now,
  };
  if (newStatus === 'Concluído') update['Concluído em'] = now;
  if (oldStatus === 'Concluído' && newStatus !== 'Concluído') update['Concluído em'] = '';
  orusWriteObjectToRow_(orusSheet_(ORV4_SHEETS.orders), info.row, info.headers, update);
  orv4TrackStatusTransition_(orderId, oldStatus, newStatus, origin || 'ERP v4');
  orv4RefreshOrderDerivedById_(orderId);
  orv4UpsertClientFromOrder_(orderId);
  orv4SyncInventory_();
}

function orv4TrackStatusTransition_(orderId, oldStatus, newStatus, origin) {
  if (!newStatus || oldStatus === newStatus) return;
  const info = orv4GetOrderById_(orderId);
  if (!info) return;
  const history = orusSheet_(ORV4_SHEETS.statusHistory);
  const data = history.getDataRange().getValues();
  const headers = data[0] || [];
  const hm = orusHeaderMap_(headers);
  const now = new Date();

  for (let r = data.length - 1; r >= 1; r -= 1) {
    if (orusString_(data[r][hm['UID Pedido']]) === orusString_(info.order['UID Interno']) && !data[r][hm['Fim']]) {
      const start = orusAsDate_(data[r][hm['Início']]);
      history.getRange(r + 1, hm['Fim'] + 1).setValue(now);
      history.getRange(r + 1, hm['Dias na etapa'] + 1).setValue(start ? (now.getTime() - start.getTime()) / 86400000 : 0);
      history.getRange(r + 1, hm['Atualizado em'] + 1).setValue(now);
      break;
    }
  }

  const eventId = 'STS-' + Utilities.getUuid().slice(0, 12).toUpperCase();
  orusAppendObject_(history, {
    'ID Evento': eventId,
    'ID Pedido': info.order['ID'],
    'UID Pedido': info.order['UID Interno'],
    'Status anterior': orusString_(oldStatus),
    'Novo status': orusString_(newStatus),
    'Início': now,
    'Fim': '',
    'Dias na etapa': 0,
    'Usuário / origem': origin || 'ERP v4',
    'Observações': '',
    'Criado em': now,
    'Atualizado em': now,
  });

  const orderSheet = orusSheet_(ORV4_SHEETS.orders);
  const oh = orusHeaderMap_(info.headers);
  orderSheet.getRange(info.row, oh['Início status'] + 1).setValue(now);
  if (newStatus === 'Concluído' || oldStatus === 'Concluído') {
    orv4ApplyStockTransition_(info.order, oldStatus, newStatus, now, eventId);
  }
}

function orv4DefaultNextAction_(status) {
  const map = {
    'Novo': 'Enviar orçamento',
    'Orçamento': 'Aguardar cliente',
    'Aguardando aprovação': 'Aguardar cliente',
    'Aguardando pagamento': 'Cobrar pagamento',
    'Na fila': 'Produzir',
    'Produção': 'Produzir',
    'Pronto': 'Enviar / entregar',
    'Concluído': 'Pós-venda',
    'Cancelado': 'Nenhuma',
  };
  return map[orusString_(status)] || 'Nenhuma';
}

// ----------------------------
// Financeiro
// ----------------------------

function orv4RecalcOrderFinancials_(orderId) {
  const info = orv4GetOrderById_(orderId);
  if (!info) return;
  const paymentSheet = orusSheet_(ORV4_SHEETS.payments);
  const p = paymentSheet.getDataRange().getValues();
  const ph = p.length ? orusHeaderMap_(p[0]) : {};
  let paid = 0;
  if (p.length > 1 && ph['ID Pedido'] !== undefined) {
    for (let r = 1; r < p.length; r += 1) {
      if (orusString_(p[r][ph['ID Pedido']]) !== orusString_(orderId)) continue;
      const status = orusString_(p[r][ph['Status']]);
      if (status === 'Pago' || status === 'Parcial') paid += orusNumber_(p[r][ph['Valor']]);
    }
  }
  const amount = orusNumber_(info.order['Valor a cobrar']);
  const balance = Math.max(0, amount - paid);
  let paymentStatus = '';
  if (amount > 0 && balance <= 0) paymentStatus = 'Pago';
  else if (paid > 0) paymentStatus = 'Parcial';
  else if (amount > 0) paymentStatus = 'Pendente';

  orusWriteObjectToRow_(orusSheet_(ORV4_SHEETS.orders), info.row, info.headers, {
    'Valor pago': paid,
    'Saldo': balance,
    'Status pagamento': paymentStatus,
    'Atualizado em': new Date(),
  });
}

// ----------------------------
// Estoque, itens e custos
// ----------------------------

function orv4SyncInventory_() {
  const productSheet = orusSheet_(ORV4_SHEETS.products);
  const itemSheet = orusSheet_(ORV4_SHEETS.items);
  const orderSheet = orusSheet_(ORV4_SHEETS.orders);
  const pData = productSheet.getDataRange().getValues();
  const iData = itemSheet.getDataRange().getValues();
  const oData = orderSheet.getDataRange().getValues();
  if (pData.length < 2) return { products: 0 };
  const ph = orusHeaderMap_(pData[0]);
  const ih = iData.length ? orusHeaderMap_(iData[0]) : {};
  const oh = oData.length ? orusHeaderMap_(oData[0]) : {};
  const orders = {};
  for (let r = 1; r < oData.length; r += 1) orders[orusString_(oData[r][oh['ID']])] = orusRowObject_(oData[0], oData[r]);

  const reserved = {};
  const soldQty = {};
  const revenue = {};
  const lastSale = {};
  if (iData.length > 1 && ih['ID Produto'] !== undefined) {
    for (let r = 1; r < iData.length; r += 1) {
      const productId = Number(iData[r][ih['ID Produto']]) || 0;
      if (!productId) continue;
      const orderId = orusString_(iData[r][ih['ID Pedido']]);
      const order = orders[orderId];
      if (!order) continue;
      const qty = orusNumber_(iData[r][ih['Quantidade']]);
      const status = orusString_(order['Status']);
      const prodInfo = orv4GetProductById_(productId, pData, ph);
      const modality = prodInfo ? orusString_(prodInfo.product['Modalidade']) : '';
      const reserve = modality === 'Pronta entrega' && ORV4_RESERVE_STATUSES.indexOf(status) !== -1;
      if (reserve) reserved[productId] = (reserved[productId] || 0) + qty;
      if (status === 'Concluído') {
        soldQty[productId] = (soldQty[productId] || 0) + qty;
        revenue[productId] = (revenue[productId] || 0) + orusNumber_(iData[r][ih['Total']]);
        const d = orusAsDate_(order['Concluído em']) || orusAsDate_(order['Atualizado em']);
        if (d && (!lastSale[productId] || d > lastSale[productId])) lastSale[productId] = d;
      }
      orv4RefreshItemRow_(r + 1, order, prodInfo && prodInfo.product);
    }
  }

  for (let r = 1; r < pData.length; r += 1) {
    const product = orusRowObject_(pData[0], pData[r]);
    const id = Number(product['ID Produto']) || 0;
    if (!id) continue;
    const physical = Math.max(0, orusNumber_(product['Estoque físico'] || product['Estoque']));
    const resv = reserved[id] || 0;
    const available = Math.max(0, physical - resv);
    const minimum = Math.max(0, orusNumber_(product['Estoque mínimo']) || orv4ConfigNumber_('LOW_STOCK_DEFAULT', 3));
    const modality = orusString_(product['Modalidade']) || 'Sob encomenda';
    const status = modality === 'Sob encomenda' ? 'SOB ENCOMENDA' : (available <= 0 ? 'SEM ESTOQUE' : available <= minimum ? 'BAIXO' : 'OK');
    const price = orusNumber_(product['Preço promocional']) > 0 ? orusNumber_(product['Preço promocional']) : orusNumber_(product['Preço']);
    const cost = orusNumber_(product['Custo unitário estimado']);
    const margin = price > 0 && cost > 0 ? (price - cost) / price : '';
    const legacyStock = modality === 'Pronta entrega' ? available : Math.max(999, available);
    orusWriteObjectToRow_(productSheet, r + 1, pData[0], {
      'Estoque': legacyStock,
      'Estoque físico': physical,
      'Reservado': resv,
      'Disponível': available,
      'Estoque mínimo': minimum,
      'Status estoque': status,
      'Vendas concluídas': soldQty[id] || 0,
      'Receita': revenue[id] || 0,
      'Margem estimada': margin,
      'Última venda': lastSale[id] || '',
      'Repor?': modality === 'Pronta entrega' && available <= minimum ? 'Sim' : 'Não',
      'Atualizado em': new Date(),
    });
  }
  return { products: pData.length - 1 };
}

function orv4RefreshItemRow_(row, providedOrder, providedProduct) {
  const itemSheet = orusSheet_(ORV4_SHEETS.items);
  const values = itemSheet.getRange(row, 1, 1, itemSheet.getLastColumn()).getValues()[0];
  const headers = itemSheet.getRange(1, 1, 1, itemSheet.getLastColumn()).getValues()[0];
  const item = orusRowObject_(headers, values);
  const order = providedOrder || (orv4GetOrderById_(item['ID Pedido']) || {}).order;
  const product = providedProduct || ((orv4GetProductById_(item['ID Produto']) || {}).product);
  const qty = orusNumber_(item['Quantidade']);
  const costUnit = product ? orusNumber_(product['Custo unitário estimado']) : orusNumber_(item['Custo unitário']);
  const status = order ? orusString_(order['Status']) : '';
  const modality = product ? orusString_(product['Modalidade']) : '';
  const reserved = modality === 'Pronta entrega' && ORV4_RESERVE_STATUSES.indexOf(status) !== -1;
  const statusItem = status === 'Produção' ? 'Produção' : status === 'Pronto' ? 'Pronto' : status === 'Concluído' ? 'Concluído' : status === 'Cancelado' ? 'Cancelado' : reserved ? 'Reservado' : 'Pendente';
  orusWriteObjectToRow_(itemSheet, row, headers, {
    'Imagem': product ? orusString_(product['Imagem principal']) : orusString_(item['Imagem']),
    'Custo unitário': costUnit,
    'Custo total': qty * costUnit,
    'Status item': statusItem,
    'Produzido?': status === 'Pronto' || status === 'Concluído' ? 'Sim' : 'Não',
    'Reservado em estoque?': reserved ? 'Sim' : 'Não',
  });
}

function orv4ApplyStockTransition_(order, oldStatus, newStatus, when, eventId) {
  const oldDone = orusString_(oldStatus) === 'Concluído';
  const newDone = orusString_(newStatus) === 'Concluído';
  if (oldDone === newDone) return;
  const direction = newDone ? -1 : 1;
  const itemSheet = orusSheet_(ORV4_SHEETS.items);
  const iData = itemSheet.getDataRange().getValues();
  if (iData.length < 2) return;
  const ih = orusHeaderMap_(iData[0]);
  for (let r = 1; r < iData.length; r += 1) {
    if (orusString_(iData[r][ih['ID Pedido']]) !== orusString_(order['ID'])) continue;
    const productId = Number(iData[r][ih['ID Produto']]) || 0;
    const qty = orusNumber_(iData[r][ih['Quantidade']]);
    if (!productId || qty <= 0) continue;
    const pInfo = orv4GetProductById_(productId);
    if (!pInfo || orusString_(pInfo.product['Modalidade']) !== 'Pronta entrega') continue;
    const key = (direction < 0 ? 'SAIDA' : 'ESTORNO') + ':' + (eventId || order['UID Interno'] + ':' + Utilities.formatDate(when, Session.getScriptTimeZone(), 'yyyyMMddHHmmss')) + ':' + productId;
    orv4MoveStock_(pInfo, direction * qty, direction < 0 ? 'SAÍDA VENDA' : 'ESTORNO CONCLUSÃO', order, key);
  }
}

function orv4MoveStock_(productInfo, delta, type, order, key) {
  if (orv4StockMoveExists_(key)) return;
  const productSheet = orusSheet_(ORV4_SHEETS.products);
  const before = Math.max(0, orusNumber_(productInfo.product['Estoque físico']));
  const after = Math.max(0, before + delta);
  orusWriteObjectToRow_(productSheet, productInfo.row, productInfo.headers, {'Estoque físico': after, 'Atualizado em': new Date()});
  orusAppendObject_(orusSheet_(ORV4_SHEETS.stockMoves), {
    'ID Movimento': 'MOV-' + Utilities.getUuid().slice(0, 12).toUpperCase(),
    'Data/Hora': new Date(),
    'ID Produto': productInfo.product['ID Produto'],
    'Produto': productInfo.product['Nome'],
    'Tipo': type,
    'Quantidade': delta,
    'Estoque antes': before,
    'Estoque depois': after,
    'ID Pedido': order['ID'],
    'UID Pedido': order['UID Interno'],
    'Origem': 'ERP v4',
    'Observações': '',
    'Usuário': Session.getActiveUser().getEmail() || 'Planilha',
    'Chave idempotência': key,
  });
}

function orv4StockMoveExists_(key) {
  const sheet = orusSheet_(ORV4_SHEETS.stockMoves);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  const hm = orusHeaderMap_(data[0]);
  for (let r = 1; r < data.length; r += 1) if (orusString_(data[r][hm['Chave idempotência']]) === key) return true;
  return false;
}

// ----------------------------
// Clientes / CRM
// ----------------------------