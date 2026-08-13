/**
 * Sent invites - analytical treatment.
 *
 * DARK, portalled surface: literal hex, never var(--hcp-*).
 *
 * Rides the house `BottomSheet` (drag handle, scroll lock, portal, dark
 * variant) rather than a hand-rolled vaul drawer with its own
 * lock/unlockBodyScroll pair and an X button.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeAgoLong } from '@/i18n/format';
import { useSentInvites } from '@/lib/whs/hooks';
import { firstName } from '@/lib/whs/utils/initials';
import { shareInvite } from '@/lib/whs/share';
import type { WhsInviteStatus } from '@/lib/whs/types';
import { REC, KICKER, LABEL, CAPTION } from '../../gam/trophy-room/career/tokens';
import { Collapsible } from '../../gam/trophy-room/career/Primitives';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TITLE_ID = 'sent-invites-title';

const GroupKicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ ...LABEL, fontFamily: REC.FONT, padding: '16px 16px 8px' }}>{children}</div>
);

const InviteRow: React.FC<{
  invite: WhsInviteStatus;
  last: boolean;
  statusLabel: string;
  statusColor: string;
}> = ({ invite, last, statusLabel, statusColor }) => {
  const isPending = invite.status === 'pending';
  const onClick = () => {
    if (!isPending) return;
    shareInvite({
      share_url: `https://clbhouz.co.uk/i/${invite.invite_code}`,
      share_message: `Join me on clbhouz - connect your England Golf handicap and we can compare rounds. Tap: https://clbhouz.co.uk/i/${invite.invite_code}`,
      invitee_name: invite.invitee_name,
    });
  };

  const inner = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: REC.FONT,
            fontSize: 13.5,
            fontWeight: 700,
            color: REC.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {firstName(invite.invitee_name)}
        </p>
        <div
          style={{
            ...LABEL,
            fontFamily: REC.FONT,
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {[invite.invitee_home_club, formatRelativeAgoLong(invite.sent_at)]
            .filter(Boolean)
            .join(' \u00B7 ')}
        </div>
      </div>
      <span style={{ ...LABEL, fontFamily: REC.FONT, color: statusColor, flexShrink: 0 }}>
        {statusLabel}
      </span>
    </div>
  );

  const style: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: last ? 'none' : `1px solid ${REC.BORDER}`,
  };

  if (!isPending) return <div style={style}>{inner}</div>;
  return (
    <button type="button" onClick={onClick} style={{ ...style, cursor: 'pointer' }}>
      {inner}
    </button>
  );
};

export const SentInvitesSheet: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation('handicap');
  const { data: invites, isLoading } = useSentInvites();

  const groups = useMemo(() => {
    const rows = invites ?? [];
    return {
      joined: rows.filter((r) => r.status === 'redeemed'),
      pending: rows.filter((r) => r.status === 'pending'),
      expired: rows.filter((r) => r.status === 'expired'),
    };
  }, [invites]);

  const total = invites?.length ?? 0;

  const statusFor = (invite: WhsInviteStatus) => {
    if (invite.status === 'redeemed') {
      return { label: t('invites.status.joined'), color: REC.GOOD };
    }
    if (invite.status === 'expired') {
      return { label: t('invites.status.expired'), color: REC.DIM };
    }
    return { label: formatRelativeAgoLong(invite.sent_at), color: REC.MUTE };
  };

  const renderGroup = (
    kicker: string,
    rows: WhsInviteStatus[],
    collapse?: boolean,
  ) => {
    if (rows.length === 0) return null;
    const items = rows.map((inv, i) => {
      const s = statusFor(inv);
      return (
        <InviteRow
          key={inv.id}
          invite={inv}
          last={i === rows.length - 1}
          statusLabel={s.label}
          statusColor={s.color}
        />
      );
    });
    return (
      <section>
        <GroupKicker>{kicker}</GroupKicker>
        {collapse ? (
          <Collapsible
            showAllLabel={t('invites.showAll', { count: rows.length })}
            showFewerLabel={t('invites.showFewer')}
          >
            {items}
          </Collapsible>
        ) : (
          items
        )}
      </section>
    );
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="dark"
      surfaceColor={REC.PANEL}
      maxHeight="85dvh"
      ariaLabelledBy={TITLE_ID}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Pinned header. Panel background - never a light-surface token. */}
      <div
        style={{
          flexShrink: 0,
          padding: '20px 16px 14px',
          background: REC.PANEL,
          borderBottom: `1px solid ${REC.BORDER}`,
        }}
      >
        <div style={{ ...KICKER, fontFamily: REC.FONT }}>{t('invites.kicker')}</div>
        <h2
          id={TITLE_ID}
          style={{
            margin: '6px 0 0',
            fontFamily: REC.FONT,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: REC.INK,
            ...REC.TABULAR,
          }}
        >
          {total === 0 ? t('invites.headlineNone') : t('invites.headlineSent', { count: total })}
        </h2>
        {total > 0 && (
          <div style={{ ...LABEL, fontFamily: REC.FONT, marginTop: 8, ...REC.TABULAR }}>
            {t('invites.split', {
              pending: groups.pending.length,
              joined: groups.joined.length,
            })}
          </div>
        )}
      </div>

      {/* One scroller. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 32 }}>
        {isLoading ? (
          <div style={{ padding: '16px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="dark"
                style={{ height: 48, marginBottom: 8, borderRadius: 8 }}
              />
            ))}
          </div>
        ) : total === 0 ? (
          <div style={{ ...CAPTION, fontFamily: REC.FONT, padding: '18px 16px' }}>
            {t('invites.empty')}
          </div>
        ) : (
          <>
            {renderGroup(
              t('invites.groupJoined', { count: groups.joined.length }),
              groups.joined,
            )}
            {renderGroup(
              t('invites.groupPending', { count: groups.pending.length }),
              groups.pending,
            )}
            {renderGroup(
              t('invites.groupExpired', { count: groups.expired.length }),
              groups.expired,
              true,
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
};

export default SentInvitesSheet;
