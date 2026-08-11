import React from 'react';
import { formatRelativeAgoLong, formatDate } from '@/i18n/format';
import type { WhsConnection } from '@/lib/whs/types';
import { useLastRound } from '@/lib/whs/hooks';
import { getSyncHealth } from '@/lib/whs/syncHealth';
import { bodyNameForProvider } from '@/lib/whs/whsCountries';
import { INK, MUTE, BORDER, GOOD, BAD, LABEL, CAPTION } from './designTokens';
import { Panel, PanelGap, Figure, RefRow, Action } from './Primitives';
import { useImportedCounts } from './useImportedCounts';

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
);

const monthsSince = (iso: string): number => {
  const then = new Date(iso).getTime();
  return Math.max(0, Math.floor((Date.now() - then) / (30 * 86_400_000)));
};

interface Props {
  connection: WhsConnection;
  onDisconnect: () => void;
  onDelete: () => void;
  /** Variant A only - takes the member back to the sign-in form. */
  onReconnect?: () => void;
}

/** SCREENS 6 and 7 - MANAGE, and the two REAUTH variants. */
export const ManageScreen: React.FC<Props> = ({
  connection,
  onDisconnect,
  onDelete,
  onReconnect,
}) => {
  const health = getSyncHealth(connection);
  const bodyName = bodyNameForProvider(connection.provider);
  const { data: counts } = useImportedCounts(connection.id);
  const { data: lastRound } = useLastRound(connection.id);

  const lastSyncedAt = connection.last_synced_at;
  const days = health.daysSinceSync;

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>
      {health.needsAttention ? (
        // SCREEN 7 - reauth. Two variants, split by cause. Never branch on
        // last_sync_error: it is free text and may only be shown as detail.
        <Panel kicker={bodyName} aside="sync paused">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <Dot color={BAD} />
            <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>
              {days === null ? 'Nothing new yet' : `Nothing new for ${days} days`}
            </div>
          </div>

          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: MUTE }}>
            {health.kind === 'reauth_auth'
              ? `${bodyName} is turning away the details we have saved - almost always because the MyEG password changed. Everything already imported is safe and still yours; new rounds just are not arriving.`
              : `We have not been able to reach ${bodyName} since ${
                  lastSyncedAt ? formatDate(lastSyncedAt, 'medium') : 'recently'
                }. Your index and rounds are safe - we will keep trying, and this usually clears on its own.`}
          </div>

          {health.detail ? (
            <div style={{ ...CAPTION, marginTop: 10, color: MUTE }}>{health.detail}</div>
          ) : null}

          {health.actionable && onReconnect ? (
            <div style={{ marginTop: 16 }}>
              <Action onClick={onReconnect}>Sign in again</Action>
            </div>
          ) : null}
        </Panel>
      ) : (
        <Panel kicker={bodyName} aside="sync on">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <Dot color={GOOD} />
            <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>
              {`Synced ${lastSyncedAt ? formatRelativeAgoLong(lastSyncedAt) : 'recently'}`}
            </div>
          </div>
          <div style={{ ...LABEL, marginBottom: 18 }}>Checks again every 6 hours</div>

          <div style={{ display: 'flex' }}>
            <Figure
              label="Connected"
              value={`${monthsSince(connection.created_at)} mo`}
              sub="ago"
              size={17}
            />
            <Figure label="Rounds in" value={counts ? counts.rounds : '--'} size={17} />
            <Figure
              label="Last round"
              value={lastRound?.play_date ? formatDate(lastRound.play_date, 'short') : '--'}
              size={17}
            />
          </div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
            <RefRow label="Membership number" value={connection.membership_number || '--'} />
            <RefRow label="Passport ID" value={String(connection.passport_id ?? '--')} />
          </div>
        </Panel>
      )}

      <PanelGap />

      <Panel kicker="Stored details">
        <div style={{ fontSize: 12.5, lineHeight: 1.52, color: MUTE }}>
          Your MyEG password sits encrypted in a vault and is decrypted only for the moment a sync
          runs.
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
              padding: '7px 0',
            }}
          >
            <div style={{ fontSize: 13, color: INK }}>Stop syncing, keep my rounds</div>
            <Action onClick={onDisconnect} color={MUTE}>
              Disconnect
            </Action>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
              padding: '7px 0',
            }}
          >
            <div style={{ fontSize: 13, color: INK }}>Remove everything from clbhouz</div>
            <Action onClick={onDelete} color={BAD}>
              Delete
            </Action>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default ManageScreen;
