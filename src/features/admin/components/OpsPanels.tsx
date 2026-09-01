import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Smartphone, ShieldAlert } from 'lucide-react';
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

/**
 * 3.8 ERRORS - the denominator is member-only, and the label says so. The word
 * "member" is what distinguishes it from the old, bot-inflated figure.
 */
export function OpsErrorsPanel({ data, loading }: { data?: OpsHealth; loading: boolean }) {
  const e = data?.errors;
  const rate =
    e && e.sessions_24h > 0 ? (e.errors_24h / e.sessions_24h) * 100 : null;
  // NO AMBER, AND NO TWO-STEP SEVERITY: the 1-5% tier was warn amber and is
  // now the same red as 5%+. The detail line below carries the magnitude - the
  // hue only has to say "bad". Below 1% stays green.
  const tone = rate === null ? t.inkMuted : rate >= 1 ? t.dangerText : t.okText;

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShieldAlert size={14} color={t.inkFaint} />
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Errors</div>
        <span style={{ flex: 1 }} />
        <Link
          to="/admin-v2/health?tab=status"
          style={{ ...LABEL, display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}
        >
          Health <ChevronRight size={12} />
        </Link>
      </div>

      {loading || !e ? (
        <Skeleton height={96} />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...FIG, color: tone, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
              {rate === null ? '-' : `${(Math.round(rate * 10) / 10).toFixed(1)}%`}
            </span>
            <span style={{ color: t.inkMuted, fontSize: 12 }}>error rate, last 24h</span>
          </div>
          <div style={{ ...LABEL, ...FIG }}>
            {num(e.errors_24h)} errors across {num(e.sessions_24h)} member sessions
            {e.users_hit_24h > 0
              ? ` - ${num(e.users_hit_24h)} member${e.users_hit_24h === 1 ? '' : 's'} hit`
              : ''}
          </div>
          {/* SEPARATED, NOT DISCARDED. A rising figure here means the update
              mechanism is failing, not that the current build is worse. */}
          {(e.outdated_errors_24h ?? 0) > 0 && (
            <div style={{ ...LABEL, ...FIG, color: t.inkFaint }}>
              {num(e.outdated_errors_24h)} error{e.outdated_errors_24h === 1 ? '' : 's'} from outdated clients
              {(e.outdated_users_24h ?? 0) > 0
                ? ` - ${num(e.outdated_users_24h)} member${e.outdated_users_24h === 1 ? '' : 's'}`
                : ''}
            </div>
          )}

          {e.top.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {e.top.slice(0, 3).map((row, i) => (
                <div
                  key={`${row.message}-${i}`}
                  style={{
                    display: 'flex', alignItems: 'baseline', gap: 10,
                    padding: '8px 0',
                    borderTop: `1px solid ${t.line}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: t.ink, fontSize: 13, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {row.message}
                    </div>
                    <div style={LABEL}>{row.kind}{row.route ? ` - ${row.route}` : ''}</div>
                  </div>
                  <span style={{ ...FIG, color: t.ink, fontSize: 13, fontWeight: 700 }}>{num(row.count)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
