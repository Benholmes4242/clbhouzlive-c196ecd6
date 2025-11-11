export function Kpi({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className="text-2xl font-semibold">{value}</div>
        {delta !== undefined && delta !== 0 && (
          <div
            className={`text-xs font-medium ${
              delta > 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
          </div>
        )}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground/70 mt-1">{hint}</div>}
    </div>
  );
}
