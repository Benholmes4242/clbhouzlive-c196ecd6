import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatOrdinal, formatYearNumeric } from '@/i18n/format';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { A, CARD_RADIUS, DISCOVER_FACT, DISCOVER_QUIET, LABEL, SANS, SCOPE_PILL_RADIUS, EYEBROW_TEXT, InkAction } from './tokens';
import { HonoursPanel as HonoursPanelShell } from './DiscoverCourseLedSkeleton';
import { PodiumAvatarRing } from './PodiumAvatarRing';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

/**
 * Section 7 — THE HONOURS BOARD (BRIEF_HONOURS_PERSON_LED).
 *
 * THE MEMBER LEADS. Honours commemorates the person who made the feat; hole,
 * par and yardage are supporting context on one line beneath their name.
 *
 * TWO EARLIER ANSWERS WERE DESIGNED AND CUT (§S0.5) — do not revisit them:
 *   A DARK CLUBHOUSE BOARD (gold on lacquer) read as a foreign object parked in
 *   a light scroll.
 *   AN ODDS-LED CARD ("1 IN 12,500" as the hero) put the one constant per feat
 *   type in the largest type on the card: six cards that looked like one card
 *   six times.
 *
 * THE RAIL IS A SAMPLE, THE SHEET IS THE RECORD (§S4): one card per feat,
 * RAREST FIRST THEN MOST RECENT, EVERY CARD THE SAME WIDTH AND HEIGHT. Grouping by person was
 * cut because a member's nested feats made some cards taller than others; a
 * member with two feats simply APPEARS TWICE, which is its own signal. The
 * RECENT / LEADERS toggle lives only in the see-all sheet.
 */

/** §S1.5 — one card geometry, and it is fixed so the rail cannot go ragged. */
export const PLAQUE_W = 206;
export const CARD_SHADOW = '0 1px 3px rgba(11,15,20,0.06)';
/** The person-led metal head, then the course-only foot. Both fixed. */
export const HEAD_H = 104;
export const CARD_H = 148;
const PLAQUE_GAP = 10;
const AVATAR = 44;

/**
 * TWO SURFACES, TWO JOBS. A scorecard IDENTIFIES a score, so an ace and an
 * albatross deliberately share its red disc with a gold ring: both mean “rarer
 * than an eagle”. The honours board RANKS rarity, so it deliberately separates
 * the roughly 500× rarer albatross (champagne) from the ace (bone). Do not make
 * either surface match the other; the difference is semantic, not accidental.
 *
 * THESE TWO SEPARATE BY SATURATION, NOT VALUE. Champagne is the richer card,
 * not a lighter or darker card. Do not introduce a value difference to make the
 * hierarchy louder.
 *
 * ONE MATERIAL, TOP TO BOTTOM (MICRO_BRIEF_HONOURS_CARD_ALL_CREAM): the ground
 * covers the WHOLE CARD — shell to foot. The board is the page's one
 * deliberately light element; an A.PANEL foot was a dark strip through it.
 */
/* MATCHED TO BEN'S MOCK-UP: the ground is FLAT IVORY #FDFBF5 top to bottom, not
   a gradient that darkens at the foot, and the two feats no longer separate by
   the card's colour — they separate by the GOLD INK the card carries, which is
   what the mock shows. Kept as *_GROUND names and as gradient-shaped strings so
   the shell's backgroundImage and the suite's reads are unchanged. */
export const ALBATROSS_GROUND = 'linear-gradient(150deg, #FDFBF5 0%, #FDFBF5 100%)';
export const ACE_GROUND = 'linear-gradient(150deg, #FDFBF5 0%, #FDFBF5 100%)';
export const METAL_INK = '#0F1216';
/* THE GOLD INK of the mock: feat label, year and the hole-and-par line. */
export const METAL_GOLD = '#A47821';
export const METAL_YEAR = METAL_GOLD;
export const METAL_SUPPORT = METAL_GOLD;
/* The course name at the foot reads SLATE, quieter than the member's name. */
export const METAL_COURSE = '#3B424C';
/* 1px of gold along the card's top edge, and the foot's separator. */
export const METAL_TOP_EDGE = '#EFDEB7';
export const METAL_HAIRLINE = '#F3E9CE';
export const METAL_AVATAR_RING = 'rgba(11,15,20,0.28)';

/**
 * Honours uses Best This Week's measured 1px ring and 0.5px visible gap, but
 * cannot use its panel-filled gap over a gradient. An offset outline leaves the
 * gap genuinely empty. The 40px avatar and existing 44px footprint are fixed.
 */
const HONOURS_RING_WIDTH = 1;
const HONOURS_RING_GAP = 0.5;

function HonoursAvatarRing({
  src,
  alt,
  userId,
}: {
  src: string | null;
  alt: string;
  userId: string | null;
}) {
  return (
    <span
      data-honours-avatar-ring
      style={{
        position: 'relative',
        width: AVATAR,
        aspectRatio: '1 / 1.05',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      <span
        style={{
          width: 40,
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
          outline: `${HONOURS_RING_WIDTH}px solid ${METAL_AVATAR_RING}`,
          outlineOffset: HONOURS_RING_GAP,
          display: 'inline-flex',
        }}
      >
        <SquircleAvatar
          size={40}
          src={src}
          alt={alt}
          userId={userId}
          hideRing
        />
      </span>
    </span>
  );
}

export type HonoursMode = 'recent' | 'leaders';

/** The sheet's Recent mode remains chronological. */
export function sortHonours(events: WireEvent[]): WireEvent[] {
  return [...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/** The page rail's stated order: rarity first, then most recent within rarity. */
export function sortHonoursRail(events: WireEvent[]): WireEvent[] {
  return [...events].sort((a, b) => {
    const rarity = Number(b.kind === 'albatross') - Number(a.kind === 'albatross');
    return rarity || new Date(b.at).getTime() - new Date(a.at).getTime();
  });
}

const at = (e: WireEvent) => new Date(e.at).getTime();

/* ──────────────────────────── shared wording ─────────────────────────── */

/** The hole and its par, built from present parts only. */
export function useHoleAndPar() {
  const { t } = useTranslation('courses');
  return (e: WireEvent) => {
    const hole = e.holeNo != null ? formatOrdinal(e.holeNo) : null;
    if (hole && e.holePar != null)
      return t('discover.honours.holeAndPar', '{{hole}} · Par {{par}}', {
        hole,
        par: e.holePar,
      });
    if (hole) return hole;
    if (e.holePar != null) return t('holes.parLabel', 'Par {{par}}', { par: e.holePar });
    return '';
  };
}

/** Kept for the sheet's rows, which still name the feat in a column. */
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


function MemberAvatar({
  userId,
  src,
  alt,
  size = AVATAR,
  metal = false,
}: {
  userId: string | null;
  src: string | null;
  alt: string;
  size?: number;
  metal?: boolean;
}) {
  return (
    <PodiumAvatarRing
      avatarSize={size}
      src={src}
      alt={alt}
      userId={userId}
      ringColor={metal ? METAL_AVATAR_RING : DISCOVER_FACT}
    />
  );
}

/* ───────────────────────────── the feat card ─────────────────────────── */

/** §S1 — one card per feat, led by the member. */
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
  const ace = e.kind === 'ace';
  const line = holeDetail(e);

  return (
    <button
      type="button"
      disabled={!tappable}
      data-honours-card-ground={ace ? ACE_GROUND : ALBATROSS_GROUND}
      onClick={tappable ? () => onPress?.(e) : undefined}
      style={{
        width,
        height: CARD_H,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        border: 'none',
        borderRadius: CARD_RADIUS,
        /* The metal is the card's shell, full height — one panel, not two.
           backgroundImage, not background: jsdom drops gradients from the
           shorthand, and the suite reads this value. */
        backgroundImage: ace ? ACE_GROUND : ALBATROSS_GROUND,
        boxShadow: CARD_SHADOW,
        /* The mock's gold top edge — an inset line, so it cannot shift layout. */
        borderTop: `1px solid ${METAL_TOP_EDGE}`,
        overflow: 'hidden',
        textAlign: 'left',
        fontFamily: SANS,
        boxSizing: 'border-box',
        cursor: tappable ? 'pointer' : 'default',
        /* Disabled changes interaction only; rarity copy must keep full contrast. */
        opacity: 1,
      }}
    >
      {/* THE FEAT BLOCK — champagne ranks above bone; the ground is the
          shell's, so this block carries no background of its own. */}
      <span
        data-honours-feat-block={ace ? 'ace' : 'albatross'}
        data-honours-metal={ace ? ACE_GROUND : ALBATROSS_GROUND}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: HEAD_H,
          flex: '0 0 auto',
          padding: '11px 12px 12px',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 11,
            left: 12,
            ...LABEL,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
             color: METAL_GOLD,
          }}
        >
          {kindLabel(e)}
        </span>
        <span
          style={{
            position: 'absolute',
            top: 11,
            right: 12,
            ...LABEL,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: METAL_YEAR,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {formatYearNumeric(e.at)}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <HonoursAvatarRing
            src={e.actorAvatar}
            userId={e.userId}
            alt={e.actorName}
          />
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: 0,
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: 15,
                // Match the self-name treatment used by Courses Played This
                // Week: the same canonical amber at the same 700 weight.
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: e.isOwn ? A.AMBER : METAL_INK,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {e.actorName}
            </span>
            <span
              style={{
                marginTop: 5,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: 1.15,
                color: METAL_SUPPORT,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {line || kindLabel(e)}
            </span>
          </span>
        </span>
      </span>

      {/* The member appears once, in the feat block. The foot sits on the SAME
          ground, separated by a gold hairline — never a change of material. */}
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
          padding: '0 12px',
          borderTop: `1px solid ${METAL_HAIRLINE}`,
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: METAL_COURSE,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {e.courseName ?? t('discover.unknownCourse', 'Course')}
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
 * THE RANKING, STATED SO IT IS REPRODUCIBLE: total feats DESC, then
 * ALBATROSSES DESC, then most recent. Albatross breaks the tie because it is the
 * rarer feat. Grouping is by the STABLE MEMBER ID and never by display name.
 *
 * This now serves the SHEET ONLY (§S4.1): the section rail does not group.
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
 * THE LEADER HEAD — the member, their count, and NO PHOTOGRAPH (acceptance K).
 * Rendered in the sheet only; the section rail is one card per feat.
 */
export function LeaderHead({ leader: l }: { leader: HonoursLeader }) {
  const countLabel = useCountLabel();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '11px 12px',
        background: A.PANEL,
      }}
    >
      <MemberAvatar
        userId={l.userId}
        src={l.lead.actorAvatar}
        alt={l.lead.actorName}
        size={28}
      />
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: l.isOwn ? A.AMBER : DISCOVER_FACT,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          flex: 1,
        }}
      >
        {l.lead.actorName}
      </span>
      <span
        style={{
          ...LABEL,
          fontSize: 11,
          letterSpacing: '0.18em',
          color: DISCOVER_QUIET,
          flex: '0 0 auto',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {countLabel(l.events)}
      </span>
    </div>
  );
}

/* ─────────────────────────── header and the toggle ───────────────────── */

/**
 * §S4.1 — THE TOGGLE LIVES IN THE SHEET AND NOWHERE ELSE. On a list of five it
 * asked a member to choose between a list of FEATS and a list of PEOPLE before
 * seeing either; in the sheet both orderings have room to mean something.
 */
export function HonoursModeToggle({
  mode,
  onChange,
}: {
  mode: HonoursMode;
  onChange: (m: HonoursMode) => void;
}) {
  const { t } = useTranslation('courses');
  /* THE SCOPE PILLS' TREATMENT (BRIEF_HONOURS_SHEET_DARK §3). This control had
     no sibling in the app, so it kept a white selected pill on a light track —
     the last light element in the sheet. It now takes Discover's settled
     selected/unselected values verbatim from PillFilterRow.tsx:50-57: A.INK
     fill with A.PANEL lettering when selected, A.PANEL with A.BORDER and A.INK
     when not, SCOPE_PILL_RADIUS, 12.5/700.

     WHAT DOES NOT TRANSFER: the enclosing TRACK. A two-segment control with a
     tinted track behind two already-bordered pills reads as a third surface,
     and the track was the light residue. The pills sit directly on the canvas
     with the row's own 6px gap. Type is 12.5/700, not LABEL's 8.5 caps, because
     the pills' legibility comes from their size and these two words are values,
     not chrome. */
  const seg = (m: HonoursMode, label: string) => {
    const on = mode === m;
    return (
      <button
        key={m}
        type="button"
        role="tab"
        aria-selected={on}
        aria-pressed={on}
        onClick={() => onChange(m)}
        style={{
          flex: 'none',
          border: `1px solid ${on ? A.INK : A.BORDER}`,
          background: on ? A.INK : A.PANEL,
          color: on ? A.PANEL : A.INK,
          borderRadius: SCOPE_PILL_RADIUS,
          padding: '8px 14px',
          fontSize: 12.5,
          fontWeight: 700,
          whiteSpace: 'nowrap',
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
      role="tablist"
      aria-label={t('discover.honours.modeLabel', 'Order')}
      style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}
    >
      {seg('recent', t('discover.honours.modeRecent', 'Recent'))}
      {seg('leaders', t('discover.honours.modeLeaders', 'Leaders'))}
    </span>
  );
}

/** The heading block: eyebrow title and an optional aside action. */
export function HonoursHeading({
  aside,
}: {
  aside?: React.ReactNode;
}) {
  const { t } = useTranslation('courses');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
      <span style={EYEBROW_TEXT}>{t('discover.honoursTitle', 'The honours board')}</span>
      {aside ? <span style={{ marginLeft: 'auto' }}>{aside}</span> : null}
    </div>
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
}

export function HonoursBoard({
  events,
  limit,
  isPending = false,
  showHeader = true,
  onRowPress,
  onSeeAll,
}: Props) {
  const { t } = useTranslation('courses');
  const feats = useMemo(() => sortHonoursRail(events), [events]);

  if (isPending) return <HonoursPanelShell />;
  if (events.length === 0) return null;

  const featShown = limit ? feats.slice(0, limit) : feats;

  const railStyle: React.CSSProperties = {
    display: 'flex',
    /* STRETCH, NOT flex-start: every card declares CARD_H, so the rail cannot
       go ragged (acceptance G). */
    alignItems: 'stretch',
    gap: PLAQUE_GAP,
    overflowX: 'auto',
    /* Asymmetric gutters: the first card shares the heading's left edge, the
       last bleeds off the right so the rail announces that it scrolls. The
       vertical padding is the shadow's room. */
    padding: '3px 0 6px 2px',
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
            aside={
              onSeeAll ? (
                <InkAction onClick={onSeeAll}>
                  {t('discover.honoursSeeAllPlain', 'See all')}
                </InkAction>
              ) : null
            }
          />
        </div>
      ) : null}

      <div style={railStyle}>
        {featShown.map((e) => (
          <FeatCard key={e.id} event={e} onPress={onRowPress} />
        ))}
      </div>
    </section>
  );
}

export default HonoursBoard;
