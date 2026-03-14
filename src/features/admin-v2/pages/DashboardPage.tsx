import React from 'react';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Coming in Sprint 3</p>
        </div>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">This section is being built</p>
      </div>
    </div>
  );
}
