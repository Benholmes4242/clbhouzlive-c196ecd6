import React from "react";

export default function ClbhouzPageSpinner({
  label = 'Loading…',
}: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] grid place-items-center bg-white/60 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        <span className="text-slate-600 font-medium">{label}</span>
      </div>
    </div>
  );
}
