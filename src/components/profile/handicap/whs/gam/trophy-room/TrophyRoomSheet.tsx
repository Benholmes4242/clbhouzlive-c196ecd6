import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Crown, ChevronDown, type LucideIcon } from 'lucide-react';
import { GamSheet } from '../../../gam/_shared/GamSheet';
import { GAM } from '../tokens';
import { gamAchievementsBus } from '../events';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useUserTopLegends } from '@/hooks/gam/useUserTopLegends';
import { TrophyCard } from './TrophyCard';
import { TrophyDetailSheet } from './TrophyDetailSheet';
import { normalizeBadge, normalizeLegend, type TrophyItem } from './_shared/normalizeTrophyItem';
import { isShowpiece, LIFETIME_ORDER } from './_shared/showpieces';
import type { BadgeCategory } from '@/lib/gam/types';

const CATEGORY_ORDER: BadgeCategory[] = [
  'scoring',
  'handicap',
  'consistency',
  'courses',
  'community',
  'seasonal',
];

const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  scoring: 'Scoring',
  handicap: 'Handicap',
  consistency: 'Consistency',
  courses: 'Courses',
  community: 'Community',
  seasonal: 'Seasonal',
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
  showpieces.sort((a, b) => {
    const aIdx = LIFETIME_ORDER.indexOf(a.badgeId);
    const bIdx = LIFETIME_ORDER.indexOf(b.badgeId);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  return showpieces;
}

interface Props {
  userId: string;
  viewerUserId?: string;
  ownerFirstName?: string | null;
}

type Tab = 'all' | 'earned' | 'locked';

interface DetailContext {
  items: TrophyItem[];
  index: number;
}

const TAB_LABEL: Record<Tab, string> = {
  all: 'All',
  earned: 'Earned',
  locked: 'Locked',
};

const Eyebrow: React.FC<{ ownerFirstName?: string | null; isFriendView?: boolean }> = ({
  ownerFirstName,
  isFriendView,
}) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-100)',
    }}
  >
    {isFriendView && ownerFirstName
      ? `${ownerFirstName.toUpperCase()}'S TROPHY ROOM`
      : 'TROPHY ROOM'}
  </div>
);

const SectionHeader: React.FC<{
  Icon?: LucideIcon | null;
  iconColor?: string;
  label: string;
  count: number;
}> = ({ Icon, iconColor, label, count }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 20,
      marginBottom: 10,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-80)',
    }}
  >
    {Icon && <Icon size={12} color={iconColor ?? 'currentColor'} strokeWidth={2.4} />}
    <span>{label}</span>
    <span style={{ color: 'var(--hcp-t-60)', ...GAM.TABULAR, fontWeight: 700 }}>({count})</span>
  </div>
);

const Grid: React.FC<{ items: TrophyItem[]; onTap: (item: TrophyItem) => void }> = ({ items, onTap }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
    {items.map((item) => (
      <TrophyCard key={item.id} item={item} onTap={onTap} />
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
          marginTop: 20,
          marginBottom: 10,
          padding: 0,
          background: 'transparent',
          border: 'none',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'var(--hcp-t-80)',
          fontFamily: GAM.FONT_GEIST,
        }}
        aria-expanded={expanded}
        aria-controls="trophy-course-legends-grid"
      >
        <Crown size={12} color={GAM.GOLD} strokeWidth={2.4} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Course legends
        </span>
        <span style={{ color: 'var(--hcp-t-60)', ...GAM.TABULAR, fontWeight: 700, fontSize: 10, letterSpacing: '0.18em' }}>
          ({items.length})
        </span>
        <ChevronDown
          size={14}
          color="var(--hcp-t-60)"
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
  const [tab, setTab] = useState<Tab>('all');
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
  const earnedTotal = earnedAchievements.length + allLegends.length;

  const openDetail = useCallback(
    (item: TrophyItem) => {
      if (item.kind === 'achievement') {
        const list =
          tab === 'all'
            ? allAchievements
            : tab === 'earned'
              ? earnedAchievements
              : lockedAchievements;
        const index = list.findIndex((i) => i.id === item.id);
        setDetailCtx({ items: list, index: Math.max(0, index) });
      } else {
        const index = allLegends.findIndex((i) => i.id === item.id);
        setDetailCtx({ items: allLegends, index: Math.max(0, index) });
      }
    },
    [tab, earnedAchievements, allAchievements, lockedAchievements, allLegends],
  );

  const isLoading = badgesLoading || legendsLoading;
  const isFriendView = viewerUserId !== undefined && viewerUserId !== userId;

  return (
    <>
      <GamSheet open={open} onClose={() => setOpen(false)}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hcp-line-2)' }} />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '12px 20px 10px',
            borderBottom: '0.5px solid var(--hcp-line)',
            flexShrink: 0,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          <Eyebrow ownerFirstName={ownerFirstName} isFriendView={isFriendView} />
          <div
            style={{
              fontSize: 34,
              fontWeight: 200,
              letterSpacing: '-0.045em',
              color: 'var(--hcp-t-100)',
              marginTop: 4,
              lineHeight: 0.95,
              ...GAM.TABULAR,
            }}
          >
            {earnedTotal}
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--hcp-t-60)',
                letterSpacing: '0.02em',
                marginLeft: 6,
              }}
            >
              earned
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--hcp-t-60)',
              marginTop: 6,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              ...GAM.TABULAR,
            }}
          >
            <span>
              <span style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
                {earnedAchievements.length}
              </span>{' '}
              {earnedAchievements.length === 1 ? 'achievement' : 'achievements'}
            </span>
            <span style={{ color: 'var(--hcp-t-40)' }} aria-hidden>·</span>
            <span>
              <span style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
                {allLegends.length}
              </span>{' '}
              course {allLegends.length === 1 ? 'legend' : 'legends'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 16px',
            borderBottom: '0.5px solid var(--hcp-line)',
            flexShrink: 0,
            fontFamily: GAM.FONT_GEIST,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="hcp-tab-row"
          role="tablist"
        >
          {(['all', 'earned', 'locked'] as Tab[]).map((key) => {
            const active = tab === key;
            const count =
              key === 'all'
                ? allAchievements.length
                : key === 'earned'
                  ? earnedAchievements.length
                  : lockedAchievements.length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                role="tab"
                aria-selected={active}
                style={{
                  flex: '0 0 auto',
                  height: 32,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: active ? '1px solid var(--hcp-line-3)' : '1px solid transparent',
                  background: active ? 'var(--hcp-bg-3)' : 'transparent',
                  color: active ? 'var(--hcp-t-100)' : 'var(--hcp-t-60)',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                {TAB_LABEL[key]}
                <span
                  style={{
                    ...GAM.TABULAR,
                    fontWeight: 600,
                    fontSize: 12,
                    color: active ? 'var(--hcp-t-100)' : 'var(--hcp-t-60)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
          <style>{`.hcp-tab-row::-webkit-scrollbar { display: none; }`}</style>
        </div>


        {/* Body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            willChange: 'transform',
            padding: '4px 16px 32px',
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          {isLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1 / 1.22',
                    background: 'var(--hcp-line)',
                    borderRadius: 12,
                    animation: 'gamPulse 1.6s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          )}

          {!isLoading && tab === 'earned' && (() => {
            const lifetime = selectLifetime(earnedAchievements);
            const earnedGroups = groupAchievementsByCategory(earnedAchievements);
            const anyEarnedAchievements = earnedAchievements.length > 0;
            const anyLegends = allLegends.length > 0;
            if (!anyEarnedAchievements && !anyLegends) {
              return (
                <EmptyState message={isFriendView ? 'No trophies earned yet.' : "You haven't earned any trophies yet."} />
              );
            }
            return (
              <>
                {lifetime.length > 0 && (
                  <>
                    <SectionHeader label="Lifetime" count={lifetime.length} />
                    <Grid items={lifetime} onTap={openDetail} />
                  </>
                )}
                {CATEGORY_ORDER.map((cat) => {
                  const items = earnedGroups[cat];
                  if (!items || items.length === 0) return null;
                  return (
                    <React.Fragment key={`earned-${cat}`}>
                      <SectionHeader label={CATEGORY_LABEL[cat]} count={items.length} />
                      <Grid items={items} onTap={openDetail} />
                    </React.Fragment>
                  );
                })}
                {anyLegends && (
                  <CourseLegendsCollapsibleSection items={allLegends} onTap={openDetail} />
                )}
              </>
            );
          })()}

          {!isLoading && tab === 'all' && (() => {
            const lifetime = selectLifetime(allAchievements);
            const allGroups = groupAchievementsByCategory(allAchievements);
            const anyAchievements = allAchievements.length > 0;
            const anyLegends = allLegends.length > 0;
            if (!anyAchievements && !anyLegends) {
              return (
                <EmptyState message={isFriendView ? 'No trophies yet.' : "You don't have any trophies yet."} />
              );
            }
            return (
              <>
                {lifetime.length > 0 && (
                  <>
                    <SectionHeader label="Lifetime" count={lifetime.length} />
                    <Grid items={lifetime} onTap={openDetail} />
                  </>
                )}
                {CATEGORY_ORDER.map((cat) => {
                  const items = allGroups[cat];
                  if (!items || items.length === 0) return null;
                  return (
                    <React.Fragment key={`all-${cat}`}>
                      <SectionHeader label={CATEGORY_LABEL[cat]} count={items.length} />
                      <Grid items={items} onTap={openDetail} />
                    </React.Fragment>
                  );
                })}
                {anyLegends && (
                  <CourseLegendsCollapsibleSection items={allLegends} onTap={openDetail} />
                )}
              </>
            );
          })()}

          {!isLoading && tab === 'locked' && (() => {
            const lifetime = selectLifetime(lockedAchievements);
            const lockedGroups = groupAchievementsByCategory(lockedAchievements);
            if (lockedAchievements.length === 0) {
              return <EmptyState message="No locked achievements." />;
            }
            return (
              <>
                {lifetime.length > 0 && (
                  <>
                    <SectionHeader label="Lifetime" count={lifetime.length} />
                    <Grid items={lifetime} onTap={openDetail} />
                  </>
                )}
                {CATEGORY_ORDER.map((cat) => {
                  const items = lockedGroups[cat];
                  if (!items || items.length === 0) return null;
                  return (
                    <React.Fragment key={`locked-${cat}`}>
                      <SectionHeader label={CATEGORY_LABEL[cat]} count={items.length} />
                      <Grid items={items} onTap={openDetail} />
                    </React.Fragment>
                  );
                })}
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
      padding: '40px 20px',
      textAlign: 'center',
      fontSize: 13,
      color: 'var(--hcp-t-60)',
      fontFamily: GAM.FONT_GEIST,
    }}
  >
    {message}
  </div>
);

export default TrophyRoomSheet;
