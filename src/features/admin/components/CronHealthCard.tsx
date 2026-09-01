import React, { useState } from 'react';
import { adminTheme as t } from '../theme';
import { toneColor } from '../lib/healthChips';
import { Skeleton } from '../lib/chartPrimitives';
import { useCronJobHealth, cronFaults, isNeverSucceeded, type CronJobHealthRow } from '../hooks/useCronJobHealth';

/**
 * BRIEF_CRON_FAILURE_WATCH — the most actionable thing on the Status tab, so it
 * sits above the ALL SYSTEMS lanes (the lanes are the history behind it).
 *
 * READ ONLY: no retry, no unschedule. Unscheduling a job from a phone is not a
 * thing that should be one tap away.
 */

const PANEL: React.CSSProperties = {
  background: t.surface,
  border: `1px solid ${t.line}`,
  borderRadius: t.radius.lg,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const KICKER: React.CSSProperties = {
  color: t.inkFaint, fontSize: 9, fontWeight: 700,
  letterSpacing: 0.9, textTransform: 'uppercase',
};

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"kern" 1, "liga" 1',
};

function Dot({ tone }: { tone: 'ok' | 'warn' | 'danger' | 'neutral' }) {
  return (
    <span
      aria-hidden
      style={{
        width: 7, height: 7, borderRadius: 999, flexShrink: 0,
        background: tone === 'neutral' ? t.inkFaint : toneColor(tone),
        opacity: tone === 'ok' ? 0.5 : tone === 'neutral' ? 0.35 : 1,
      }}
    />
  );
}

export default function CronHealthCard() {
  const { data, isLoading, isError } = useCronJobHealth();

  // PENDING IS NOT ABSENT.
  if (isLoading) {
    return (
      <section style={{ ...PANEL, padding: '12px 14px', gap: 8 }}>
        <span style={KICKER}>Cron</span>
        <Skeleton height={14} radius={4} />
      </section>
    );
  }

  // An RPC error must NEVER read ALL RUNNING.
  if (isError || !data) {
    return (
      <section style={{ ...PANEL, padding: '12px 14px', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dot tone="warn" />
          <span style={{ flex: 1, minWidth: 0, color: t.ink, fontSize: 13, fontWeight: 700 }}>
            Cron · state unknown
          </span>
          <span style={{ ...FIG, color: t.warnText, fontSize: 11, fontWeight: 700, letterSpacing: 0.6 }}>
            COULD NOT READ
          </span>
        </div>
        <div style={{ color: t.inkMuted, fontSize: 12, fontWeight: 600, paddingLeft: 15 }}>
          get_cron_job_health() did not answer. Job state is not being reported.
        </div>
      </section>
    );
  }

  const faults = cronFaults(data);

  if (faults.length === 0) {
    // A healthy board should be one line, not 74.
    return (
      <section style={{ ...PANEL, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dot tone="ok" />
          <span style={{ flex: 1, minWidth: 0, color: t.inkMuted, fontSize: 13, fontWeight: 600 }}>
            {`Cron · ${data.length} job${data.length === 1 ? '' : 's'}`}
          </span>
          <span style={{ ...FIG, color: t.inkMuted, fontSize: 11, fontWeight: 700, letterSpacing: 0.6 }}>
            ALL RUNNING
          </span>
        </div>
      </section>
    );
  }

  return (
    <section style={{ ...PANEL, padding: '12px 14px', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Dot tone="danger" />
        <span style={{ color: t.ink, fontSize: 13, fontWeight: 700 }}>
          {`Cron · ${faults.length} job${faults.length === 1 ? '' : 's'} need${faults.length === 1 ? 's' : ''} looking at`}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {faults.map((row, i) => (
          <FaultRow key={row.jobid} row={row} first={i === 0} />
        ))}
      </div>
    </section>
  );
}

function FaultRow({ row, first }: { row: CronJobHealthRow; first: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const never = isNeverSucceeded(row);
  const state = never
    ? 'NEVER SUCCEEDED'
    : `${row.failed_24h} FAILED IN 24H`;
  const message = (row.last_message ?? '').trim();

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 3,
        padding: '10px 0',
        borderTop: first ? 'none' : `1px solid ${t.hairline}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, color: t.ink, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.jobname}
        </span>
        <span style={{ ...FIG, color: t.inkFaint, fontSize: 11, fontWeight: 600 }}>{row.schedule}</span>
        <span style={{
          ...FIG,
          color: never ? t.dangerText : t.warnText,
          fontSize: 11, fontWeight: 700, letterSpacing: 0.6, whiteSpace: 'nowrap',
        }}>
          {state}
        </span>
      </div>
      {message ? (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          title={expanded ? 'Collapse' : 'Show full message'}
          style={{
            background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
            cursor: 'pointer', color: t.inkMuted, fontSize: 12, fontWeight: 600,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: expanded ? 'unset' as unknown as number : 2,
            overflow: expanded ? 'visible' : 'hidden',
            whiteSpace: expanded ? 'pre-wrap' : 'normal',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </button>
      ) : (
        <span style={{ color: t.inkFaint, fontSize: 12, fontWeight: 600 }}>No message recorded.</span>
      )}
    </div>
  );
}
