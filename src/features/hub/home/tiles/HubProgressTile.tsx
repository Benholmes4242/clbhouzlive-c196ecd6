/**
 * HubProgressTile - Progress tile with XP and mini chart
 * Shows user progress stats
 */

import React from 'react';

// Mock data for the chart bars
const CHART_BARS = [
  40, 55, 45, 60, 50, 70, 65, 55, 75, 60, 80, 55, 70, 65
];

export function HubProgressTile() {
  return (
    <div
      className="w-full rounded-[22px] p-4 transition-all"
      style={{
        background: 'var(--hub-glass-bg)',
        border: '1px solid var(--hub-stroke)',
        boxShadow: 'var(--hub-shadow-tile)',
      }}
    >
      <div className="flex items-start justify-between">
        {/* Left side - text */}
        <div>
          <div 
            className="text-[18px] font-bold"
            style={{ color: 'var(--hub-text)' }}
          >
            Progress
          </div>
          <div 
            className="text-[22px] font-bold mt-1"
            style={{ color: '#2F7CFF' }}
          >
            +450 XP
          </div>
          <div 
            className="text-[13px] mt-2"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            Distance  6.4k mil
          </div>
        </div>

        {/* Right side - mini chart */}
        <div className="flex items-end gap-[3px] h-16">
          {CHART_BARS.map((height, i) => (
            <div
              key={i}
              className="w-[6px] rounded-sm"
              style={{
                height: `${height}%`,
                background: '#2F7CFF',
                opacity: 0.7 + (i / CHART_BARS.length) * 0.3,
              }}
            />
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: i === 0 ? 'var(--hub-text)' : 'var(--hub-text-muted)',
              opacity: i === 0 ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}
