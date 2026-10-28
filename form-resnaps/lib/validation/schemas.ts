// P05.4: skema zod untuk input publik.
import { z } from "zod";

export const searchQuery = z.object({
  q: z.string().trim().min(2).max(60),
});

export const guestId = z.object({
  guest_id: z.string().uuid(),
  locked_guest_id: z.string().uuid().optional(),
});

export const tokenInput = z.object({
  t: z.string().min(1).max(120),
});

export const mode = z.enum(["in", "out"]);

export const paymentStatusSchema = z.enum(["lunas", "belum_lunas"]);

export const voucherScanInput = z.object({
  code: z.string().trim().min(4).max(120),
  kind: z.enum(["meal", "photobooth"]),
});

export const htmActionInput = z.object({
  guest_id: z.string().uuid(),
  action: z.enum(["approve_checkin", "set_payment", "set_allergies", "reset_attendance"]),
  payment_status: paymentStatusSchema.optional(),
  allergies: z.string().trim().max(200).nullable().optional(),
});
