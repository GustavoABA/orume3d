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



    if (action === "ping") return output_({ ok: true, version: 2, spreadsheetId: SPREADSHEET_ID }, p.callback);

    if (action === "status") return output_(getQuoteStatus_(p.siteId), p.callback);

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



  const orderId = allocateOrderId_();

  const uid = Utilities.getUuid();

  const now = new Date();

  const row = [

    orderId, siteId, now, now, "Orçamento", "Normal", name, phone,

    normalizeText_(payload.city, 180), cep, normalizeText_(payload.referral, 180), product,

    quantity, normalizeText_(payload.dimensions, 180), normalizeText_(payload.color, 120),

    normalizeText_(payload.material, 120) || "Avaliar com a Orume",

    normalizeText_(payload.deadline, 80), normalizeText_(payload.links, 1500),

    normalizeText_(payload.description, 3000), normalizeText_(payload.delivery, 160) || "A combinar",

    payload.cleanService ? "Sim" : "Não", normalizeText_(payload.notes, 2500),

    "", 0, "", "", "Pendente", "", "Site ORUME", "", "", uid

  ];

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

  const cart = Array.isArray(payload.cart) ? payload.cart : [];

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



  const subtotal = toMoney_(payload.subtotal);

  const freight = 0;

  const total = subtotal;

  const itemSummary = cart.map(function(item) {

    const itemName = normalizeText_(item.name, 240);

    const quantity = normalizePositiveInt_(item.quantity, 1, 9999);

    const unitPrice = toMoney_(item.unitPrice !== undefined ? item.unitPrice : item.price);

    const lineTotal = toMoney_(item.total !== undefined ? item.total : unitPrice * quantity);

    return quantity + "x " + itemName + " — " + formatMoneyBr_(lineTotal);

  }).join("\n");



  const existing = findRowByValue_(sheet, 1, uid);

  if (existing) return { ok: true, duplicate: true, checkoutId: uid };



  sheet.appendRow([

    uid, now, now, "Aguardando contato", name, phone, cep, city,

    JSON.stringify(cart).slice(0, 45000), subtotal, freight, total,

    "PIX manual", "", "Site ORUME", "", "",

    email, delivery, cleanService, notes, itemSummary

  ]);



  if (payload.cleanService) {

    const destination = PropertiesService.getScriptProperties().getProperty("NOTIFICATION_EMAIL") || "orume3d@gmail.com";

    const subject = "Novo checkout Orume — atendimento mínimo — " + uid;

    const body = [

      "Novo checkout recebido pela Orume 3D.",

      "",

      "ID: " + uid,

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

  return { ok: true, orders: getOrderSummaries_(), products: getProducts_(), spreadsheetId: SPREADSHEET_ID };

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
