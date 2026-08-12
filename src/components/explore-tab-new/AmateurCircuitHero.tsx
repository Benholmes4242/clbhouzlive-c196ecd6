import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  useHeroStories,
  type HeroChips,
  type HeroStoryDetail,
  type HeroStoryRow,
  type HeroStoryKind,
} from './hooks/useHeroStories';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { toParText } from './hooks/useRegionFeats';
import { analyticsEvents } from '@/utils/analyticsEvents';


const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';
const UNDER_PAR = '#FF4D57';

const HERO_MIN_HEIGHT =
  'calc(clamp(280px, 35dvh, 390px) + env(safe-area-inset-top, 0px))';

const KIND_LABEL: Record<HeroStoryKind, string> = {
  course_record: 'COURSE RECORD',
  ace: 'HOLE-IN-ONE',
  albatross: 'ALBATROSS',
  eagle: 'EAGLE',
  birdie_haul: 'BIRDIE HAUL',
};

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function initials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

// ---------------------------------------------------------------------------
// Story + chips (jsonb, parsed defensively - shapes are not guaranteed)
// ---------------------------------------------------------------------------

export type HeroStoryKindTag = 'beat' | 'rarity' | 'first_at_course' | 'most_at_course' | 'none';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

interface ChipItem {
  key: string;
  label: string;
}

/** Ordered chip list. Absent/zero/false keys are omitted entirely. */
function buildChips(raw: HeroChips | null | undefined, t: TFunction): ChipItem[] {
  const r = asRecord(raw);
  if (!r) return [];
  const out: ChipItem[] = [];
  const birdies = num(r.birdies) ?? 0;
  if (birdies > 0) {
    out.push({
      key: 'birdies',
      // plural key, count passed as a NUMBER so i18next selects _one/_other
      label: t('discover.friendsRounds.feats.birdies', { count: birdies }),
    });
  }
  const eagles = num(r.eagles) ?? 0;
  if (eagles > 0) {
    out.push({ key: 'eagles', label: t('discover.friendsRounds.feats.eagles', { count: eagles }) });
  }
  if (r.beat_par === true) {
    out.push({ key: 'beat_par', label: t('discover.friendsRounds.feats.beatPar', 'UNDER PAR') });
  }
  if (r.clean_card === true) {
    out.push({ key: 'clean_card', label: t('discover.friendsRounds.feats.cleanCard', 'CLEAN CARD') });
  }
  return out;
}

/**
 * Story renderer. Returns null for a missing story OR an unrecognised
 * story kind - the caller renders nothing and reserves no space.
 */
function buildStoryLine(
  raw: HeroStoryDetail | null | undefined,
  row: HeroStoryRow,
  t: TFunction,
): { text: string; storyKind: HeroStoryKindTag } | null {
  const s = asRecord(raw);
  if (!s) return null;
  const kind = typeof s.kind === 'string' ? s.kind : '';

  if (kind === 'beat') {
    const by = num(s.by);
    if (by == null) return null;
    const stood = s.stood == null || s.stood === '' ? null : String(s.stood);
    // self is load-bearing: the holder cannot "beat" themselves.
    if (s.self === true) {
      let text = t('discover.heroStory.beatSelf', { by });
      if (stood) text += t('discover.heroStory.stoodSelf', { stood });
      return { text, storyKind: 'beat' };
    }
    const name = typeof s.name === 'string' && s.name.trim() ? s.name.trim() : null;
    if (!name) return null;
    let text = t('discover.heroStory.beat', { name, by });
    if (stood) text += t('discover.heroStory.stood', { stood });
    return { text, storyKind: 'beat' };
  }

  if (kind === 'rarity') {
    const noun =
      row.kind === 'ace'
        ? t('discover.heroStory.nounAce', 'hole-in-one')
        : row.kind === 'albatross'
          ? t('discover.heroStory.nounAlbatross', 'albatross')
          : null;
    if (!noun) return null;
    const total = num(s.total);
    if (total === 1) {
      return { text: t('discover.heroStory.rarityOnly', { noun }), storyKind: 'rarity' };
    }
    const ordinalN = num(s.ordinal);
    if (ordinalN == null || ordinalN < 1) return null;
    const ordinal = t('discover.heroStory.ordinal', { count: ordinalN, ordinal: true });
    return { text: t('discover.heroStory.rarityNth', { ordinal, noun }), storyKind: 'rarity' };
  }

  if (kind === 'first_at_course') {
    if (!row.course_name) return null;
    return {
      text: t('discover.heroStory.firstEagle', { course: row.course_name }),
      storyKind: 'first_at_course',
    };
  }

  if (kind === 'most_at_course') {
    if (!row.course_name) return null;
    return {
      text: t('discover.heroStory.mostBirdies', { course: row.course_name }),
      storyKind: 'most_at_course',
    };
  }

  // Unrecognised story kind - render nothing.
  return null;
}


interface HeroSlideProps {
  story: HeroStoryRow;
  onOpenScore: (scoreId: string, userId: string | null) => void;
  onOpenProfile: (userId: string) => void;
}

function HeroSlide({ story, onOpenScore, onOpenProfile }: HeroSlideProps) {
  const { t } = useTranslation('courses');
  const holder = formatHolderName(story.holder_name);
  const overline = `${KIND_LABEL[story.kind] ?? story.kind.toUpperCase()} · THE AMATEUR CIRCUIT`;
  const chips = useMemo(() => buildChips(story.chips, t), [story.chips, t]);
  const storyLine = useMemo(() => buildStoryLine(story.story, story, t), [story, t]);


  let bigValue = '';
  let bigColor = '#FFFFFF';
  let microLabel = '';
  let subLine: string | null = null;

  if (story.kind === 'course_record') {
    if (story.value != null && story.course_par != null) {
      const d = story.value - story.course_par;
      bigValue = toParText(d);
      if (d < 0) bigColor = UNDER_PAR;
      microLabel = `${story.value} GROSS`;
    } else if (story.value != null) {
      bigValue = String(story.value);
      microLabel = 'GROSS';
    } else {
      bigValue = '—';
      microLabel = 'GROSS';
    }
  } else if (story.kind === 'birdie_haul') {
    bigValue = story.hole != null ? String(story.hole) : '—';
    microLabel = 'BIRDIES';
    subLine = 'ONE ROUND';
  } else {
    // ace, albatross, eagle
    bigValue = story.hole != null ? String(story.hole) : '—';
    microLabel = 'HOLE';
    if (story.kind === 'albatross' && story.course_par != null) {
      subLine = `PAR ${story.course_par} · IN 2`;
    }
  }

  const canOpenScore = !!story.score_id;
  const canOpenProfile = !!story.user_id;
  const showCta = canOpenScore || canOpenProfile;

  const handleCta = () => {
    if (canOpenScore) onOpenScore(story.score_id!, story.user_id);
    else if (canOpenProfile) onOpenProfile(story.user_id!);
  };

  return (
    <div
      style={{
        position: 'relative',
        flex: '0 0 100%',
        width: '100%',
        minHeight: HERO_MIN_HEIGHT,
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(165deg, #3E5C3A, #23361F)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        fontFamily: FONT,
      }}
    >
      {story.image ? (
        <img
          src={story.image}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      ) : null}

      {/* Layered scrim — matches the Tour Overview PhotoBand stack
          (top scrim + heavy bottom scrim + radial ambient). */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%) top / 100% 80px no-repeat,' +
            'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,0.92) 100%) bottom / 100% 260px no-repeat,' +
            'radial-gradient(ellipse 90% 60% at 50% 95%, rgba(0,0,0,0.55) 0%, transparent 70%),' +
            'radial-gradient(ellipse 70% 50% at 30% 20%, rgba(0,80,40,0.30) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content bottom-anchored */}
      <div
        style={{
          marginTop: 'auto',
          padding: '0 16px 44px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type scale mirrors CoursesPageHero: 10/700 eyebrow, 18.5 title. */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 8,
              lineHeight: 1,
            }}
          >
            {overline}
          </div>
          <div
            style={{
              fontSize: 18.5,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
              color: '#FFFFFF',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {story.course_name}
          </div>

          {/* Chips - nothing rendered (and no space reserved) when absent */}
          {chips.length > 0 ? (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {chips.map((c) => (
                <span
                  key={c.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    color: '#FFFFFF',
                    background: 'rgba(255,255,255,0.16)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.label}
                </span>
              ))}
            </div>
          ) : null}

          {/* Story line - absent story renders nothing at all.
              Sized as the Courses hero fact line (12.5). */}
          {storyLine ? (
            <div
              style={{
                marginTop: 10,
                fontSize: 12.5,
                lineHeight: 1.45,
                maxWidth: 340,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              {storyLine.text}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            <SquircleAvatar
              size={20}
              src={story.holder_avatar}
              alt={holder}
              fallback={initials(holder)}
              hairlineRing
              ringColor={GOLD}
            />
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {holder}
            </span>
            {story.happened_at ? (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.60)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {relativeTime(story.happened_at)}
              </span>
            ) : null}
          </div>

          {showCta ? (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleCta}
                className="active:scale-[0.98] transition-transform"
                style={{
                  background: '#FFFFFF',
                  color: '#15171F',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  padding: '9px 15px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('discover.hero.viewScorecard', 'View scorecard')}
              </button>
            </div>
          ) : null}
        </div>

        {/* Right: value block */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            minWidth: 0,
            paddingBottom: 4,
          }}
        >
          <div
            className="tabular-nums"
            style={{
              // 39 is the Courses hero rank figure.
              fontSize: 39,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: bigColor,
            }}
          >
            {bigValue}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.58)',
              whiteSpace: 'nowrap',
            }}
          >
            {microLabel}
          </div>
          {subLine ? (
            <div
              style={{
                marginTop: 3,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                whiteSpace: 'nowrap',
              }}
            >
              {subLine}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface AmateurCircuitHeroProps {
  /** Fallback element to render when stories are empty/errored. */
  fallback: React.ReactNode;
}

function AmateurCircuitHeroInner({ fallback }: AmateurCircuitHeroProps) {
  const { data, isLoading, isError } = useHeroStories();
  const opener = useScorecardOpener();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Latched once per mount as soon as stories arrive. Never re-rolled on
  // re-renders (lens flips, scroll, parent updates) because the effect
  // early-returns once the ref is set.
  const initialIdxRef = useRef<number | null>(null);

  const stories = data ?? [];
  const count = stories.length;

  // Analytics: fire once per slide VIEW, not per render (the carousel
  // re-renders on every swipe frame). The 'none' story_kind count tells us
  // what share of slides have nothing to say.
  const { t: tHero } = useTranslation('courses');
  const seenSlidesRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const row = stories[activeIndex];
    if (!row) return;
    if (seenSlidesRef.current.has(activeIndex)) return;
    seenSlidesRef.current.add(activeIndex);
    const line = buildStoryLine(row.story, row, tHero);
    analyticsEvents.track('hero_story_shown', {
      kind: row.kind,
      story_kind: line?.storyKind ?? 'none',
    });
    analyticsEvents.track('hero_chips_shown', {
      kind: row.kind,
      chip_count: buildChips(row.chips, tHero).length,
    });
  }, [activeIndex, stories, tHero]);


  // Pick a random entry slide once per mount, jump to it instantly
  // (no scroll animation), and sync the dot state. Runs BEFORE paint so
  // the user lands on the chosen slide rather than watching it travel.
  useLayoutEffect(() => {
    if (initialIdxRef.current !== null || count === 0) return;
    const idx = count === 1 ? 0 : Math.floor(Math.random() * count);
    initialIdxRef.current = idx;
    if (idx !== 0) {
      const el = scrollerRef.current;
      if (el) {
        el.scrollTo({ left: idx * el.clientWidth, behavior: 'auto' });
      }
      setActiveIndex(idx);
    }
  }, [count]);

  // Preload the immediate neighbours of the entry slide (clamped) so
  // the very first swipe in either direction has a warm image.
  useEffect(() => {
    const idx = initialIdxRef.current;
    if (idx == null || count < 2) return;
    for (const n of [idx - 1, idx + 1]) {
      if (n < 0 || n >= count || n === idx) continue;
      const src = stories[n]?.image;
      if (src) {
        const img = new Image();
        img.src = src;
      }
    }
  }, [count, stories]);

  // Passive scroll listener → active index
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / w);
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: HERO_MIN_HEIGHT,
          background: 'linear-gradient(180deg,#1E4D38,#0F172A)',
        }}
      />
    );
  }

  if (isError || count === 0) {
    return <>{fallback}</>;
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={scrollerRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {stories.map((s, i) => (
          <HeroSlide
            key={`${s.kind}-${s.score_id ?? s.user_id ?? i}`}
            story={s}
            onOpenScore={(scoreId, userId) => opener.openByScore(scoreId, null, userId)}
            onOpenProfile={(userId) => opener.openProfile(userId)}
          />
        ))}
      </div>

      {count > 1 ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {stories.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <span
                key={i}
                style={{
                  width: isActive ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: isActive ? GOLD : 'rgba(255,255,255,0.45)',
                  transition: 'all 250ms ease',
                }}
              />
            );
          })}
        </div>
      ) : null}

      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </div>
  );
}

export const AmateurCircuitHero = memo(AmateurCircuitHeroInner);
export default AmateurCircuitHero;
