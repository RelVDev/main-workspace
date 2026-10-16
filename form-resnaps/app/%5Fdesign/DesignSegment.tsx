"use client";

import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export function DesignSegment() {
  const [mode, setMode] = useState<"in" | "out">("in");
  return (
    <SegmentedControl<"in" | "out">
      name="mode"
      ariaLabel="Pilih mode"
      value={mode}
      onChange={setMode}
      options={[
        { value: "in", label: "MASUK", icon: LogIn },
        { value: "out", label: "PULANG", icon: LogOut },
      ]}
    />
  );
}
