import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Crown, ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { GamSheet } from '../../../gam/_shared/GamSheet';
import { GAM } from '../tokens';
import { gamAchievementsBus } from '../events';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useUserTopLegends } from '@/hooks/gam/useUserTopLegends';
import { useUserProfile } from '@/hooks/useUserProfile';
import { TrophyCardHybrid } from './TrophyCardHybrid';
import { renderBadgeIcon } from '../badgeIcons';
import { TrophyDetailSheet } from './TrophyDetailSheet';
import { normalizeBadge, normalizeLegend, type TrophyItem } from './_shared/normalizeTrophyItem';
import { isShowpiece, LIFETIME_ORDER } from './_shared/showpieces';
import { medalsOwned } from './_shared/levels';
import { MATERIAL_PALETTES, FORGE_GOLD } from './_shared/rarityPalette';
import { TrophyRoomSpine } from './TrophyRoomSpine';
import { rarityColor } from '@/lib/gam/visuals';
import type { BadgeCategory } from '@/lib/gam/types';

const AMBER = '#F7931E';
const INK = '#F2F4F7';
const DIM = 'rgba(242,244,247,0.55)';
const FAINT = 'rgba(242,244,247,0.38)';
const CARD = '#1B1E27';
const LINE = 'rgba(255,255,255,0.08)';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '148,163,184';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}


const CATEGORY_ORDER: BadgeCategory[] = [
  'scoring',
  'handicap',
  'courses',
  'consistency',
  'community',
  'seasonal',
];

const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  scoring: 'Scoring',
  handicap: 'Handicap',
  consistency: 'Consistency',
  courses: 'Courses',
  community: 'Community',
  seasonal: 'Limited Edition',
};

const COURSES_ORDER: string[] = [
  'rounds_played',
];

function groupAchievementsByCategory(
  items: Extract<TrophyItem, { kind: 'achievement' }>[],
): Record<BadgeCategory, Extract<TrophyItem, { kind: 'achievement' }>[]> {
  const groups: Record<BadgeCategory, Extract<TrophyItem, { kind: 'achievement' }>[]> = {
    scoring: [],
    handicap: [],
    consistency: [],
    courses: [],
    community: [],
    seasonal: [],
  };
  for (const item of items) {
    // Showpieces render in their own Lifetime section, not in catalogue category groups.
    if (isShowpiece(item.badgeId)) continue;
    if (groups[item.category]) {
      groups[item.category].push(item);
    }
  }

  groups.courses.sort((a, b) => {
    const aIdx = COURSES_ORDER.indexOf(a.badgeId);
    const bIdx = COURSES_ORDER.indexOf(b.badgeId);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return groups;
}

function selectLifetime(
  items: Extract<TrophyItem, { kind: 'achievement' }>[],
): Extract<TrophyItem, { kind: 'achievement' }>[] {
  const showpieces = items.filter((a) => isShowpiece(a.badgeId));
  // Material desc (obsidian>diamond>emerald>silver>bronze), then progress-to-next
  // desc, then alpha. Locked (reachedTier 0 && no value) drop to the tail.
  showpieces.sort((a, b) => {
    const aLocked = !a.earned && (a.currentValue ?? 0) === 0;
    const bLocked = !b.earned && (b.currentValue ?? 0) === 0;
    if (aLocked !== bLocked) return aLocked ? 1 : -1;
    const am = a.reachedTier || 0;
    const bm = b.reachedTier || 0;
    if (am !== bm) return bm - am;
    const progFrac = (x: Extract<TrophyItem, { kind: 'achievement' }>) => {
      const total = x.tiers.length;
      if (!total || x.reachedTier >= total) return -1;
      const prev = x.reachedTier > 0 ? x.tiers[x.reachedTier - 1].threshold : 0;
      const next = x.tiers[x.reachedTier].threshold;
      const denom = next - prev;
      if (denom <= 0) return 0;
      return Math.max(0, Math.min(1, ((x.currentValue ?? 0) - prev) / denom));
    };
    const ap = progFrac(a);
    const bp = progFrac(b);
    if (ap !== bp) return bp - ap;
    return a.name.localeCompare(b.name);
  });
  return showpieces;
}

interface Props {
  userId: string;
  viewerUserId?: string;
  ownerFirstName?: string | null;
}

interface DetailContext {
  items: TrophyItem[];
  index: number;
}

const Eyebrow: React.FC<{ ownerFirstName?: string | null; isFriendView?: boolean }> = ({
  ownerFirstName,
  isFriendView,
}) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.55)',
    }}
  >
    {isFriendView && ownerFirstName
      ? `${ownerFirstName.toUpperCase()}'S TROPHY ROOM`
      : 'TROPHY ROOM'}
  </div>
);

const TrophyGroupLabel: React.FC<{
  Icon?: LucideIcon | null;
  iconColor?: string;
  label: string;
  earned: number;
  total: number;
}> = ({ Icon, iconColor, label, earned, total }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 24,
      marginBottom: 12,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.72)',
    }}
  >
    {Icon && <Icon size={12} color={iconColor ?? 'currentColor'} strokeWidth={2.4} />}
    <span>{label}</span>
    <span
      style={{
        marginLeft: 'auto',
        fontSize: 11.5,
        fontWeight: 400,
        letterSpacing: '0.02em',
        textTransform: 'none',
        color: 'rgba(255,255,255,0.45)',
        ...GAM.TABULAR,
      }}
    >
      <b style={{ fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{earned}</b> of{' '}
      <b style={{ fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{total}</b> earned
    </span>
  </div>
);


const Grid: React.FC<{
  items: TrophyItem[];
  onTap: (item: TrophyItem) => void;
  columns?: number;
}> = ({ items, onTap, columns = 3 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
    {items.map((item) => (
      <TrophyCardHybrid key={item.id} item={item} onTap={onTap} />
    ))}
  </div>
);

const CourseLegendsCollapsibleSection: React.FC<{
  items: TrophyItem[];
  onTap: (item: TrophyItem) => void;
}> = ({ items, onTap }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 24,
          marginBottom: 12,
          padding: 0,
          background: 'transparent',
          border: 'none',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.72)',
          fontFamily: GAM.FONT_GEIST,
        }}
        aria-expanded={expanded}
        aria-controls="trophy-course-legends-grid"
      >
        <Crown size={12} color={GAM.GOLD} strokeWidth={2.4} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Course legends
        </span>
        <span style={{ color: 'rgba(255,255,255,0.55)', ...GAM.TABULAR, fontWeight: 700, fontSize: 10, letterSpacing: '0.18em' }}>
          ({items.length})
        </span>
        <ChevronDown
          size={14}
          color="rgba(255,255,255,0.55)"
          strokeWidth={2.4}
          style={{
            marginLeft: 'auto',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 180ms ease',
          }}
        />
      </button>
      {expanded && (
        <div id="trophy-course-legends-grid">
          <Grid items={items} onTap={onTap} />
        </div>
      )}
    </>
  );
};

export const TrophyRoomSheet: React.FC<Props> = ({ userId, viewerUserId, ownerFirstName }) => {
  const [open, setOpen] = useState(false);
  const [detailCtx, setDetailCtx] = useState<DetailContext | null>(null);


  useEffect(() => gamAchievementsBus.subscribe(() => setOpen(true)), []);

  const effectiveViewerId = viewerUserId ?? userId;
  const { data: badges = [], isLoading: badgesLoading } = useUserAchievements(open ? userId : undefined);
  const { data: legends = [], isLoading: legendsLoading } = useUserTopLegends(open ? userId : undefined, {
    limit: 200,
    maxRank: 100,
  });

  const achievementItems = useMemo(() => badges.map(normalizeBadge), [badges]);
  const legendItems = useMemo(() => legends.map(normalizeLegend), [legends]);

  const earnedAchievements = useMemo(
    () =>
      achievementItems.filter(
        (a): a is Extract<TrophyItem, { kind: 'achievement' }> => a.kind === 'achievement' && a.earned,
      ),
    [achievementItems],
  );
  const lockedAchievements = useMemo(
    () =>
      achievementItems.filter(
        (a): a is Extract<TrophyItem, { kind: 'achievement' }> =>
          a.kind === 'achievement' && !a.earned,
      ),
    [achievementItems],
  );
  const allAchievements = useMemo(
    () =>
      achievementItems.filter(
        (a): a is Extract<TrophyItem, { kind: 'achievement' }> => a.kind === 'achievement',
      ),
    [achievementItems],
  );

  const allLegends = legendItems;
  const items = useMemo(() => [...achievementItems, ...legendItems], [achievementItems, legendItems]);

  const badgesEarned = earnedAchievements.length;
  const medals = medalsOwned(items);
  const legendTitles = allLegends.length;
  const total = badgesEarned + legendTitles;

  const openDetail = useCallback(
    (item: TrophyItem) => {
      if (item.kind === 'achievement') {
        const list = allAchievements;
        const index = list.findIndex((i) => i.id === item.id);
        setDetailCtx({ items: list, index: Math.max(0, index) });
      } else {
        const index = allLegends.findIndex((i) => i.id === item.id);
        setDetailCtx({ items: allLegends, index: Math.max(0, index) });
      }
    },
    [allAchievements, allLegends],
  );


  const isLoading = badgesLoading || legendsLoading;
  const isFriendView = viewerUserId !== undefined && viewerUserId !== userId;

  const totalAchievements = allAchievements.length;
  const earnedAchCount = earnedAchievements.length;
  const remaining = Math.max(0, totalAchievements - earnedAchCount);
  const railPct = totalAchievements > 0 ? (earnedAchCount / totalAchievements) * 100 : 0;

  // NEXT UNLOCK — closest-to-unlock achievement with tier progress.
  // Considers ANY not-fully-maxed achievement (locked OR partially-earned
  // tiered), because partially-earned tiered showpieces (first_birdie
  // reached=1/5) live in earnedAchievements, not lockedAchievements — a
  // locked-only filter empties the spotlight even when 12+ cards have
  // visible tier progress.
  const nextUnlock = useMemo(() => {
    type A = Extract<TrophyItem, { kind: 'achievement' }>;
    const withProgress = allAchievements
      .map((item: A) => {
        const totalTiers = item.tiers.length;
        if (totalTiers === 0) return null;
        const reached = item.reachedTier ?? 0;
        if (reached >= totalTiers) return null; // fully maxed
        if (item.currentValue == null || item.currentValue <= 0) return null;
        if (item.nextThreshold == null || item.nextThreshold <= 0) return null;
        const prev = reached > 0 && item.tiers[reached - 1] ? item.tiers[reached - 1].threshold : 0;
        const denom = item.nextThreshold - prev;
        if (denom <= 0) return null;
        const frac = Math.max(0, Math.min(1, (item.currentValue - prev) / denom));
        if (frac <= 0) return null;
        const remainingUnits = item.nextThreshold - item.currentValue;
        return { item, frac, remainingUnits };
      })
      .filter((v): v is { item: A; frac: number; remainingUnits: number } => v !== null);

    withProgress.sort((a, b) => {
      if (b.frac !== a.frac) return b.frac - a.frac;
      if (a.remainingUnits !== b.remainingUnits) return a.remainingUnits - b.remainingUnits;
      return a.item.name.localeCompare(b.item.name);
    });

    return withProgress[0] ?? null;
  }, [allAchievements]);

  // NEXT FORGE — destination material for the spotlight (tier the user is chasing).
  const nextForgeDestTier = nextUnlock
    ? Math.max(1, Math.min(5, (nextUnlock.item.reachedTier || 0) + 1)) as 1 | 2 | 3 | 4 | 5
    : null;
  const nextForgeDestPal = nextForgeDestTier ? MATERIAL_PALETTES[nextForgeDestTier] : null;

  return (
    <>
      <GamSheet open={open} onClose={() => setOpen(false)}>
        {/* Drag handle — pinned */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: LINE }} />
        </div>

        {/* Filter chips retired — sheet always renders everything. */}


        {/* Body — scrolls the header block, spotlight, and category sections. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            willChange: 'transform',
            padding: '0 16px 32px',
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          {/* Header block (was pinned in the previous layout) */}
          <div style={{ padding: '12px 4px 12px', fontFamily: GAM.FONT_GEIST }}>
            <Eyebrow ownerFirstName={ownerFirstName} isFriendView={isFriendView} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: INK,
                  lineHeight: 1,
                  ...GAM.TABULAR,
                }}
              >
                {total}
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                trophies earned
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                marginTop: 10,
                fontSize: 12.5,
                color: 'rgba(255,255,255,0.55)',
                ...GAM.TABULAR,
              }}
            >
              <span>
                <b style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 800 }}>{badgesEarned}</b>{' '}
                badges
              </span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>
                <b style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 800 }}>{medals}</b> medals
              </span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>
                <b style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 800 }}>{legendTitles}</b>{' '}
                legend titles
              </span>
            </div>
          </div>

          <TrophyRoomSpine items={items} />

          {/* NEXT UNLOCK banner — muted three-line stack. */}
          {nextUnlock && (
            <div style={{ padding: '4px 0 12px' }}>
              {(() => {
                const isOneShot = nextUnlock.item.tiers.length === 1;
                const destColor = isOneShot
                  ? (rarityColor[nextUnlock.item.rarity as keyof typeof rarityColor] ?? '#94A3B8')
                  : nextForgeDestPal
                    ? (nextForgeDestTier === 5 ? FORGE_GOLD : nextForgeDestPal.color)
                    : AMBER;
                const destRgb = hexToRgb(destColor);
                const remaining = Math.max(
                  0,
                  (nextUnlock.item.nextThreshold ?? 0) - (nextUnlock.item.currentValue ?? 0),
                );
                const line3Label = isOneShot
                  ? String(nextUnlock.item.rarity).toUpperCase()
                  : (nextForgeDestPal?.material ?? '');
                return (
                  <button
                    type="button"
                    onClick={() => openDetail(nextUnlock.item)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: CARD,
                      border: `1px solid ${LINE}`,
                      borderLeft: `3px solid rgba(${destRgb},0.35)`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: GAM.FONT_GEIST,
                      color: INK,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${LINE}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: DIM,
                        flexShrink: 0,
                      }}
                    >
                      {renderBadgeIcon(nextUnlock.item.iconKey, 16, 'currentColor')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 8.5,
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          color: FAINT,
                          textTransform: 'uppercase',
                        }}
                      >
                        NEXT UNLOCK
                      </div>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: INK,
                          marginTop: 2,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          ...GAM.TABULAR,
                        }}
                      >
                        {nextUnlock.item.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 4,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            background: `rgba(${destRgb},0.55)`,
                            transform: 'rotate(45deg)',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: DIM,
                            ...GAM.TABULAR,
                          }}
                        >
                          {line3Label ? `${line3Label} · ${remaining} to go` : `${remaining} to go`}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          width: '100%',
                          height: 3,
                          borderRadius: 99,
                          background: 'rgba(255,255,255,0.07)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${nextUnlock.frac * 100}%`,
                            height: '100%',
                            background: `rgba(${destRgb},0.55)`,
                            borderRadius: 99,
                          }}
                        />
                      </div>
                    </div>
                    <ChevronRight size={16} color={FAINT} style={{ flexShrink: 0 }} />
                  </button>
                );
              })()}
            </div>
          )}

          {isLoading && (
            <>
              {/* Lifetime skeleton — mirrors 2-up ShowpieceCards. */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 4 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`sk-life-${i}`}
                    style={{
                      minHeight: 148,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 16,
                      animation: 'gamPulse 1.6s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
              {/* Category skeleton — 3-up matches every other section. */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 24 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`sk-cat-${i}`}
                    style={{
                      aspectRatio: '1 / 1.22',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      animation: 'gamPulse 1.6s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            </>
          )}


          {!isLoading && (() => {
            const lifetime = selectLifetime(allAchievements);
            const allGroups = groupAchievementsByCategory(allAchievements);
            const anyAchievements = allAchievements.length > 0;
            const anyLegends = allLegends.length > 0;
            if (!anyAchievements && !anyLegends) {
              return (
                <EmptyState message={isFriendView ? 'No trophies yet.' : "You don't have any trophies yet."} />
              );
            }
            const lifetimeEarned = lifetime.filter((a) => a.earned).length;
            return (
              <>
                {lifetime.length > 0 && (
                  <>
                    <TrophyGroupLabel label="Lifetime" earned={lifetimeEarned} total={lifetime.length} />
                    <Grid items={lifetime} onTap={openDetail} columns={2} />
                  </>
                )}
                {CATEGORY_ORDER.map((cat) => {
                  const items = allGroups[cat];
                  if (!items || items.length === 0) return null;
                  const earnedCount = items.filter((a) => a.earned).length;
                  return (
                    <React.Fragment key={`all-${cat}`}>
                      <TrophyGroupLabel
                        label={CATEGORY_LABEL[cat]}
                        earned={earnedCount}
                        total={items.length}
                      />
                      <Grid items={items} onTap={openDetail} columns={2} />
                    </React.Fragment>
                  );
                })}
                {anyLegends && (
                  <CourseLegendsCollapsibleSection items={allLegends} onTap={openDetail} />
                )}
              </>
            );
          })()}

        </div>
      </GamSheet>

      {detailCtx && (
        <TrophyDetailSheet
          items={detailCtx.items}
          initialIndex={detailCtx.index}
          ownerUserId={userId}
          viewerUserId={effectiveViewerId}
          onClose={() => setDetailCtx(null)}
        />
      )}
    </>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      padding: '40px 16px',
      textAlign: 'center',
      fontSize: 13,
      color: 'rgba(255,255,255,0.55)',
      fontFamily: GAM.FONT_GEIST,
    }}
  >
    {message}
  </div>
);

export default TrophyRoomSheet;
