/**
 * WS1 §2 — THE CREATORS ROW (watch-s1.html, signed off — the mock is the spec).
 *
 * For you only, between the chips and the lead. Ben's curated list, newest
 * video first, from get_featured_creators. A creator with a video in the last
 * 7 days wears a white ring and reads "{n} this week"; everyone else reads
 * their area through shortCourseName. The row hides itself, heading included,
 * under CREATORS_MIN; See all appears only above CREATORS_SEE_ALL_MAX and
 * opens a bottom sheet listing every creator with a Follow pill.
 *
 * Guests see nothing: the read is disabled signed out and the RPC returns no
 * rows, and a guest render never reaches here (the row is not mounted).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { getProfilePathById } from '@/lib/profileRoutes';
import { toast } from '@/lib/toast';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useFeaturedCreators, type FeaturedCreator } from './useFeaturedCreators';
import {
  CREATORS_SHEET_LIMIT,
  creatorSecondLine,
  showsCreatorsRow,
  showsCreatorsSeeAll,
} from './watchTopRules';

/** watch_creators_viewed fires once per session, at 50% visibility. */
let viewedThisSession = false;

/** Test-only: clears the session view flag. The app never calls this. */
export function resetCreatorsRowSessionForTests() {
  viewedThisSession = false;
}

const MUTE = 'rgba(248,250,252,0.62)';

function creatorPath(creator: FeaturedCreator): string {
  return creator.actor_type === 'business'
    ? `/business/${creator.handle || creator.actor_id}`
    : getProfilePathById(creator.actor_id, undefined, creator.handle);
}

/** The second line, shared by the row cell and the sheet row so they cannot
 *  drift: "{n} this week" in ink, otherwise the area, dim. */
function SecondLine({ creator, size }: { creator: FeaturedCreator; size: number }) {
  const { t } = useTranslation('courses');
  const line = creatorSecondLine(creator.videos_7d, creator.area);
  if (!line) return null;
  if (line.kind === 'week') {
    return (
      <span data-creator-line="week" style={{ display: 'block', marginTop: 1, fontSize: size, fontWeight: 600, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {t('amateur.watch.creators.thisWeek', '{{count}} this week', { count: line.count })}
      </span>
    );
  }
  return (
    <span data-creator-line="area" style={{ display: 'block', marginTop: 1, fontSize: size, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {line.area}
    </span>
  );
}

/** 64px avatar for the row: photo, else a black name tile for a business,
 *  else the member's initials through the canonical squircle fallback. */
function CreatorAvatar({ creator, size }: { creator: FeaturedCreator; size: number }) {
  if (creator.actor_type === 'business' && !creator.avatar_url) {
    return (
      <span
        data-creator-avatar="business-tile"
        style={{
          display: 'flex',
          width: size,
          height: size,
          borderRadius: '34%',
          background: '#000000',
          color: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: 9,
          fontWeight: 700,
          lineHeight: 1.2,
          padding: 4,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {creator.display_name}
      </span>
    );
  }
  return (
    <SquircleAvatar
      src={creator.avatar_url ?? undefined}
      alt={creator.display_name}
      userId={creator.actor_type === 'personal' ? creator.actor_id : null}
      size={size}
      fallback={creator.display_name.charAt(0)}
      hairlineRing
    />
  );
}

export function CreatorsRow({ userId }: { userId: string | undefined }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const creators = useFeaturedCreators(12, !!userId);
  const [sheetOpen, setSheetOpen] = useState(false);

  /* watch_creators_viewed — once per session, at 50% visible. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  const count = creators.data?.length ?? 0;
  useEffect(() => {
    const el = rootRef.current;
    if (!el || viewedThisSession || count === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedThisSession) {
            viewedThisSession = true;
            analyticsEvents.track('watch_creators_viewed');
            obs.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [count]);

  if (!userId) return null;

  /* Skeleton: the heading plus five 64px squircles. */
  if (!creators.isFetched) {
    return (
      <div data-watch-creators="skeleton" aria-hidden>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '22px 16px 12px' }}>
          <div style={{ width: 76, height: 19, borderRadius: 6, background: A.PANEL }} />
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflow: 'hidden' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ flex: 'none', width: 64, height: 64, borderRadius: '34%', background: A.PANEL }} />
          ))}
        </div>
      </div>
    );
  }

  /* Errored or under the minimum: no row, no heading. */
  if (creators.isError || !showsCreatorsRow(count)) return null;
  const list = creators.data ?? [];

  return (
    <div ref={rootRef} data-watch-creators="row">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '22px 16px 12px' }}>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK, fontFamily: SANS }}>
          {t('amateur.watch.creators.title', 'Creators')}
        </h2>
        {showsCreatorsSeeAll(count) ? (
          <button
            type="button"
            onClick={() => {
              analyticsEvents.track('watch_creators_see_all');
              setSheetOpen(true);
            }}
            style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600, color: MUTE }}
          >
            {t('amateur.watch.seeAll', 'See all')}
          </button>
        ) : null}
      </div>
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 12,
          padding: '0 16px',
          overflowX: 'auto',
          maxWidth: '100%',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-x pan-y',
          willChange: 'transform',
        }}
      >
        {list.map((creator, index) => {
          const active = creator.videos_7d > 0;
          return (
            <button
              key={`${creator.actor_type}:${creator.actor_id}`}
              type="button"
              data-watch-creator={creator.actor_type}
              onClick={() => {
                analyticsEvents.track('watch_creator_tapped', { actor_type: creator.actor_type, position: index + 1 });
                navigate(creatorPath(creator));
              }}
              style={{
                flex: 'none',
                width: 68,
                padding: 0,
                border: 0,
                background: 'transparent',
                textAlign: 'center',
                cursor: 'pointer',
                fontFamily: SANS,
                color: A.INK,
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: 64,
                  margin: '0 auto',
                  borderRadius: '34%',
                  /* A creator with a video this week wears the white ring. */
                  boxShadow: active ? `0 0 0 2px ${A.CANVAS}, 0 0 0 4px ${A.INK}` : undefined,
                }}
              >
                <CreatorAvatar creator={creator} size={64} />
              </span>
              <span style={{ display: 'block', marginTop: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {creator.display_name}
              </span>
              <SecondLine creator={creator} size={11} />
            </button>
          );
        })}
      </div>
      {sheetOpen ? <CreatorsSheet onClose={() => setSheetOpen(false)} /> : null}
    </div>
  );
}

/** The See-all sheet: every creator, Find people row design — 44 squircle,
 *  name with VerifiedBadge, the same second line, and a Follow pill. */
function CreatorsSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const creators = useFeaturedCreators(CREATORS_SHEET_LIMIT, true);
  const list = useMemo(() => creators.data ?? [], [creators.data]);

  return (
    <BottomSheet open onClose={onClose} scrollBody ariaLabelledBy="watch-creators-sheet-title">
      <div style={{ padding: '0 16px 24px', fontFamily: SANS }}>
        <h2 id="watch-creators-sheet-title" style={{ margin: 0, padding: '4px 0 12px', fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>
          {t('amateur.watch.creators.title', 'Creators')}
        </h2>
        {list.map((creator, index) => (
          <SheetRow key={`${creator.actor_type}:${creator.actor_id}`} creator={creator} divider={index > 0} onOpen={() => {
            onClose();
            navigate(creatorPath(creator));
          }} />
        ))}
      </div>
    </BottomSheet>
  );
}

function SheetRow({ creator, divider, onOpen }: { creator: FeaturedCreator; divider: boolean; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        cursor: 'pointer',
        borderTopStyle: divider ? 'solid' : undefined,
        borderTopWidth: divider ? 0.5 : undefined,
        borderTopColor: divider ? A.BORDER : undefined,
        textAlign: 'left',
      }}
    >
      <CreatorAvatar creator={creator} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, fontWeight: 600, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.display_name}</span>
          {creator.is_verified ? <VerifiedBadge size="sm" /> : null}
        </div>
        <SecondLine creator={creator} size={12} />
      </div>
      <CreatorFollowPill creator={creator} />
    </div>
  );
}

/** 32px outline pill; Following dims to mute with a 0.1-alpha border — the
 *  Find people pill, through the same canonical useToggleFollow mutation. */
function CreatorFollowPill({ creator }: { creator: FeaturedCreator }) {
  const { t } = useTranslation('common');
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const [followed, setFollowed] = useState(false);
  const [pending, setPending] = useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) {
      toast.error(t('findPeople.signIn', { defaultValue: 'Please sign in' }));
      return;
    }
    const prev = followed;
    setFollowed(!prev);
    setPending(true);
    try {
      await toggle.mutateAsync({
        targetActorType: creator.actor_type,
        targetActorId: creator.actor_id,
        targetUserId: creator.actor_type === 'personal' ? creator.actor_id : undefined,
        viewerActorType: activeActor?.type ?? 'personal',
        viewerActorId: activeActor?.id ?? user.id,
        viewerUserId: user.id,
        isFollowing: prev,
      });
    } catch {
      setFollowed(prev);
      toast.error(prev ? 'Could not unfollow' : 'Could not follow');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      style={{
        flex: 'none',
        height: 32,
        padding: '0 14px',
        borderRadius: 999,
        border: followed ? '1px solid rgba(248,250,252,0.1)' : '1px solid rgba(248,250,252,0.28)',
        background: 'transparent',
        color: followed ? MUTE : A.INK,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: SANS,
        cursor: 'pointer',
      }}
    >
      {followed
        ? t('findPeople.following', { defaultValue: 'Following' })
        : t('findPeople.follow', { defaultValue: 'Follow' })}
    </button>
  );
}

export default CreatorsRow;
