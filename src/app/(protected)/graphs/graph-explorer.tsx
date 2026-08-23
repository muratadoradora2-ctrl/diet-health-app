"use client";

import { useMemo, useState } from "react";
import type { BodyComposition } from "@/lib/types";
import { buildMovingAverageSeries } from "@/lib/metrics";
import { LineChart } from "@/components/line-chart";

const METRICS = [
  { key: "weight_kg", label: "体重", unit: "kg" },
  { key: "body_fat_percent", label: "体脂肪率", unit: "%" },
  { key: "muscle_mass_kg", label: "筋肉量", unit: "kg" },
] as const;

const PERIODS = [
  { key: "7", label: "7日", days: 7 },
  { key: "30", label: "30日", days: 30 },
  { key: "90", label: "3か月", days: 90 },
  { key: "all", label: "全期間", days: null },
] as const;

export function GraphExplorer({ entries }: { entries: BodyComposition[] }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("weight_kg");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("30");

  const series = useMemo(() => buildMovingAverageSeries(entries, metric), [entries, metric]);

  const filtered = useMemo(() => {
    const selected = PERIODS.find((p) => p.key === period);
    if (!selected || selected.days === null) return series;
    return series.slice(-selected.days);
  }, [series, period]);

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  return (
    <div>
      <div className="tab-row">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`tab-button${metric === m.key ? " active" : ""}`}
            onClick={() => setMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="tab-row tab-row-sm">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`tab-button-sm${period === p.key ? " active" : ""}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="card">
        <LineChart points={filtered} unitLabel={`${activeMetric.label} (${activeMetric.unit})`} />
      </div>
    </div>
  );
}
