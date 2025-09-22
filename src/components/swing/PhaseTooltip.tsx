import { METRIC_INFO, type MetricKey, gradeMetric } from "@/config/swingMetrics";

export function PhaseTooltip({ metrics }: { metrics?: Partial<Record<MetricKey, number>> }) {
  if (!metrics) return null;
  const keys = Object.keys(metrics) as MetricKey[];
  if (!keys.length) return null;

  return (
    <div role="tooltip" className="rounded-md border bg-popover text-popover-foreground p-3 shadow-sm">
      <ul className="space-y-1">
        {keys.slice(0,4).map(k => {
          const v = metrics[k]; if (v == null) return null;
          const info = METRIC_INFO[k];
          const g = gradeMetric(k, v);
          const badge =
            g === "good" ? "bg-emerald-100 text-emerald-700" :
            g === "warn" ? "bg-amber-100 text-amber-800" :
            "bg-rose-100 text-rose-700";
          const txt = info.fmt ? info.fmt(v) : String(v);
          return (
            <li key={k} className="flex items-center justify-between gap-3">
              <span className="text-sm">{info.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${badge}`}>{txt}{info.unit || ""}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Values reflect last completed frame for this phase.
      </p>
    </div>
  );
}