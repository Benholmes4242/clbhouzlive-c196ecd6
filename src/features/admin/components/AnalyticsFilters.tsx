import React from 'react';

export type Filters = {
  range: '7d' | '30d' | '90d' | 'custom';
  customFrom?: string; // ISO
  customTo?: string;   // ISO
  event?: string;
  userId?: string;
  tag?: string;
};

export function calcRangeISO(range: Filters): { from: string; to: string } {
  const to = new Date();
  let from = new Date();
  if (range.range === '7d') from.setDate(to.getDate() - 7);
  else if (range.range === '30d') from.setDate(to.getDate() - 30);
  else if (range.range === '90d') from.setDate(to.getDate() - 90);
  else {
    from = new Date(range.customFrom || to.toISOString());
    return { from: from.toISOString(), to: (range.customTo ? new Date(range.customTo) : to).toISOString() };
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

export const AnalyticsFilters: React.FC<{
  value: Filters;
  onChange: (next: Filters) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Range */}
      <select
        value={value.range}
        onChange={e => onChange({ ...value, range: e.target.value as any })}
        className="px-3 py-1.5 rounded-lg text-sm border border-border bg-card/50 backdrop-blur-sm"
        aria-label="Select date range"
      >
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="custom">Custom…</option>
      </select>

      {value.range === 'custom' && (
        <>
          <input
            type="datetime-local"
            value={value.customFrom ?? ''}
            onChange={e => onChange({ ...value, customFrom: e.target.value })}
            className="px-2 py-1.5 rounded-md text-sm bg-card/50 border border-border backdrop-blur-sm"
            aria-label="From date/time"
          />
          <input
            type="datetime-local"
            value={value.customTo ?? ''}
            onChange={e => onChange({ ...value, customTo: e.target.value })}
            className="px-2 py-1.5 rounded-md text-sm bg-card/50 border border-border backdrop-blur-sm"
            aria-label="To date/time"
          />
        </>
      )}

      {/* Event (optional) */}
      <input
        placeholder="Filter by event (e.g. echo_history_open_full)"
        value={value.event ?? ''}
        onChange={e => onChange({ ...value, event: e.target.value || undefined })}
        className="flex-1 min-w-[220px] px-3 py-1.5 rounded-md text-sm bg-card/50 border border-border backdrop-blur-sm"
        aria-label="Event filter"
      />

      {/* Tag (optional) */}
      <input
        placeholder="Tag (e.g. research)"
        value={value.tag ?? ''}
        onChange={e => onChange({ ...value, tag: e.target.value || undefined })}
        className="w-[180px] px-3 py-1.5 rounded-md text-sm bg-card/50 border border-border backdrop-blur-sm"
        aria-label="Tag filter"
      />

      {/* User (optional) */}
      <input
        placeholder="User ID"
        value={value.userId ?? ''}
        onChange={e => onChange({ ...value, userId: e.target.value || undefined })}
        className="w-[220px] px-3 py-1.5 rounded-md text-sm bg-card/50 border border-border backdrop-blur-sm"
        aria-label="User filter"
      />
    </div>
  );
};
