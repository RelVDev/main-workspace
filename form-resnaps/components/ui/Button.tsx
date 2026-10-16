// P02.5: primary solid biru + teks putih; secondary outline. Tinggi sentuh ≥ 48px.
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand-blue text-white hover:brightness-95",
  secondary: "border-2 border-brand-blue text-brand-blue bg-surface hover:bg-surface-soft",
  danger: "bg-error text-white hover:brightness-95",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control px-5 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    />
  );
}
