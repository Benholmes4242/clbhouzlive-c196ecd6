import React from 'react';
import { Shield } from 'lucide-react';

export default function AdminV2Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
      {/* Animated amber shield */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: 'hsl(var(--accent-amber) / 0.15)' }}>
        <Shield className="w-7 h-7" style={{ color: 'hsl(var(--accent-amber))' }} />
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">Admin Console</p>
        <p className="text-xs text-muted-foreground">Verifying access…</p>
      </div>

      {/* Skeleton rows */}
      <div className="w-full max-w-xs space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}
