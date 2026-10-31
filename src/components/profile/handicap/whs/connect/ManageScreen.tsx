import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatDate, formatRelative } from '@/i18n/format';
import type { WhsConnection, WhsLastRound } from '@/lib/whs/types';
import { callSyncWhsOne } from '@/lib/whs/api';
import { useLastRound } from '@/lib/whs/hooks';
import { getSyncHealth } from '@/lib/whs/syncHealth';
import { Skeleton } from '@/components/ui/skeleton';
import { handicapTabRoute } from '@/lib/handicap/handicapTabRoute';
import { INK, MUTE, BORDER, GOOD, BAD, DIM, AMBER, CAPTION, NUM, FONT } from './designTokens';
import { Panel, PanelGap, Figure, RefRow, Action, SecondaryButton } from './Primitives';
import { useImportedCounts } from './useImportedCounts';
import { useHandicapChipState } from '@/lib/whs/useHandicapChipState';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { bodyNameForProvider } from '@/lib/whs/whsCountries';
import { useTranslation } from 'react-i18next';

const Dot: React.FC<{ color: string; style?: React.CSSProperties }> = ({ color, style }) => (
  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, ...style }} />
);

/** Hero title - the shared 17/700 treatment used by every panel-1 hero. */
const TITLE: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: INK,
};

/** The full domain of the Sync now button. See the 4.x wiring rules. */
type SyncState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'new'; count: number }
  | { kind: 'none' }
  | { kind: 'refreshing' }
  | { kind: 'failed' };

/**
 * The detail line under the course name. Segments joined by " - middot - ",
 * DROPPING any whose source is null - never a placeholder:
 *   1. the date, MEDIUM - "11 Oct 2026", never the month-first 10/11/26;
 *   2. the adjusted gross, with "(+n / E / -n)" only when course_par exists;
 *   3. "off {index}" only when the provider recorded one;
 *   4. "9 holes" for nine-hole rounds.
 */
const buildDetailLine = (r: WhsLastRound): string => {
  const segs: string[] = [];
  segs.push(formatDate(r.play_date, 'medium'));
  if (r.adjusted_gross != null) {
    if (r.course_par != null) {
      const diff = r.adjusted_gross - r.course_par;
      const mark = diff > 0 ? `+${diff}` : diff === 0 ? 'E' : `\u2212${Math.abs(diff)}`;
      segs.push(`${r.adjusted_gross} (${mark})`);
    } else {
      segs.push(String(r.adjusted_gross));
    }
  }
  if (r.handicap_index_at_time != null) segs.push(`off ${r.handicap_index_at_time}`);
  if (r.is_nine_hole) segs.push('9 holes');
  return segs.join(' \u00b7 ');
};

interface Props {
  connection: WhsConnection;
  onDisconnect: () => void;
  onDelete: () => void;
  /** Variant A only - takes the member back to the sign-in form. */
  onReconnect?: () => void;
  /** Called after a successful hand sync. Invalidation lives on the page. */
  onSynced?: () => void;
}

/** SCREEN 6 and 7 - MANAGE, and the two REAUTH variants. */
export const ManageScreen: React.FC<Props> = ({
  connection,
  onDisconnect,
  onDelete,
  onReconnect,
  onSynced,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('handicap');
  const { user } = useSupabaseSession();
  const chip = useHandicapChipState(user?.id);
  const provider = bodyNameForProvider(connection.provider);
  const health = getSyncHealth(connection);
  const { data: counts } = useImportedCounts(connection.id);
  const { data: lastRound } = useLastRound(connection.id);

  /* ── Sync now state machine ─────────────────────────────────────────────
     Two independent pieces of state. `sync` is the outcome only and persists
     until the next press or unmount. `coolingDown` is ONE 60-second window:
     set true at the press, cleared by a single 60s timer started when the
     response lands. It gates the button for EVERY outcome, refreshing and
     failed included - it is the only rate limit on this path. Component
     state only: the sweep writes last_attempted_at too, so that field must
     never gate the button. */
  const [sync, setSync] = useState<SyncState>({ kind: 'idle' });
  const [coolingDown, setCoolingDown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCooldownTimer = () => {
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
      cooldownTimer.current = null;
    }
  };
  useEffect(() => clearCooldownTimer, []);

  const handleSyncNow = async () => {
    if (sync.kind === 'running' || coolingDown) return;
    setCoolingDown(true);
    setSync({ kind: 'running' });
    const res = await callSyncWhsOne();
    // Branch on the body's error string, never the HTTP status - the fetch
    // discards the status and every failure path carries a distinct error.
    const upserted = res.scores_upserted ?? 0;
    let next: SyncState;
    if (res.ok && upserted > 0) next = { kind: 'new', count: upserted };
    else if (res.ok) next = { kind: 'none' };
    else if (res.error === 'eg_connection_refreshing') next = { kind: 'refreshing' };
    else next = { kind: 'failed' };
    setSync(next);
    if (res.ok) onSynced?.();

    clearCooldownTimer();
    cooldownTimer.current = setTimeout(() => {
      cooldownTimer.current = null;
      setCoolingDown(false);
    }, 60_000);
  };

  /* /manage/contact accepts ?category= and ?subject= and prefills both, so
     the member lands on a part-written ticket. */
  const contactSupport = (subject: string) => (
    <div style={{ marginTop: 14, display: 'flex' }}>
      <Action
        color={MUTE}
        onClick={() =>
          navigate(`/manage/contact?${new URLSearchParams({ category: 'handicap', subject }).toString()}`)
        }
      >
        Contact support
      </Action>
    </div>
  );

  const lastSyncedAt = connection.last_synced_at;
  /* formatRelative returns "now" under 60s, which would render "Checked now
     ago" - guard it. The 6-hour cadence is the member-visible pg_cron job
     (sync-whs-due-every-6h, minute 0 every 6th hour), not the sweep's internal
     defer. */
  const syncLine = !lastSyncedAt
    ? 'Not checked yet. We check England Golf every 6 hours.'
    : Date.now() - new Date(lastSyncedAt).getTime() < 60_000
      ? 'Checked just now. We check England Golf every 6 hours.'
      : `Checked ${formatRelative(lastSyncedAt)} ago. We check England Golf every 6 hours.`;

  const syncDisabled = sync.kind === 'running' || coolingDown;

  const syncButton = (marginTop: number) => (
    <div style={{ marginTop }}>
      <SecondaryButton onClick={handleSyncNow} disabled={syncDisabled}>
        {sync.kind === 'running' ? (
          <>
            <svg width={15} height={15} viewBox="0 0 18 18">
              <circle
                cx={9}
                cy={9}
                r={7.6}
                fill="none"
                stroke="rgba(248,250,252,0.38)"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeDasharray="15 33"
                className="animate-spin motion-reduce:animate-none"
                style={{ animationDuration: '1.05s', transformOrigin: '50% 50%' }}
              />
            </svg>
            Checking England Golf
          </>
        ) : sync.kind === 'refreshing' || sync.kind === 'failed' ? (
          'Try again'
        ) : (
          'Sync now'
        )}
      </SecondaryButton>
    </div>
  );

  /* The result line, announced. Contact support rides beneath it on the one
     state a member cannot fix by retrying - 'failed'. Deliberately absent on
     'refreshing': that is our token rotating, we say so, and it clears itself. */
  const syncResult = (
    <div aria-live="polite">
      {sync.kind === 'new' && (
        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Dot color={GOOD} />
          <span style={{ fontSize: 12, fontWeight: 700, color: GOOD }}>
            {sync.count === 1 ? '1 new round in' : `${sync.count} new rounds in`}
          </span>
        </div>
      )}
      {sync.kind === 'none' && (
        <div style={{ marginTop: 11, fontSize: 12, color: MUTE }}>Nothing new at England Golf.</div>
      )}
      {sync.kind === 'refreshing' && (
        <div style={{ marginTop: 11, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
          <Dot color={AMBER} style={{ marginTop: 4 }} />
          <span style={{ fontSize: 12, lineHeight: 1.5, color: MUTE }}>
            Our connection to England Golf is being refreshed — this is on our side, not yours. Try
            again shortly.
          </span>
        </div>
      )}
      {sync.kind === 'failed' && (
        <div style={{ marginTop: 11, fontSize: 12, lineHeight: 1.5, color: MUTE }}>
          England Golf did not answer. We will keep trying in the background.
        </div>
      )}
      {coolingDown && sync.kind !== 'running' && (
        <div style={{ marginTop: 6, fontSize: 11.5, lineHeight: 1.52, color: DIM }}>
          You can check again in a minute.
        </div>
      )}
      {sync.kind === 'failed' ? contactSupport('Sync now is not working') : null}
    </div>
  );

  /* ── Panel 1: healthy (hero = the last round), loading, or no rounds yet ── */
  const lastRoundLoading = lastRound === undefined;
  const panel1 = (
    <Panel
      kicker={lastRound === null ? 'Connection' : 'Last round in'}
      aside={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot color={GOOD} />
          <span>Synced</span>
        </div>
      }
    >
      {lastRoundLoading ? (
        <div>
          <Skeleton variant="dark" style={{ height: 21, width: '60%' }} />
          <Skeleton variant="dark" style={{ height: 15, width: '85%', marginTop: 4 }} />
        </div>
      ) : lastRound ? (
        <button
          type="button"
          onClick={() => navigate(`/round/${lastRound.id}`)}
          aria-label={`${lastRound.course?.name ?? 'Your last round'}, ${formatDate(lastRound.play_date, 'medium')}`}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...TITLE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lastRound.course?.name ?? 'Your last round'}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: MUTE, marginTop: 4, ...NUM }}>
              {buildDetailLine(lastRound)}
            </div>
          </div>
          <ChevronRight size={14} strokeWidth={2.6} color={DIM} style={{ flexShrink: 0 }} />
        </button>
      ) : (
        <>
          <div style={TITLE}>No rounds yet</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: MUTE, marginTop: 4 }}>
            {chip.linked && !chip.loading && chip.value == null
              ? t('whsConnect.done.subConnectedEmpty', { provider })
              : `${provider} has no rounds on your record. The next one you play will arrive here on its own.`}
          </div>
        </>
      )}

      <div style={{ height: 1, background: BORDER, margin: '14px 0 12px' }} />
      <div style={{ fontSize: 11.5, lineHeight: 1.52, color: MUTE }}>{syncLine}</div>
      {syncButton(14)}
      {syncResult}
    </Panel>
  );

  /* ── Panel 1: the two reauth variants ─────────────────────────────────── */
  const reauthPanel =
    health.kind === 'reauth_auth' ? (
      /* VARIANT A - the fix is the password, not a retry. No Sync now here. */
      <Panel
        kicker="Sync paused"
        aside={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Dot color={BAD} />
            <span>Action needed</span>
          </div>
        }
      >
        <div style={TITLE}>
          {health.daysSinceSync === null
            ? 'Nothing new yet'
            : `Nothing new for ${health.daysSinceSync} days`}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.52, color: MUTE, marginTop: 10 }}>
          England Golf is turning away the details we have saved — almost always because the MyEG
          password changed. Everything already imported is safe and still yours; new rounds just
          are not arriving.
        </div>
        {health.detail ? <div style={{ ...CAPTION, marginTop: 10 }}>{health.detail}</div> : null}
        <div style={{ height: 1, background: BORDER, margin: '14px 0 12px' }} />
        <SecondaryButton onClick={onReconnect}>Sign in again</SecondaryButton>
        {contactSupport('England Golf is rejecting my sign-in details')}
      </Panel>
    ) : (
      /* VARIANT B - nothing to FIX, something to RE-TRY. health.actionable is
         false here; branch on health.kind only, never last_sync_error.
         DELIBERATELY NO "Checked … every 6 hours." sync line here: the body's
         "We have not been able to reach England Golf since {date}" already
         states the last-checked fact with a real date. Do not add it back. */
      <Panel
        kicker="Sync paused"
        aside={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Dot color={AMBER} />
            <span>Retrying</span>
          </div>
        }
      >
        <div style={TITLE}>
          {health.daysSinceSync === null
            ? 'Nothing new yet'
            : `Nothing new for ${health.daysSinceSync} days`}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.52, color: MUTE, marginTop: 10 }}>
          We have not been able to reach England Golf since{' '}
          {lastSyncedAt ? formatDate(lastSyncedAt, 'medium') : 'recently'}. Your index and rounds
          are safe — we will keep trying, and this usually clears on its own.
        </div>
        {health.detail ? <div style={{ ...CAPTION, marginTop: 10 }}>{health.detail}</div> : null}
        <div style={{ height: 1, background: BORDER, margin: '14px 0 12px' }} />
        {syncButton(0)}
        {syncResult}
        {contactSupport('England Golf rounds have stopped arriving')}
      </Panel>
    );

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>
      {health.needsAttention ? reauthPanel : panel1}

      <PanelGap />

      {/* PANEL 2 - Your record. counts null = not readable yet: '--', never 0. */}
      <Panel
        kicker="Your record"
        aside={
          counts ? (
            <Action color={DIM} onClick={() => navigate(handicapTabRoute())}>
              See all {counts.rounds}
            </Action>
          ) : undefined
        }
      >
        <div style={{ display: 'flex' }}>
          <Figure label="Rounds" value={counts ? counts.rounds : '--'} />
          <Figure label="Courses" value={counts ? counts.courses : '--'} />
          <Figure label="Friends" value={counts ? counts.friends : '--'} />
        </div>
      </Panel>

      <PanelGap />

      {/* PANEL 3 - What we hold. */}
      <Panel kicker="What we hold">
        <div style={{ fontSize: 12.5, lineHeight: 1.52, color: MUTE }}>
          Your MyEG password sits encrypted in a vault and is decrypted only for the moment a sync
          runs.
        </div>

        <div style={{ height: 1, background: BORDER, margin: '14px 0 10px' }} />
        <RefRow label="Membership number" value={connection.membership_number || '--'} />
        <RefRow label="England Golf ID" value={String(connection.passport_id ?? '--')} />
        <RefRow label="Connected" value={formatDate(connection.created_at, 'medium')} />

        <div style={{ height: 1, background: BORDER, margin: '10px 0 12px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ fontSize: 13, color: INK }}>Stop syncing, keep my rounds</div>
          <Action color={MUTE} onClick={onDisconnect}>
            Disconnect
          </Action>
        </div>
      </Panel>

      {/* THE EXIT - outside the panels, with air and a consequence sentence. */}
      <div style={{ marginTop: 28, padding: '0 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: INK }}>Remove everything from clbhouz</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: DIM, marginTop: 4 }}>
              Every round, every handicap snapshot and the connection itself. This cannot be
              undone.
            </div>
          </div>
          <div style={{ marginTop: 1, flexShrink: 0 }}>
            <Action color={BAD} onClick={onDelete}>
              Delete
            </Action>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageScreen;
