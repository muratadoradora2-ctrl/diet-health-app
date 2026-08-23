"use client";

import { useMemo } from "react";
import type { MovingAveragePoint } from "@/lib/metrics";

export function LineChart({
  points,
  unitLabel,
}: {
  points: MovingAveragePoint[];
  unitLabel: string;
}) {
  const { avgPath, dots, minY, maxY } = useMemo(() => {
    const values = points
      .flatMap((p) => [p.value, p.average])
      .filter((v): v is number => v !== null);

    if (values.length === 0) {
      return { avgPath: "", dots: [] as { x: number; y: number }[], minY: 0, maxY: 0 };
    }

    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const padding = Math.max((rawMax - rawMin) * 0.15, 0.5);
    const minY = rawMin - padding;
    const maxY = rawMax + padding;

    const width = 100;
    const height = 100;
    const stepX = points.length > 1 ? width / (points.length - 1) : 0;
    const toY = (v: number) => height - ((v - minY) / (maxY - minY)) * height;

    let avgPath = "";
    const dots: { x: number; y: number }[] = [];

    points.forEach((p, i) => {
      const x = stepX * i;
      if (p.value !== null) {
        dots.push({ x, y: toY(p.value) });
      }
      if (p.average !== null) {
        const y = toY(p.average);
        avgPath += avgPath ? ` L ${x} ${y}` : `M ${x} ${y}`;
      }
    });

    return { avgPath, dots, minY, maxY };
  }, [points]);

  if (points.length === 0) {
    return <p className="lead-note">この期間のデータがありません。</p>;
  }

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div>
      <div className="chart-wrap">
        <div className="chart-yaxis">
          <span>{maxY.toFixed(1)}</span>
          <span>{minY.toFixed(1)}</span>
        </div>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="chart-svg"
          role="img"
          aria-label={`${unitLabel}の推移グラフ`}
        >
          {avgPath && (
            <path
              d={avgPath}
              className="chart-avg-line"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="1.1" className="chart-dot" />
          ))}
        </svg>
      </div>
      <div className="chart-axis">
        <span>{first.date.slice(5).replace("-", "/")}</span>
        <span>{last.date.slice(5).replace("-", "/")}</span>
      </div>
      <p className="chart-legend">
        <span className="chart-legend-dot" />
        日々の記録
        <span className="chart-legend-line" />
        7日移動平均
      </p>
    </div>
  );
}
