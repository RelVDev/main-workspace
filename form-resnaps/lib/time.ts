// Format waktu konsisten dalam zona waktu Indonesia Barat (Asia/Jakarta, WIB).
import { formatInTimeZone } from "date-fns-tz";

export const TIMEZONE_WIB = "Asia/Jakarta";

export function formatWib(date: string | number | Date, fmt: string = "HH.mm 'WIB'"): string {
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return formatInTimeZone(d, TIMEZONE_WIB, fmt);
  } catch {
    return "-";
  }
}
