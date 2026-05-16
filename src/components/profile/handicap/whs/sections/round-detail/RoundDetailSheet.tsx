import React, { useMemo } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useNavigate } from 'react-router-dom';
import { useRoundDetail, useFriendRoundDetail } from '@/lib/whs/hooks';
import RoundScorecard from './RoundScorecard';
import {
  SheetHero,
  SheetHeroGlass,
  UserEyebrow,
  FriendEyebrow,
  SheetFooterInk,
  FooterPill,
  ScorecardEmpty,
  NonClbhouzFriendBody,
} from './cinema-sheet';
import { firstName } from '@/lib/whs/share';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

interface Props {
  variant?: 'user' | 'friend';
  open: boolean;
  onClose: () => void;
  // user variant
  scoreId?: string | null;
  handicapDelta?: number | null;
  connectionId?: string | null;
  // friend variant
  activity?: WhsFriendActivityWithImage | null;
}

const PAGE_BG = '#F8FAFC';
const INK_MUTE = 'var(--hcp-t-60)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const AMBER = '#F7931E';

const SheetSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div style={{ width: '100%', height: 340, background: 'var(--hcp-bg-3)' }} />
    <div style={{ padding: 18 }}>
      <div style={{ height: 180, background: 'var(--hcp-bg-2)', borderRadius: 8, marginBottom: 12 }} />
      <div style={{ height: 60, background: 'var(--hcp-bg-2)', borderRadius: 8 }} />
    </div>
  </div>
);

const SheetEmpty: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: FONT_GEIST }}>
    <p style={{ margin: '0 0 8px', fontSize: 14, color: INK_MUTE }}>No round to show yet.</p>
    <button
      onClick={onClose}
      style={{
        marginTop: 16,
        padding: '10px 20px',
        borderRadius: 999,
        background: AMBER,
        color: '#fff',
        border: 'none',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      Close
    </button>
  </div>
);

export const RoundDetailSheet: React.FC<Props> = ({
  variant = 'user',
  open,
  onClose,
  scoreId,
  handicapDelta,
  connectionId,
  activity,
}) => {
  const navigate = useNavigate();
  const isFriend = variant === 'friend';

  // ── User variant ──
  const userQuery = useRoundDetail(isFriend ? null : scoreId, !isFriend && open);

  // ── Friend variant ──
  const friendIsClbhouz = !!activity?.is_clbhouz_user;
  const friendScoreId = isFriend && friendIsClbhouz ? activity?.last_round_score_id ?? null : null;
  const friendQuery = useFriendRoundDetail(friendScoreId, isFriend && !!friendScoreId && open);

  const userData = !isFriend ? userQuery.data : null;
  const userLoading = !isFriend && userQuery.isLoading;
  const friendDetail = isFriend ? friendQuery.data : null;
  const friendLoading = isFriend && friendIsClbhouz && friendQuery.isLoading;

  const parTotal = useMemo<number | null>(() => {
    const holes = isFriend ? friendDetail?.holes : userData?.holes;
    if (!holes || holes.length === 0) return null;
    let total = 0;
    let any = false;
    for (const h of holes) {
      if (h.par != null) {
        total += h.par;
        any = true;
      }
    }
    return any ? total : null;
  }, [isFriend, friendDetail, userData]);

  // counterRank: previously used by removed CounterPill (signal now via gross ring).

  const renderUserBody = (): { scroll: React.ReactNode; footer: React.ReactNode } => {
    if (userLoading) return { scroll: <SheetSkeleton />, footer: null };
    if (!userData) return { scroll: <SheetEmpty onClose={onClose} />, footer: null };

    const holes = userData.holes;
    const hasHoles = !!holes && holes.length > 0;
    const previousIndex =
      handicapDelta != null && userData.handicap_index_at_time != null
        ? userData.handicap_index_at_time - handicapDelta
        : null;

    return {
      scroll: (
        <>
          <SheetHero
            imageUrl={userData.course_header_image}
            onClose={onClose}
            topEyebrow={<UserEyebrow playDate={userData.play_date} />}
            glass={
              <SheetHeroGlass
                courseName={userData.course?.name ?? 'Unknown course'}
                par={parTotal}
                slope={userData.slope_rating}
                gross={userData.adjusted_gross}
                stableford={userData.stableford_points}
                differential={userData.handicap_differential}
                holes={hasHoles ? holes : null}
                isCounter={!!userData.is_counter}
              />
            }
          />

          {hasHoles ? (
            <RoundScorecard holes={holes!} isNineHole={userData.is_nine_hole} />
          ) : (
            <ScorecardEmpty
              message={
                userData.hole_by_hole_fetched
                  ? 'No hole-by-hole data for this round.'
                  : 'Hole data is still syncing'
              }
              subMessage={
                userData.hole_by_hole_fetched ? undefined : 'Check back in a few hours.'
              }
            />
          )}
        </>
      ),
      footer: (
        <SheetFooterInk
          label="INDEX IMPACT"
          currentIndex={userData.handicap_index_at_time ?? null}
          previousIndex={previousIndex}
          delta={handicapDelta ?? null}
          action={
            userData.permalink_url ? (
              <FooterPill
                href={userData.permalink_url}
                label="Open in MyEG"
                external
              />
            ) : null
          }
        />
      ),
    };
  };

  const renderFriendBody = (): { scroll: React.ReactNode; footer: React.ReactNode } => {
    if (!activity) return { scroll: <SheetSkeleton />, footer: null };
    const fname = firstName(reformatFriendName(activity.friend_name));

    // Hero data composed from activity
    const courseName = activity.last_round_course_name ?? 'Round played';
    const heroImage = activity.course_thumbnail_image;

    if (!friendIsClbhouz) {
      return {
        scroll: (
          <>
            <SheetHero
              imageUrl={heroImage}
              onClose={onClose}
              topEyebrow={<FriendEyebrow activity={activity} />}
              glass={
                <SheetHeroGlass
                  courseName={courseName}
                  par={null}
                  slope={null}
                  gross={activity.last_round_adjusted_gross}
                  stableford={activity.last_round_stableford}
                  differential={activity.last_round_differential}
                  holes={null}
                  metaOverride={
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 11,
                        fontWeight: 600,
                        color: AMBER,
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {activity.friend_handicap_index != null
                        ? `England Golf · Handicap ${activity.friend_handicap_index.toFixed(1)}`
                        : 'England Golf'}
                    </div>
                  }
                />
              }
            />
            <NonClbhouzFriendBody activity={activity} />
          </>
        ),
        footer: null,
      };
    }

    // Clbhouz friend (synced)
    const holes = friendDetail?.holes ?? null;
    const hasHoles = !!holes && holes.length > 0;
    const friendDelta =
      activity.handicap_index_at_time != null && activity.friend_handicap_index != null
        ? activity.friend_handicap_index - activity.handicap_index_at_time
        : null;

    return {
      scroll: (
        <>
          <SheetHero
            imageUrl={heroImage}
            onClose={onClose}
            topEyebrow={<FriendEyebrow activity={activity} />}
            glass={
              <SheetHeroGlass
                courseName={courseName}
                par={parTotal}
                slope={friendDetail?.slope_rating ?? null}
                gross={activity.last_round_adjusted_gross}
                stableford={activity.last_round_stableford}
                differential={activity.last_round_differential}
                holes={hasHoles ? holes : null}
              />
            }
          />

          {friendLoading && !friendDetail ? (
            <ScorecardEmpty message="Loading hole data\u2026" />
          ) : hasHoles ? (
            <RoundScorecard holes={holes!} isNineHole={!!friendDetail?.is_nine_hole} />
          ) : friendDetail && !friendDetail.hole_by_hole_fetched ? (
            <ScorecardEmpty
              message="Hole data is still syncing"
              subMessage={`Check back in a few hours for ${fname}'s hole-by-hole.`}
            />
          ) : (
            <ScorecardEmpty
              message={`No hole-by-hole data for ${fname}'s round.`}
            />
          )}
        </>
      ),
      footer: (
        <SheetFooterInk
          label={`${fname.toUpperCase()}'S INDEX`}
          currentIndex={activity.friend_handicap_index ?? null}
          previousIndex={
            friendDelta != null && activity.handicap_index_at_time != null
              ? activity.handicap_index_at_time
              : null
          }
          delta={friendDelta}
          action={
            activity.friend_user_id ? (
              <FooterPill
                onClick={() => {
                  onClose();
                  navigate(`/profile/${activity.friend_user_id}`);
                }}
                label="View profile"
                trailing={<span style={{ opacity: 0.7, marginLeft: 2 }}>{'\u203A'}</span>}
              />
            ) : null
          }
        />
      ),
    };
  };

  const titleText = isFriend
    ? activity?.last_round_course_name ?? 'Friend round detail'
    : userData?.course?.name ?? 'Round detail';

  const { scroll, footer } = isFriend ? renderFriendBody() : renderUserBody();

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          className="fixed inset-0 z-[10001]"
          style={{ background: 'var(--hcp-t-40)' }}
        />
        <DrawerPrimitive.Content
          aria-labelledby="round-detail-sheet-title"
          className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[20px] outline-none"
          style={{
            background: PAGE_BG,
            height: '80dvh',
            overflow: 'hidden',
            boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.5)',
            fontFamily: FONT_GEIST,
          }}
        >
          <DrawerPrimitive.Title className="sr-only">{titleText}</DrawerPrimitive.Title>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {scroll}
          </div>
          {footer}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default RoundDetailSheet;
