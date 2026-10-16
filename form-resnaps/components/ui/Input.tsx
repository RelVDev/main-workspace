// P02.5: input dengan state fokus jelas. font-size ≥16px agar tidak zoom paksa di iOS (P08.11).
import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-12 w-full rounded-control border-2 border-line bg-surface px-4 text-base text-ink placeholder:text-ink-muted focus:border-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${className}`}
    />
  );
}
