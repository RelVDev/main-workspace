// P10.3: Grafik interaktif absensi masuk dan pulang per interval 15 menit (WIB).
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type IntervalItem = {
  time: string;
  masuk: number;
  pulang: number;
};

export function AttendanceChart({ data }: { data: IntervalItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-control bg-surface-soft text-sm text-ink-muted">
        Belum ada aktivitas absensi untuk ditampilkan pada grafik.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E9E2E4" vertical={false} />
          <XAxis dataKey="time" stroke="#666476" fontSize={11} tickLine={false} />
          <YAxis stroke="#666476" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E9E2E4",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
          />
          <Bar dataKey="masuk" name="Masuk" fill="#1677B8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pulang" name="Pulang" fill="#6035A8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
