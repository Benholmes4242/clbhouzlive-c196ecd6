import React from 'react';
import { Smartphone } from 'lucide-react';
import { adminTheme as t } from '../theme';
import type { OpsHealth } from '../hooks/useOpsHealth';

const num = (n: number) => n.toLocaleString();

const CARD: React.CSSProperties = {
  background: t.surface,
  border: `1px solid ${t.line}`,
  borderRadius: 18,
  boxShadow: t.shadowCard,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const LABEL: React.CSSProperties = {
  color: t.inkFaint,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.3,
};

const FIG: React.CSSProperties = {
  fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1',
  fontVariantNumeric: 'tabular-nums',
};

function Skeleton({ height }: { height: number }) {
  return (
    <div style={{
      height, background: t.canvas, borderRadius: t.radius.md,
      animation: 'admin-pulse 1.4s ease-in-out infinite',
    }} />
  );
}

/**
 * 3.9 CLIENT SPLIT - SYSTEM area, not the Errors footer.
 *
 * The figure is MEMBERS. Sessions are inflated per-client by different amounts
 * (sessionStorage churn on iOS WebView reopens) so they are not comparable
 * across buckets and are rendered as subordinate LABEL metadata only.
 *
 * Deliberately NOT a stacked bar and NOT a percentage of total: a member using
 * two clients appears in two rows, so the counts do not sum to the distinct
 * member total and do not describe a partition.
 */
export function ClientSplitPanel({ data, loading }: { data?: OpsHealth; loading: boolean }) {
  const clients = data?.clients ?? [];
  const traffic = data?.traffic;

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Smartphone size={14} color={t.inkFaint} />
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Client split</div>
        <span style={{ flex: 1 }} />
        <span style={LABEL}>Members, last {data?.window_days ?? 7}d</span>
      </div>

      {loading ? (
        <Skeleton height={132} />
      ) : clients.length === 0 ? (
        <div style={{ color: t.inkFaint, fontSize: 12 }}>No member sessions in the window.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {clients.map((c, i) => (
            <div
              key={c.client}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 10,
                padding: '10px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
              }}
            >
              <span style={{ color: t.ink, fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0 }}>
                {c.client}
              </span>
              <span style={{ ...LABEL, ...FIG }}>{num(c.sessions)} sessions</span>
              <span style={{ ...FIG, color: t.ink, fontSize: 17, fontWeight: 700, minWidth: 34, textAlign: 'right' }}>
                {num(c.members)}
              </span>
            </div>
          ))}
        </div>
      )}

      {traffic && !loading ? (
        <div style={{ ...LABEL, ...FIG, borderTop: `1px solid ${t.line}`, paddingTop: 10 }}>
          {num(traffic.member_sessions)} member sessions, {num(traffic.bot_sessions)} bot
        </div>
      ) : null}
    </section>
  );
}
