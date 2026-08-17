import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { formatOrdinal, formatYearNumeric } from '@/i18n/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { A, CARD_SHELL, KICKER, LABEL, NUMF, SANS } from './tokens';
import { SCRIM_STANDOUT } from './photoScrim';
import { CourseImageFallback } from './CourseImageFallback';
import { HonoursPanel as HonoursPanelShell } from './DiscoverCourseLedSkeleton';

/**
 * Section 7 — THE HONOURS BOARD (light mode; no dark values on this page).
 *
 * BRIEF_HONOURS_BOARD_REBUILD — THE PARCHMENT IS GONE. No cream wash, no gold
 * border, no gold hairline, no gold lettering: the section sits on the app
 * canvas with a kicker, a headline and a rail, exactly like Standout Rounds and
 * Latest Reviews, and lets its CONTENT carry the weight.
 *
 * RECENT: the subject is the FEAT, and a feat is about a HOLE — so the card
 * leads with the hole's photograph, the course name and "7th - Par 3 - 165 yds"
 * ON the photograph, the kind in a glass chip top-left, the year top-right, and
 * the member in a white footer beneath.
 *
 * LEADERS: the subject is the PERSON. A member with two aces at two courses has
 * two hole photos and no honest way to pick one, so the member leads: their most
 * recent feat's photo carries their avatar and name IN THE SCRIM, a glass chip
 * top-right carries the count, and their feats list beneath as rows — capped at
 * TWO plus a "{{n}} more" row, because a horizontal rail takes the height of its
 * tallest item and one prolific member would leave every other card in a column
 * of dead space. "{{n}} more" opens the SHEET in leaders mode at that member:
 * nothing is hidden, it is deferred.
 */

/** The rail card. One width for both modes, so the rail reads as one thing. */
export const PLAQUE_W = 212;
export const BAND_H = 132;
const PLAQUE_GAP = 10;
/** Footer / scrim avatar — 20px squircle, canonical component, member userId. */
const AVATAR = 20;

export type HonoursMode = 'recent' | 'leaders';

/** Rarest first everywhere on this surface. */
export function sortHonours(events: WireEvent[]): WireEvent[] {
  return [...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

const at = (e: WireEvent) => new Date(e.at).getTime();

/* ──────────────────────────── shared wording ─────────────────────────── */

/** The hole, middot joined and BUILT FROM PRESENT PARTS. */
export function useHoleDetail() {
  const { t } = useTranslation('courses');
  return (e: WireEvent) =>
    [
      e.holeNo != null ? formatOrdinal(e.holeNo) : null,
      e.holePar != null ? t('holes.parLabel', 'Par {{par}}', { par: e.holePar }) : null,
      e.holeYards != null ? t('holes.yards', '{{yards}} yds', { yards: e.holeYards }) : null,
    ]
      .filter(Boolean)
      .join(' · ');
}

export function useKindLabel() {
  const { t } = useTranslation('courses');
  return (e: WireEvent) =>
    e.kind === 'ace'
      ? t('discover.honours.badgeAce', 'Ace')
      : t('discover.honours.badgeAlbatross', 'Albatross');
}

/**
 * THE COUNT CHIP ADAPTS (§1.7): "2 aces" only when every feat is the same kind.
 * An ace and an albatross is "2 feats" — "2 aces" would simply be wrong.
 */
export function useCountLabel() {
  const { t } = useTranslation('courses');
  return (events: WireEvent[]) => {
    const aces = events.filter((e) => e.kind === 'ace').length;
    const count = events.length;
    if (aces === count)
      return t('discover.honours.countAces', {
        count,
        defaultValue: '{{count}} aces',
        defaultValue_one: '{{count}} ace',
      });
    if (aces === 0)
      return t('discover.honours.countAlbatrosses', {
        count,
        defaultValue: '{{count}} albatrosses',
        defaultValue_one: '{{count}} albatross',
      });
    return t('discover.honours.featCountWith', {
      count,
      defaultValue: '{{count}} feats',
      defaultValue_one: '{{count}} feat',
    });
  };
}

/* ───────────────────────────── glass chrome ──────────────────────────── */

/**
 * The dark glass chip every Discover photo badge now uses
 * (BRIEF_GLASS_BADGES_DARK): a SOLID dark fill, flat white figure, no blur —
 * a static backdrop-filter costs a compositing layer per card on mobile.
 */
const GLASS_CHIP: React.CSSProperties = {
  position: 'absolute',
  ...LABEL,
  fontSize: 8.5,
  lineHeight: 1,
  color: '#FFFFFF',
  background: 'rgba(24,30,26,0.62)',
  borderRadius: 999,
  padding: '5px 8px',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums lining-nums',
};

const OVERLAY_YEAR: React.CSSProperties = {
  position: 'absolute',
  top: 9,
  right: 10,
  fontSize: 7,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'rgba(255,255,255,0.78)',
  textShadow: '0 1px 2px rgba(10,14,10,0.55)',
  fontVariantNumeric: 'tabular-nums lining-nums',
};

function MemberAvatar({
  userId,
  src,
  alt,
  size = AVATAR,
}: {
  userId: string | null;
  src: string | null;
  alt: string;
  size?: number;
}) {
  return (
    <span style={{ flex: '0 0 auto', display: 'block' }}>
      <SquircleAvatar size={size} src={src} alt={alt} userId={userId} hairlineRing />
    </span>
  );
}

/* ──────────────────────────── the recent card ────────────────────────── */

/** §1.3 — one card per FEAT, led by the hole. */
export function FeatCard({
  event: e,
  onPress,
  width = PLAQUE_W,
}: {
  event: WireEvent;
  onPress?: (event: WireEvent) => void;
  width?: number | string;
}) {
  const { t } = useTranslation('courses');
  const holeDetail = useHoleDetail();
  const kindLabel = useKindLabel();
  const tappable = !!onPress && !!e.scoreId;
  const detail = holeDetail(e);

  return (
    <button
      type="button"
      disabled={!tappable}
      onClick={tappable ? () => onPress?.(e) : undefined}
      style={{
        ...CARD_SHELL,
        width,
        flex: 'none',
        padding: 0,
        textAlign: 'left',
        fontFamily: SANS,
        boxSizing: 'border-box',
        cursor: tappable ? 'pointer' : 'default',
        // A feat with no score genuinely cannot open — say so visually.
        opacity: tappable ? 1 : 0.62,
      }}
    >
      <CourseImageFallback
        courseId={e.courseId}
        courseName={e.courseName}
        imageUrl={e.courseImage}
        initialsSize={24}
        style={{ height: BAND_H }}
      >
        <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />

        <span style={{ ...GLASS_CHIP, top: 8, left: 8 }}>{kindLabel(e)}</span>
        <span style={OVERLAY_YEAR}>{formatYearNumeric(e.at)}</span>

        <span style={{ position: 'absolute', left: 10, right: 10, bottom: 9, display: 'block' }}>
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.14,
              color: '#FFFFFF',
            }}
          >
            {e.courseName ?? t('discover.unknownCourse', 'Course')}
          </span>
          {detail ? (
            <span
              style={{
                ...LABEL,
                fontSize: 8.5,
                display: 'block',
                marginTop: 4,
                color: 'rgba(255,255,255,0.84)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {detail}
            </span>
          ) : null}
        </span>
      </CourseImageFallback>

      {/* THE MEMBER — a white footer, not the subject of the card. */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '9px 10px',
          background: A.PANEL,
        }}
      >
        <MemberAvatar userId={e.userId} src={e.actorAvatar} alt={e.actorName} />
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: e.isOwn ? A.AMBER_DEEP : A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {e.isOwn ? t('discover.wire.you', 'You') : e.actorName}
        </span>
      </span>
    </button>
  );
}

/* ───────────────────────────── the leaders ───────────────────────────── */

export interface HonoursLeader {
  key: string;
  userId: string | null;
  isOwn: boolean;
  lead: WireEvent;
  events: WireEvent[];
  total: number;
  albatrosses: number;
  latest: number;
}

/**
 * §5.3 — THE RANKING, STATED SO IT IS REPRODUCIBLE:
 *   total feats DESC, then ALBATROSSES DESC, then most recent.
 * Albatross breaks the tie because it is the rarer feat. Grouping is by the
 * STABLE MEMBER ID and never by display name; an event with no id is its own
 * leader, keyed by the event id.
 */
export function groupLeaders(events: WireEvent[]): HonoursLeader[] {
  const byMember = new Map<string, HonoursLeader>();
  for (const e of sortHonours(events)) {
    const key = e.userId ? `u:${e.userId}` : `e:${e.id}`;
    const found = byMember.get(key);
    if (found) {
      found.events.push(e);
      found.latest = Math.max(found.latest, at(e));
      found.isOwn = found.isOwn || !!e.isOwn;
    } else {
      byMember.set(key, {
        key,
        userId: e.userId,
        isOwn: !!e.isOwn,
        lead: e,
        events: [e],
        total: 0,
        albatrosses: 0,
        latest: at(e),
      });
    }
  }

  const leaders = [...byMember.values()];
  for (const l of leaders) {
    l.events.sort((a, b) => at(b) - at(a));
    l.total = l.events.length;
    l.albatrosses = l.events.filter((e) => e.kind === 'albatross').length;
  }
  return leaders.sort(
    (a, b) => b.total - a.total || b.albatrosses - a.albatrosses || b.latest - a.latest,
  );
}

/**
 * THE LEADER BAND (§1.6 / §2.5) — the member IN the scrim over their most
 * recent feat's hole photo, with the count chip top-right. The SHEET renders
 * the SAME band full width, so the two surfaces are recognisably the same
 * thing.
 */
export function LeaderBand({
  leader: l,
  onPress,
  ariaExpanded,
}: {
  leader: HonoursLeader;
  onPress?: () => void;
  ariaExpanded?: boolean;
}) {
  const { t } = useTranslation('courses');
  const countLabel = useCountLabel();

  const body = (
    <>
      <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
      <span style={{ ...GLASS_CHIP, top: 8, right: 8 }}>{countLabel(l.events)}</span>
      <span
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 9,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <MemberAvatar userId={l.userId} src={l.lead.actorAvatar} alt={l.lead.actorName} size={24} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#FFFFFF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {l.isOwn ? t('discover.wire.you', 'You') : l.lead.actorName}
        </span>
      </span>
    </>
  );

  return (
    <div
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      aria-expanded={ariaExpanded}
      onClick={onPress}
      style={{ cursor: onPress ? 'pointer' : 'default' }}
    >
      <CourseImageFallback
        courseId={l.lead.courseId}
        courseName={l.lead.courseName}
        imageUrl={l.lead.courseImage}
        initialsSize={24}
        style={{ height: BAND_H }}
      >
        {body}
      </CourseImageFallback>
    </div>
  );
}

/** §1.8 — TWO rows on a card, then a "{{n}} more" row. */
export const LEADER_ROWS_ON_CARD = 2;

/** A feat row under a leader band. Same shape on the card and in the sheet. */
export function LeaderFeatRow({
  event: e,
  onPress,
  divider = true,
}: {
  event: WireEvent;
  onPress?: (event: WireEvent) => void;
  divider?: boolean;
}) {
  const { t } = useTranslation('courses');
  const holeDetail = useHoleDetail();
  const kindLabel = useKindLabel();
  const tappable = !!onPress && !!e.scoreId;
  const detail = holeDetail(e);

  return (
    <button
      type="button"
      disabled={!tappable}
      onClick={tappable ? () => onPress?.(e) : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        textAlign: 'left',
        border: 'none',
        borderTop: divider ? `1px solid ${A.BORDER}` : 'none',
        background: 'transparent',
        padding: '8px 10px',
        cursor: tappable ? 'pointer' : 'default',
        opacity: tappable ? 1 : 0.62,
        fontFamily: SANS,
      }}
    >
      <span
        style={{
          ...NUMF,
          fontSize: 11,
          color: A.MUTE,
          flex: '0 0 auto',
          width: 28,
        }}
      >
        {formatYearNumeric(e.at)}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {e.courseName ?? t('discover.unknownCourse', 'Course')}
        </span>
        {detail ? (
          <span
            style={{
              ...LABEL,
              fontSize: 8.5,
              color: A.MUTE,
              display: 'block',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {detail}
          </span>
        ) : null}
      </span>
      <span style={{ ...LABEL, fontSize: 8.5, color: A.BODY, flex: '0 0 auto' }}>
        {kindLabel(e)}
      </span>
      <ChevronRight size={13} strokeWidth={2.5} color={A.DIM} style={{ flex: '0 0 auto' }} />
    </button>
  );
}

function LeaderCard({
  leader: l,
  onPress,
  onSeeAllLeader,
}: {
  leader: HonoursLeader;
  onPress?: (event: WireEvent) => void;
  onSeeAllLeader?: (leader: HonoursLeader) => void;
}) {
  const { t } = useTranslation('courses');
  const hidden = Math.max(0, l.events.length - LEADER_ROWS_ON_CARD);
  const shown = l.events.slice(0, LEADER_ROWS_ON_CARD);

  return (
    <div
      style={{
        ...CARD_SHELL,
        width: PLAQUE_W,
        flex: 'none',
        padding: 0,
        boxSizing: 'border-box',
        fontFamily: SANS,
      }}
    >
      <LeaderBand leader={l} />
      {shown.map((e, i) => (
        <LeaderFeatRow key={e.id} event={e} onPress={onPress} divider={i > 0} />
      ))}
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => onSeeAllLeader?.(l)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            width: '100%',
            ...LABEL,
            fontSize: 9,
            color: A.INK,
            padding: '8px 10px',
            border: 'none',
            borderTop: `1px solid ${A.BORDER}`,
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: SANS,
          }}
        >
          {t('discover.honours.expandFeats', {
            count: hidden,
            defaultValue: '{{count}} more',
            defaultValue_one: '{{count}} more',
          })}
          <ChevronRight size={11} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

/* ────────────────────────── header and the toggle ────────────────────── */

/**
 * §4 — the headline is COMPUTED and each part is its OWN interpolated,
 * independently pluralised string. A zero part is OMITTED.
 */
export function useHonoursHeadline(events: WireEvent[]) {
  const { t } = useTranslation('courses');
  const aces = events.filter((e) => e.kind === 'ace').length;
  const albatrosses = events.length - aces;
  const parts: string[] = [];
  if (aces > 0)
    parts.push(
      t('discover.honours.headlineAces', {
        count: aces,
        defaultValue: '{{count}} aces.',
        defaultValue_one: '{{count}} ace.',
      }),
    );
  if (albatrosses > 0)
    parts.push(
      t('discover.honours.headlineAlbatrosses', {
        count: albatrosses,
        defaultValue: '{{count}} albatrosses.',
        defaultValue_one: '{{count}} albatross.',
      }),
    );
  return parts.join(' ');
}

/**
 * §1.10 — THE APP'S STANDARD PILL TREATMENT: an INK pill on a
 * rgba(15,23,42,0.05) track. The amber segmented control this replaced was a
 * meaningful part of what dated the section.
 */
export function HonoursModeToggle({
  mode,
  onChange,
}: {
  mode: HonoursMode;
  onChange: (m: HonoursMode) => void;
}) {
  const { t } = useTranslation('courses');
  const seg = (m: HonoursMode, label: string) => {
    const on = mode === m;
    return (
      <button
        key={m}
        type="button"
        aria-pressed={on}
        onClick={() => onChange(m)}
        style={{
          ...LABEL,
          fontSize: 8.5,
          padding: '5px 10px',
          borderRadius: 999,
          border: 'none',
          background: on ? A.INK : 'transparent',
          color: on ? '#FFFFFF' : A.MUTE,
          cursor: 'pointer',
          fontFamily: SANS,
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        borderRadius: 999,
        background: 'rgba(15,23,42,0.05)',
        flexShrink: 0,
      }}
    >
      {seg('recent', t('discover.honours.modeRecent', 'Recent'))}
      {seg('leaders', t('discover.honours.modeLeaders', 'Leaders'))}
    </span>
  );
}

/** The kicker / headline / subline block, shared with the sheet header. */
export function HonoursHeading({
  events,
  mode,
  onModeChange,
  leaderCount,
}: {
  events: WireEvent[];
  mode: HonoursMode;
  onModeChange: (m: HonoursMode) => void;
  leaderCount: number;
}) {
  const { t } = useTranslation('courses');

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={KICKER}>{t('discover.honoursTitle', 'The honours board')}</span>
        <span style={{ marginLeft: 'auto' }}>
          <HonoursModeToggle mode={mode} onChange={onModeChange} />
        </span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: A.MUTE, marginTop: 3 }}>
        {mode === 'recent' ? t('discover.honours.subRecent', 'In clbhouz history') : null}
      </div>
    </>
  );
}

/* ──────────────────────────────── the board ──────────────────────────── */

interface Props {
  events: WireEvent[];
  /** Cap on the page rail — in CARDS. The sheet is uncapped and separate. */
  limit?: number;
  /** TRUE while the wire read has not settled — the shell holds the slot. */
  isPending?: boolean;
  showHeader?: boolean;
  onRowPress?: (event: WireEvent) => void;
  onSeeAll?: () => void;
  /** §1.9 — "{{n}} more" opens the sheet in LEADERS mode at that member. */
  onSeeAllLeader?: (leader: HonoursLeader) => void;
}

export function HonoursBoard({
  events,
  limit,
  isPending = false,
  showHeader = true,
  onRowPress,
  onSeeAll,
  onSeeAllLeader,
}: Props) {
  const { t } = useTranslation('courses');
  /* The mode does NOT persist across mounts; the section opens on RECENT. */
  const [mode, setMode] = useState<HonoursMode>('recent');

  const leaders = useMemo(() => groupLeaders(events), [events]);
  const feats = useMemo(() => sortHonours(events), [events]);

  if (isPending) return <HonoursPanelShell />;
  if (events.length === 0) return null;

  const featShown = limit ? feats.slice(0, limit) : feats;
  const leaderShown = limit ? leaders.slice(0, limit) : leaders;

  const railStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: PLAQUE_GAP,
    overflowX: 'auto',
    /* Asymmetric gutters: the first card shares the heading's left edge, the
       last bleeds off the right so the rail announces that it scrolls. */
    paddingLeft: 2,
    paddingRight: 0,
    paddingBottom: 4,
    scrollPaddingLeft: 2,
    willChange: 'transform',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  };

  return (
    <section style={{ fontFamily: SANS }}>
      {showHeader ? (
        <div style={{ padding: '0 2px', marginBottom: 10 }}>
          <HonoursHeading
            events={events}
            mode={mode}
            onModeChange={setMode}
            leaderCount={leaders.length}
          />
          {onSeeAll ? (
            <button
              type="button"
              onClick={onSeeAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                ...LABEL,
                fontSize: 9.5,
                color: A.INK,
                marginTop: 8,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: SANS,
              }}
            >
              {t('discover.honoursSeeAllPlain', 'See all')}
              <ChevronRight size={12} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div style={railStyle}>
        {mode === 'recent'
          ? featShown.map((e) => <FeatCard key={e.id} event={e} onPress={onRowPress} />)
          : leaderShown.map((l) => (
              <LeaderCard
                key={l.key}
                leader={l}
                onPress={onRowPress}
                onSeeAllLeader={onSeeAllLeader}
              />
            ))}
      </div>
    </section>
  );
}

export default HonoursBoard;
