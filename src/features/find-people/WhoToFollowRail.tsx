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
 * Option B reads media and covers once per surface and waits for both before
 * choosing media → cover → none. FollowTileImage owns URL failure fallback;
 * shared photo fade and squircle avatars retain their canonical owners.
 *
 * KindRail (Pros to follow above post 10, Creators to follow above post 21)
 * shares RailBody/RailCardView and the HIDDEN set; a qualifying kind rail's
 * people leave the general rail so no one appears twice.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProOrVerifiedMark } from '@/features/pro-verification/ProOrVerifiedMark';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSuggestionCoversQuery } from './useSuggestionCovers';
import { useFollowTileMedia, type FollowTileMedia } from './useFollowTileMedia';
import { useFollowTileSource } from './FollowTileImage';
import { PhotoBandFade } from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import './follow-tiles.css';
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
  kindFigures,
  kindRailVisible,
  kindReason,
  kindRowToPerson,
  type FollowKind,
  type KindPerson,
  type RailCard,
} from './railRules';
import { usePeopleToFollowByKind } from './usePeopleToFollowByKind';
import { ActiveAvatarDoor } from './ActiveRing';
import { type RecentActivity } from './activeRingRules';
import { tilePostedLine } from './followTileRules';
import { useRecentActivity } from './useRecentActivity';

/** Cards hidden this session — shared by both slots and across feed remounts. */
const HIDDEN = new Set<string>();
/** Rails (slot number or kind) whose 50%-visible view event already fired this session. */
const VIEWED = new Set<string | number>();
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

type RailTrack = Record<string, unknown>;

interface RailHeadSpec {
  testId: string;
  viewKey: string | number;
  track: RailTrack;
  title: string;
  sub: string;
  seeAllAria: string;
  seeAllPath: string;
}

export function WhoToFollowRail({ slot }: { slot: 1 | 2 }) {
  const { t } = useTranslation('common');
  const peopleQ = usePeopleSuggestions();
  const bizQ = useBusinessSuggestions();
  /* No one twice: people shown in a QUALIFYING kind rail leave this rail;
     a kind rail under 3 cards keeps its people eligible here. Same cache
     keys as the kind rails, so this adds no reads of its own. */
  const proQ = usePeopleToFollowByKind('pro');
  const creatorQ = usePeopleToFollowByKind('creator');
  const excluded = useMemo(() => {
    const ids = new Set<string>();
    for (const r of kindRailVisible(proQ.data ?? [], HIDDEN)) ids.add(r.user_id);
    for (const r of kindRailVisible(creatorQ.data ?? [], HIDDEN)) ids.add(r.user_id);
    return ids;
  }, [proQ.data, creatorQ.data]);

  const ordered = useMemo(
    () => railCards((peopleQ.data ?? []).filter((p) => !excluded.has(p.user_id)), bizQ.data ?? []),
    [peopleQ.data, bizQ.data, excluded],
  );
  /** The slot's cards before session hides — tells a never-render from an
   *  everything-dismissed collapse. */
  const all = useMemo(() => railSlotCards(ordered, slot, EMPTY), [ordered, slot]);
  const select = useMemo(() => (hidden: ReadonlySet<string>) => railSlotCards(ordered, slot, hidden), [ordered, slot]);
  const head = useMemo<RailHeadSpec>(() => ({
    testId: `who-to-follow-rail-${slot}`,
    viewKey: slot,
    track: { slot },
    title: t('findPeople.rail.title', { defaultValue: 'Who to follow' }),
    sub: t('findPeople.rail.sub', { defaultValue: 'Golfers and clubs you might know' }),
    seeAllAria: t('findPeople.rail.seeAllAria', { defaultValue: 'See all, Explore the community' }),
    seeAllPath: '/find-people',
  }), [slot, t]);
  return <RailBody all={all} select={select} head={head} />;
}

/** Pros to follow / Creators to follow — the same rail frame and card. */
export function KindRail({ kind }: { kind: FollowKind }) {
  const { t } = useTranslation('common');
  const q = usePeopleToFollowByKind(kind);
  /** Qualifies once per data load against this session's hides (3+ cards);
   *  later hides collapse cards in place and close the rail at zero. */
  const rows = useMemo(() => kindRailVisible(q.data ?? [], HIDDEN), [q.data]);
  const all = useMemo<RailCard[]>(
    () => rows.map((r) => ({ kind: 'person', person: kindRowToPerson(kind, r) })),
    [rows, kind],
  );
  const kindRows = useMemo(() => new Map(rows.map((r) => [r.user_id, r])), [rows]);
  const select = useMemo(
    () => (hidden: ReadonlySet<string>) => all.filter((c) => !hidden.has(railCardId(c))),
    [all],
  );
  const head = useMemo<RailHeadSpec>(() => kind === 'pro'
    ? {
        testId: 'pros-to-follow-rail',
        viewKey: 'rail_pros',
        track: { surface: 'rail_pros' },
        title: t('findPeople.kind.pro.title', { defaultValue: 'Pros to follow' }),
        sub: t('findPeople.kind.pro.sub', { defaultValue: 'Verified tour and teaching professionals' }),
        seeAllAria: t('findPeople.kind.pro.seeAllAria', { defaultValue: 'See all, Pros to follow' }),
        seeAllPath: '/find-people?kind=pro',
      }
    : {
        testId: 'creators-to-follow-rail',
        viewKey: 'rail_creators',
        track: { surface: 'rail_creators' },
        title: t('findPeople.kind.creator.title', { defaultValue: 'Creators to follow' }),
        sub: t('findPeople.kind.creator.sub', { defaultValue: 'Golfers making videos on clbhouz' }),
        seeAllAria: t('findPeople.kind.creator.seeAllAria', { defaultValue: 'See all, Creators to follow' }),
        seeAllPath: '/find-people?kind=creator',
      }, [kind, t]);
  return <RailBody all={all} select={select} head={head} kind={kind} kindRows={kindRows} />;
}

function RailBody({
  all,
  select,
  head,
  kind,
  kindRows,
}: {
  all: RailCard[];
  select: (hidden: ReadonlySet<string>) => RailCard[];
  head: RailHeadSpec;
  kind?: FollowKind;
  kindRows?: ReadonlyMap<string, KindPerson>;
}) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { track } = head;

  const [closing, setClosing] = useState<ReadonlySet<string>>(new Set());
  const [hiddenTick, setHiddenTick] = useState(0);
  const [gone, setGone] = useState(false);

  // hiddenTick re-reads the module-level HIDDEN set.
  const cards = useMemo(() => select(HIDDEN), [select, hiddenTick]);
  /** ACTIVE RING — one batched read for the slot's cards, in display order. */
  const activityIds = useMemo(() => all.map(actorIdOf), [all]);
  const activity = useRecentActivity(activityIds);
  const coverIds = useMemo(() => ({
    people: all.flatMap(card => card.kind === 'person' ? [card.person.user_id] : []),
    businesses: all.flatMap(card => card.kind === 'business' ? [card.business.business_id] : []),
  }), [all]);
  const coversQuery = useSuggestionCoversQuery(coverIds.people, coverIds.businesses);
  const mediaQuery = useFollowTileMedia(coverIds.people, coverIds.businesses);

  /** WF2 §7 — mark both suggestion queries stale WITHOUT refetching. */
  const markStale = () => {
    queryClient.invalidateQueries({ queryKey: ['people-suggestions'], refetchType: 'none' });
    queryClient.invalidateQueries({ queryKey: ['business-suggestions'], refetchType: 'none' });
    queryClient.invalidateQueries({ queryKey: ['people-to-follow'], refetchType: 'none' });
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
    const key = head.viewKey;
    if (!el || VIEWED.has(key) || cards.length === 0) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !VIEWED.has(key)) {
          VIEWED.add(key);
          analyticsEvents.track('who_to_follow_viewed', track);
          obs.disconnect();
        }
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [head.viewKey, track, cards.length]);

  if (gone || all.length === 0) return null;
  const collapsing = cards.length === 0;

  const dismiss = (card: RailCard) => {
    const id = railCardId(card);
    const actor = railCardActor(card);
    analyticsEvents.track('who_to_follow_dismiss', {
      ...track,
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
      data-testid={head.testId}
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
          {head.title}
        </div>
        <button
          type="button"
          aria-label={head.seeAllAria}
          onClick={() => {
            analyticsEvents.track('who_to_follow_see_all', track);
            navigate(head.seeAllPath);
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
        {head.sub}
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
            track={track}
            kind={kind}
            kindRow={card.kind === 'person' ? kindRows?.get(card.person.user_id) : undefined}
            closing={closing.has(railCardId(card))}
            onDismiss={() => dismiss(card)}
            markStale={markStale}
            scheduleRemoval={scheduleRemoval}
            cancelRemoval={cancelRemoval}
            activity={activity.get(actorIdOf(card))}
            coverUrl={coversQuery.covers.get(railCardId(card))}
            media={mediaQuery.media.get(railCardId(card))}
            sourcesSettled={coversQuery.settled && mediaQuery.settled}
          />
        ))}
      </div>
    </div>
  );
}

/* ── card ───────────────────────────────────────────────────────────── */

function RailCardView({
  card,
  track,
  kind,
  kindRow,
  closing,
  onDismiss,
  markStale,
  scheduleRemoval,
  cancelRemoval,
  activity,
  coverUrl,
  media,
  sourcesSettled,
}: {
  card: RailCard;
  track: RailTrack;
  kind?: FollowKind;
  kindRow?: KindPerson;
  closing: boolean;
  onDismiss: () => void;
  markStale: () => void;
  scheduleRemoval: (id: string) => void;
  cancelRemoval: (id: string) => void;
  activity: RecentActivity | undefined;
  coverUrl: string | undefined;
  media: FollowTileMedia | undefined;
  sourcesSettled: boolean;
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
  const reason: Copy | null = kind && kindRow
    ? kindReason(kind, kindRow)
    : isPerson
    ? railGolferReason(card.person)
    : railBusinessReason(card.business, businessCategoryLabel(card.business));
  const { source, fail } = useFollowTileSource(media, coverUrl, sourcesSettled);
  const line = source?.media ? tilePostedLine(source.media.posted_at, new Date()) : null;
  const when = line ? t(line.key, { ...line.vars, defaultValue: line.def }) : '';
  const followers = !isPerson ? card.business.followers ?? 0 : 0;
  const kindFig = kind && kindRow ? kindFigures(kindRow) : null;
  const figures = kind && kindRow
    ? (kindFig ? t(kindFig.key, { ...kindFig.vars, defaultValue: kindFig.def }) : '')
    : isPerson
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
        ...track,
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

  const avatar = (size: number) => <ActiveAvatarDoor
    postId={activity?.post_id ?? null}
    label={t('findPeople.active.open', { name, defaultValue: `Open ${name}'s latest post` })}
    onOpen={(id) => navigate(`/post/${id}`)}
  ><SquircleAvatar src={isPerson ? card.person.profile_photo_url : card.business.logo_url}
    alt={name} userId={actorIdOf(card)} size={size}
    fallback={isPerson ? getInitialsFromName(name) : businessInitials(name)} hairlineRing />
  </ActiveAvatarDoor>;
  return (
    <div role="button" tabIndex={0} className="follow-tile" data-follow-tile-source={!sourcesSettled ? 'pending' : source?.media ? 'media' : source ? 'cover' : 'none'}
      onClick={open} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(); }}
      style={{ flex: 'none', width: closing ? 0 : 186, height: 300, boxSizing: 'border-box', borderRadius: 18,
        marginRight: closing ? -10 : 0, opacity: closing ? 0 : 1, overflow: 'hidden', position: 'relative',
        cursor: 'pointer', scrollSnapAlign: 'start',
        transition: `width ${DISMISS_MS}ms ease, opacity ${DISMISS_MS}ms ease, margin ${DISMISS_MS}ms ease` }}>
      {source && <><img className="follow-tile-image" src={source.url} alt="" loading="lazy" decoding="async" onError={fail} /><PhotoBandFade canvas={PAGE_CANVAS} /></>}
      <Button variant={null} size={null} className="follow-tile-dismiss" type="button"
        aria-label={t('findPeople.rail.hide', { name, defaultValue: `Hide ${name}` })}
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}><X size={14} strokeWidth={2.6} /></Button>
      {source?.media?.media_type === 'video' && <span data-follow-tile-play className="follow-tile-play" aria-hidden><Play size={13} fill="currentColor" strokeWidth={0} /></span>}
      {!source && <div data-follow-tile-avatar="large" className="follow-tile-avatar follow-tile-avatar-large">{avatar(84)}</div>}
      <div className="follow-tile-bottom">
        {source && <div data-follow-tile-avatar="small" className="follow-tile-avatar follow-tile-avatar-small">{avatar(34)}</div>}
        <div className="follow-tile-name"><span>{name}</span><ProOrVerifiedMark userId={isPerson ? card.person.user_id : null} verified={verified} /></div>
        <div className="follow-tile-reason">{reason ? t(reason.key, { ...reason.vars, defaultValue: reason.def }) : ''}</div>
        <div data-testid="rail-slot" className="follow-tile-stat">{when ? <span data-testid="rail-when">{when}</span> : figures ? <span data-testid="rail-figures">{figures}</span> : null}</div>
        <Button type="button" variant={null} size={null} onClick={onFollow} disabled={pending} className="follow-tile-follow"
          style={{ opacity: pending ? 0.7 : 1, ...(followed ? { background: A.INK, color: A.CANVAS, border: `1px solid ${A.INK}` } : {}) }}>
          {followed ? t('findPeople.following', { defaultValue: 'Following' }) : t('findPeople.follow', { defaultValue: 'Follow' })}
        </Button>
      </div>
    </div>
  );
}

export default WhoToFollowRail;
