const SPREADSHEET_ID = "1IGZ0KY2J5E87qdl4Gza3w0v_Tz_vsESCH9EHMGZtPoI";

const SHEETS = {
  admin: "Administração",
  orders: "Pedidos",
  products: "Produtos",
  orderItems: "Itens do Pedido",
  customers: "Clientes",
  payments: "Pagamentos",
  media: "Mídias",
  checkouts: "Checkouts",
  config: "Config",
  logs: "Logs",
  history: "Histórico"
};

const MAX_ORDER_ID = 1000;
const COMPLETED_STATUSES = ["Concluído", "Cancelado"];
const ADMIN_FORM_START_ROW = 6;
const ADMIN_FORM_VALUE_COL = 10;
const ADMIN_LIST_START_ROW = 6;
const ADMIN_LIST_MAX = 35;

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = String(p.action || "ping");

    if (action === "ping") return output_({ ok: true, version: 3, spreadsheetId: SPREADSHEET_ID }, p.callback);
    if (action === "status") return output_(getQuoteStatus_(p.siteId), p.callback);
    if (action === "affiliate") return output_({ ok: true, affiliate: requireAffiliate_(p.code) }, p.callback);
    if (action === "catalog") return output_({ ok: true, products: getPublicCatalog_() }, p.callback);

    if (action === "adminSnapshot") {
      requireAdmin_(p.adminKey);
      return output_(getAdminSnapshot_(), p.callback);
    }
    if (action === "adminOrder") {
      requireAdmin_(p.adminKey);
      return output_({ ok: true, order: getOrderById_(p.id) }, p.callback);
    }
    if (action === "adminProduct") {
      requireAdmin_(p.adminKey);
      return output_({ ok: true, product: getProductById_(p.id) }, p.callback);
    }
    if (action === "scrapeShopee") {
      requireAdmin_(p.adminKey);
      return output_(scrapeShopee_(p.url), p.callback);
    }

    return output_({ ok: false, error: "Ação GET desconhecida." }, p.callback);
  } catch (error) {
    return output_({ ok: false, error: safeError_(error) }, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const payload = parsePayload_(e);
    const action = String(payload.action || "quote");

    if (action === "quote") return output_(createOrderFromQuote_(payload));
    if (action === "createCheckout") return output_(createCheckout_(payload));

    requireAdmin_(payload.adminKey);
    if (action === "adminSaveAffiliate") return output_({ ok: true, affiliate: saveAffiliate_(payload.affiliate || {}, payload.mode) });
    if (action === "adminSaveOrder") return output_({ ok: true, order: saveOrder_(payload.order || {}) });
    if (action === "adminCompleteOrder") return output_({ ok: true, order: completeOrder_(payload.id) });
    if (action === "adminSaveProduct") return output_({ ok: true, product: saveProduct_(payload.product || {}, payload.mode || "") });
    if (action === "adminRefresh") {
      refreshAdminSheet_();
      return output_({ ok: true });
    }

    return output_({ ok: false, error: "Ação POST desconhecida." });
  } catch (error) {
    log_("Erro", "doPost", "", "", "API", safeError_(error), error && error.stack ? String(error.stack) : "");
    return output_({ ok: false, error: safeError_(error) });
  } finally {
    lock.releaseLock();
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Orume")
    .addItem("Atualizar painel", "refreshAdminSheet_")
    .addItem("Salvar pedido selecionado", "saveAdminForm_")
    .addItem("Marcar pedido como concluído", "completeAdminOrder_")
    .addSeparator()
    .addItem("Configurar chave do /admin", "configureAdminKey_")
    .addItem("Instalar gatilhos da planilha v2", "installTriggers_")
    .addToUi();
  refreshAdminSheet_();
}

function onSelectionChange(e) {
  try {
    const range = e && e.range;
    if (!range) return;
    if (range.getSheet().getName() !== SHEETS.admin) return;
    if (range.getColumn() !== 1) return;
    if (range.getRow() < ADMIN_LIST_START_ROW || range.getRow() >= ADMIN_LIST_START_ROW + ADMIN_LIST_MAX) return;
    const id = range.getValue();
    if (id === "" || id === null) return;
    loadOrderToAdmin_(id);
  } catch (error) {
    console.error(error);
  }
}

function onEdit(e) {
  try {
    const range = e && e.range;
    if (!range || range.getSheet().getName() !== SHEETS.admin) return;
    const a1 = range.getA1Notation();

    if (range.getColumn() === 8 && range.getRow() >= ADMIN_LIST_START_ROW && range.getRow() < ADMIN_LIST_START_ROW + ADMIN_LIST_MAX && e.value === "TRUE") {
      const id = range.getSheet().getRange(range.getRow(), 1).getValue();
      if (id !== "" && id !== null) loadOrderToAdmin_(id);
      range.setValue(false);
      return;
    }

    if (a1 === "I30" && e.value === "TRUE") {
      saveAdminForm_();
      range.setValue(false);
    }
    if (a1 === "M30" && e.value === "TRUE") {
      completeAdminOrder_();
      range.setValue(false);
    }
  } catch (error) {
    console.error(error);
  }
}

function installTriggers_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const handlers = ["orumeOnEdit_", "orumeOnOpen_"];
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (handlers.indexOf(trigger.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger("orumeOnEdit_").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("orumeOnOpen_").forSpreadsheet(ss).onOpen().create();
  SpreadsheetApp.getUi().alert("Gatilhos da planilha v2 instalados.");
}

function orumeOnEdit_(e) {
  onEdit(e);
}

function orumeOnOpen_() {
  refreshAdminSheet_();
}

function configureAdminKey_() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Chave do /admin",
    "Digite uma chave forte. Ela ficará apenas em Script Properties e não será gravada na planilha nem no GitHub.",
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const key = String(response.getResponseText() || "").trim();
  if (key.length < 12) {
    ui.alert("Use uma chave com pelo menos 12 caracteres.");
    return;
  }
  PropertiesService.getScriptProperties().setProperty("ADMIN_KEY", key);
  ui.alert("Chave do /admin configurada.");
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.payload) return JSON.parse(String(e.parameter.payload));
  if (e && e.postData && e.postData.contents) {
    const raw = String(e.postData.contents || "").trim();
    if (raw) return JSON.parse(raw);
  }
  return {};
}

function requireAdmin_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!expected) throw new Error("ADMIN_KEY ainda não foi configurada no Apps Script.");
  if (String(provided || "") !== expected) throw new Error("Acesso administrativo negado.");
}

function getSheet_(name) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error("Aba não encontrada: " + name);
  return sheet;
}

function createOrderFromQuote_(payload) {
  const siteId = normalizeText_(payload.siteId, 80);
  if (!siteId) throw new Error("ID Site ausente.");

  const orders = getSheet_(SHEETS.orders);
  const existing = findRowByValue_(orders, 2, siteId);
  if (existing) {
    const oldRow = orders.getRange(existing, 1, 1, 32).getValues()[0];
    return { ok: true, duplicate: true, orderId: formatOrderId_(oldRow[0]), uid: oldRow[31] };
  }

  const name = normalizeText_(payload.name, 180);
  const phone = normalizePhone_(payload.phone);
  const cep = normalizeCep_(payload.cep);
  const product = normalizeText_(payload.product, 240);
  const quantity = normalizePositiveInt_(payload.quantity, 1, 9999);
  if (!name) throw new Error("Nome obrigatório.");
  if (!phone) throw new Error("WhatsApp inválido.");
  if (!cep) throw new Error("CEP inválido.");
  if (!product) throw new Error("Produto obrigatório.");

  const affiliate = checkoutAffiliate_(payload);
  ensureAffiliateColumns_(orders, 33);
  const orderId = allocateOrderId_();
  const uid = Utilities.getUuid();
  const now = new Date();
  const row = [
    orderId, siteId, now, now, "Orçamento", "Normal", name, phone,
    normalizeText_(payload.city, 180), cep, affiliate ? affiliate.code : normalizeText_(payload.referral, 180), product,
    quantity, normalizeText_(payload.dimensions, 180), normalizeText_(payload.color, 120),
    normalizeText_(payload.material, 120) || "Avaliar com a Orume",
    normalizeText_(payload.deadline, 80), normalizeText_(payload.links, 1500),
    normalizeText_(payload.description, 3000), normalizeText_(payload.delivery, 160) || "A combinar",
    payload.cleanService ? "Sim" : "Não", normalizeText_(payload.notes, 2500),
    "", 0, "", "", "Pendente", "", "Site ORUME", "", "", uid
  ];
  row.push(affiliate ? affiliate.code : "", affiliate ? affiliate.rate : "", "");
  orders.appendRow(row);
  const rowNumber = orders.getLastRow();
  orders.getRange(rowNumber, 25).setFormula('=IF(W' + rowNumber + '="","",MAX(0,W' + rowNumber + '-X' + rowNumber + '))');
  upsertCustomer_(row);
  refreshAdminSheet_();
  log_("Pedido", "Criado", "Pedido", uid, "Site", "Novo orçamento " + formatOrderId_(orderId), siteId);
  return { ok: true, orderId: formatOrderId_(orderId), uid: uid };
}

function createCheckout_(payload) {
  const sheet = getSheet_(SHEETS.checkouts);
  const uid = normalizeText_(payload.checkoutId, 120) || ("CHK-" + Utilities.getUuid().slice(0, 12).toUpperCase());
  const now = new Date();
  let cart = Array.isArray(payload.cart) ? payload.cart : [];
  if (!cart.length) throw new Error("Carrinho vazio.");

  const name = normalizeText_(payload.name, 180);
  const phone = normalizePhone_(payload.phone);
  const email = normalizeText_(payload.email, 220);
  const cep = normalizeCep_(payload.cep);
  const city = normalizeText_(payload.city, 180);
  const delivery = normalizeText_(payload.delivery, 160) || "A combinar";
  const cleanService = payload.cleanService ? "Sim" : "Não";
  const notes = normalizeText_(payload.notes, 2500);

  if (!name) throw new Error("Nome obrigatório.");
  if (!phone) throw new Error("WhatsApp inválido.");
  if (!cep) throw new Error("CEP inválido.");
  if (payload.cleanService && !email) throw new Error("E-mail obrigatório no atendimento mínimo.");

  const existing = findRowByValue_(sheet, 1, uid);
  if (existing) return { ok: true, duplicate: true, checkoutId: uid };
  const affiliate = checkoutAffiliate_(payload);
  let affiliateAmount = 0;
  if (affiliate) {
    const products = getProducts_();
    cart = cart.map(function(item) {
      const product = products.find(function(p) { return p.id === Number(item.id) && isYes_(p.active); });
      if (!product) throw new Error("Produto indisponível. Atualize o catálogo.");
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Quantidade inválida.");
      const base = product.salePrice > 0 ? product.salePrice : product.price;
      const unitPrice = affiliateMoney_(base, affiliate.rate);
      if (Math.abs(Number(item.unitPrice) - unitPrice) > 0.001 || !Number.isFinite(Number(item.unitPrice))) throw new Error("O preço foi atualizado. Remova o item do carrinho e adicione novamente pelo catálogo atualizado.");
      affiliateAmount += Math.round((unitPrice - base) * 100) * quantity;
      return { id: product.id, name: product.name, quantity: quantity, basePrice: base, unitPrice: unitPrice, total: Math.round(unitPrice * 100) * quantity / 100 };
    });
  }
  const subtotal = affiliate ? cart.reduce(function(sum, item) { return sum + Math.round(item.total * 100); }, 0) / 100 : toMoney_(payload.subtotal);
  if (affiliate && (!Number.isFinite(Number(payload.subtotal)) || Math.abs(Number(payload.subtotal) - subtotal) > 0.001)) throw new Error("Total divergente. Recarregue o catálogo antes de continuar.");
  ensureAffiliateColumns_(sheet, 23);
  const freight = 0;
  const total = subtotal;
  const itemSummary = cart.map(function(item) {
    const itemName = normalizeText_(item.name, 240);
    const quantity = normalizePositiveInt_(item.quantity, 1, 9999);
    const unitPrice = toMoney_(item.unitPrice !== undefined ? item.unitPrice : item.price);
    const lineTotal = toMoney_(item.total !== undefined ? item.total : unitPrice * quantity);
    return quantity + "x " + itemName + " — " + formatMoneyBr_(lineTotal);
  }).join("\n");

  sheet.appendRow([
    uid, now, now, "Aguardando contato", name, phone, cep, city,
    JSON.stringify(cart).slice(0, 45000), subtotal, freight, total,
    "PIX manual", "", "Site ORUME", "", "",
    email, delivery, cleanService, notes, itemSummary,
    affiliate ? affiliate.code : "", affiliate ? affiliate.rate : "", affiliate ? affiliateAmount / 100 : ""
  ]);

  if (payload.cleanService) {
    const destination = PropertiesService.getScriptProperties().getProperty("NOTIFICATION_EMAIL") || "orume3d@gmail.com";
    const subject = "Novo checkout Orume — atendimento mínimo — " + uid;
    const body = [
      "Novo checkout recebido pela Orume 3D.",
      "",
      "ID: " + uid,
      affiliate ? "Afiliado: " + affiliate.code + " (" + affiliate.rate + "%)" : "",
      "Cliente: " + name,
      "WhatsApp: " + phone,
      "E-mail: " + email,
      "CEP: " + cep,
      "Cidade / UF: " + city,
      "Entrega: " + delivery,
      "",
      "ITENS",
      itemSummary,
      "",
      "Subtotal dos itens: " + formatMoneyBr_(subtotal),
      "Frete: ainda não incluído",
      "",
      notes ? "Observações: " + notes : "",
      "",
      "O cliente solicitou atendimento com o mínimo de interação. Responda por e-mail apenas com o necessário para frete, PIX, produção e entrega."
    ].filter(Boolean).join("\n");

    MailApp.sendEmail({
      to: destination,
      replyTo: email,
      subject: subject,
      body: body
    });
    sheet.getRange(sheet.getLastRow(), 4).setValue("Aguardando contato por e-mail");
  }

  log_("Checkout", "Criado", "Checkout", uid, "Site", "Checkout iniciado", cleanService);
  return { ok: true, checkoutId: uid };
}

function getQuoteStatus_(siteId) {
  const cleanId = normalizeText_(siteId, 80);
  if (!cleanId) return { found: false };
  const sheet = getSheet_(SHEETS.orders);
  const rowNumber = findRowByValue_(sheet, 2, cleanId);
  if (!rowNumber) return { found: false };
  const row = sheet.getRange(rowNumber, 1, 1, 32).getValues()[0];
  return { found: true, complete: true, failed: false, orderId: formatOrderId_(row[0]), status: row[4] };
}

function allocateOrderId_() {
  const sheet = getSheet_(SHEETS.orders);
  const last = sheet.getLastRow();
  if (last <= 1) return 0;
  const rows = sheet.getRange(2, 1, last - 1, 32).getValues();
  const used = {};
  rows.forEach(function(row) {
    const id = Number(row[0]);
    if (Number.isInteger(id) && id >= 0 && id <= MAX_ORDER_ID) used[id] = true;
  });
  for (let id = 0; id <= MAX_ORDER_ID; id++) if (!used[id]) return id;

  let candidate = null;
  rows.forEach(function(row, index) {
    const status = String(row[4] || "");
    if (COMPLETED_STATUSES.indexOf(status) === -1) return;
    const date = row[29] instanceof Date ? row[29] : row[3] instanceof Date ? row[3] : row[2] instanceof Date ? row[2] : new Date(0);
    if (!candidate || date.getTime() < candidate.date.getTime()) candidate = { rowNumber: index + 2, values: row, date: date };
  });
  if (!candidate) throw new Error("Os IDs 0000–1000 estão ocupados e não há pedido concluído para reciclar.");

  getSheet_(SHEETS.history).appendRow(candidate.values);
  sheet.deleteRow(candidate.rowNumber);
  log_("Sistema", "Arquivado", "Pedido", candidate.values[31], "Backend", "ID " + formatOrderId_(candidate.values[0]) + " liberado para reutilização", "");
  return Number(candidate.values[0]);
}

function upsertCustomer_(orderRow) {
  const sheet = getSheet_(SHEETS.customers);
  const phone = String(orderRow[7] || "");
  const existing = phone ? findRowByValue_(sheet, 3, phone) : 0;
  const now = new Date();
  if (existing) {
    const count = Number(sheet.getRange(existing, 9).getValue() || 0) + 1;
    sheet.getRange(existing, 8).setValue(now);
    sheet.getRange(existing, 9).setValue(count);
    if (orderRow[9]) sheet.getRange(existing, 5).setValue(orderRow[9]);
    if (orderRow[8]) sheet.getRange(existing, 6).setValue(orderRow[8]);
    return;
  }
  sheet.appendRow(["CLI-" + Utilities.getUuid().slice(0, 8).toUpperCase(), orderRow[6], phone, "", orderRow[9], orderRow[8], now, now, 1, 0, ""]);
}

function getAdminSnapshot_() {
  return { ok: true, orders: getOrderSummaries_(), products: getProducts_(), affiliates: getAffiliates_(), spreadsheetId: SPREADSHEET_ID };
}

function getOrderSummaries_() {
  const sheet = getSheet_(SHEETS.orders);
  const last = sheet.getLastRow();
  if (last <= 1) return [];
  return sheet.getRange(2, 1, last - 1, 32).getValues()
    .filter(function(row) { return row[0] !== "" && row[0] !== null; })
    .sort(function(a, b) {
      const ad = a[3] instanceof Date ? a[3].getTime() : 0;
      const bd = b[3] instanceof Date ? b[3].getTime() : 0;
      return bd - ad;
    })
    .slice(0, 250)
    .map(orderToObject_);
}

function getOrderById_(id) {
  const sheet = getSheet_(SHEETS.orders);
  const rowNumber = findRowByValue_(sheet, 1, Number(id));
  if (!rowNumber) return null;
  return orderToObject_(sheet.getRange(rowNumber, 1, 1, 32).getValues()[0]);
}

function orderToObject_(row) {
  return {
    id: Number(row[0]), displayId: formatOrderId_(row[0]), siteId: row[1] || "",
    createdAt: serializeValue_(row[2]), updatedAt: serializeValue_(row[3]), status: row[4] || "",
    priority: row[5] || "", name: row[6] || "", phone: row[7] || "", city: row[8] || "",
    cep: row[9] || "", referral: row[10] || "", product: row[11] || "", quantity: row[12] || "",
    dimensions: row[13] || "", color: row[14] || "", material: row[15] || "",
    deadline: serializeValue_(row[16]), links: row[17] || "", description: row[18] || "",
    delivery: row[19] || "", cleanService: row[20] || "", notes: row[21] || "",
    amount: Number(row[22] || 0), paid: Number(row[23] || 0), balance: Number(row[24] || 0),
    paymentMethod: row[25] || "", paymentStatus: row[26] || "", tracking: row[27] || "",
    origin: row[28] || "", completedAt: serializeValue_(row[29]), lastError: row[30] || "", uid: row[31] || ""
  };
}

function saveOrder_(order) {
  const id = Number(order.id);
  if (!Number.isInteger(id) || id < 0 || id > MAX_ORDER_ID) throw new Error("ID do pedido inválido.");
  const sheet = getSheet_(SHEETS.orders);
  const rowNumber = findRowByValue_(sheet, 1, id);
  if (!rowNumber) throw new Error("Pedido " + formatOrderId_(id) + " não encontrado.");
  const existing = sheet.getRange(rowNumber, 1, 1, 32).getValues()[0];
  existing[3] = new Date();
  existing[4] = normalizeText_(order.status, 80) || existing[4];
  existing[5] = normalizeText_(order.priority, 80) || existing[5];
  existing[6] = normalizeText_(order.name, 180);
  existing[7] = normalizePhone_(order.phone) || normalizeText_(order.phone, 40);
  existing[8] = normalizeText_(order.city, 180);
  existing[9] = normalizeCep_(order.cep) || normalizeText_(order.cep, 20);
  existing[10] = normalizeText_(order.referral, 180);
  existing[11] = normalizeText_(order.product, 240);
  existing[12] = normalizePositiveInt_(order.quantity, 1, 9999);
  existing[13] = normalizeText_(order.dimensions, 180);
  existing[14] = normalizeText_(order.color, 120);
  existing[15] = normalizeText_(order.material, 120);
  existing[16] = normalizeText_(order.deadline, 80);
  existing[17] = normalizeText_(order.links, 1500);
  existing[18] = normalizeText_(order.description, 3000);
  existing[19] = normalizeText_(order.delivery, 160);
  existing[20] = normalizeText_(order.cleanService, 20);
  existing[21] = normalizeText_(order.notes, 2500);
  existing[22] = toMoney_(order.amount);
  existing[23] = toMoney_(order.paid);
  existing[24] = Math.max(0, existing[22] - existing[23]);
  existing[25] = normalizeText_(order.paymentMethod, 120);
  existing[26] = normalizeText_(order.paymentStatus, 120);
  existing[27] = normalizeText_(order.tracking, 220);
  if (COMPLETED_STATUSES.indexOf(existing[4]) >= 0 && !existing[29]) existing[29] = new Date();
  sheet.getRange(rowNumber, 1, 1, 32).setValues([existing]);
  refreshAdminSheet_();
  log_("Pedido", "Editado", "Pedido", existing[31], "Admin", "Pedido " + formatOrderId_(id) + " atualizado", "");
  return orderToObject_(existing);
}

function completeOrder_(id) {
  const sheet = getSheet_(SHEETS.orders);
  const rowNumber = findRowByValue_(sheet, 1, Number(id));
  if (!rowNumber) throw new Error("Pedido não encontrado.");
  sheet.getRange(rowNumber, 5).setValue("Concluído");
  sheet.getRange(rowNumber, 4).setValue(new Date());
  sheet.getRange(rowNumber, 30).setValue(new Date());
  refreshAdminSheet_();
  const row = sheet.getRange(rowNumber, 1, 1, 32).getValues()[0];
  log_("Pedido", "Concluído", "Pedido", row[31], "Admin", "Pedido " + formatOrderId_(row[0]) + " concluído", "");
  return orderToObject_(row);
}

function refreshAdminSheet_() {
  const admin = getSheet_(SHEETS.admin);
  const orders = getOrderSummaries_().slice(0, ADMIN_LIST_MAX);
  const values = [], backgrounds = [], fontColors = [];
  for (let i = 0; i < ADMIN_LIST_MAX; i++) {
    const order = orders[i];
    if (!order) {
      values.push(["", "", "", "", "", "", ""]);
      backgrounds.push(["#F4F1E9","#F4F1E9","#F4F1E9","#F4F1E9","#F4F1E9","#F4F1E9","#F4F1E9"]);
      fontColors.push(["#080706","#080706","#080706","#080706","#080706","#080706","#080706"]);
      continue;
    }
    values.push([order.id, order.status, order.name, shortDate_(order.createdAt), order.amount || "", order.delivery, shortDate_(order.deadline)]);
    const completed = COMPLETED_STATUSES.indexOf(order.status) >= 0;
    const bg = completed ? "#F2C8C8" : "#F4F1E9";
    const fg = completed ? "#7A1919" : "#080706";
    backgrounds.push([bg,bg,bg,bg,bg,bg,bg]);
    fontColors.push([fg,fg,fg,fg,fg,fg,fg]);
  }
  const range = admin.getRange(ADMIN_LIST_START_ROW, 1, ADMIN_LIST_MAX, 7);
  range.setValues(values).setBackgrounds(backgrounds).setFontColors(fontColors);
  admin.getRange(ADMIN_LIST_START_ROW, 1, ADMIN_LIST_MAX, 1).setNumberFormat("0000");
  admin.getRange(ADMIN_LIST_START_ROW, 5, ADMIN_LIST_MAX, 1).setNumberFormat('R$ #,##0.00');
}

function loadOrderToAdmin_(id) {
  const order = getOrderById_(id);
  if (!order) return;
  const admin = getSheet_(SHEETS.admin);
  const values = [[order.id],[order.status],[order.priority],[order.createdAt],[order.name],[order.phone],[order.city],[order.cep],[order.product],[order.quantity],[order.color],[order.material],[order.deadline],[order.delivery],[order.cleanService],[order.referral],[order.amount],[order.paid],[order.balance],[order.links],[order.description],[order.notes]];
  admin.getRange(ADMIN_FORM_START_ROW, ADMIN_FORM_VALUE_COL, values.length, 1).setValues(values);
  admin.getRange(6, 10).setNumberFormat("0000");
  admin.getRange(22, 10, 3, 1).setNumberFormat('R$ #,##0.00');
}

function saveAdminForm_() {
  const admin = getSheet_(SHEETS.admin);
  const v = admin.getRange(ADMIN_FORM_START_ROW, ADMIN_FORM_VALUE_COL, 22, 1).getValues().map(function(row) { return row[0]; });
  const id = Number(v[0]);
  if (!Number.isInteger(id)) throw new Error("Selecione um pedido na lista.");
  saveOrder_({id:id,status:v[1],priority:v[2],name:v[4],phone:v[5],city:v[6],cep:v[7],product:v[8],quantity:v[9],color:v[10],material:v[11],deadline:v[12],delivery:v[13],cleanService:v[14],referral:v[15],amount:v[16],paid:v[17],links:v[19],description:v[20],notes:v[21]});
  loadOrderToAdmin_(id);
}

function completeAdminOrder_() {
  const id = Number(getSheet_(SHEETS.admin).getRange(6, 10).getValue());
  if (!Number.isInteger(id)) throw new Error("Selecione um pedido na lista.");
  completeOrder_(id);
  loadOrderToAdmin_(id);
}

function getProducts_() {
  const sheet = getSheet_(SHEETS.products);
  const last = sheet.getLastRow();
  if (last <= 1) return [];
  return sheet.getRange(2, 1, last - 1, 23).getValues().filter(function(row) { return row[0] !== "" && row[0] !== null; }).map(productToObject_);
}

function getPublicCatalog_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("public_catalog_v2");
  if (cached) {
    try { return JSON.parse(cached); } catch (error) {}
  }

  const catalog = getProducts_().filter(function(product) { return isYes_(product.active); }).map(function(product) {
    return {id:product.id,sku:product.sku,name:product.name,slug:product.slug,category:product.category,description:product.description,price:product.salePrice > 0 ? product.salePrice : product.price,originalPrice:product.price,stock:product.stock,productionDays:product.productionDays,shopeeUrl:product.shopeeUrl,image:product.imageMain || product.detectedImage,images:[product.imageMain,product.image2,product.image3,product.detectedImage].filter(Boolean)};
  });

  cache.put("public_catalog_v2", JSON.stringify(catalog), 300);
  return catalog;
}

function getProductById_(id) {
  const sheet = getSheet_(SHEETS.products);
  const rowNumber = findRowByValue_(sheet, 1, Number(id));
  if (!rowNumber) return null;
  return productToObject_(sheet.getRange(rowNumber, 1, 1, 23).getValues()[0]);
}

function productToObject_(row) {
  return {id:Number(row[0]),sku:row[1]||"",active:row[2]||"",featured:row[3]||"",name:row[4]||"",slug:row[5]||"",category:row[6]||"",description:row[7]||"",price:Number(row[8]||0),salePrice:Number(row[9]||0),stock:Number(row[10]||0),productionDays:Number(row[11]||0),shopeeUrl:row[12]||"",scrapeStatus:row[13]||"",scrapeAttemptAt:serializeValue_(row[14]),detectedTitle:row[15]||"",detectedPrice:Number(row[16]||0),detectedImage:row[17]||"",imageMain:row[18]||"",image2:row[19]||"",image3:row[20]||"",adminNotes:row[21]||"",updatedAt:serializeValue_(row[22])};
}

function saveProduct_(product, mode) {
  const sheet = getSheet_(SHEETS.products);
  const requestedId = Number(product.id);
  const operation = String(mode || "").toLowerCase();
  let id = 0;
  let rowNumber = 0;

  if (operation === "create" || !Number.isInteger(requestedId) || requestedId <= 0) {
    // CREATE nunca procura/reutiliza uma linha existente.
    id = nextProductId_();
    rowNumber = sheet.getLastRow() + 1;
    if (rowNumber > sheet.getMaxRows()) {
      sheet.insertRowsAfter(sheet.getMaxRows(), Math.max(20, rowNumber - sheet.getMaxRows()));
    }
  } else {
    // UPDATE só altera a linha cujo ID exista de fato.
    id = requestedId;
    rowNumber = findRowByValue_(sheet, 1, id);
    if (!rowNumber) {
      throw new Error("Produto #" + id + " não encontrado para edição. Clique em Novo produto para criar outro item.");
    }
  }

  const row = [id,normalizeText_(product.sku,100),normalizeYesNo_(product.active,"Sim"),normalizeYesNo_(product.featured,"Não"),normalizeText_(product.name,240),slugify_(product.slug||product.name),normalizeText_(product.category,120),normalizeText_(product.description,5000),toMoney_(product.price),toMoney_(product.salePrice),normalizePositiveInt_(product.stock,0,999999),normalizePositiveInt_(product.productionDays,0,365),normalizeShopeeUrl_(product.shopeeUrl),normalizeText_(product.scrapeStatus,120),product.scrapeAttemptAt?new Date(product.scrapeAttemptAt):"",normalizeText_(product.detectedTitle,500),toMoney_(product.detectedPrice),normalizeUrl_(product.detectedImage),normalizeUrl_(product.imageMain),normalizeUrl_(product.image2),normalizeUrl_(product.image3),normalizeText_(product.adminNotes,2500),new Date()];

  sheet.getRange(rowNumber,1,1,23).setValues([row]);
  CacheService.getScriptCache().remove("public_catalog_v2");
  CacheService.getScriptCache().remove("public_catalog_v3");
  log_("Produto",operation === "create" ? "Criado" : "Atualizado","Produto",id,"Admin",row[4],row[12]);
  return productToObject_(row);
}

function nextProductId_() {
  const sheet = getSheet_(SHEETS.products), last = sheet.getLastRow();
  if (last <= 1) return 1;
  const ids = sheet.getRange(2,1,last-1,1).getValues().flat().map(Number).filter(function(v){return Number.isFinite(v);});
  return ids.length ? Math.max.apply(null, ids) + 1 : 1;
}

function scrapeShopee_(url) {
  const cleanUrl = normalizeShopeeUrl_(url);
  if (!cleanUrl) throw new Error("Informe um link válido da Shopee.");
  const response = UrlFetchApp.fetch(cleanUrl,{method:"get",followRedirects:true,muteHttpExceptions:true,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36","Accept-Language":"pt-BR,pt;q=0.9,en;q=0.7"}});
  const httpStatus = response.getResponseCode();
  const html = response.getContentText().slice(0,1500000);
  const lower = html.toLowerCase();
  if (httpStatus===403 || httpStatus===429 || lower.indexOf("captcha")>=0 || (lower.indexOf("verify")>=0 && lower.indexOf("robot")>=0)) return {ok:false,blocked:true,status:"Bloqueado pela Shopee",httpStatus:httpStatus,error:"A página exigiu verificação ou bloqueou a leitura automática. Preencha manualmente e tente novamente depois."};
  if (httpStatus>=400) return {ok:false,status:"Erro HTTP "+httpStatus,httpStatus:httpStatus};

  const found = findJsonLdProduct_(html) || {};
  const title = normalizeText_(found.name || extractMeta_(html,"og:title") || extractMeta_(html,"twitter:title") || extractHtmlTitle_(html),500);
  const imageRaw = firstImage_(found.image) || extractMeta_(html,"og:image") || extractMeta_(html,"twitter:image");
  const description = normalizeText_(found.description || extractMeta_(html,"og:description") || extractMeta_(html,"description"),5000);
  const offers = found.offers || {};
  const price = parsePrice_(Array.isArray(offers)&&offers.length?offers[0].price:offers.price) || parsePrice_(extractMeta_(html,"product:price:amount"));
  const ok = Boolean(title || imageRaw || price);
  return {ok:ok,blocked:false,status:ok?"Dados detectados":"Nenhum dado estruturado encontrado",httpStatus:httpStatus,title:title,price:price||0,image:normalizeUrl_(imageRaw),description:description,source:cleanUrl};
}

function findJsonLdProduct_(html) {
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const raw = decodeHtml_(String(match[1]||"").trim());
    try {
      const parsed = JSON.parse(raw), found = walkForProduct_(parsed);
      if (found) return found;
    } catch (error) {}
  }
  return null;
}

function walkForProduct_(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (let i=0;i<value.length;i++){const found=walkForProduct_(value[i]);if(found)return found;}
    return null;
  }
  if (typeof value!=="object") return null;
  const type=value["@type"];
  if (type==="Product" || (Array.isArray(type)&&type.indexOf("Product")>=0)) return value;
  const keys=Object.keys(value);
  for(let j=0;j<keys.length;j++){const found=walkForProduct_(value[keys[j]]);if(found)return found;}
  return null;
}

function extractMeta_(html,key) {
  const escaped=String(key).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const patterns=[new RegExp('<meta[^>]+(?:property|name|itemprop)=["\\\']'+escaped+'["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\']',"i"),new RegExp('<meta[^>]+content=["\\\']([^"\\\']+)["\\\'][^>]+(?:property|name|itemprop)=["\\\']'+escaped+'["\\\']',"i")];
  for(let i=0;i<patterns.length;i++){const match=html.match(patterns[i]);if(match&&match[1])return decodeHtml_(match[1]);}
  return "";
}

function extractHtmlTitle_(html){const match=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);return match?decodeHtml_(match[1]).replace(/\s+/g," ").trim():"";}
function firstImage_(value){if(Array.isArray(value))return value.length?String(value[0]||""):"";return value?String(value):"";}
function decodeHtml_(value){return String(value||"").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");}

function findRowByValue_(sheet,column,value){const last=sheet.getLastRow();if(last<=1)return 0;const values=sheet.getRange(2,column,last-1,1).getValues();const target=String(value);for(let i=0;i<values.length;i++)if(String(values[i][0])===target)return i+2;return 0;}
function log_(type,action,entity,id,origin,summary,details){try{getSheet_(SHEETS.logs).appendRow([new Date(),type,action,entity,id,origin,summary,details]);}catch(error){console.error(error);}}
function normalizeText_(value,max){const text=String(value==null?"":value).trim();return text.slice(0,max||500);}
function normalizePhone_(value){let digits=String(value||"").replace(/\D/g,"");if(digits.indexOf("55")===0&&digits.length>11)digits=digits.slice(2);return digits.length>=10&&digits.length<=11?digits:"";}
function normalizeCep_(value){const digits=String(value||"").replace(/\D/g,"");return digits.length===8?digits.slice(0,5)+"-"+digits.slice(5):"";}
function normalizePositiveInt_(value,min,max){const n=parseInt(String(value==null?"":value).replace(/\D/g,""),10);if(!Number.isFinite(n))return min;return Math.max(min,Math.min(max,n));}
function normalizeYesNo_(value,fallback){const clean=String(value||"").toLowerCase();if(clean==="sim"||clean==="true"||clean==="1")return "Sim";if(clean==="não"||clean==="nao"||clean==="false"||clean==="0")return "Não";return fallback||"Não";}
function isYes_(value){return normalizeYesNo_(value,"Não")==="Sim";}
function normalizeUrl_(value){const text=normalizeText_(value,2000);return /^https?:\/\//i.test(text)?text:"";}
function normalizeShopeeUrl_(value){const text=normalizeUrl_(value);if(!text)return "";const match=text.match(/^https:\/\/([a-z0-9.-]+)(\/.*)?$/i);if(!match)return "";const host=String(match[1]||"").toLowerCase();if(host!=="shopee.com.br"&&!host.endsWith(".shopee.com.br")&&host!=="shopee.com"&&!host.endsWith(".shopee.com"))return "";return text;}
function formatMoneyBr_(value) {
  return "R$ " + Number(value || 0).toFixed(2).replace(".", ",");
}

function toMoney_(value){return Math.max(0,parsePrice_(value));}
function parsePrice_(value){if(value==null||value==="")return 0;if(typeof value==="number")return Number.isFinite(value)?value:0;let clean=String(value).trim().replace(/[^0-9,.-]/g,"");if(!clean)return 0;if(clean.indexOf(",")>=0&&clean.indexOf(".")>=0)clean=clean.replace(/\./g,"").replace(",",".");else if(clean.indexOf(",")>=0)clean=clean.replace(",",".");const n=Number(clean);return Number.isFinite(n)?n:0;}
function slugify_(value){return normalizeText_(value,240).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120);}
function formatOrderId_(value){const n=Number(value);if(!Number.isFinite(n))return "";return String(Math.trunc(n)).padStart(4,"0");}
function serializeValue_(value){if(value instanceof Date)return Utilities.formatDate(value,"America/Sao_Paulo","yyyy-MM-dd'T'HH:mm:ssXXX");return value==null?"":value;}
function shortDate_(value){if(!value)return "";const date=value instanceof Date?value:new Date(value);if(String(date)==="Invalid Date")return String(value);return Utilities.formatDate(date,"America/Sao_Paulo","dd/MM/yyyy");}
function sanitizeCallback_(value){const callback=String(value||"");return /^[A-Za-z_$][0-9A-Za-z_$\.]{0,100}$/.test(callback)?callback:"";}
function output_(data,callback){const json=JSON.stringify(data),safeCallback=sanitizeCallback_(callback);if(safeCallback)return ContentService.createTextOutput(safeCallback+"("+json+");").setMimeType(ContentService.MimeType.JAVASCRIPT);return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);}
function safeError_(error){return normalizeText_(error&&error.message?error.message:error,800)||"Erro desconhecido.";}


function testCheckoutEmail_() {
  const destination = PropertiesService.getScriptProperties().getProperty("NOTIFICATION_EMAIL") || "orume3d@gmail.com";
  MailApp.sendEmail({
    to: destination,
    subject: "Teste checkout Orume",
    body: "O envio de e-mail do checkout Orume está autorizado e funcionando."
  });
}

// Afiliados: o cadastro é administrativo, a resolução pública aceita apenas um código.
function getAffiliates_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Afiliados");
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues().filter(function(row) { return row[0]; }).map(function(row) {
    return { code: String(row[0]), name: String(row[1]), rate: Number(row[2]), active: isYes_(row[3]), updatedAt: serializeValue_(row[4]) };
  });
}
function affiliateMoney_(price, rate) { return Math.round((price * (100 + rate) / 100 + Number.EPSILON) * 100) / 100; }
function requireAffiliate_(code) {
  const affiliate = getAffiliates_().find(function(item) { return item.code === String(code || ""); });
  if (!affiliate || !affiliate.active || !Number.isFinite(affiliate.rate) || affiliate.rate < 0 || affiliate.rate > 1000) throw new Error("Afiliado inexistente ou inativo.");
  return { code: affiliate.code, name: affiliate.name, rate: affiliate.rate, active: true };
}
function checkoutAffiliate_(payload) {
  if (!payload.affiliateCode) return null;
  const affiliate = requireAffiliate_(payload.affiliateCode);
  if (Number(payload.affiliateRate) !== affiliate.rate) throw new Error("A taxa do afiliado mudou. Recarregue a página antes de continuar.");
  return affiliate;
}
function saveAffiliate_(affiliate, mode) {
  const code = String(affiliate.code || "").trim();
  const name = normalizeText_(affiliate.name, 120);
  const rate = Number(affiliate.rate);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(code) || code.length > 80) throw new Error("Código inválido: use letras minúsculas, números e hífens.");
  if (!name || /^[=+@-]/.test(name)) throw new Error("Informe um nome válido.");
  if (affiliate.rate === "" || !Number.isFinite(rate) || rate < 0 || rate > 1000 || Math.abs(rate * 100 - Math.round(rate * 100)) > 0.00001) throw new Error("Informe uma taxa de 0 a 1000%, com até duas casas decimais.");
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = book.getSheetByName("Afiliados");
  if (!sheet) {
    sheet = book.insertSheet("Afiliados");
    sheet.getRange(1, 1, 1, 5).setValues([["Código", "Nome", "Acréscimo (%)", "Ativo", "Atualizado em"]]);
    sheet.setFrozenRows(1);
  }
  const row = findRowByValue_(sheet, 1, code);
  if (mode !== "create" && mode !== "update") throw new Error("Modo de gravação inválido.");
  if (mode === "create" && row) throw new Error("Este código já existe. Edite o afiliado cadastrado.");
  if (mode === "update" && !row) throw new Error("Afiliado não encontrado.");
  const values = [code, name, rate, affiliate.active === true ? "Sim" : "Não", new Date()];
  if (row) sheet.getRange(row, 1, 1, 5).setValues([values]); else sheet.appendRow(values);
  return requireAffiliateForAdmin_(code);
}
function requireAffiliateForAdmin_(code) { return getAffiliates_().find(function(item) { return item.code === code; }); }
function ensureAffiliateColumns_(sheet, start) {
  const last = start + 2;
  if (sheet.getMaxColumns() < last) sheet.insertColumnsAfter(sheet.getMaxColumns(), last - sheet.getMaxColumns());
  const headers = sheet.getRange(1, start, 1, 3).getValues()[0];
  const expected = ["Afiliado", "Acréscimo afiliado (%)", "Valor acréscimo afiliado"];
  if (headers.some(function(value, index) { return value && value !== expected[index]; })) throw new Error("As colunas de afiliado já estão ocupadas na aba " + sheet.getName() + ". Confira a estrutura antes de continuar.");
  sheet.getRange(1, start, 1, 3).setValues([expected]);
}
