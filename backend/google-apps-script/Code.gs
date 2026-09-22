const SPREADSHEET_ID = "1-3kwgx0P-tRecpBbE_jsdr2_N40PmY302PuJgAnuMjE";

const SHEETS = {
  intake: "Pedidos Site",
  clients: "Clientes",
  orders: "Encomendas",
};

function doGet() {
  return json_({ ok: true, service: "orume-intake" });
}

function doPost(e) {
  let intakeRow = 0;
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);

    const payload = parsePayload_(e);
    validate_(payload);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const intake = ss.getSheetByName(SHEETS.intake);
    const clients = ss.getSheetByName(SHEETS.clients);
    const orders = ss.getSheetByName(SHEETS.orders);

    if (!intake || !clients || !orders) {
      throw new Error("Uma ou mais abas obrigatórias não foram encontradas.");
    }

    enforceRateLimit_(payload);

    const siteId = "SITE-" + Utilities.getUuid().split("-")[0].toUpperCase();
    intakeRow = appendIntake_(intake, payload, siteId);

    const client = upsertClient_(clients, payload);
    const order = createOrder_(orders, payload, client.name);

    const notify = notifyOwner_(payload, order.id, siteId);

    intake.getRange(intakeRow, 19).setValue("Registrado");
    intake.getRange(intakeRow, 20).setValue("Sim");
    intake.getRange(intakeRow, 21).setValue(order.id);
    intake.getRange(intakeRow, 23).setValue(
      notify.sent ? "WhatsApp interno enviado" : "Registro concluído; notificação WhatsApp não configurada"
    );

    SpreadsheetApp.flush();

    return postResponse_({
      source: "orume-intake",
      ok: true,
      siteId: siteId,
      orderId: order.id,
      clientRow: client.row,
      whatsappNotificationSent: notify.sent,
    });
  } catch (error) {
    try {
      if (intakeRow) {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const intake = ss.getSheetByName(SHEETS.intake);
        intake.getRange(intakeRow, 19).setValue("Erro");
        intake.getRange(intakeRow, 23).setValue(String(error && error.message ? error.message : error));
      }
    } catch (_) {}

    return postResponse_({
      source: "orume-intake",
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  throw new Error("Payload ausente.");
}

function validate_(p) {
  require_(p.name, "Nome");
  require_(p.phone, "WhatsApp");
  require_(p.city, "Cidade / UF");
  require_(p.product, "Produto / peça");
  require_(p.quantity, "Quantidade");
  require_(p.cep, "CEP");

  const phone = normalizePhone_(p.phone);
  if (phone.length < 10 || phone.length > 11) {
    throw new Error("WhatsApp inválido. Informe DDD + número.");
  }

  const cep = normalizeCep_(p.cep);
  if (cep.length !== 8) {
    throw new Error("CEP inválido. Informe os 8 dígitos.");
  }

  if (String(p.quantity || "").length > 12) {
    throw new Error("Quantidade inválida.");
  }

  const serialized = JSON.stringify(p);
  if (serialized.length > 12000) {
    throw new Error("O formulário excedeu o limite de tamanho.");
  }
}

function require_(value, label) {
  if (!String(value || "").trim()) throw new Error(label + " é obrigatório.");
}

function normalizePhone_(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.indexOf("55") === 0) {
    digits = digits.slice(2);
  }
  return digits;
}

function normalizeCep_(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCep_(value) {
  const digits = normalizeCep_(value);
  return digits.length === 8 ? digits.slice(0, 5) + "-" + digits.slice(5) : digits;
}

function safeText_(value) {
  let text = String(value == null ? "" : value).trim();
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}


function enforceRateLimit_(p) {
  const cache = CacheService.getScriptCache();
  const key = "quote:" + normalizePhone_(p.phone) + ":" + normalizeCep_(p.cep);
  const recent = cache.get(key);
  if (recent) {
    throw new Error("Este orçamento acabou de ser enviado. Aguarde alguns minutos antes de tentar novamente.");
  }
  cache.put(key, "1", 180);
}

function appendIntake_(sheet, p, siteId) {
  const row = sheet.getLastRow() + 1;
  const now = new Date();
  const values = [[
    now,
    siteId,
    safeText_(p.name),
    normalizePhone_(p.phone),
    safeText_(p.city),
    safeText_(p.referral),
    safeText_(p.product),
    safeText_(p.quantity),
    safeText_(p.dimensions),
    safeText_(p.color),
    safeText_(p.material),
    safeText_(p.deadline),
    safeText_(p.links),
    safeText_(p.description),
    safeText_(p.delivery),
    formatCep_(p.cep),
    safeText_(p.notes),
    p.cleanService ? "Sim" : "Não",
    "Recebido",
    "Não",
    "",
    "Site ORUME",
    "",
  ]];
  sheet.getRange(row, 1, 1, values[0].length).setValues(values);
  return row;
}

function firstBlankRow_(sheet, column, maxRow) {
  const limit = Math.min(maxRow || sheet.getMaxRows(), sheet.getMaxRows());
  const values = sheet.getRange(2, column, limit - 1, 1).getDisplayValues();
  for (let i = 0; i < values.length; i++) {
    if (!String(values[i][0] || "").trim()) return i + 2;
  }
  sheet.insertRowsAfter(sheet.getMaxRows(), 100);
  return limit + 1;
}

function copyTemplate_(sheet, row, width) {
  if (row === 2) return;
  const source = sheet.getRange(2, 1, 1, width);
  const target = sheet.getRange(row, 1, 1, width);
  source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
  source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
}

function parseIsoDate_(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
}

function upsertClient_(sheet, p) {
  const phone = normalizePhone_(p.phone);
  const phones = sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).getDisplayValues();
  const names = sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).getDisplayValues();
  let row = 0;

  for (let i = 0; i < phones.length; i++) {
    if (normalizePhone_(phones[i][0]) === phone) {
      row = i + 2;
      break;
    }
  }

  let displayName = safeText_(p.name);
  if (!row) {
    const sameName = names.findIndex(function(item, index) {
      return safeText_(item[0]).toLowerCase() === displayName.toLowerCase()
        && normalizePhone_(phones[index][0])
        && normalizePhone_(phones[index][0]) !== phone;
    });
    if (sameName >= 0) displayName += " (" + phone.slice(-4) + ")";
  } else {
    displayName = safeText_(sheet.getRange(row, 1).getDisplayValue()) || displayName;
  }

  const address = [safeText_(p.city), p.cep ? "CEP " + formatCep_(p.cep) : ""].filter(Boolean).join(" — ");
  const cleanNote = p.cleanService
    ? "Preferência de atendimento: CLEAN / mínimo de interação."
    : "Preferência de atendimento: padrão.";

  if (!row) {
    row = firstBlankRow_(sheet, 1, 1000);
    copyTemplate_(sheet, row, 8);
    sheet.getRange(row, 1, 1, 4).setValues([[
      displayName,
      phone,
      address,
      "Cliente cadastrado pelo formulário do site. " + cleanNote,
    ]]);
  } else {
    if (address) sheet.getRange(row, 3).setValue(address);
    const current = String(sheet.getRange(row, 4).getDisplayValue() || "").trim();
    if (!current.includes(cleanNote)) {
      sheet.getRange(row, 4).setValue([current, cleanNote].filter(Boolean).join(" | "));
    }
  }

  return { row: row, name: displayName };
}

function createOrder_(sheet, p, clientName) {
  const row = firstBlankRow_(sheet, 4, 1000);
  copyTemplate_(sheet, row, 37);
  const quantity = safeText_(p.quantity);
  const product = safeText_(p.product) + (quantity ? " — Qtd. " + quantity : "");
  const notes = [
    p.dimensions ? "Medidas: " + safeText_(p.dimensions) : "",
    p.description ? "Detalhes: " + safeText_(p.description) : "",
    p.notes ? "Observações: " + safeText_(p.notes) : "",
    "Atendimento: " + (p.cleanService ? "CLEAN / mínimo de interação" : "Padrão"),
    "Origem: formulário do site ORUME",
  ].filter(Boolean).join(" | ");

  sheet.getRange(row, 2).setValue("Orçamento");
  sheet.getRange(row, 3).setValue("Normal");
  sheet.getRange(row, 4).setValue(new Date());
  if (p.deadline) {
    const deadline = parseIsoDate_(p.deadline);
    if (deadline) sheet.getRange(row, 5).setValue(deadline);
  }
  sheet.getRange(row, 8).setValue(clientName || safeText_(p.name));
  sheet.getRange(row, 9).setValue(product);
  if (p.links) sheet.getRange(row, 11).setValue(safeText_(p.links));

  if (p.material && p.material !== "Avaliar com a Orume" && p.material !== "Outro / não sei") {
    sheet.getRange(row, 14).setValue(safeText_(p.material));
  }

  if (p.color) sheet.getRange(row, 15).setValue(safeText_(p.color));
  sheet.getRange(row, 28).setValue(safeText_(p.referral) || "Direto / Orume");
  if (p.delivery) sheet.getRange(row, 33).setValue(safeText_(p.delivery));
  sheet.getRange(row, 35).setValue(notes);

  SpreadsheetApp.flush();
  const id = String(sheet.getRange(row, 1).getDisplayValue() || "").trim();

  return { row, id };
}

function notifyOwner_(p, orderId, siteId) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("WHATSAPP_TOKEN");
  const phoneNumberId = props.getProperty("WHATSAPP_PHONE_NUMBER_ID");
  const to = props.getProperty("WHATSAPP_TO");
  const apiVersion = props.getProperty("WHATSAPP_API_VERSION");

  if (!token || !phoneNumberId || !to || !apiVersion) {
    return { sent: false, reason: "not_configured" };
  }

  const url = "https://graph.facebook.com/" + apiVersion + "/" + phoneNumberId + "/messages";

  const body = [
    "NOVO ORÇAMENTO — ORUME 3D",
    orderId ? "Pedido: " + orderId : "Registro: " + siteId,
    "Cliente: " + safeText_(p.name),
    "WhatsApp: " + normalizePhone_(p.phone),
    "Cidade: " + safeText_(p.city),
    "Produto: " + safeText_(p.product),
    "Quantidade: " + safeText_(p.quantity),
    p.deadline ? "Prazo desejado: " + safeText_(p.deadline) : "",
    p.delivery ? "Entrega: " + safeText_(p.delivery) : "",
    p.referral ? "Indicado por: " + safeText_(p.referral) : "",
    "Atendimento: " + (p.cleanService ? "CLEAN" : "Padrão"),
  ].filter(Boolean).join("\n");

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + token },
    payload: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: body },
    }),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  return { sent: code >= 200 && code < 300, code: code };
}

function postResponse_(value) {
  const payload = JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  const html = [
    "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>",
    "<script>",
    "window.parent.postMessage(" + payload + ", '*');",
    "</script>",
    "</body></html>"
  ].join("");

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
