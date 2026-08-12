/**
 * FindGolfersSheet (BRIEF_FIND_GOLFERS_SHEET) — the sheet the Discover
 * 'friends' prompt opens.
 *
 * IT SENDS FRIEND REQUESTS, because only an accepted friendship fills the
 * friends rail. Follow is offered beside it, quietly, because following is a
 * different promise and does not put anybody in that rail.
 *
 * Rules encoded here:
 *   - the name NEVER truncates (overflowWrap: anywhere); a truncated name
 *     defeats the sheet
 *   - the figures sit on a fixed grid indented past the avatar so HCP and
 *     ROUNDS align down the whole sheet, across groups
 *   - absent values render NOTHING - no dashes, and no orphan label over an
 *     empty cell (the label goes with the figure)
 *   - settled states occupy the SAME footprint as live ones, so a tap never
 *     shifts the row under the member's thumb
 *   - exactly ONE filled button on the sheet: Invite, at the foot
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Search, X } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { A, FIGS, KICKER, LABEL, SANS } from './courseled/tokens';
import {
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';
  useFindGolfers,
  type FindGolferRow,
} from './courseled/hooks/useFindGolfers';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Local, per-row overrides so a tap settles instantly and never re-orders. */
type RowState = { friend?: 'requested'; following?: boolean };

const AVATAR = 34;
const GUTTER = 11;
/** One row per golfer, so the row holds a floor rather than a fixed height. */
const ROW_CONTENT_MIN = 46;

/**
 * ActionSlot — the two states of one control share ONE grid cell.
 *
 * The cell is therefore as wide as the WIDER of the two, in whatever language
 * is loaded, and the settled state cannot resize it. That is the whole point:
 * at three rows a screen, a tap that re-widened "Add friend" into "Requested"
 * would slide the next golfer under the thumb that just tapped.
 */
function ActionSlot({
  settled,
  live,
  settledNode,
}: {
  settled: boolean;
  live: React.ReactNode;
  settledNode: React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', flexShrink: 0 }}>
      <div
        style={{ gridArea: '1 / 1', visibility: settled ? 'hidden' : 'visible' }}
        aria-hidden={settled}
      >
        {live}
      </div>
      <div
        style={{ gridArea: '1 / 1', visibility: settled ? 'visible' : 'hidden' }}
        aria-hidden={!settled}
      >
        {settledNode}
      </div>
    </div>
  );
}

function Pill({
  onClick,
  border,
  color,
  children,
}: {
  onClick?: () => void;
  border: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      style={{
        height: 30,
        padding: '0 11px',
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: 'transparent',
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
        fontFamily: SANS,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}

/**
 * TextAction — Follow, as a word rather than a pill. Fixed 16px high so the
 * settled state cannot change the row's height either.
 */
function TextAction({
  onClick,
  color,
  children,
}: {
  onClick?: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      style={{
        height: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        whiteSpace: 'nowrap',
        color,
        fontFamily: SANS,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}


/** A figure and its label, inline. Absent values are not rendered at all. */
function Fig({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <>
      <span style={{ ...LABEL, fontSize: 9, color: A.DIM }}>{label}</span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: bold ? 700 : 600,
          color: bold ? A.INK : A.BODY,
          letterSpacing: '-0.01em',
          marginLeft: 4,
          ...FIGS,
        }}
      >
        {value}
      </span>
    </>
  );
}

function GolferRow({
  row,
  state,
  onAddFriend,
  onToggleFollowRow,
}: {
  row: FindGolferRow;
  state: RowState | undefined;
  onAddFriend: (row: FindGolferRow) => void;
  onToggleFollowRow: (row: FindGolferRow, isFollowing: boolean) => void;
}) {
  const { t } = useTranslation('courses');

  const name = row.display_name || row.username || '';
  const requested =
    state?.friend === 'requested' || row.is_friend || row.friend_pending;
  const following = state?.following ?? row.is_following;

  const hcp =
    row.handicap_index == null ? null : row.handicap_index.toFixed(1);
  const club = row.home_club?.trim() || null;

  // THE FIGURES, on one line now. Same three, same labels, same rule: an
  // absent value contributes NOTHING - no dash, no orphan label, no separator.
  const figs: React.ReactNode[] = [];
  if (hcp) {
    figs.push(
      <Fig key="hcp" label={t('discover.findGolfers.hcp', 'HCP')} value={hcp} bold />,
    );
  }
  if (row.rounds_tracked > 0) {
    figs.push(
      <Fig
        key="rounds"
        label={t('discover.findGolfers.rounds', 'ROUNDS')}
        value={String(row.rounds_tracked)}
      />,
    );
  }
  if (club) {
    figs.push(
      <span
        key="club"
        style={{ fontSize: 12, fontWeight: 600, color: A.BODY }}
      >
        {club}
      </span>,
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: GUTTER,
        alignItems: 'center',
        padding: '11px 0',
        minHeight: ROW_CONTENT_MIN,
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={AVATAR}
          src={row.profile_photo_url}
          alt={name}
          userId={row.id}
          hairlineRing
        />
      </div>

      {/* THE NAME NEVER TRUNCATES. It takes a second line instead, and the row
          grows to hold it - acceptance D holds from 320 to 430. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            lineHeight: 1.25,
            color: A.INK,
            overflowWrap: 'anywhere',
          }}
        >
          {name}
        </div>
        {figs.length ? (
          // THE META LINE may clip; the name may not.
          <div
            style={{
              marginTop: 3,
              display: 'flex',
              alignItems: 'baseline',
              gap: 7,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            {figs.map((f, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', minWidth: 0 }}>
                {f}
              </span>
            ))}
          </div>
        ) : row.username ? (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: A.DIM,
              marginTop: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            @{row.username}
          </div>
        ) : null}
      </div>

      {/* THE ACTIONS. TWO PILLS INLINE DID NOT FIT: at 320 they left the name
          129px, under the floor, so Follow drops to the quiet text action
          beneath Add friend and buys the width back. NEITHER IS FILLED. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 5,
          flexShrink: 0,
        }}
      >
        <ActionSlot
          settled={requested}
          live={
            <Pill border={A.INK} color={A.INK} onClick={() => onAddFriend(row)}>
              {t('discover.findGolfers.addFriend', 'Add friend')}
            </Pill>
          }
          settledNode={
            <Pill border={A.BORDER} color={A.MUTE}>
              <Check size={12} strokeWidth={2.6} />
              {t('discover.findGolfers.requested', 'Requested')}
            </Pill>
          }
        />
        <ActionSlot
          settled={!!following}
          live={
            <TextAction color={A.BODY} onClick={() => onToggleFollowRow(row, false)}>
              {t('discover.findGolfers.follow', 'Follow')}
            </TextAction>
          }
          settledNode={
            <TextAction color={A.MUTE} onClick={() => onToggleFollowRow(row, true)}>
              <Check size={12} strokeWidth={2.6} />
              {t('discover.findGolfers.following', 'Following')}
            </TextAction>
          }
        />
      </div>

    </div>
  );
}


export function FindGolfersSheet({ open, onClose }: Props) {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const viewerId = user?.id;

  const [raw, setRaw] = useState('');
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [sent, setSent] = useState(0);

  const { openInviteSheet } = useInviteSheet();
  const { sendFriendRequest, acceptFriendRequest } = useFriendActions({
    currentUserId: viewerId ?? '',
  });
  const toggleFollow = useToggleFollow();

  const q = raw.trim();
  const golfers = useFindGolfers(open && !!viewerId, q);
  const rows = useMemo(
    () => (golfers.data?.members ?? []).filter((m) => m.id !== viewerId),
    [golfers.data?.members, viewerId],
  );

  const handleAddFriend = useCallback(
    async (row: FindGolferRow) => {
      if (!viewerId) return;
      setStates((s) => ({ ...s, [row.id]: { ...s[row.id], friend: 'requested' } }));
      setSent((n) => n + 1);
      analyticsEvents.track('find_golfers_friend_request', {
        incoming: row.friend_incoming,
      });
      // THE OTHER PERSON MAY HAVE ASKED FIRST: accept, never create a second
      // row. user_friends is unique on (user_id, friend_id) only, so a blind
      // insert would sit alongside theirs.
      const ok = row.friend_incoming
        ? await acceptFriendRequest(row.id)
        : await sendFriendRequest(row.id);
      if (!ok) {
        setStates((s) => ({ ...s, [row.id]: { ...s[row.id], friend: undefined } }));
        setSent((n) => Math.max(0, n - 1));
      }
    },
    [viewerId, acceptFriendRequest, sendFriendRequest],
  );

  const handleToggleFollow = useCallback(
    (row: FindGolferRow, isFollowing: boolean) => {
      if (!viewerId) return;
      setStates((s) => ({ ...s, [row.id]: { ...s[row.id], following: !isFollowing } }));
      toggleFollow.mutate(
        {
          targetActorType: 'personal',
          targetActorId: row.id,
          targetUserId: row.id,
          viewerActorType: 'personal',
          viewerActorId: viewerId,
          viewerUserId: viewerId,
          isFollowing,
        },
        {
          onError: () =>
            setStates((s) => ({
              ...s,
              [row.id]: { ...s[row.id], following: isFollowing },
            })),
        },
      );
    },
    [viewerId, toggleFollow],
  );

  /** Grouped by reason, keeping the server's order. */
  const groups = useMemo(() => {
    const out: Array<{ key: string; reason: string; detail: string | null; rows: FindGolferRow[] }> = [];
    const index = new Map<string, number>();
    for (const r of rows) {
      const key = `${r.reason_type}::${r.reason_detail ?? ''}`;
      let at = index.get(key);
      if (at == null) {
        at = out.length;
        index.set(key, at);
        out.push({ key, reason: r.reason_type, detail: r.reason_detail, rows: [] });
      }
      out[at].rows.push(r);
    }
    return out;
  }, [rows]);

  const reasonLabel = useCallback(
    (reason: string) => {
      switch (reason) {
        case 'followed_by':
          return t('discover.findGolfers.groupFollowedBy', 'Followed by');
        case 'plays':
          return t('discover.findGolfers.groupPlays', 'Plays where you play');
        case 'match':
          return t('discover.findGolfers.groupMatch', 'Matches');
        default:
          return t('discover.findGolfers.groupPopular', 'Members to know');
      }
    },
    [t],
  );

  const settled = !golfers.isPending && !golfers.isFetching;
  const showEmpty = settled && rows.length === 0 && q.length > 0;

  const countLine = t('discover.findGolfers.count', '{{shown}} of {{total}} members', {
    shown: rows.length,
    total: golfers.data?.total_members ?? 0,
  });
  const sentLine =
    sent > 0
      ? t('discover.findGolfers.requestsSent', '{{count}} requests sent', { count: sent })
      : '';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="find-golfers-title"
      variant="light"
      surfaceColor={A.CANVAS}
      style={{
        height: '90dvh',
        maxHeight: '90dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.CANVAS,
        ...FIGS,
      }}
    >
      {/* HEADER — does not scroll. Sample size is always visible. */}
      <div
        style={{
          padding: '8px 16px 14px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div style={KICKER}>{t('discover.findGolfers.kicker', 'The members')}</div>
        <h2
          id="find-golfers-title"
          style={{
            margin: '5px 0 0',
            ...TITLE_METRICS,
            color: A.INK,
          }}
        >
          {t('discover.findGolfers.title', 'Find golfers')}
        </h2>
        <div style={{ ...LABEL, color: A.DIM, marginTop: 7 }}>
          {countLine}
          {sentLine ? ` \u00B7 ${sentLine}` : ''}
        </div>

        {/* INPUTS STAY WHITE; the shell does not. */}
        <div
          style={{
            marginTop: 12,
            height: 42,
            borderRadius: 12,
            border: `1px solid ${A.BORDER}`,
            background: A.PANEL,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
          }}
        >
          <Search size={15} strokeWidth={2.2} color={A.DIM} />
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t('discover.findGolfers.searchPlaceholder', 'Name or handle')}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
              color: A.INK,
            }}
          />
          {raw ? (
            <button
              type="button"
              onClick={() => setRaw('')}
              aria-label={t('discover.findGolfers.clear', 'Clear')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 32,
                padding: 0,
                border: 'none',
                background: 'none',
                color: A.DIM,
              }}
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          ) : null}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0' }}>
        {showEmpty ? (
          <div style={{ padding: '34px 6px 10px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 15.5,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: A.INK,
                overflowWrap: 'anywhere',
              }}
            >
              {t('discover.findGolfers.emptyTitle', 'No golfer called "{{q}}"', { q })}
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: A.MUTE,
                marginTop: 7,
                lineHeight: 1.45,
              }}
            >
              {t(
                'discover.findGolfers.emptyBody',
                'Try their handle, or invite them to clbhouz',
              )}
            </div>
            <button
              type="button"
              onClick={() => openInviteSheet('find_golfers_sheet')}
              style={{
                marginTop: 14,
                height: 34,
                padding: '0 4px',
                border: 'none',
                background: 'none',
                color: A.INK,
                fontFamily: SANS,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
              }}
            >
              {t('discover.findGolfers.inviteQuiet', 'Invite a golfer')}
            </button>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.key} style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  padding: '0 2px',
                  marginBottom: 10,
                }}
              >
                <span style={KICKER}>{reasonLabel(g.reason)}</span>
                {g.detail ? (
                  <span
                    style={{
                      marginLeft: 'auto',
                      ...LABEL,
                      color: A.AMBER_DEEP,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '52%',
                    }}
                  >
                    {g.detail}
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  background: A.PANEL,
                  border: `1px solid ${A.BORDER}`,
                  borderRadius: 16,
                  padding: '2px 16px',
                }}
              >
                {g.rows.map((r) => (
                  <GolferRow
                    key={r.id}
                    row={r}
                    state={states[r.id]}
                    onAddFriend={handleAddFriend}
                    onToggleFollowRow={handleToggleFollow}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {/* THE SHEET'S ONE FILLED BUTTON. */}
        <button
          type="button"
          onClick={() => openInviteSheet('find_golfers_sheet')}
          style={{
            width: '100%',
            height: 46,
            marginTop: 6,
            borderRadius: 999,
            border: 'none',
            background: A.INK,
            color: A.PANEL,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {t('discover.findGolfers.inviteCta', 'Invite a golfer to clbhouz')}
        </button>

        <div
          aria-hidden
          style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        />
      </div>
    </BottomSheet>
  );
}

export default FindGolfersSheet;
