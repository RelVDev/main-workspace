// Normalisasi nama tamu yang identik dengan normalize_name() di PostgreSQL.
export function normalizeNameJs(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
