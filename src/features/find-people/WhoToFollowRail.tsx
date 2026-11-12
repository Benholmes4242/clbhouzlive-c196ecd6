/**
 * WF2 — Who to follow rail in the Clubhouse feed (wf2-feed-rail.html, signed
 * off — the mock is the spec for the frame and the card).
 *
 * Rendered by Clubhouse through CardFeed's `renderBeforePost` prop ABOVE the
 * post card at postIndex 3 (slot 1) and 15 (slot 2) — never spliced into the
 * item array, so postIndex, Virtuoso keys, snapshot restore and the
 * video/carousel bookkeeping are unchanged. The rail fetches its own data
 * through the same usePeopleSuggestions / useBusinessSuggestions hooks Find
 * people uses (same default limits, same cache keys), so the rail and the
 * page share one cache and one server-defined audience.
 *
 * Dismissals write to suggestion_dismissals (NEVER the older
 * user_suggestion_dismissals) and are held in a module-level session Set so a
 * feed remount cannot bring a hidden card back before the server read catches
 * up. After any follow, unfollow or dismiss the two suggestion queries are
 * marked stale with refetchType 'none' (WF2 §7): Find people shows the change
 * next time it opens and the rail never reshuffles under the member's thumb.
 * Covers are one slot-scoped read via useSuggestionCovers; SuggestionCover
 * owns decorative image failure, never source selection or community rows.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProOrVerifiedMark } from '@/features/pro-verification/ProOrVerifiedMark';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SuggestionCover } from './SuggestionCover';
import { useSuggestionCovers } from './useSuggestionCovers';
import './suggestion-covers.css';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ROW_FONT } from '@/features/social-lists-v2/rowParts';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getProfilePathById } from '@/lib/profileRoutes';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useBusinessSuggestions, usePeopleSuggestions } from './usePeopleSuggestions';
import { businessInitials, golferFigures, type Copy } from './findPeopleRules';
import {
  businessCategoryLabel,
  railCardActor,
  railCardId,
  railCardReasonType,
  railCards,
  railBusinessReason,
  railGolferReason,
  railSlotCards,
  type RailCard,
} from './railRules';
import { ActiveAvatarDoor, ActiveRing } from './ActiveRing';
import { activityLine, type RecentActivity } from './activeRingRules';
import { useRecentActivity } from './useRecentActivity';

/** Cards hidden this session — shared by both slots and across feed remounts. */
const HIDDEN = new Set<string>();
/** Slots whose 50%-visible view event already fired this session. */
const VIEWED = new Set<number>();
const EMPTY: ReadonlySet<string> = new Set();

const actorIdOf = (card: RailCard) => (card.kind === 'person' ? card.person.user_id : card.business.business_id);

/** Mock: ✕ closes a card over 200ms; the rail closes over the same 200ms. */
const DISMISS_MS = 200;
/** FIX §2 — a followed card leaves the rail after three seconds; tapping
 *  Following again inside the window unfollows and cancels the removal. */
const FOLLOW_REMOVE_MS = 3000;

/** Test-only: clears the session dismissal and view-event sets. The app never
 *  calls this — session state is meant to last the session. */
export function resetWhoToFollowRailSessionForTests() {
  HIDDEN.clear();
  VIEWED.clear();
}

const MUTE = 'rgba(248,250,252,0.62)';

export function WhoToFollowRail({ slot }: { slot: 1 | 2 }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const peopleQ = usePeopleSuggestions();
  const bizQ = useBusinessSuggestions();

  const [closing, setClosing] = useState<ReadonlySet<string>>(new Set());
  const [hiddenTick, setHiddenTick] = useState(0);
  const [gone, setGone] = useState(false);

  const ordered = useMemo(
    () => railCards(peopleQ.data ?? [], bizQ.data ?? []),
    [peopleQ.data, bizQ.data],
  );
  /** The slot's cards before session hides — tells a never-render from an
   *  everything-dismissed collapse. */
  const all = useMemo(() => railSlotCards(ordered, slot, EMPTY), [ordered, slot]);
  // hiddenTick re-reads the module-level HIDDEN set.
  const cards = useMemo(
    () => railSlotCards(ordered, slot, HIDDEN),
    [ordered, slot, hiddenTick],
  );
  /** ACTIVE RING — one batched read for the slot's cards, in display order. */
  const activityIds = useMemo(() => all.map(actorIdOf), [all]);
  const activity = useRecentActivity(activityIds);
  const coverIds = useMemo(() => ({
    people: all.flatMap(card => card.kind === 'person' ? [card.person.user_id] : []),
    businesses: all.flatMap(card => card.kind === 'business' ? [card.business.business_id] : []),
  }), [all]);
  const covers = useSuggestionCovers(coverIds.people, coverIds.businesses);

  /** WF2 §7 — mark both suggestion queries stale WITHOUT refetching. */
  const markStale = () => {
    queryClient.invalidateQueries({ queryKey: ['people-suggestions'], refetchType: 'none' });
    queryClient.invalidateQueries({ queryKey: ['business-suggestions'], refetchType: 'none' });
  };

  /* FIX §2 — follow-removal timers by card id. After a follow the card stays
     put for three seconds, then collapses with the dismiss animation (or at
     once under reduced motion) into the session HIDDEN set, so it cannot
     return this session. An unfollow inside the window cancels the timer. */
  const removeTimers = useRef(new Map<string, number>());
  useEffect(
    () => () => {
      for (const timer of removeTimers.current.values()) window.clearTimeout(timer);
      removeTimers.current.clear();
    },
    [],
  );
  const cancelRemoval = (id: string) => {
    const timer = removeTimers.current.get(id);
    if (timer != null) {
      window.clearTimeout(timer);
      removeTimers.current.delete(id);
    }
  };
  const scheduleRemoval = (id: string) => {
    cancelRemoval(id);
    removeTimers.current.set(
      id,
      window.setTimeout(() => {
        removeTimers.current.delete(id);
        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) {
          HIDDEN.add(id);
          setHiddenTick((v) => v + 1);
          return;
        }
        setClosing((prev) => new Set(prev).add(id));
        window.setTimeout(() => {
          HIDDEN.add(id);
          setClosing((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setHiddenTick((v) => v + 1);
        }, DISMISS_MS);
      }, FOLLOW_REMOVE_MS),
    );
  };

  // When every card in the slot is gone the rail closes (height → 0, 200ms),
  // then unmounts.
  useEffect(() => {
    if (all.length > 0 && cards.length === 0 && !gone) {
      const id = window.setTimeout(() => setGone(true), DISMISS_MS);
      return () => window.clearTimeout(id);
    }
  }, [all.length, cards.length, gone]);

  // who_to_follow_viewed once per slot per session, at 50% visibility.
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || VIEWED.has(slot) || cards.length === 0) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !VIEWED.has(slot)) {
          VIEWED.add(slot);
          analyticsEvents.track('who_to_follow_viewed', { slot });
          obs.disconnect();
        }
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [slot, cards.length]);

  if (gone || all.length === 0) return null;
  const collapsing = cards.length === 0;

  const dismiss = (card: RailCard) => {
    const id = railCardId(card);
    const actor = railCardActor(card);
    analyticsEvents.track('who_to_follow_dismiss', {
      slot,
      actor_type: actor.actor_type,
      reason_type: railCardReasonType(card),
    });
    // Hide at once: width, padding and opacity to 0 over 200ms, then remove.
    setClosing((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      HIDDEN.add(id);
      setClosing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setHiddenTick((v) => v + 1);
    }, DISMISS_MS);
    void (async () => {
      const { error } = await supabase.from('suggestion_dismissals').insert({
        actor_type: actor.actor_type,
        actor_id: actor.actor_id,
      });
      if (error && (error as { code?: string }).code !== '23505') {
        // Any other error: put the card back and say so.
        HIDDEN.delete(id);
        setHiddenTick((v) => v + 1);
        toast.error(t('findPeople.rail.dismissError', { defaultValue: "Couldn't hide that. Try again." }));
      }
      markStale();
    })();
  };

  return (
    <div
      ref={rootRef}
      data-testid={`who-to-follow-rail-${slot}`}
      style={{
        background: A.CANVAS,
        padding: collapsing ? '0' : '16px 0 18px',
        marginBottom: 8,
        overflow: 'hidden',
        maxHeight: collapsing ? 0 : 420,
        opacity: collapsing ? 0 : 1,
        transition: `max-height ${DISMISS_MS}ms ease, opacity ${DISMISS_MS}ms ease, padding ${DISMISS_MS}ms ease`,
        fontFamily: ROW_FONT,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 16px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 0, color: A.INK }}>
          {t('findPeople.rail.title', { defaultValue: 'Who to follow' })}
        </div>
        <button
          type="button"
          aria-label={t('findPeople.rail.seeAllAria', { defaultValue: 'See all, Explore the community' })}
          onClick={() => {
            analyticsEvents.track('who_to_follow_see_all', { slot });
            navigate('/find-people');
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 14,
            fontWeight: 600,
            color: MUTE,
            fontFamily: ROW_FONT,
            cursor: 'pointer',
          }}
        >
          {t('findPeople.rail.seeAll', { defaultValue: 'See all' })}
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: A.DIM, padding: '2px 16px 0' }}>
        {t('findPeople.rail.sub', { defaultValue: 'Golfers and clubs you might know' })}
      </div>

      {/* Cards row — sideways drags scroll the cards, vertical drags pass
          through to scroll the feed (pan-x pan-y); contained horizontal
          overscroll stops either arming pull-to-refresh or a page swipe. */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 10,
          padding: '12px 16px 0',
          overflowX: 'auto',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-x pan-y',
          scrollSnapType: 'x proximity',
          scrollPadding: '0 16px',
        }}
      >
        {cards.map((card) => (
          <RailCardView
            key={railCardId(card)}
            card={card}
            slot={slot}
            closing={closing.has(railCardId(card))}
            onDismiss={() => dismiss(card)}
            markStale={markStale}
            scheduleRemoval={scheduleRemoval}
            cancelRemoval={cancelRemoval}
            activity={activity.get(actorIdOf(card))}
            coverUrl={covers.get(railCardId(card))}
          />
        ))}
      </div>
    </div>
  );
}

/* ── card ───────────────────────────────────────────────────────────── */

function RailCardView({
  card,
  slot,
  closing,
  onDismiss,
  markStale,
  scheduleRemoval,
  cancelRemoval,
  activity,
  coverUrl,
}: {
  card: RailCard;
  slot: 1 | 2;
  closing: boolean;
  onDismiss: () => void;
  markStale: () => void;
  scheduleRemoval: (id: string) => void;
  cancelRemoval: (id: string) => void;
  activity: RecentActivity | undefined;
  coverUrl: string | undefined;
}) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const [followed, setFollowed] = useState(false);
  const [pending, setPending] = useState(false);

  const isPerson = card.kind === 'person';
  const name = isPerson
    ? card.person.display_name ?? card.person.username ?? ''
    : card.business.name;
  const verified = isPerson ? !!card.person.is_verified : !!card.business.is_verified;
  const reason: Copy | null = isPerson
    ? railGolferReason(card.person)
    : railBusinessReason(card.business, businessCategoryLabel(card.business));
  const line = activity ? activityLine(activity, new Date()) : null;
  const when = line ? t(line.key, { ...line.vars, defaultValue: line.def }) : '';
  const followers = !isPerson ? card.business.followers ?? 0 : 0;
  const figures = isPerson
    ? golferFigures(card.person)
    : t('findPeople.followers', {
        count: followers,
        defaultValue: `${followers.toLocaleString('en-GB')} ${followers === 1 ? 'follower' : 'followers'}`,
      });

  const open = () => {
    if (card.kind === 'person') {
      navigate(getProfilePathById(card.person.user_id, undefined, card.person.username));
    } else {
      navigate(`/business/${card.business.slug ?? card.business.business_id}`);
    }
  };

  const onFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) {
      toast.error('Please sign in');
      return;
    }
    const actor = railCardActor(card);
    const prev = followed;
    setFollowed(!prev);
    setPending(true);
    try {
      await toggle.mutateAsync({
        targetActorType: actor.actor_type,
        targetActorId: actor.actor_id,
        targetUserId: actor.actor_type === 'personal' ? actor.actor_id : undefined,
        viewerActorType: activeActor?.type ?? 'personal',
        viewerActorId: activeActor?.id ?? user.id,
        viewerUserId: user.id,
        isFollowing: prev,
      });
      analyticsEvents.track('who_to_follow_follow', {
        slot,
        actor_type: actor.actor_type,
        reason_type: railCardReasonType(card),
      });
      /* FIX §2 — a follow starts the three-second removal; an unfollow inside
         the window cancels it and the card stays. */
      const id = railCardId(card);
      if (prev) cancelRemoval(id);
      else scheduleRemoval(id);
    } catch {
      setFollowed(prev);
      toast.error(prev ? 'Could not unfollow' : 'Could not follow');
    } finally {
      setPending(false);
    }
    markStale();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') open();
      }}
      style={{
        flex: 'none',
        width: closing ? 0 : 172,
        /* FIX §1 — fixed-height flex column with the Follow button pinned to
           the bottom, so golfer and business cards align whatever the
           reason/figures content above. */
        height: 266,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--suggestion-card)',
        border: closing ? 'none' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: closing ? '0 0 12px' : '0 12px 12px',
        marginRight: closing ? -10 : 0,
        opacity: closing ? 0 : 1,
        overflow: 'hidden',
        textAlign: 'center',
        position: 'relative',
        cursor: 'pointer',
        scrollSnapAlign: 'start',
        transition: `width ${DISMISS_MS}ms ease, padding ${DISMISS_MS}ms ease, opacity ${DISMISS_MS}ms ease, margin ${DISMISS_MS}ms ease`,
      }}
    >
      <SuggestionCover key={coverUrl ?? 'plain'} url={coverUrl} />
      <Button
        variant="ghost"
        className="suggestion-dismiss"
        type="button"
        aria-label={t('findPeople.rail.hide', { name, defaultValue: `Hide ${name}` })}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        <span className="suggestion-dismiss-disc"><X size={12} strokeWidth={2.6} /></span>
      </Button>

      {/* Avatar: canonical dark fallback or unchanged business logo, inside
          the ACTIVE RING slot (ringed avatars open the latest post). */}
      <div style={{ margin: '31px auto 0', display: 'flex', position: 'relative', zIndex: 1 }}>
        <ActiveAvatarDoor
          postId={activity?.post_id ?? null}
          label={t('findPeople.active.open', { name, defaultValue: `Open ${name}'s latest post` })}
          onOpen={(id) => navigate(`/post/${id}`)}
        >
          <ActiveRing active={!!activity} surface="card">
            {isPerson ? (
              <div style={{ width: 64 }}>
                <SquircleAvatar
                  src={card.person.profile_photo_url ?? undefined}
                  alt={name}
                  userId={card.person.user_id}
                  size={64}
                  fallback={getInitialsFromName(name)}
                  hairlineRing={!activity}
                  hideRing={!!activity}
                />
              </div>
            ) : card.business.logo_url ? (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '34%',
                  overflow: 'hidden',
                  background: '#F8FAFC',
                }}
              >
                <img src={card.business.logo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <SquircleAvatar size={64} src={undefined} alt={name} fallback={businessInitials(name)} hairlineRing={!activity} hideRing={!!activity} />
            )}
          </ActiveRing>
        </ActiveAvatarDoor>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          fontSize: 15,
          fontWeight: 600,
          color: A.INK,
          marginTop: 10,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        <ProOrVerifiedMark userId={card.kind === 'person' ? card.person.user_id : null} verified={verified} />
      </div>

      {/* Reason: two lines max, fixed height so cards stay aligned. */}
      <div
        style={{
          fontSize: 12.5,
          color: MUTE,
          marginTop: 3,
          lineHeight: 1.35,
          height: 34,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
        }}
      >
        {reason ? t(reason.key, { ...reason.vars, defaultValue: reason.def }) : ''}
      </div>

      {/* One 35px slot: the amber ACTIVE RING line (two lines max) when the
          golfer has one, otherwise the figures; empty but height-holding when
          neither. Business cards never carry a when line, so always figures. */}
      <div
        data-testid="rail-slot"
        style={{
          marginTop: 6,
          height: 35,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          maxWidth: '100%',
        }}
      >
        {isPerson && when ? (
          <div
            data-testid="rail-when"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: '#F7931E',
              lineHeight: '15px',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              maxWidth: '100%',
            }}
          >
            {when}
          </div>
        ) : figures ? (
          <div
            data-testid="rail-figures"
            style={{
              fontSize: 12,
              color: A.DIM,
              lineHeight: '16px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {figures}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onFollow}
        disabled={pending}
        style={{
          width: '100%',
          height: 34,
          borderRadius: 999,
          border: followed ? `1px solid ${A.INK}` : '1px solid rgba(255,255,255,0.22)',
          background: followed ? A.INK : 'transparent',
          color: followed ? A.CANVAS : A.INK,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: ROW_FONT,
          /* FIX §1 — pinned to the card's bottom, not spaced from content. */
          marginTop: 'auto',
          cursor: pending ? 'default' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {followed
          ? t('findPeople.following', { defaultValue: 'Following' })
          : t('findPeople.follow', { defaultValue: 'Follow' })}
      </button>
    </div>
  );
}

export default WhoToFollowRail;
