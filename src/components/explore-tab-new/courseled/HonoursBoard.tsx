import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatOrdinal, formatYearNumeric } from '@/i18n/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { A, CARD_RADIUS, GOLD, LABEL, NUMF, SANS, EYEBROW_TEXT, InkAction } from './tokens';
import { HonoursPanel as HonoursPanelShell } from './DiscoverCourseLedSkeleton';
import { GOLD_TINT_10 } from '@/features/tourhub/_shared/tokens';

/**
 * Section 7 — THE HONOURS BOARD (BRIEF_HONOURS_BOARD_THE_HOLE).
 *
 * THE HOLE LEADS BECAUSE THE HOLE IS WHAT VARIES (§S1.2). The feat name is the
 * same word on every card of its kind; the odds are the same number. The
 * yardage, the hole and the course are the only things that differ between one
 * ace and the next. So the card opens with the YARDAGE at size, the hole and
 * par beneath it, and the feat name reduced to a small label.
 *
 * TWO EARLIER ANSWERS WERE DESIGNED AND CUT (§S0.5) — do not revisit them:
 *   A DARK CLUBHOUSE BOARD (gold on lacquer) read as a foreign object parked in
 *   a light scroll.
 *   AN ODDS-LED CARD ("1 IN 12,500" as the hero) put the one constant per feat
 *   type in the largest type on the card: six cards that looked like one card
 *   six times. The odds are now said ONCE, in the section subline (§S3).
 *
 * NO PHOTOGRAPHY (§S0.4 / acceptance K). The stock course image was of
 * somewhere else on the property; the hole it never showed is the subject.
 *
 * THE RAIL IS A SAMPLE, THE SHEET IS THE RECORD (§S4): one card per feat,
 * newest first, EVERY CARD THE SAME WIDTH AND HEIGHT. Grouping by person was
 * cut because a member's nested feats made some cards taller than others; a
 * member with two feats simply APPEARS TWICE, which is its own signal. The
 * RECENT / LEADERS toggle lives only in the see-all sheet.
 */

/** §S1.5 — one card geometry, and it is fixed so the rail cannot go ragged. */
export const PLAQUE_W = 206;
export const CARD_SHADOW = '0 1px 3px rgba(11,15,20,0.06)';
/** The tinted head, then the course + member foot. Both fixed. */
export const HEAD_H = 96;
export const CARD_H = 164;
const PLAQUE_GAP = 10;
const AVATAR = 20;

/**
 * GOLD IS THE ACE (§S2), AND IT IS NOT A RARITY JUDGEMENT — AN ALBATROSS IS THE
 * RARER SHOT. Gold already means an ace in this app: the scorecard's scoring key
 * shows a gold circle for one and `beadForScore` returns SC_FILL_GOLD for it.
 * The honours board was contradicting the scorecard, so the ace takes the gold
 * ground and the albatross takes the neutral well. Do NOT swap these on rarity
 * grounds: whoever does that is right about the rarity and wrong about the
 * convention.
 *
 * ONE GOLD, NOT TWO (§S2.3). SC_FILL_GOLD is #FFD200 — the scorecard's bead
 * FILL, which is a fill value and illegible as 8px lettering on cream. ACE_GOLD
 * below is that same gold taken to text weight; the ground is its wash. No
 * second gold hue is introduced on this surface.
 */
const ACE_GROUND = GOLD_TINT_10;
const ACE_GOLD = GOLD;
const NEUTRAL_GROUND = A.PANEL;
const GHOST = A.DIM;

export type HonoursMode = 'recent' | 'leaders';

/** Newest first everywhere on this surface (§S4.2). */
export function sortHonours(events: WireEvent[]): WireEvent[] {
  return [...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
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

/**
 * §S3 — THE RARITY, SAID ONCE. The totals are COMPUTED from the feats on the
 * board, so "Four aces and an albatross" changes the moment someone makes one.
 *
 * "COMMONLY QUOTED AT" IS DELIBERATE AND MUST NOT BE TIGHTENED (§S3.3): the
 * 12,500 figure is folklore rather than a measured statistic and the app should
 * not assert it as fact.
 *
 * The sentence takes the two totals as SEPARATE PLACEHOLDERS (§S6.3) because
 * "four aces and an albatross" does not concatenate in every language.
 */
export function useHonoursSubline(events: WireEvent[]) {
  const { t } = useTranslation('courses');
  const aces = events.filter((e) => e.kind === 'ace').length;
  const albatrosses = events.length - aces;

  const acePart = t('discover.honours.sublineAces', {
    count: aces,
    defaultValue: '{{count}} aces',
    defaultValue_one: '{{count}} ace',
  });
  const albatrossPart = t('discover.honours.sublineAlbatrosses', {
    count: albatrosses,
    defaultValue: '{{count}} albatrosses',
    defaultValue_one: '{{count}} albatross',
  });

  if (aces > 0 && albatrosses > 0)
    return t(
      'discover.honours.sublineBoth',
      '{{aces}} and {{albatrosses}}, all time. An ace is commonly quoted at 12,500 to 1.',
      { aces: acePart, albatrosses: albatrossPart },
    );
  if (aces > 0 || albatrosses > 0)
    return t(
      'discover.honours.sublineOne',
      '{{feats}}, all time. An ace is commonly quoted at 12,500 to 1.',
      { feats: aces > 0 ? acePart : albatrossPart },
    );
  return '';
}

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
    <span
      style={{
        flex: '0 0 auto',
        display: 'block',
        borderRadius: '34%',
      }}
    >
      <SquircleAvatar size={size} src={src} alt={alt} userId={userId} hairlineRing />
    </span>
  );
}

/* ───────────────────────────── the feat card ─────────────────────────── */

/** §S1 — one card per FEAT, led by the yardage. */
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
  const holeAndPar = useHoleAndPar();
  const kindLabel = useKindLabel();
  const tappable = !!onPress && !!e.scoreId;
  const ace = e.kind === 'ace';
  const line = holeAndPar(e);

  return (
    <button
      type="button"
      disabled={!tappable}
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
        background: A.PANEL,
        boxShadow: CARD_SHADOW,
        overflow: 'hidden',
        textAlign: 'left',
        fontFamily: SANS,
        boxSizing: 'border-box',
        cursor: tappable ? 'pointer' : 'default',
        /* A feat with no score genuinely cannot open — say so visually. */
        opacity: tappable ? 1 : 0.62,
      }}
    >
      {/* THE TINTED HEAD — gold for an ace, the neutral well for an albatross. */}
      <span
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: HEAD_H,
          flex: '0 0 auto',
          background: ace ? ACE_GROUND : NEUTRAL_GROUND,
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
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: ace ? ACE_GOLD : A.INK,
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
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: GHOST,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {formatYearNumeric(e.at)}
        </span>

        {/* THE YARDAGE IS THE HERO (§S1.1). A card with no yardage on record
            falls back to the hole line at the same rank rather than printing an
            empty figure. */}
        {e.holeYards != null ? (
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span
              style={{
                ...NUMF,
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 1,
                color: A.INK,
              }}
            >
              {e.holeYards}
            </span>
            <span
              style={{
                ...LABEL,
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: A.MUTE,
              }}
            >
              {t('discover.honours.yards', 'YARDS')}
            </span>
          </span>
        ) : (
          <span
            style={{
              ...NUMF,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: A.INK,
            }}
          >
            {line || t('discover.honours.badgeAce', 'Ace')}
          </span>
        )}

        {e.holeYards != null && line ? (
          <span
            style={{
              display: 'block',
              marginTop: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: A.BODY,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {line}
          </span>
        ) : null}
      </span>

      {/* THE COURSE, THEN THE MEMBER (§S1.4). One line each — a rail card that
          wraps is a rail card that changes height. */}
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 8,
          flex: 1,
          padding: '0 12px',
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {e.courseName ?? t('discover.unknownCourse', 'Course')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <MemberAvatar
            userId={e.userId}
            src={e.actorAvatar}
            alt={e.actorName}
          />
          {/* NO "YOU" SUBSTITUTION (§S5.2) — this is a record, and a record
              carries names. Amber says whose it is. */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              color: e.isOwn ? A.AMBER_DEEP : A.BODY,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {e.actorName}
          </span>
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
        background: l.events.some((e) => e.kind === 'ace') ? ACE_GROUND : NEUTRAL_GROUND,
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
          color: l.isOwn ? A.AMBER_DEEP : A.INK,
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
          fontSize: 8,
          letterSpacing: '0.18em',
          color: A.BODY,
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

/** The heading block: glyph, title, quiet see-all, then the rarity subline. */
export function HonoursHeading({
  events,
  aside,
}: {
  events: WireEvent[];
  aside?: React.ReactNode;
}) {
  const { t } = useTranslation('courses');
  const subline = useHonoursSubline(events);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        <span style={EYEBROW_TEXT}>{t('discover.honoursTitle', 'The honours board')}</span>
        {aside ? <span style={{ marginLeft: 'auto' }}>{aside}</span> : null}
      </div>
      {subline ? (
        <div
          style={{
            marginTop: 3,
            fontFamily: SANS,
            fontSize: 11.5,
            fontWeight: 500,
            lineHeight: 1.4,
            color: A.MUTE,
          }}
        >
          {subline}
        </div>
      ) : null}
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
  const feats = useMemo(() => sortHonours(events), [events]);

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
            events={events}
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
