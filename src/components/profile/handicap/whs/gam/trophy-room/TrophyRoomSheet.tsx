import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Crown, type LucideIcon } from 'lucide-react';
import { GamSheet } from '../../../gam/_shared/GamSheet';
import { GAM } from '../tokens';
import { gamAchievementsBus } from '../events';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useUserTopLegends } from '@/hooks/gam/useUserTopLegends';
import { TrophyCard } from './TrophyCard';
import { TrophyDetailSheet } from './TrophyDetailSheet';
import { normalizeBadge, normalizeLegend, type TrophyItem } from './_shared/normalizeTrophyItem';

interface Props {
  userId: string;
  viewerUserId?: string;
}

type Tab = 'earned' | 'progress' | 'locked';

interface DetailContext {
  items: TrophyItem[];
  index: number;
}

const TAB_LABEL: Record<Tab, string> = {
  earned: 'Earned',
  progress: 'In progress',
  locked: 'Locked',
};

const Eyebrow: React.FC = () => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-100)',
    }}
  >
    <span style={{ color: GAM.AMBER, marginRight: 6 }}>•</span>
    TROPHY ROOM
  </div>
);

const SectionHeader: React.FC<{
  Icon?: LucideIcon | null;
  iconColor?: string;
  label: string;
  count: number;
  amberDot?: boolean;
}> = ({ Icon, iconColor, label, count, amberDot }) => (
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
    {amberDot && <span style={{ color: GAM.AMBER }}>•</span>}
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

export const TrophyRoomSheet: React.FC<Props> = ({ userId, viewerUserId }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('earned');
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
  const inProgressAchievements = useMemo(
    () =>
      achievementItems.filter(
        (a): a is Extract<TrophyItem, { kind: 'achievement' }> =>
          a.kind === 'achievement' && !a.earned && a.currentValue != null && a.currentValue > 0,
      ),
    [achievementItems],
  );
  const lockedAchievements = useMemo(
    () =>
      achievementItems.filter(
        (a): a is Extract<TrophyItem, { kind: 'achievement' }> =>
          a.kind === 'achievement' && !a.earned && (a.currentValue == null || a.currentValue === 0),
      ),
    [achievementItems],
  );

  const allLegends = legendItems;
  const earnedTotal = earnedAchievements.length + allLegends.length;

  const openDetail = useCallback(
    (item: TrophyItem) => {
      if (item.kind === 'achievement') {
        const list =
          tab === 'earned'
            ? earnedAchievements
            : tab === 'progress'
              ? inProgressAchievements
              : lockedAchievements;
        const index = list.findIndex((i) => i.id === item.id);
        setDetailCtx({ items: list, index: Math.max(0, index) });
      } else {
        const index = allLegends.findIndex((i) => i.id === item.id);
        setDetailCtx({ items: allLegends, index: Math.max(0, index) });
      }
    },
    [tab, earnedAchievements, inProgressAchievements, lockedAchievements, allLegends],
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
            padding: '16px 20px 14px',
            borderBottom: '0.5px solid var(--hcp-line)',
            flexShrink: 0,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          <Eyebrow />
          <div
            style={{
              fontSize: 42,
              fontWeight: 200,
              letterSpacing: '-0.045em',
              color: 'var(--hcp-t-100)',
              marginTop: 6,
              lineHeight: 0.95,
              ...GAM.TABULAR,
            }}
          >
            {earnedTotal}
            <span
              style={{
                fontSize: 17,
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
              marginTop: 8,
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
            gap: 4,
            padding: '10px 16px',
            borderBottom: '0.5px solid var(--hcp-line)',
            flexShrink: 0,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          {(['earned', 'progress', 'locked'] as Tab[]).map((key) => {
            const active = tab === key;
            const count =
              key === 'earned'
                ? earnedTotal
                : key === 'progress'
                  ? inProgressAchievements.length
                  : lockedAchievements.length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? `2px solid ${GAM.AMBER}` : '2px solid transparent',
                  color: active ? 'var(--hcp-t-100)' : 'var(--hcp-t-60)',
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  fontFamily: GAM.FONT_GEIST,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {TAB_LABEL[key]}
                <span style={{ ...GAM.TABULAR, fontWeight: 600, color: 'var(--hcp-t-60)' }}>{count}</span>
              </button>
            );
          })}
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
                    aspectRatio: '1 / 1.18',
                    background: 'var(--hcp-line)',
                    borderRadius: 14,
                    animation: 'gamPulse 1.6s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          )}

          {!isLoading && tab === 'earned' && (
            <>
              {earnedAchievements.length > 0 && (
                <>
                  <SectionHeader label="Achievements" count={earnedAchievements.length} amberDot />
                  <Grid items={earnedAchievements} onTap={openDetail} />
                </>
              )}
              {allLegends.length > 0 && (
                <>
                  <SectionHeader Icon={Crown} iconColor={GAM.GOLD} label="Course legends" count={allLegends.length} />
                  <Grid items={allLegends} onTap={openDetail} />
                </>
              )}
              {earnedAchievements.length === 0 && allLegends.length === 0 && (
                <EmptyState message={isFriendView ? 'No trophies earned yet.' : "You haven't earned any trophies yet."} />
              )}
            </>
          )}

          {!isLoading && tab === 'progress' && (
            inProgressAchievements.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <Grid items={inProgressAchievements} onTap={openDetail} />
              </div>
            ) : (
              <EmptyState message="Nothing in progress right now." />
            )
          )}

          {!isLoading && tab === 'locked' && (
            lockedAchievements.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <Grid items={lockedAchievements} onTap={openDetail} />
              </div>
            ) : (
              <EmptyState message="No locked achievements." />
            )
          )}
        </div>
      </GamSheet>

      {detailCtx && (
        <TrophyDetailSheet
          items={detailCtx.items}
          initialIndex={detailCtx.index}
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
