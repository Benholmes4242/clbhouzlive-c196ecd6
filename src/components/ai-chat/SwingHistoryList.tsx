/**
 * Swing History List
 * Displays swing analysis history from Supabase
 */

import React from 'react';

interface SwingHistoryListProps {
  onSelect: (id: string) => void;
}

export function SwingHistoryList({ onSelect }: SwingHistoryListProps) {
  // TODO: Load from Supabase
  const swingAnalyses: any[] = [];

  if (swingAnalyses.length === 0) {
    return (
      <div className="text-center py-12 text-white/60">
        <p>No swing analyses yet</p>
        <p className="text-sm mt-2 text-white/40">Upload a swing video to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {swingAnalyses.map((analysis) => (
        <button
          key={analysis.id}
          onClick={() => onSelect(analysis.id)}
          className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <div className="font-medium text-white mb-1">{analysis.title}</div>
          <div className="text-sm text-white/60">{analysis.date}</div>
        </button>
      ))}
    </div>
  );
}
