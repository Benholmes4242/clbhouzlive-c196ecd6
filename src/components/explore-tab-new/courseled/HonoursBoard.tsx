import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

import { formatOrdinal, formatYearNumeric } from '@/i18n/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { A, InkAction, LABEL, SANS } from './tokens';
import {
  GOLD_INK,
  GOLD_HAIR,
  HONOURS_SHELL,
  HONOURS_OWN_WASH,
  HONOURS_OWN_RULE,
  BADGE_ACE_BG,
  BADGE_ALBATROSS_BG,
  BADGE_INK,
} from './honoursTokens';
import { HonoursPanel as HonoursPanelShell } from './DiscoverCourseLedSkeleton';

/**
 * Section 6 — THE HONOURS BOARD (light mode; no dark values on this page).
 *
 * Every ace and albatross on the platform, never windowed, dated by YEAR.
 * The only gold-bordered panel on Discover — that is its distinction.
 *
 * BRIEF_HONOURS_BOARD_PLAYER_LED — THE BOARD IS PLAYER-LED AND GROUPED.
 * A group leads with the MEMBER, badged with one badge per distinct feat kind
 * (counted), then lists that member's feats: course, then hole · par · yardage
 * beneath, with the YEAR right-aligned on the course line and MUTED (a year is
 * not an achievement, §0.3). "Hole in one" is never printed as a line — it is
 * the board's subject, so it lives in the badge.
 *
 * GROUPING IS BY THE STABLE MEMBER ID (`userId`) AND NEVER BY DISPLAY NAME.
 * An event with no id is its own group, keyed by the event id, so two unknown
 * holders can never be merged into one person.
 *
 * The viewing member's group is MARKED (solid wash + solid leading rule + the
 * member tone on the name) and NOT MOVED — a board that reorders itself around
 * whoever is looking at it is not an honours board.
 */

export { GOLD_INK, GOLD_HAIR, GOLD_BORDER, HONOURS_WASH, HONOURS_SHELL } from './honoursTokens';

/** §5 — the collapse threshold, named. "More than five", not "five or more". */
export const HONOURS_FEATS_BEFORE_COLLAPSE = 5;

/** The holder, 34x34, canonical squircle with the canonical traced hairline. */
function HolderAvatar({ event: e }: { event: WireEvent }) {
  return (
    <span style={{ flex: '0 0 auto', display: 'block' }}>
      <SquircleAvatar
        size={34}
        src={e.actorAvatar}
        alt={e.actorName}
        userId={e.userId}
        hairlineRing
      />
    </span>
  );
}

export function sortHonours(events: WireEvent[]): WireEvent[] {
  const groupRank = (e: WireEvent) => (e.kind === 'ace' ? 0 : 1);
  return [...events].sort(
    (a, b) =>
      groupRank(a) - groupRank(b) || new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export interface HonoursGroup {
  key: string;
  /** NULL only where the wire carried no member id for the holder. */
  userId: string | null;
  isOwn: boolean;
  lead: WireEvent;
  events: WireEvent[];
  /** Most recent feat in the group, epoch ms — the tiebreak in §4. */
  latest: number;
}

/**
 * §4 — groups order by FEAT COUNT DESCENDING, then MOST RECENT. Feats inside a
 * group order most recent first. The viewing member is NOT pinned.
 */
export function groupHonours(events: WireEvent[]): HonoursGroup[] {
  const byMember = new Map<string, HonoursGroup>();

  for (const e of sortHonours(events)) {
    const key = e.userId ? `u:${e.userId}` : `e:${e.id}`;
    const at = new Date(e.at).getTime();
    const existing = byMember.get(key);
    if (existing) {
      existing.events.push(e);
      existing.latest = Math.max(existing.latest, at);
      existing.isOwn = existing.isOwn || e.isOwn;
    } else {
      byMember.set(key, {
        key,
        userId: e.userId,
        isOwn: e.isOwn,
        lead: e,
        events: [e],
        latest: at,
      });
    }
  }

  const groups = [...byMember.values()];
  for (const g of groups) {
    g.events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }
  return groups.sort((a, b) => b.events.length - a.events.length || b.latest - a.latest);
}

/** §3 — one badge per distinct feat kind, rarest first, counted. */
function badgesFor(events: WireEvent[]) {
  const aces = events.filter((e) => e.kind === 'ace').length;
  const albatrosses = events.length - aces;
  return [
    albatrosses > 0 ? { kind: 'albatross' as const, count: albatrosses } : null,
    aces > 0 ? { kind: 'ace' as const, count: aces } : null,
  ].filter(Boolean) as { kind: 'ace' | 'albatross'; count: number }[];
}

function FeatBadge({ kind, count }: { kind: 'ace' | 'albatross'; count: number }) {
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
      {count > 1
        ? t('discover.honours.badgeCount', '{{label}} ×{{count}}', { label, count })
        : label}
    </span>
  );
}

/** One feat: the course, the year, and the hole detail beneath. */
function FeatLine({
  event: e,
  onPress,
}: {
  event: WireEvent;
  onPress?: (event: WireEvent) => void;
}) {
  const { t } = useTranslation('courses');
  const tappable = !!onPress && !!e.scoreId;

  /**
   * THE HOLE DETAIL — hole, par and yardage, middot joined and BUILT FROM
   * PRESENT PARTS so a null yardage can never leave a dangling middot. The feat
   * name is gone from this line: it is the badge now.
   */
  const detail = [
    e.holeNo != null ? formatOrdinal(e.holeNo) : null,
    e.holeNo != null && e.holePar != null
      ? t('holes.parLabel', 'Par {{par}}', { par: e.holePar })
      : null,
    e.holeNo != null && e.holePar != null && e.holeYards != null
      ? t('holes.yards', '{{yards}} yds', { yards: e.holeYards })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      onClick={
        tappable
          ? (ev) => {
              ev.stopPropagation();
              onPress?.(e);
            }
          : undefined
      }
      style={{
        display: 'block',
        width: '100%',
        padding: 0,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        fontFamily: SANS,
        cursor: tappable ? 'pointer' : 'default',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, height: 16 }}>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            fontWeight: 700,
            color: A.INK,
            letterSpacing: '-0.015em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {e.courseName ?? t('discover.unknownCourse', 'Course')}
        </span>
        {/* A YEAR IS NOT AN ACHIEVEMENT — muted, never gold (§0.3). */}
        <span
          style={{
            ...LABEL,
            fontSize: 9,
            color: A.MUTE,
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {formatYearNumeric(e.at)}
        </span>
      </span>
      {detail ? (
        <span
          style={{
            display: 'block',
            height: 14,
            fontSize: 11.5,
            fontWeight: 600,
            color: A.MUTE,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {detail}
        </span>
      ) : null}
    </button>
  );
}

export function HonoursGroupRow({
  group,
  last,
  onPress,
}: {
  group: HonoursGroup;
  last: boolean;
  onPress?: (event: WireEvent) => void;
}) {
  const { t } = useTranslation('courses');
  const [open, setOpen] = useState(false);

  const collapsible = group.events.length > HONOURS_FEATS_BEFORE_COLLAPSE;
  const shown =
    collapsible && !open
      ? group.events.slice(0, HONOURS_FEATS_BEFORE_COLLAPSE)
      : group.events;
  const hidden = group.events.length - HONOURS_FEATS_BEFORE_COLLAPSE;

  const who = group.isOwn ? t('discover.wire.you', 'You') : group.lead.actorName;

  return (
    <div
      style={{
        padding: group.isOwn ? '8px 14px 8px 11px' : '8px 0',
        margin: group.isOwn ? '0 -14px' : undefined,
        background: group.isOwn ? HONOURS_OWN_WASH : undefined,
        borderLeft: group.isOwn ? `3px solid ${HONOURS_OWN_RULE}` : undefined,
        borderBottom: last ? 'none' : `1px solid ${GOLD_HAIR}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minHeight: 34 }}>
        <HolderAvatar event={group.lead} />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13.5,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: group.isOwn ? HONOURS_OWN_RULE : A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {who}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {badgesFor(group.events).map((b) => (
            <FeatBadge key={b.kind} kind={b.kind} count={b.count} />
          ))}
        </span>
      </div>

      <div
        style={{
          marginTop: 6,
          marginLeft: 45,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {shown.map((e) => (
          <FeatLine key={e.id} event={e} onPress={onPress} />
        ))}
      </div>

      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 6,
            marginLeft: 45,
            padding: 0,
            border: 'none',
            background: 'transparent',
            ...LABEL,
            fontSize: 9,
            color: A.INK,
            cursor: 'pointer',
            fontFamily: SANS,
          }}
        >
          {open
            ? t('discover.honours.showLess', 'Show less')
            : t('discover.honours.more', '{{count}} more', { count: hidden })}
          <ChevronDown
            size={12}
            strokeWidth={2.5}
            aria-hidden
            className="honours-chevron"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 160ms ease',
            }}
          />
        </button>
      ) : null}
    </div>
  );
}

interface Props {
  events: WireEvent[];
  /** Cap on the page panel — in GROUPS, not feats. The sheet passes them all. */
  limit?: number;
  /** TRUE while the wire read has not settled — the gold shell holds the slot. */
  isPending?: boolean;
  showHeader?: boolean;
  onRowPress?: (event: WireEvent) => void;
  onSeeAll?: () => void;
}

export function HonoursBoard({
  events,
  limit = 3,
  isPending = false,
  showHeader = true,
  onRowPress,
  onSeeAll,
}: Props) {
  const { t } = useTranslation('courses');
  if (isPending) return <HonoursPanelShell />;
  if (events.length === 0) return null;

  const groups = groupHonours(events);
  const shown = groups.slice(0, limit);
  const overflow = groups.length > shown.length;

  return (
    <section>
      <style>{`@media (prefers-reduced-motion: reduce){.honours-chevron{transition:none !important}}`}</style>
      <div style={{ ...HONOURS_SHELL, padding: '4px 14px', fontFamily: SANS }}>
        {showHeader ? (
          <div
            style={{
              padding: '14px 0 12px',
              borderBottom: `1px solid ${GOLD_HAIR}`,
            }}
          >
            {/* SECTION GRAMMAR: eyebrow left, sample size right. The COUNT is
                FEATS on the whole board (`events`), never groups and never
                `shown` — and it is stated HERE ONLY (§7). */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: GOLD_INK,
                }}
              >
                {t('discover.honoursTitle', 'The honours board')}
              </div>
              <div
                style={{
                  ...LABEL,
                  fontSize: 9,
                  color: A.MUTE,
                  marginLeft: 'auto',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {t('discover.honoursOnTheBoard', '{{count}} on the board', {
                  count: events.length,
                })}
              </div>
            </div>
            <div
              style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.35, color: A.MUTE, marginTop: 5 }}
            >
              {t(
                'discover.honoursWhatItIs',
                'Every ace and albatross in clbhouz history',
              )}
            </div>
          </div>
        ) : null}

        {shown.map((g, i) => (
          <HonoursGroupRow
            key={g.key}
            group={g}
            last={i === shown.length - 1 && !(overflow && onSeeAll)}
            onPress={onRowPress}
          />
        ))}

        {overflow && onSeeAll ? (
          <div style={{ padding: '11px 0 13px' }}>
            {/* NO COUNT HERE — the board states its count once, in the header. */}
            <InkAction onClick={onSeeAll}>
              {t('discover.honoursSeeAllPlain', 'See all')}
            </InkAction>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default HonoursBoard;
