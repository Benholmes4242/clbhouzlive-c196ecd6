import { formatAgo } from '../lib/formatAgo';
import React from 'react';
import { adminTheme as t } from '../theme';
import { useMemberActivity } from '../hooks/useMemberActivity';


interface Props { userId: string | null }

/**
 * C4-1: Member 360 Activity Card.
 * Placement: between engagement rail and golf identity in Member 360 sheet.
 * Failure mode: renders nothing so the sheet keeps working.
 */
export default function MemberActivityCard({ userId }: Props) {
  const { data, isLoading, isError } = useMemberActivity(userId);
  if (isError || !userId) return null;

  const max = data ? Math.max(1, ...data.daily.map(d => d.count)) : 1;

  const Chip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div style={{
      flex: 1,
      background: t.canvas,
      border: `1px solid ${t.line}`,
      borderRadius: t.radius.md,
      padding: '8px 10px',
    }}>
      <div style={{ color: t.inkMuted, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.line}`,
      borderRadius: t.radius.lg,
      padding: 12,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 13 }}>Activity - last 30 days</div>
        {data && (
          <div style={{ color: t.inkMuted, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
            {data.totalEvents} events
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Chip label="Sessions" value={isLoading ? '-' : String(data?.sessions ?? 0)} />
        <Chip label="Last session" value={isLoading ? '-' : formatAgo(data?.lastSessionAt ?? null, { suffix: true, empty: 'never' })} />
        <Chip label="Avg / active day" value={isLoading ? '-' : String(data?.avgPerActiveDay ?? 0)} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 56 }}>
        {(data?.daily ?? new Array(30).fill({ date: '', count: 0 })).map((d, i) => {
          const h = Math.max(2, Math.round((d.count / max) * 54));
          return (
            <div
              key={`${d.date}-${i}`}
              title={d.date ? `${d.date}: ${d.count}` : ''}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                background: isLoading ? t.neutralSoft : d.count > 0 ? t.brand : t.line,
                opacity: isLoading ? 0.5 : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
