import React from 'react';

export default function PredictiveInsight({ message, targetIndex }: { message: string; targetIndex: number }) {
  return (
    <div className="mx-0 bg-muted border border-border rounded-lg p-4">
      <div className="text-sm text-muted-foreground">{message} <span className="font-semibold text-foreground">{targetIndex.toFixed(1)}</span>.</div>
    </div>
  );
}