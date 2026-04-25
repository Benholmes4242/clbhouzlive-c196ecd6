/**
 * Top100JourneyPage — /top100/journey
 *
 * Phase B sub-page focused on milestones, regional progress, and stats.
 * Pulls from useTop100ProgressForUser; opens UnifiedAchievementSheet.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Lock } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { PageRoot } from '@/components/layout/PageRoot';
import { Skeleton } from '@/components/ui/skeleton';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  UnifiedAchievementSheet,
  type AchievementData,
} from '@/components/top100/UnifiedAchievementSheet';
import { CLUB_STEPS } from '@/lib/top100Club';
import { MILESTONE_THEMES } from '@/lib/globalAchievementMilestoneSystem';
import type { Top100ListSlug } from '@/lib/regionTheme';

// Region card visual config — slug → label, color
const REGIONAL_LISTS: { slug: Top100ListSlug; label: string; color: string }[] = [
  { slug: 'global', label: 'Global', color: '#C9A961' },
  { slug: 'gb-i', label: 'Britain & Ireland', color: '#1B4D2E' },
  { slug: 'usa', label: 'USA', color: '#8B3A3A' },
  { slug: 'europe', label: 'Europe', color: '#5B6B7C' },
];

const Top100JourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id ?? null;
  const { data: profile } = useUserProfile(userId);
  const { data, isLoading } = useTop100ProgressForUser(userId);

  const [sheetData, setSheetData] = useState<AchievementData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openMilestone = useCallback(
    (threshold: number) => {
      setSheetData({
        type: 'milestone',
        threshold,
        totalPlayed: data?.totalTop100Played ?? 0,
      });
      setSheetOpen(true);
    },
    [data?.totalTop100Played]
  );

  const openRegional = useCallback(
    (slug: Top100ListSlug, played: number, total: number) => {
      setSheetData({ type: 'regional', listSlug: slug, played, total });
      setSheetOpen(true);
    },
    []
  );

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // Region progress — derive from data.lists by slug
  const regionProgress = useMemo(() => {
    const map = new Map<string, { played: number; total: number }>();
    (data?.lists ?? []).forEach((l) => {
      map.set(l.listSlug, { played: l.played, total: l.total });
    });
    return REGIONAL_LISTS.map((r) => ({
      ...r,
      played: map.get(r.slug)?.played ?? 0,
      total: map.get(r.slug)?.total ?? 100,
    }));
  }, [data?.lists]);

  const totalPlayed = data?.totalTop100Played ?? 0;
  const unlockedCount = CLUB_STEPS.filter((s) => totalPlayed >= s.threshold).length;
  const regionsTouched = regionProgress.filter((r) => r.played > 0).length;

  // ===== Signed-out empty state =====
  if (!userId) {
    return (
      <PageRoot>
        <JourneyHeader onBack={() => navigate(-1)} />
        <div className="px-4 py-20 flex flex-col items-center text-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(247,147,30,0.10)' }}
          >
            <Trophy size={28} color="#F7931E" />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
              Track your Top 100 journey
            </p>
            <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
              Sign in to see your milestones and regional progress.
            </p>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="h-11 px-6 text-sm font-semibold text-white rounded-full active:scale-[0.97] transition-all"
            style={{ background: '#F7931E' }}
          >
            Sign in
          </button>
        </div>
      </PageRoot>
    );
  }

  // ===== Loading skeleton =====
  if (isLoading || !data) {
    return (
      <PageRoot>
        <JourneyHeader onBack={() => navigate(-1)} />
        <div className="px-4 pt-2 pb-10 space-y-6">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageRoot>
    );
  }

  const displayName = profile?.display_name ?? session?.user?.user_metadata?.full_name ?? null;
  const initials =
    displayName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const avatarUrl =
    profile?.profile_photo_url ?? session?.user?.user_metadata?.avatar_url ?? null;

  return (
    <PageRoot>
      <JourneyHeader onBack={() => navigate(-1)} />

      <div className="pb-10">
        {/* ============ Hero ============ */}
        <div className="px-4 pt-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1 }} />
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                color: '#F7931E',
                letterSpacing: '0.16em',
                textTransform: 'uppercase' as const,
              }}
            >
              Your Journey
            </span>
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Milestones & regions
          </h1>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 14px',
              background: '#ffffff',
              border: '1px solid rgba(15,23,42,0.10)',
              borderRadius: 14,
            }}
          >
            <SquircleAvatar
              size={56}
              src={avatarUrl}
              alt={displayName ?? 'You'}
              fallback={initials}
              thinRing
              ringColor="#F7931E"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Total played
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#F7931E',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    fontVariantNumeric: 'tabular-nums' as const,
                  }}
                >
                  {totalPlayed}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>of 100</span>
              </div>
            </div>
          </div>

          {/* 3-col stats grid */}
          <div
            style={{
              marginTop: 10,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            <StatCell label="Milestones" value={`${unlockedCount}/${CLUB_STEPS.length}`} />
            <StatCell label="Regions" value={`${regionsTouched}/${REGIONAL_LISTS.length}`} />
            <StatCell
              label="Next tier"
              value={data.next_milestone ? `${data.next_milestone.remaining}` : '—'}
              suffix={data.next_milestone ? 'to go' : undefined}
            />
          </div>
        </div>

        {/* ============ Milestones grid ============ */}
        <div className="px-4 pt-7">
          <SectionHeader label="Milestones" />
          <div
            style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {CLUB_STEPS.map((step) => {
              const unlocked = totalPlayed >= step.threshold;
              const theme = MILESTONE_THEMES[step.threshold as keyof typeof MILESTONE_THEMES];
              const accent = theme?.accent ?? '#F7931E';
              return (
                <button
                  key={step.tierId}
                  type="button"
                  onClick={() => openMilestone(step.threshold)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    border: '1px solid rgba(15,23,42,0.10)',
                    background: unlocked ? '#ffffff' : 'rgba(15,23,42,0.025)',
                    textAlign: 'left' as const,
                    cursor: 'pointer',
                    position: 'relative' as const,
                    overflow: 'hidden',
                    minHeight: 110,
                  }}
                  className="active:scale-[0.98] transition-transform"
                >
                  {/* Accent bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: unlocked ? accent : 'rgba(15,23,42,0.10)',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: unlocked ? '#0F172A' : '#94A3B8',
                        letterSpacing: '-0.03em',
                        fontVariantNumeric: 'tabular-nums' as const,
                      }}
                    >
                      {step.threshold}
                    </span>
                    {!unlocked && <Lock size={12} color="#94A3B8" strokeWidth={2.2} />}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: unlocked ? '#0F172A' : '#64748B',
                      marginTop: 6,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {step.tierName}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                    {unlocked ? 'Unlocked' : `${step.threshold - totalPlayed} more`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============ Regional progress ============ */}
        <div className="px-4 pt-7">
          <SectionHeader label="Regional progress" />
          <div
            style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {regionProgress.map((r) => {
              const pct = r.total > 0 ? Math.round((r.played / r.total) * 100) : 0;
              return (
                <button
                  key={r.slug}
                  type="button"
                  onClick={() => openRegional(r.slug, r.played, r.total)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    border: '1px solid rgba(15,23,42,0.10)',
                    background: '#ffffff',
                    textAlign: 'left' as const,
                    cursor: 'pointer',
                    minHeight: 124,
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'space-between',
                  }}
                  className="active:scale-[0.98] transition-transform"
                >
                  <div>
                    <div
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: 2,
                        background: r.color,
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#0F172A',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      {r.label}
                    </span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          color: '#0F172A',
                          letterSpacing: '-0.03em',
                          fontVariantNumeric: 'tabular-nums' as const,
                        }}
                      >
                        {r.played}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                        / {r.total}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(15,23,42,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: r.color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <UnifiedAchievementSheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        data={sheetData}
        firstName={displayName?.split(' ')[0]}
      />
    </PageRoot>
  );
};

// ============ Local components ============

const JourneyHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '10px 12px 8px',
      background: '#F8FAFC',
    }}
  >
    <button
      type="button"
      onClick={onBack}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      className="active:scale-[0.94] transition-transform"
      aria-label="Back"
    >
      <ChevronLeft size={22} color="#0F172A" strokeWidth={2.2} />
    </button>
  </div>
);

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1 }} />
    <span
      style={{
        fontSize: 9,
        fontWeight: 900,
        color: '#F7931E',
        letterSpacing: '0.16em',
        textTransform: 'uppercase' as const,
      }}
    >
      {label}
    </span>
  </div>
);

const StatCell: React.FC<{ label: string; value: string; suffix?: string }> = ({
  label,
  value,
  suffix,
}) => (
  <div
    style={{
      padding: '10px 10px',
      borderRadius: 12,
      background: '#ffffff',
      border: '1px solid rgba(15,23,42,0.08)',
    }}
  >
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: '#64748B',
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 4,
        fontSize: 17,
        fontWeight: 900,
        color: '#0F172A',
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums' as const,
      }}
    >
      {value}
      {suffix && (
        <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginLeft: 4 }}>
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export default Top100JourneyPage;
