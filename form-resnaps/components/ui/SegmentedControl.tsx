// P02.5 / P07.3: pilihan MASUK | PULANG dengan ikon + label besar (§7).
"use client";

import type { ComponentType } from "react";

export type Option<T extends string> = {
  value: T;
  label: string;
  icon: ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
};

export function SegmentedControl<T extends string>({
  name,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid grid-cols-2 gap-2 rounded-card bg-surface-soft p-1">
      {options.map((o) => {
        const selected = o.value === value;
        const Icon = o.icon;
        return (
          <label
            key={o.value}
            className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-control px-4 text-base font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-blue ${
              selected ? "bg-brand-blue text-white" : "text-ink hover:bg-surface"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={selected}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <Icon aria-hidden={true} className="size-5" />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
