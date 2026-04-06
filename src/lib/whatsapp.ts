/** Digits only, with country code (e.g. 9198xxxxxxx). */
export function normalizeWhatsAppPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  return d;
}

export function customerWhatsAppUrl(phoneRaw: string, message: string): string {
  const n = normalizeWhatsAppPhone(phoneRaw);
  if (n.length < 10) return "#";
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
