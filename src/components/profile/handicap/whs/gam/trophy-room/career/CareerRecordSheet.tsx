/**
 * CareerRecordSheet -- the room, rebuilt as a record.
 *
 * Replaces TrophyRoomSheet. What went, and why:
 *   - rarity vocabulary (common/rare/legendary): asserted, not measured. The
 *     measured share from gam_badge_population_share replaces it.
 *   - the metal tier ladder (bronze -> obsidian) and the medal-wall level:
 *     a loot reading of a career. Thresholds are now stated as distances.
 *   - the rank track and gem ladder: same reason.
 *   - full-bleed immersive detail views: replaced by in-sheet detail views
 *     with a back link, so the room keeps ONE scroller and one way out.
 *
 * All population figures obey the denominator floor in shareModel.ts, so on
 * today's population this room shows counts, thresholds, crowns, streaks and
 * milestones with NO share lines. That is expected.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GamSheet } from '../../../../gam/_shared/GamSheet';
import { gamAchievementsBus } from '../../events';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useUserTopLegends } from '@/hooks/gam/useUserTopLegends';
import { useUserStreaks } from '@/hooks/gam/useUserStreaks';
import { useBadgePopulationShare } from '@/hooks/gam/useBadgePopulationShare';
import { useTop100Distribution } from '@/hooks/gam/useTop100Distribution';
import { useGamRecordConfig, RECORD_CONFIG_DEFAULTS } from '@/hooks/gam/useGamRecordConfig';
import { useCareerRounds } from '@/hooks/gam/useCareerRounds';
import { useCourseFieldSizes } from '@/hooks/gam/useCourseFieldSizes';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeBadge, normalizeLegend } from '../_shared/normalizeTrophyItem';
import { isTop100Achievement } from '../_shared/showpieces';
import { REC } from './tokens';
import { Caption } from './Primitives';
import { CareerHeader } from './CareerHeader';
import { CountingStatsPanel } from './panels/CountingStatsPanel';
import { SeasonCutPanel } from './panels/SeasonCutPanel';
import { Top100Panel } from './panels/Top100Panel';
import { CrownsPanel, groupCrowns } from './panels/CrownsPanel';
import { StreaksPanel } from './panels/StreaksPanel';
import { MilestonesPanel } from './panels/MilestonesPanel';
import { CountingStatDetail } from './details/CountingStatDetail';
import { Top100Detail } from './details/Top100Detail';
import { CrownDetail } from './details/CrownDetail';
import { MilestoneDetail } from './details/MilestoneDetail';
import { STREAK_BADGE_IDS, type Achievement, type CareerData, type CareerView } from './types';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface Props {
  userId: string;
  viewerUserId?: string;
  ownerFirstName?: string | null;
}

export const CareerRecordSheet: React.FC<Props> = ({ userId, viewerUserId, ownerFirstName }) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CareerView>({ kind: 'room' });

  useEffect(
    () =>
      gamAchievementsBus.subscribe(() => {
        setView({ kind: 'room' });
        setOpen(true);
      }),
    [],
  );

  const effectiveViewer = viewerUserId ?? userId;
  const isFriendView = viewerUserId !== undefined && viewerUserId !== userId;

  const { data: badges = [], isLoading: badgesLoading } = useUserAchievements(
    open ? userId : undefined,
  );
  const { data: legends = [], isLoading: legendsLoading } = useUserTopLegends(
    open ? userId : undefined,
    { limit: 500, maxRank: 1 },
  );
  const { data: streaks = [] } = useUserStreaks(open ? userId : undefined);
  const { data: rounds = [] } = useCareerRounds(open ? userId : undefined);
  const { data: shares } = useBadgePopulationShare(open);
  const { data: distribution = [] } = useTop100Distribution(open);
  const { data: config } = useGamRecordConfig();

  const achievements = useMemo(
    () =>
      badges
        .map(normalizeBadge)
        .filter((i): i is Achievement => i.kind === 'achievement'),
    [badges],
  );
  const legendItems = useMemo(() => legends.map(normalizeLegend), [legends]);
  const crownGroups = useMemo(
    () =>
      groupCrowns(
        legendItems.filter((i): i is Extract<typeof i, { kind: 'legend' }> => i.kind === 'legend'),
      ),
    [legendItems],
  );
  const { data: fieldSizes } = useCourseFieldSizes(
    open ? crownGroups.map((g) => g.courseId) : [],
  );

  const onOpen = useCallback((next: CareerView) => {
    setView(next);
    if (next.kind !== 'room') {
      analyticsEvents.track('career_record_detail_open', { view: next.kind });
    }
  }, []);

  const data: CareerData = useMemo(
    () => ({
      ownerUserId: userId,
      viewerUserId: effectiveViewer,
      isFriendView,
      ownerFirstName: ownerFirstName ?? null,
      achievements,
      legends: legendItems.filter(
        (i): i is Extract<typeof i, { kind: 'legend' }> => i.kind === 'legend',
      ),
      rounds,
      streaks,
      shares: shares ?? new Map(),
      distribution,
      fieldSizes: fieldSizes ?? new Map(),
      config: config ?? RECORD_CONFIG_DEFAULTS,
      onOpen,
    }),
    [
      userId,
      effectiveViewer,
      isFriendView,
      ownerFirstName,
      achievements,
      legendItems,
      rounds,
      streaks,
      shares,
      distribution,
      fieldSizes,
      config,
      onOpen,
    ],
  );

  const top100 = achievements.filter((a) => isTop100Achievement(a.badgeId));
  const counting = achievements.filter(
    (a) =>
      !isTop100Achievement(a.badgeId) &&
      !STREAK_BADGE_IDS.has(a.badgeId) &&
      a.category !== 'community' &&
      (a.counterMetric !== null || a.tiers.length > 1),
  );
  const milestones = achievements.filter(
    (a) =>
      !isTop100Achievement(a.badgeId) &&
      !STREAK_BADGE_IDS.has(a.badgeId) &&
      a.category !== 'community' &&
      a.counterMetric === null &&
      a.tiers.length <= 1,
  );

  const isLoading = badgesLoading || legendsLoading;
  const back = () => setView({ kind: 'room' });

  /**
   * SPARSE: the typical member, not the edge case. With no crowns, no Top 100
   * progress and no streaks those panels self-hide, and the closing footnote
   * says what appears as they play instead of the measured-share note.
   */
  const sparse =
    crownGroups.length === 0 &&
    top100.every((a) => (a.currentValue ?? 0) === 0) &&
    streaks.every((s) => s.current_count === 0 && s.best_count === 0);

  const detail = (() => {
    if (view.kind === 'counting' || view.kind === 'milestone') {
      const item = achievements.find((a) => a.badgeId === view.badgeId);
      if (!item) return null;
      return view.kind === 'counting' ? (
        <CountingStatDetail data={data} item={item} onBack={back} />
      ) : (
        <MilestoneDetail data={data} item={item} onBack={back} />
      );
    }
    if (view.kind === 'top100') {
      const item = achievements.find((a) => a.badgeId === view.badgeId);
      if (!item) return null;
      return <Top100Detail data={data} item={item} onBack={back} />;
    }
    if (view.kind === 'crown') {
      const group = crownGroups.find((g) => g.key === view.courseKey);
      if (!group) return null;
      return <CrownDetail data={data} group={group} onBack={back} />;
    }
    return null;
  })();

  return (
    <GamSheet
      open={open}
      onClose={() => {
        setOpen(false);
        setView({ kind: 'room' });
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: REC.BORDER }} />
      </div>

      {/* ONE scroller for the room and for every detail view. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          willChange: 'transform',
          padding: '8px 16px 40px',
          fontFamily: REC.FONT,
          background: REC.CANVAS,
        }}
      >
        {detail ?? (
          <>
            <CareerHeader data={data} />
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={`rec-sk-${i}`}
                    variant="dark"
                    style={{ height: 96, borderRadius: 14 }}
                  />
                ))}
              </div>
            ) : achievements.length === 0 && crownGroups.length === 0 ? (
              <Caption>
                {isFriendView
                  ? 'Nothing on the record yet.'
                  : 'Nothing on the record yet. Post a round and it starts here.'}
              </Caption>
            ) : (
              <>
                <SeasonCutPanel rounds={rounds} />
                <CountingStatsPanel data={data} items={counting} sparse={sparse} />
                <Top100Panel data={data} items={top100} />
                <CrownsPanel data={data} groups={crownGroups} />
                <StreaksPanel streaks={streaks} />
                <MilestonesPanel data={data} items={milestones} />
              </>
            )}
          </>
        )}
      </div>
    </GamSheet>
  );
};

export default CareerRecordSheet;
