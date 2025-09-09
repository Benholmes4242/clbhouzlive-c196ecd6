import React from 'react';
export default function Bar({ label, value = 0 }: { label: string; value?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((value ?? 0) * 10)));
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 shrink-0 text-sm text-muted-foreground">{label}</div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className="h-2 rounded-full bg-foreground/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}