// P02.5: kartu surface, sudut 16px.
import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-card border border-line bg-surface p-4 shadow-sm ${className}`}
    />
  );
}
