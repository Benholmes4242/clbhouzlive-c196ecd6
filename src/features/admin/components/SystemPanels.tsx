import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { adminTheme as t } from '../theme';
import { CARD, KICKER, LABEL, FIG, Skeleton, num, formatDurationShort } from '../lib/chartPrimitives';
import { toneColor, type ChipState, type ChipTone } from '../lib/healthChips';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import type { OpsHealth } from '../hooks/useOpsHealth';
import type { EgSyncHealth } from '../hooks/useDashboard';
import type { useTriageCounts } from '../hooks/useTriageCounts';

const HAIRLINE = `1px solid ${t.hairline}`;

/** Column widths for the client split, shared by the header row and the rows. */
const SESSIONS_COL = 62;
const MEMBERS_COL = 38;

const CLIENTS_REGION_ID = 'admin-system-clients';
const CLIENTS_OPEN_KEY = 'admin-v2:system:clients-open';



// ─── 1 SYSTEM ─────────────────────────────────────────────────────────────────

/**
 * A cap is a full-width 2.5px bar. Ok states sit at 0.5 opacity and idle at
 * 0.3, so the one that is NOT ok is what the eye lands on.
 */
function Cap({ state, to }: { state: ChipState; to: string }) {
  const opacity = state.tone === 'ok' ? 0.5 : state.tone === 'idle' ? 0.3 : 1;
  return (
    <Link to={to} style={{ textDecoration: 'none', minWidth: 0, display: 'block' }}>
      <div style={{ height: 2.5, borderRadius: 2, background: toneColor(state.tone), opacity }} />
      <div style={{ ...LABEL, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {state.label}
      </div>
      <div style={{
        ...FIG, color: t.ink, fontSize: 11, fontWeight: 700, marginTop: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {state.detail}
      </div>
    </Link>
  );
}

/**
 * 1c: when EG sync is not ok, show the diagnosis the chip discards. The chip's
 * own detail is only usable in the ok case.
 */
function egDetail(chip: ChipState, eg?: EgSyncHealth): string {
  if (chip.tone === 'ok' || chip.tone === 'idle' || !eg) return chip.detail;
  const auth = eg.auth_failed ?? 0;
  const unavailable = eg.eg_unavailable ?? 0;
  if (auth === 0 && unavailable === 0) {
    return `${num(eg.consecutive_failures_total ?? 0)} failures`;
  }
  return `${num(auth)} auth, ${num(unavailable)} unavailable`;
}

export type PipelineTone = Extract<ChipTone, 'ok' | 'warn' | 'danger'>;

/** 3e thresholds. Exported so panel 1 can raise a sixth cap on danger. */
export function pipelineTone(p?: OpsHealth['pipeline']): PipelineTone {
  if (!p) return 'ok';
  if (p.oldest_wait_sec >= 6 * 3600) return 'danger';
  if (p.oldest_wait_sec >= 3600 || p.errored > 0) return 'warn';
  return 'ok';
}

export function SystemPanel({
  chips, nonOkChips, triage, ops, opsLoading, eg,
}: {
  chips: { eg: ChipState; cron: ChipState; echo: ChipState; push: ChipState; errors: ChipState };
  nonOkChips: number;
  triage: ReturnType<typeof useTriageCounts>;
  ops?: OpsHealth;
  opsLoading: boolean;
  eg?: EgSyncHealth;
}) {
  const pTone = pipelineTone(ops?.pipeline);
  const caps: { state: ChipState; to: string }[] = [
    { state: { ...chips.eg, detail: egDetail(chips.eg, eg) }, to: '/admin-v2/health?tab=status' },
    { state: chips.cron, to: '/admin-v2/health?tab=status' },
    // "Echo engines" cannot fit five columns at 390px. The detail line already
    // says "engines"; shortened here only, so other surfaces keep the long label.
    { state: { ...chips.echo, label: 'Echo' }, to: '/admin-v2/health?tab=status' },

    { state: chips.push, to: '/admin-v2/health?tab=status' },
    { state: chips.errors, to: '/admin-v2/health?tab=stability' },
  ];
  // A danger pipeline earns a sixth cap: this panel is where an admin looks first.
  if (pTone === 'danger' && ops?.pipeline) {
    caps.push({
      state: {
        tone: 'danger', label: 'Pipeline',
        detail: `oldest ${formatDurationShort(ops.pipeline.oldest_wait_sec)}`,
      },
      to: '/admin-v2/health?tab=status',
    });
  }

  const buckets = (triage.data?.byQueue ?? []).filter(b => b.count > 0);
  const clients = ops?.clients ?? [];
  const traffic = ops?.traffic;

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={KICKER}>System</span>
        <span style={{ flex: 1 }} />
        {nonOkChips > 0 ? (
          <span style={{ ...LABEL, ...FIG, color: t.warn, fontWeight: 700 }}>
            {nonOkChips} not ok
          </span>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${caps.length}, minmax(0, 1fr))`, gap: 8 }}>
        {caps.map(c => <Cap key={c.state.label} state={c.state} to={c.to} />)}
      </div>

      {/* Queues. The old banner collapsed all of byQueue into "1 waiting" and
          dropped WHICH queue - that is the point of naming them here. */}
      <div style={{ background: t.canvas, borderRadius: t.radius.lg, padding: '4px 12px' }}>
        {triage.isLoading ? (
          <div style={{ padding: '8px 0' }}><Skeleton height={36} /></div>
        ) : buckets.length === 0 ? (
          <div style={{ color: t.inkMuted, fontSize: 13, fontWeight: 600, padding: '10px 0' }}>
            Nothing waiting
          </div>
        ) : (
          buckets.map((b, i) => (
            <Link
              key={b.key}
              to={b.route}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i === 0 ? 'none' : HAIRLINE,
                textDecoration: 'none', color: 'inherit',
              }}
            >
              <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: t.warn, flexShrink: 0 }} />
              <span style={{ color: t.ink, fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.label}
              </span>
              <span style={{ ...FIG, color: t.ink, fontSize: 13, fontWeight: 700 }}>{num(b.count)}</span>
              {b.oldestCreatedAt ? (
                <span style={{ ...LABEL, ...FIG, color: t.inkFaint }}>
                  oldest {Math.max(0, Math.floor((Date.now() - new Date(b.oldestCreatedAt).getTime()) / 86_400_000))}d
                </span>
              ) : null}
              <ChevronRight size={14} color={t.inkFaint} />
            </Link>
          ))
        )}
      </div>

      {/* 1e CLIENT SPLIT - rows, never a stacked bar: a member on two clients
          appears twice, so the counts do not sum to a whole. */}
      <div style={{ borderTop: HAIRLINE, paddingTop: 4 }}>
        <button
          type="button"
          onClick={() => setClientsOpen(v => !v)}
          aria-expanded={clientsOpen}
          aria-controls={CLIENTS_REGION_ID}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'transparent', border: 'none', padding: '6px 0 0',
            cursor: 'pointer', textAlign: 'left', color: 'inherit',
          }}
        >
          <span style={{ ...LABEL, flex: 1, minWidth: 0 }}>
            Members by client, last {ops?.window_days ?? 7}d
          </span>
          <ChevronDown
            size={14}
            color={t.inkFaint}
            aria-hidden
            style={{
              flexShrink: 0,
              transform: clientsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 160ms ease',
            }}
          />
        </button>

        <div id={CLIENTS_REGION_ID} hidden={!clientsOpen}>
          {opsLoading ? (
            <div style={{ paddingTop: 8 }}><Skeleton height={132} /></div>
          ) : clients.length === 0 ? (
            <div style={{ color: t.inkFaint, fontSize: 12, paddingTop: 8 }}>No member sessions in the window.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Column headers only - NEVER a total, a percentage, a
                  percentage-of-total or a bar here: a member who uses two
                  clients is counted in both rows, so these figures do not sum
                  to the member count and any total would assert a partition
                  that does not exist. */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingTop: 8 }}>
                <span style={{ flex: 1, minWidth: 0 }} />
                <span style={{ ...LABEL, color: t.inkFaint, width: SESSIONS_COL, textAlign: 'right' }}>Sessions</span>
                <span style={{ ...LABEL, color: t.inkFaint, width: MEMBERS_COL, textAlign: 'right' }}>Members</span>
              </div>
              {clients.map((c, i) => (
                <div
                  key={c.client}
                  style={{
                    display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 0',
                    borderTop: i === 0 ? 'none' : HAIRLINE,
                  }}
                >
                  <span style={{ color: t.ink, fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0 }}>{c.client}</span>
                  <span style={{ ...LABEL, ...FIG, width: SESSIONS_COL, textAlign: 'right' }}>{num(c.sessions)}</span>
                  <span style={{ ...FIG, color: t.ink, fontSize: 17, fontWeight: 700, width: MEMBERS_COL, textAlign: 'right' }}>
                    {num(c.members)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* The summary of the section: visible collapsed AND expanded. */}
        {traffic && !opsLoading ? (
          <div style={{ ...LABEL, ...FIG, borderTop: HAIRLINE, paddingTop: 10, marginTop: 8 }}>
            {num(traffic.member_sessions)} member sessions, {num(traffic.bot_sessions)} bot
          </div>
        ) : null}
      </div>

    </section>
  );
}

// ─── 2 ACTIVATION ─────────────────────────────────────────────────────────────

/**
 * clbhouz does not work for a member until they connect a handicap: no rounds,
 * no scorecards, no crowns, no stat browse. This is the platform's activation
 * metric and it has never been on the page.
 */
export function ActivationPanel({ ops, loading }: { ops?: OpsHealth; loading: boolean }) {
  const a = ops?.activation;
  const pct = a && a.members_total > 0 ? a.connected / a.members_total : 0;
  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={KICKER}>Activation</span>
        <span style={{ flex: 1 }} />
        {a && a.connected_in_window > 0 ? (
          <span style={{ ...LABEL, ...FIG }}>+{num(a.connected_in_window)} in {ops?.window_days ?? 7}d</span>
        ) : null}
      </div>

      {loading || !a ? (
        <Skeleton height={104} />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...FIG, color: t.ink, fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>
              {num(a.connected)}
            </span>
            <span style={{ color: t.inkMuted, fontSize: 12 }}>of {num(a.members_total)} members</span>
          </div>

          {/* Starts at zero, no target marker, no percentage label: the figures
              above already state it. A mostly-empty bar is the true picture. */}
          <div style={{ height: 6, borderRadius: 3, background: t.neutralSoft, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, pct * 100)}%`, height: '100%', borderRadius: 3, background: t.brand }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {([
              ['Synced', a.synced, t.ink],
              ['Syncing', a.syncing, t.ink],
              ['Failing', a.failing, a.failing > 0 ? t.dangerText : t.ink],
            ] as const).map(([label, value, color]) => (
              <div key={label}>
                <div style={LABEL}>{label}</div>
                <div style={{ ...FIG, color, fontSize: 17, fontWeight: 800, marginTop: 2 }}>{num(value)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─── 3 PIPELINE ───────────────────────────────────────────────────────────────

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

/**
 * gam_evaluation_queue is what turns a synced score into a scorecard, a crown
 * and a feed post. EG sync being green tells you data ARRIVED; it does not tell
 * you it was processed. If this queue backs up the product silently stops
 * producing while every other figure on this page stays healthy.
 *
 * In normal operation this panel is quiet. That is a monitor doing its job.
 */
export function PipelinePanel({ ops, loading }: { ops?: OpsHealth; loading: boolean }) {
  const p = ops?.pipeline;
  const tone = pipelineTone(p);
  const statuses = Object.entries(p?.by_status ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={KICKER}>Pipeline</span>
        <span style={{ flex: 1 }} />
        <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: toneColor(tone), opacity: tone === 'ok' ? 0.5 : 1 }} />
      </div>

      {loading || !p ? (
        <Skeleton height={72} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={LABEL}>Waiting</div>
              <div style={{ ...FIG, color: tone === 'ok' ? t.ink : toneColor(tone), fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                {num(p.unprocessed)}
              </div>
            </div>
            {/* When nothing is waiting there is no oldest item, so nothing renders. */}
            {p.unprocessed > 0 ? (
              <div>
                <div style={LABEL}>Oldest</div>
                <div style={{ ...FIG, color: t.ink, fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                  {formatDurationShort(p.oldest_wait_sec)}
                </div>
              </div>
            ) : null}
            <div>
              <div style={LABEL}>Median</div>
              <div style={{ ...FIG, color: t.ink, fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                {formatDurationShort(p.median_process_sec)}
              </div>
            </div>
          </div>

          {/* Rendered from the keys the RPC actually returned. One entry is the
              normal case; a status not returned is not a zero. */}
          {statuses.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, borderTop: HAIRLINE, paddingTop: 10 }}>
              {statuses.map(([k, v]) => (
                <span key={k} style={{ ...LABEL, ...FIG }}>
                  {titleCase(k)} <span style={{ color: t.ink, fontWeight: 700 }}>{num(v)}</span>
                </span>
              ))}
              {p.retrying > 0 ? (
                <span style={{ ...LABEL, ...FIG, color: t.warnText }}>
                  Retrying <span style={{ fontWeight: 700 }}>{num(p.retrying)}</span>
                </span>
              ) : null}
              {p.errored > 0 ? (
                <span style={{ ...LABEL, ...FIG, color: t.dangerText }}>
                  Errored <span style={{ fontWeight: 700 }}>{num(p.errored)}</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
