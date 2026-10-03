const ORUME_WHATSAPP = '5519989342212';

/** A palavra em minúsculas faz parte do fluxo de cadastro no WhatsApp. */
export const buildWhatsAppUrl = (message: string) => {
  const text = message.includes('orume') ? message.trim() : `${message.trim()}\n\norume`;
  return `https://wa.me/${ORUME_WHATSAPP}?text=${encodeURIComponent(text)}`;
};
