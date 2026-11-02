import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import {
  useStandoutRounds,
  type StandoutRound,
} from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { standoutSentenceParts } from '@/components/explore-tab-new/courseled/standoutSentence';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { useFeatsWindow, type FeatYearRow } from '../useFeatsWindow';
import {
  FEAT_TILE,
  SHELF_CARD,
  SHELF_DOOR,
  TO_PAR_UNDER,
  buildShelfCards,
  eligibleFeats,
  roundToPar,
  stripColor,
  toParLabel,
  type ShelfCard,
} from './roundsShelfRules';

/**
 * ROUNDS THIS WEEK (RS §3, mock A/C) — a shelf on Watch's All chip, directly
 * after Quick hits, plus the always-on door to /rounds. Signed-in members only.
 *
 * Circle first: when the member's circle produced fewer than two standout
 * rounds in the board's own 14-day window, the shelf re-reads with scope
 * 'everyone' and the sub-line says so. No cards hides the heading and the
 * rail; the door still shows. An error hides the shelf quietly and logs the
 * way the page's other shelves log.
 */

/** One viewed event per scope per app session (the WhoToFollowRail pattern). */
const VIEWED = new Set<string>();

const oneLine: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const clamp2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

function WhoRow({
  userId,
  name,
  photoUrl,
  sub,
  onOpenMember,
}: {
  userId: string | null;
  name: string;
  photoUrl: string | null;
  sub: string;
  onOpenMember?: (userId: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      onClick={(event) => {
        event.stopPropagation();
        if (userId) onOpenMember?.(userId);
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: 0, border: 0,
        background: 'transparent', cursor: 'pointer', fontFamily: SANS, color: A.INK,
        textAlign: 'left', minWidth: 0, alignSelf: 'stretch',
      }}
    >
      <SquircleAvatar size={32} src={photoUrl} alt="" userId={userId ?? undefined} hairlineRing />
      <span style={{ minWidth: 0 }}>
        <span style={{ ...oneLine, display: 'block', fontSize: 14, fontWeight: 600 }}>{name}</span>
        <span style={{ ...oneLine, display: 'block', fontSize: 11.5, color: A.DIM, marginTop: 1 }}>{sub}</span>
      </span>
    </button>
  );
}

function courseAndDate(courseName: string | null, playDate: string | null, locale: string): string {
  const parts: string[] = [];
  if (courseName) parts.push(shortCourseName(courseName));
  const when = playDate ? new Date(playDate) : null;
  if (when && !Number.isNaN(when.getTime())) {
    parts.push(when.toLocaleDateString(locale, { day: 'numeric', month: 'short' }));
  }
  return parts.join(' · ');
}

function RoundCard({
  round,
  shapes,
  locale,
  onOpenRound,
  onOpenMember,
}: {
  round: StandoutRound;
  shapes: ReturnType<typeof useRoundHoleShapes>;
  locale: string;
  onOpenRound?: (scoreId: string, ownerUserId: string | null) => void;
  onOpenMember?: (userId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const toPar = roundToPar(round);
  const toParText = toParLabel(toPar);
  const shape = round.whs_score_id ? shapes?.get(round.whs_score_id) ?? null : null;
  const sentence = standoutSentenceParts(round, locale);
  return (
    <div
      role="button"
      tabIndex={0}
      data-rounds-shelf-card="round"
      onClick={() => {
        if (!round.whs_score_id) return;
        analyticsEvents.track('rounds_shelf_card_tapped', { kind: 'round' });
        onOpenRound?.(round.whs_score_id, round.user_id);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (!round.whs_score_id) return;
        analyticsEvents.track('rounds_shelf_card_tapped', { kind: 'round' });
        onOpenRound?.(round.whs_score_id, round.user_id);
      }}
      style={{
        flex: 'none', width: SHELF_CARD.width, height: SHELF_CARD.height, boxSizing: 'border-box',
        scrollSnapAlign: 'start', background: SHELF_CARD.background,
        border: `1px solid ${SHELF_CARD.border}`, borderRadius: SHELF_CARD.radius,
        padding: SHELF_CARD.padding, display: 'flex', flexDirection: 'column', cursor: 'pointer',
      }}
    >
      <WhoRow
        userId={round.user_id}
        name={round.display_name || t('discover.aMember', 'A member')}
        photoUrl={round.profile_photo_url}
        sub={courseAndDate(round.course_name, round.play_date, locale)}
        onOpenMember={onOpenMember}
      />
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
        <b className="tabular-nums" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {round.net_score ?? round.gross_score ?? '–'}
        </b>
        {toParText ? (
          <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: toPar != null && toPar < 0 ? TO_PAR_UNDER : A.MUTE }}>
            {toParText}
          </span>
        ) : null}
      </span>
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM, marginTop: 5 }}>
        {t('amateur.roundsShelf.kickerNet', 'Net · gross {{gross}}', { gross: round.gross_score ?? '–' })}
        {round.is_competition ? t('amateur.roundsShelf.kickerComp', ' · comp') : ''}
      </span>
      {shape ? (
        <span aria-hidden style={{ display: 'flex', gap: 2, marginTop: 11 }}>
          {shape.holes.map((hole) => (
            <i key={hole.holeNo} style={{ flex: 1, height: 5, borderRadius: 2, background: stripColor(hole.strokes, hole.par) }} />
          ))}
        </span>
      ) : null}
      <span style={{ ...clamp2, fontSize: 12.5, color: A.MUTE, marginTop: 'auto', lineHeight: 1.4 }}>
        {t(sentence.key, { ...sentence, defaultValue: sentence.defaultValue })}
      </span>
    </div>
  );
}

function FeatCard({
  feat,
  locale,
  onOpenRound,
  onOpenMember,
}: {
  feat: FeatYearRow;
  locale: string;
  onOpenRound?: (scoreId: string, ownerUserId: string | null) => void;
  onOpenMember?: (userId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const unit = t(`amateur.leaderboards.unit.${feat.denominator_unit}`);
  const rarity = feat.events > 0
    ? t('amateur.leaderboards.featRarity', { n: Math.round(feat.denominator / feat.events).toLocaleString(), unit })
    : null;
  const open = () => {
    if (!feat.latest_score_id) return;
    analyticsEvents.track('rounds_shelf_card_tapped', { kind: 'feat', feat_kind: feat.feat_kind });
    onOpenRound?.(feat.latest_score_id, feat.latest_user_id);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      data-rounds-shelf-card="feat"
      onClick={open}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
      }}
      style={{
        flex: 'none', width: SHELF_CARD.width, height: SHELF_CARD.height, boxSizing: 'border-box',
        scrollSnapAlign: 'start', background: SHELF_CARD.background,
        border: `1px solid ${SHELF_CARD.border}`, borderRadius: SHELF_CARD.radius,
        padding: SHELF_CARD.padding, display: 'flex', flexDirection: 'column', cursor: 'pointer',
      }}
    >
      <WhoRow
        userId={feat.latest_user_id}
        name={feat.latest_display_name || t('discover.aMember', 'A member')}
        photoUrl={feat.latest_photo_url}
        sub={courseAndDate(feat.latest_course_name, feat.latest_play_date, locale)}
        onOpenMember={onOpenMember}
      />
      <span style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        height: FEAT_TILE.height, borderRadius: FEAT_TILE.radius, background: FEAT_TILE.background,
        marginTop: 12, padding: '0 14px',
      }}>
        <b style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {t(`amateur.roundsShelf.feat.${feat.feat_kind === 'clean_card' ? 'cleanCard' : feat.feat_kind}`, feat.feat_kind)}
        </b>
        {rarity ? <span style={{ fontSize: 11.5, color: A.MUTE, marginTop: 3 }}>{rarity}</span> : null}
      </span>
      <span style={{ ...clamp2, fontSize: 12.5, color: A.MUTE, marginTop: 'auto', lineHeight: 1.4 }}>
        {t('amateur.roundsShelf.latestOf', { count: feat.events, events: feat.events, defaultValue: feat.events === 1 ? 'The only one this year' : 'The latest of {{events}} this year' })}
      </span>
    </div>
  );
}

export function RoundsThisWeekShelf({
  userId,
  onOpenRound,
  onOpenMember,
}: {
  userId: string | undefined;
  /** Opens the scorecard sheet Explore already hosts. */
  onOpenRound?: (scoreId: string, ownerUserId: string | null) => void;
  onOpenMember?: (userId: string) => void;
}) {
  const { t, i18n } = useTranslation('courses');
  const navigate = useNavigate();
  const locale = i18n.language || 'en';

  const circleFilters = useMemo(() => ({ ...DEFAULT_FILTERS, scope: 'circle' as const }), []);
  const everyoneFilters = useMemo(() => ({ ...DEFAULT_FILTERS, scope: 'everyone' as const }), []);
  const circle = useStandoutRounds(userId, circleFilters, !!userId);
  /* Fewer than two circle rows re-reads as everyone; the sub-line says so. */
  const fellBack = circle.isFetched && (circle.data ?? []).length < 2;
  const everyone = useStandoutRounds(userId, everyoneFilters, !!userId && fellBack);
  const scope: 'circle' | 'everyone' = fellBack ? 'everyone' : 'circle';
  const roundsQ = fellBack ? everyone : circle;

  const featsQ = useFeatsWindow(userId, 'year', !!userId);

  const rounds = useMemo(() => (roundsQ.data ?? []).slice(0, 4), [roundsQ.data]);
  const feats = useMemo(() => eligibleFeats(featsQ.data ?? []), [featsQ.data]);
  const cards = useMemo(() => buildShelfCards(rounds, feats), [rounds, feats]);
  const roundIds = useMemo(
    () => cards.filter((c): c is { kind: 'round'; round: StandoutRound } => c.kind === 'round').map((c) => c.round.whs_score_id),
    [cards],
  );
  const shapes = useRoundHoleShapes(roundIds);

  const loading = !!userId && (!circle.isFetched || (fellBack && !everyone.isFetched) || !featsQ.isFetched);
  const errored = circle.isError || (fellBack && everyone.isError) || featsQ.isError;
  useEffect(() => {
    if (errored) console.warn('[rounds shelf] read failed; shelf hidden', { circle: circle.isError, everyone: everyone.isError, feats: featsQ.isError });
  }, [errored, circle.isError, everyone.isError, featsQ.isError]);

  /* rounds_shelf_viewed — once per session per scope, at 50% visibility. */
  const viewRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = viewRef.current;
    if (!el || cards.length === 0 || VIEWED.has(scope)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !VIEWED.has(scope)) {
            VIEWED.add(scope);
            analyticsEvents.track('rounds_shelf_viewed', { scope });
            observer.disconnect();
          }
        }
      },
      { threshold: [0.5] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scope, cards.length]);

  if (!userId) return null;

  const goRounds = (from: 'header' | 'door') => {
    analyticsEvents.track('rounds_door_tapped', { from });
    navigate('/rounds');
  };

  const door = (
    <button
      type="button"
      data-rounds-shelf-door
      onClick={() => goRounds('door')}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        margin: '12px 16px 0', height: SHELF_DOOR.height, padding: '0 16px',
        borderRadius: SHELF_DOOR.radius, background: SHELF_DOOR.background,
        border: `1px solid ${SHELF_DOOR.border}`, cursor: 'pointer', fontFamily: SANS,
        color: A.INK, fontSize: 14.5, fontWeight: 600, textAlign: 'left',
      }}
    >
      <span>{t('amateur.roundsShelf.door', 'Leaderboards, feats and every round')}</span>
      <ChevronRight size={16} color={A.DIM} />
    </button>
  );

  if (loading) {
    /* Reserve the heading, one row of two cards and the door; expand outwards only. */
    return (
      <div data-rounds-shelf="loading" aria-hidden>
        <div style={{ padding: '28px 16px 10px' }}>
          <div style={{ height: 19, width: 150, borderRadius: 6, background: A.PANEL }} />
          <div style={{ height: 12, width: 130, borderRadius: 6, background: A.PANEL, marginTop: 6 }} />
        </div>
        <div style={{ display: 'flex', gap: SHELF_CARD.gap, padding: '0 16px', overflow: 'hidden' }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flex: 'none', width: SHELF_CARD.width, height: SHELF_CARD.height, borderRadius: SHELF_CARD.radius, background: A.PANEL }} />
          ))}
        </div>
        {door}
      </div>
    );
  }

  return (
    <div data-rounds-shelf={cards.length > 0 ? 'ready' : 'empty'}>
      {cards.length > 0 && !errored ? (
        <>
          <div ref={viewRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '28px 16px 10px' }}>
            <div>
              <b style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>
                {t('amateur.roundsShelf.title', 'Rounds this week')}
              </b>
              <span style={{ display: 'block', fontSize: 12.5, color: A.DIM, marginTop: 2 }}>
                {scope === 'circle'
                  ? t('amateur.roundsShelf.subCircle', 'Your circle, last 14 days')
                  : t('amateur.roundsShelf.subEveryone', 'Everyone, last 14 days')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => goRounds('header')}
              style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600, color: A.MUTE }}
            >
              {t('amateur.roundsShelf.allRounds', 'All rounds')}
            </button>
          </div>
          <div
            data-rounds-shelf-rail
            style={{
              display: 'flex', gap: SHELF_CARD.gap, padding: '0 16px', overflowX: 'auto',
              scrollbarWidth: 'none', scrollSnapType: 'x proximity', overscrollBehaviorX: 'contain',
              willChange: 'transform',
            }}
          >
            {cards.map((card: ShelfCard) =>
              card.kind === 'round' ? (
                <RoundCard
                  key={`round:${card.round.whs_score_id ?? card.round.user_id}:${card.round.play_date}`}
                  round={card.round}
                  shapes={shapes}
                  locale={locale}
                  onOpenRound={onOpenRound}
                  onOpenMember={onOpenMember}
                />
              ) : (
                <FeatCard
                  key={`feat:${card.feat.feat_kind}`}
                  feat={card.feat}
                  locale={locale}
                  onOpenRound={onOpenRound}
                  onOpenMember={onOpenMember}
                />
              ),
            )}
          </div>
        </>
      ) : null}
      {door}
    </div>
  );
}

export default RoundsThisWeekShelf;
