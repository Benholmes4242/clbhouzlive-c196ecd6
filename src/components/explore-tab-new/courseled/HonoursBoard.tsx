import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatOrdinal, formatYearNumeric } from '@/i18n/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { A, LABEL, SANS, GOLD as RING_GOLD } from './tokens';
import {
  GOLD_INK,
  GOLD_HAIR,
  GOLD_BORDER,
  HONOURS_SHELL,
  HONOURS_OWN_RULE,
  ACH_GOLD,
  ACH_GOLD_INK,
  BADGE_ACE_BG,
  BADGE_ALBATROSS_BG,
  BADGE_INK,
} from './honoursTokens';
import { HonoursPanel as HonoursPanelShell } from './DiscoverCourseLedSkeleton';

/**
 * Section 6 — THE HONOURS BOARD (light mode; no dark values on this page).
 *
 * BRIEF_HONOURS_BOARD_PLAQUE_RAIL — THE BOARD IS NO LONGER A LIST.
 *
 * Each feat is a PLAQUE: a fixed-width, fixed-height object led by the
 * golfer's canonical SquircleAvatar in a 1px gold ring. Plaques sit in a
 * HORIZONTAL RAIL, so six feats cost the same vertical space as one.
 * Player-led grouping survives ONLY as the LEADERS mode, where the repetition
 * of a name IS the subject.
 *
 * THE MEMBER'S OWN PLAQUE IS MARKED BY THE NAME TONE ALONE — no wash, no
 * border, no reordering, in either mode.
 *
 * NO NUMERAL SITS INSIDE THE RING. The badge already says ACE, which says
 * "one shot" in a word; a large 1 beside a large 2 read as first and second.
 *
 * ONE COMPONENT, TWO LAYOUTS (§7): `layout="rail"` on Discover, `layout="grid"`
 * in the sheet, where the same plaque at the same width wraps two across and
 * groups under a year heading.
 */

export { GOLD_INK, GOLD_HAIR, GOLD_BORDER, HONOURS_WASH, HONOURS_SHELL } from './honoursTokens';

/** §2 — every plaque is the same object: same width, same height. */
export const PLAQUE_W = 168;
export const PLAQUE_H = 178;
const PLAQUE_GAP = 10;
const AVATAR = 54;

export type HonoursMode = 'recent' | 'leaders';

/** Rarest first everywhere on this surface. */
export function sortHonours(events: WireEvent[]): WireEvent[] {
  return [...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

const at = (e: WireEvent) => new Date(e.at).getTime();

/* ────────────────────────────── the avatar ────────────────────────────── */

/**
 * §1 — the CANONICAL SquircleAvatar with a 1px ring in achievement gold.
 * GoldRingAvatar exists for this case but wraps the avatar in an animated
 * shimmer that cannot be suppressed by a prop; a rail of six shimmering
 * plaques is a fairground, and forking it is forbidden — so the canonical
 * component is used directly with the same gold.
 */
function HolderAvatar({ event: e, size = AVATAR }: { event: WireEvent; size?: number }) {
  return (
    <span style={{ flex: '0 0 auto', display: 'block' }}>
      <SquircleAvatar
        size={size}
        src={e.actorAvatar}
        alt={e.actorName}
        userId={e.userId}
        ringColor={RING_GOLD}
        hairlineRing
      />
    </span>
  );
}

/* ────────────────────────────── the badges ────────────────────────────── */

/** One badge per distinct feat kind, rarest first, counted (§5.2). */
export function badgesFor(events: WireEvent[]) {
  const aces = events.filter((e) => e.kind === 'ace').length;
  const albatrosses = events.length - aces;
  return [
    albatrosses > 0 ? { kind: 'albatross' as const, count: albatrosses } : null,
    aces > 0 ? { kind: 'ace' as const, count: aces } : null,
  ].filter(Boolean) as { kind: 'ace' | 'albatross'; count: number }[];
}

function FeatBadge({ kind, count }: { kind: 'ace' | 'albatross'; count?: number }) {
  const { t } = useTranslation('courses');
  const label =
    kind === 'ace'
      ? t('discover.honours.badgeAce', 'Ace')
      : t('discover.honours.badgeAlbatross', 'Albatross');
  return (
    <span
      style={{
        ...LABEL,
        fontSize: 8.5,
        lineHeight: 1,
        padding: '4px 6px',
        borderRadius: 5,
        background: kind === 'ace' ? BADGE_ACE_BG : BADGE_ALBATROSS_BG,
        color: BADGE_INK,
        flexShrink: 0,
        fontVariantNumeric: 'tabular-nums lining-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {count && count > 1
        ? t('discover.honours.badgeCount', '{{label}} ×{{count}}', { label, count })
        : label}
    </span>
  );
}

/* ────────────────────────────── the plaque ────────────────────────────── */

const PLAQUE_SHELL: React.CSSProperties = {
  width: PLAQUE_W,
  minHeight: PLAQUE_H,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  padding: '11px 11px 10px',
  border: `1px solid ${GOLD_BORDER}`,
  borderRadius: 12,
  background: '#FFFFFF',
  textAlign: 'left',
  fontFamily: SANS,
  boxSizing: 'border-box',
};

const NAME_STYLE = (isOwn: boolean): React.CSSProperties => ({
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '-0.015em',
  /* §2 — own-plaque marking is the NAME TONE and nothing else. */
  color: isOwn ? HONOURS_OWN_RULE : A.BODY,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const COURSE_STYLE: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  color: A.INK,
  letterSpacing: '-0.015em',
  lineHeight: 1.2,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

/** §2 — one plaque per FEAT. A member with two aces has two plaques. */
export function FeatPlaque({
  event: e,
  onPress,
}: {
  event: WireEvent;
  onPress?: (event: WireEvent) => void;
}) {
  const { t } = useTranslation('courses');
  const tappable = !!onPress && !!e.scoreId;

  /* Hole detail, middot joined and BUILT FROM PRESENT PARTS. */
  const detail = [
    e.holeNo != null ? formatOrdinal(e.holeNo) : null,
    e.holePar != null ? t('holes.parLabel', 'Par {{par}}', { par: e.holePar }) : null,
    e.holeYards != null ? t('holes.yards', '{{yards}} yds', { yards: e.holeYards }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      onClick={tappable ? () => onPress?.(e) : undefined}
      style={{ ...PLAQUE_SHELL, cursor: tappable ? 'pointer' : 'default' }}
    >
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <HolderAvatar event={e} />
        <span
          style={{
            ...LABEL,
            fontSize: 9,
            color: A.MUTE,
            marginLeft: 'auto',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {formatYearNumeric(e.at)}
        </span>
      </span>

      {/* The feat, IN WORDS. */}
      <span
        style={{
          ...LABEL,
          fontSize: 9,
          color: ACH_GOLD_INK,
          marginTop: 9,
          display: 'block',
        }}
      >
        {e.kind === 'ace'
          ? t('discover.honours.badgeAce', 'Ace')
          : t('discover.honours.badgeAlbatross', 'Albatross')}
      </span>

      <span style={{ ...NAME_STYLE(!!e.isOwn), display: 'block', marginTop: 3 }}>
        {e.isOwn ? t('discover.wire.you', 'You') : e.actorName}
      </span>

      <span style={{ ...COURSE_STYLE, marginTop: 2 }}>
        {e.courseName ?? t('discover.unknownCourse', 'Course')}
      </span>

      <span aria-hidden style={{ marginTop: 'auto', paddingTop: 9 }} />
      <span style={{ display: 'block', borderTop: `1px solid ${GOLD_HAIR}`, paddingTop: 8 }}>
        <span
          style={{
            ...LABEL,
            fontSize: 9,
            color: A.BODY,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {detail || '\u00A0'}
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
 * Albatross breaks the tie because it is the rarer feat (roughly 1 in 6
 * million against 1 in 12,500 for a hole in one). The viewing member is NOT
 * pinned — their plaque is found by its name tone.
 *
 * Grouping is by the STABLE MEMBER ID and never by display name; an event with
 * no id is its own leader, keyed by the event id.
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

function LeaderPlaque({
  leader: l,
  onPress,
}: {
  leader: HonoursLeader;
  onPress?: (event: WireEvent) => void;
}) {
  const { t } = useTranslation('courses');
  const latest = l.events[0];
  const tappable = !!onPress && !!latest?.scoreId;

  return (
    <button
      type="button"
      onClick={tappable ? () => onPress?.(latest) : undefined}
      style={{ ...PLAQUE_SHELL, cursor: tappable ? 'pointer' : 'default' }}
    >
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <HolderAvatar event={l.lead} />
        <span style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span
            style={{
              display: 'block',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: A.INK,
              fontVariantNumeric: 'tabular-nums lining-nums',
              lineHeight: 1,
            }}
          >
            {l.total}
          </span>
          <span style={{ ...LABEL, fontSize: 8.5, color: A.MUTE, display: 'block', marginTop: 3 }}>
            {t('discover.honours.featCount', { count: l.total, defaultValue: 'feats', defaultValue_one: 'feat' })}
          </span>
        </span>
      </span>

      <span
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginTop: 9,
        }}
      >
        {badgesFor(l.events).map((b) => (
          <FeatBadge key={b.kind} kind={b.kind} count={b.count} />
        ))}
      </span>

      <span style={{ ...NAME_STYLE(l.isOwn), display: 'block', marginTop: 6, fontSize: 13.5 }}>
        {l.isOwn ? t('discover.wire.you', 'You') : l.lead.actorName}
      </span>

      <span aria-hidden style={{ marginTop: 'auto', paddingTop: 9 }} />
      <span style={{ display: 'block', borderTop: `1px solid ${GOLD_HAIR}`, paddingTop: 8 }}>
        <span
          style={{
            ...LABEL,
            fontSize: 9,
            color: A.BODY,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t('discover.honours.latestAt', 'Latest {{year}} · {{course}}', {
            year: formatYearNumeric(latest.at),
            course: latest.courseName ?? t('discover.unknownCourse', 'Course'),
          })}
        </span>
      </span>
    </button>
  );
}

/* ────────────────────────── header and the toggle ────────────────────── */

/**
 * §4 — the headline is COMPUTED and each part is its OWN interpolated,
 * independently pluralised string. A zero part is OMITTED. The sentence is
 * never built by concatenating fragments.
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
          padding: '5px 9px',
          borderRadius: 999,
          border: 'none',
          /* SELECTION IS A SOLID FILL, never a dimming of the other side. */
          background: on ? ACH_GOLD_INK : 'transparent',
          color: on ? BADGE_INK : A.MUTE,
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
        border: `1px solid ${GOLD_BORDER}`,
        flexShrink: 0,
      }}
    >
      {seg('recent', t('discover.honours.modeRecent', 'Recent'))}
      {seg('leaders', t('discover.honours.modeLeaders', 'Leaders'))}
    </span>
  );
}

/* ──────────────────────────────── the board ──────────────────────────── */

interface Props {
  events: WireEvent[];
  /** Cap on the page rail — in PLAQUES. The sheet passes them all. */
  limit?: number;
  /** TRUE while the wire read has not settled — the gold shell holds the slot. */
  isPending?: boolean;
  showHeader?: boolean;
  /** 'rail' on Discover, 'grid' in the sheet (§7). Same plaque either way. */
  layout?: 'rail' | 'grid';
  onRowPress?: (event: WireEvent) => void;
  onSeeAll?: () => void;
  /** Controlled mode — the sheet owns the toggle it carries in its own header. */
  mode?: HonoursMode;
  onModeChange?: (m: HonoursMode) => void;
}

export function HonoursBoard({
  events,
  limit,
  isPending = false,
  showHeader = true,
  layout = 'rail',
  onRowPress,
  onSeeAll,
  mode: modeProp,
  onModeChange,
}: Props) {
  const { t } = useTranslation('courses');
  /* §5 — the mode does NOT persist across mounts; the section opens on RECENT. */
  const [modeState, setModeState] = useState<HonoursMode>('recent');
  const mode = modeProp ?? modeState;
  const setMode = onModeChange ?? setModeState;

  const headline = useHonoursHeadline(events);
  const leaders = useMemo(() => groupLeaders(events), [events]);
  const feats = useMemo(() => sortHonours(events), [events]);

  if (isPending) return <HonoursPanelShell />;
  if (events.length === 0) return null;

  /* The rail costs no height as it grows, so the page cap is generous; the
     terminal "See all" card is offered whenever the sheet exists, because the
     rail is not the whole board even when it happens to hold all of it. */
  const featShown = limit ? feats.slice(0, limit) : feats;

  /* §7 — the grid groups RECENT by year. A leader is not a year. */
  const years: { year: string; events: WireEvent[] }[] = [];
  if (layout === 'grid') {
    for (const e of featShown) {
      const y = formatYearNumeric(e.at);
      const last = years[years.length - 1];
      if (last && last.year === y) last.events.push(e);
      else years.push({ year: y, events: [e] });
    }
  }

  const railStyle: React.CSSProperties = {
    display: 'flex',
    gap: PLAQUE_GAP,
    overflowX: 'auto',
    /* §3 — asymmetric gutters: the first plaque shares the heading's left edge,
       the last bleeds off the right so the rail announces that it scrolls. */
    paddingLeft: 14,
    paddingRight: 0,
    paddingBottom: 12,
    scrollPaddingLeft: 14,
    willChange: 'transform',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  };

  const gridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: PLAQUE_GAP,
  };

  return (
    <section>
      <div
        style={{
          ...HONOURS_SHELL,
          padding: layout === 'grid' ? 0 : '0 0 2px',
          background: layout === 'grid' ? 'transparent' : HONOURS_SHELL.background,
          border: layout === 'grid' ? 'none' : HONOURS_SHELL.border,
          boxShadow: layout === 'grid' ? 'none' : HONOURS_SHELL.boxShadow,
          fontFamily: SANS,
        }}
      >
        {showHeader ? (
          <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${GOLD_HAIR}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: ACH_GOLD_INK,
                }}
              >
                {t('discover.honoursTitle', 'The honours board')}
              </div>
              {/* §4/§5 — the toggle takes the old top-right count slot. */}
              <span style={{ marginLeft: 'auto' }}>
                <HonoursModeToggle mode={mode} onChange={setMode} />
              </span>
            </div>

            {/* THE COMPUTED HEADLINE — identical in both modes. */}
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: A.INK,
                marginTop: 6,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {headline}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: A.MUTE, marginTop: 3 }}>
              {mode === 'recent'
                ? t('discover.honours.subRecent', 'In clbhouz history')
                : t('discover.honours.subLeaders', {
                    count: leaders.length,
                    defaultValue: '{{count}} golfers',
                    defaultValue_one: '{{count}} golfer',
                  })}
            </div>
          </div>
        ) : null}

        {layout === 'rail' ? (
          <div style={{ ...railStyle, paddingTop: 12 }}>
            {(mode === 'recent' ? featShown : leaders).map((item) =>
              mode === 'recent' ? (
                <FeatPlaque key={(item as WireEvent).id} event={item as WireEvent} onPress={onRowPress} />
              ) : (
                <LeaderPlaque key={(item as HonoursLeader).key} leader={item as HonoursLeader} onPress={onRowPress} />
              ),
            )}
            {onSeeAll ? (
              <button
                type="button"
                onClick={onSeeAll}
                style={{
                  ...PLAQUE_SHELL,
                  width: 108,
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  background: 'transparent',
                  borderStyle: 'dashed',
                  cursor: 'pointer',
                  ...LABEL,
                  fontSize: 9,
                  color: A.INK,
                }}
              >
                {t('discover.honoursSeeAllPlain', 'See all')}
              </button>
            ) : null}
          </div>
        ) : mode === 'leaders' ? (
          <div style={gridStyle}>
            {leaders.map((l) => (
              <LeaderPlaque key={l.key} leader={l} onPress={onRowPress} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {years.map((y) => (
              <div key={y.year}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: ACH_GOLD_INK,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {y.year}
                  </span>
                  <span
                    style={{
                      ...LABEL,
                      fontSize: 9,
                      color: A.MUTE,
                      marginLeft: 'auto',
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {t('discover.honours.featCountWith', {
                      count: y.events.length,
                      defaultValue: '{{count}} feats',
                      defaultValue_one: '{{count}} feat',
                    })}
                  </span>
                </div>
                <div
                  style={{
                    borderTop: `1px solid ${GOLD_HAIR}`,
                    paddingTop: 12,
                    ...gridStyle,
                  }}
                >
                  {y.events.map((e) => (
                    <FeatPlaque key={e.id} event={e} onPress={onRowPress} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HonoursBoard;

/** Kept for the gold-chrome consumers that read it from here. */
export { ACH_GOLD };
