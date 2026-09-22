const SPREADSHEET_ID = "1-3kwgx0P-tRecpBbE_jsdr2_N40PmY302PuJgAnuMjE";

const SHEETS = {
  intake: "Pedidos Site",
  clients: "Clientes",
  orders: "Encomendas",
};

const NOTIFICATION_EMAIL = "orume3d@gmail.com";
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/edit";

function testSetup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const missing = Object.keys(SHEETS)
    .map(function(key) { return SHEETS[key]; })
    .filter(function(name) { return !ss.getSheetByName(name); });

  if (missing.length) {
    throw new Error("Abas ausentes: " + missing.join(", "));
  }

  const result = {
    ok: true,
    spreadsheet: ss.getName(),
    spreadsheetId: ss.getId(),
    sheets: SHEETS,
    mode: "google-sheets-only",
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testEmail() {
  const subject = "[ORUME 3D] Teste de notificação";
  const body = [
    "Teste de e-mail do sistema de orçamentos da Orume 3D.",
    "",
    "Se esta mensagem chegou, o Apps Script está autorizado a enviar as notificações de novos pedidos.",
    "",
    "Planilha: " + SPREADSHEET_URL,
  ].join("\n");

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    body: body,
    name: "Orume 3D — Orçamentos",
  });

  Logger.log("E-mail de teste enviado para " + NOTIFICATION_EMAIL);
  return { ok: true, sentTo: NOTIFICATION_EMAIL };
}

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

    const emailResult = sendOrderEmail_(payload, order, siteId);

    intake.getRange(intakeRow, 19).setValue("Registrado");
    intake.getRange(intakeRow, 20).setValue("Sim");
    intake.getRange(intakeRow, 21).setValue(order.id);
    intake.getRange(intakeRow, 23).setValue(
      emailResult.sent
        ? "Registro concluído; e-mail enviado para " + NOTIFICATION_EMAIL
        : "Registro concluído; falha no e-mail: " + emailResult.error
    );

    SpreadsheetApp.flush();

    return json_({
      source: "orume-intake",
      ok: true,
      siteId: siteId,
      orderId: order.id,
      clientRow: client.row,
      storage: "google-sheets",
      emailSent: emailResult.sent,
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

    return json_({
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

  const quantity = String(p.quantity || "").trim();
  if (!/^\d+$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 9999) {
    throw new Error("Quantidade inválida. Informe um número inteiro entre 1 e 9999.");
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


function sendOrderEmail_(p, order, siteId) {
  try {
    if (MailApp.getRemainingDailyQuota() < 1) {
      return { sent: false, error: "cota diária de e-mail esgotada" };
    }

    const tz = Session.getScriptTimeZone() || "America/Sao_Paulo";
    const createdAt = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm:ss");
    const orderId = order && order.id ? order.id : "";
    const phone = normalizePhone_(p.phone);
    const whatsappUrl = phone
      ? "https://wa.me/55" + phone
      : "";

    const fields = [
      ["Data / hora", createdAt],
      ["ID do site", siteId],
      ["ID do pedido", orderId],
      ["Nome do cliente", safeText_(p.name)],
      ["WhatsApp", phone],
      ["Cidade / UF", safeText_(p.city)],
      ["Indicado por", safeText_(p.referral) || "Direto / Orume"],
      ["Produto / peça", safeText_(p.product)],
      ["Quantidade", safeText_(p.quantity)],
      ["Medidas aproximadas", safeText_(p.dimensions)],
      ["Cor", safeText_(p.color)],
      ["Material", safeText_(p.material)],
      ["Prazo desejado", safeText_(p.deadline)],
      ["Links / referências", safeText_(p.links)],
      ["Detalhes do projeto", safeText_(p.description)],
      ["Forma de entrega", safeText_(p.delivery)],
      ["CEP", formatCep_(p.cep)],
      ["Observações", safeText_(p.notes)],
      ["Atendimento clean", p.cleanService ? "SIM" : "NÃO"],
    ];

    const subject =
      "[ORUME 3D] Novo orçamento" +
      (orderId ? " — " + orderId : "") +
      " — " + safeText_(p.name);

    const textLines = [
      "NOVO ORÇAMENTO — ORUME 3D",
      "",
    ];

    fields.forEach(function(field) {
      textLines.push(field[0] + ": " + (field[1] || "—"));
    });

    textLines.push("");
    textLines.push("Planilha: " + SPREADSHEET_URL);
    if (whatsappUrl) textLines.push("Abrir WhatsApp do cliente: " + whatsappUrl);

    const rows = fields.map(function(field) {
      return (
        "<tr>" +
          "<td style=\"padding:8px 10px;border-bottom:1px solid #e5e7eb;" +
          "font-weight:700;vertical-align:top;width:190px\">" +
          escapeHtml_(field[0]) +
          "</td>" +
          "<td style=\"padding:8px 10px;border-bottom:1px solid #e5e7eb;" +
          "vertical-align:top\">" +
          formatEmailValue_(field[1]) +
          "</td>" +
        "</tr>"
      );
    }).join("");

    const htmlBody =
      "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:760px;margin:auto\">" +
        "<div style=\"background:#0b1017;color:#fff;padding:22px 24px;border-radius:14px 14px 0 0\">" +
          "<div style=\"font-size:12px;letter-spacing:.12em;color:#9fb1c8;font-weight:700\">ORUME 3D</div>" +
          "<h1 style=\"margin:6px 0 0;font-size:24px\">Novo orçamento recebido</h1>" +
        "</div>" +
        "<div style=\"border:1px solid #d8dee8;border-top:0;padding:18px 20px;border-radius:0 0 14px 14px\">" +
          "<table style=\"width:100%;border-collapse:collapse;font-size:14px\">" +
            rows +
          "</table>" +
          "<div style=\"margin-top:18px\">" +
            "<a href=\"" + escapeHtml_(SPREADSHEET_URL) + "\" " +
              "style=\"display:inline-block;padding:10px 14px;margin:0 8px 8px 0;" +
              "background:#486a9b;color:#fff;text-decoration:none;border-radius:8px;font-weight:700\">" +
              "Abrir planilha" +
            "</a>" +
            (whatsappUrl
              ? "<a href=\"" + escapeHtml_(whatsappUrl) + "\" " +
                "style=\"display:inline-block;padding:10px 14px;margin:0 8px 8px 0;" +
                "background:#25d366;color:#07110b;text-decoration:none;border-radius:8px;font-weight:700\">" +
                "Abrir WhatsApp do cliente" +
                "</a>"
              : "") +
          "</div>" +
          (p.cleanService
            ? "<div style=\"margin-top:12px;padding:12px 14px;background:#f3f4f6;border-radius:8px;" +
              "font-size:13px\"><strong>ATENDIMENTO CLEAN:</strong> manter a comunicação objetiva, " +
              "somente pelo WhatsApp e limitada ao necessário para o pedido.</div>"
            : "") +
        "</div>" +
      "</div>";

    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: subject,
      body: textLines.join("\n"),
      htmlBody: htmlBody,
      name: "Orume 3D — Orçamentos",
    });

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: String(error && error.message ? error.message : error),
    };
  }
}

function escapeHtml_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEmailValue_(value) {
  const text = String(value == null || value === "" ? "—" : value);
  return escapeHtml_(text).replace(/\n/g, "<br>");
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
