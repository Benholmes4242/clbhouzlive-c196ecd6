/**
 * Achievements Sheet (Dispatch dialect)
 * ---------------------------------------------------------------
 * Powered by `useUserAchievements` → RPC `get_user_achievements_for_viewer`.
 * Works for self + friend views (RLS-gated).
 *
 * Sections:
 *   1. CLOSEST TO EARNING  — top 3 counter/tiered badges with unreached tiers
 *   2-7. Six categories in order:
 *      handicap → scoring → consistency → courses → seasonal → community
 *
 * Rows expand inline (description + earn context + next milestone).
 * No per-badge breakdown query (deferred post-launch).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { X, Share2, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { GAM, RARITY_PILL, relativeDays } from './tokens';
import { gamAchievementsBus } from './events';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import type { UserBadge, BadgeCategory, BadgeRarity } from '@/lib/gam/types';

interface Props { userId: string; viewerUserId?: string }

// ── Category headers (Dispatch reframing) ────────────────────────
const CATEGORY_ORDER: BadgeCategory[] = [
  'handicap', 'scoring', 'consistency', 'courses', 'seasonal', 'community',
];
const CATEGORY_META: Record<BadgeCategory, { header: string; tagline: string }> = {
  handicap:    { header: 'HANDICAP',         tagline: 'Index milestones and progression' },
  scoring:     { header: 'SCORING',          tagline: 'Low rounds, birdies, sub-par feats' },
  consistency: { header: 'THE LONG GAME',    tagline: 'Streak milestones, freezes used wisely' },
  courses:     { header: 'COURSES',          tagline: 'Variety, exploration, the Top 100 trail' },
  seasonal:    { header: 'OF THIS MOMENT',   tagline: 'Time-bound, situational badges' },
  community:   { header: 'COMMUNITY',        tagline: 'Friends, rivals, shared rounds' },
};

const RARITY_WEIGHT: Record<BadgeRarity, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5,
};

// ── Tier helpers ─────────────────────────────────────────────────
function nextTier(b: UserBadge): { gap: number; threshold: number; tierIndex: number } | null {
  if (b.kind === 'binary' || b.kind === 'streak') return null;
  const tiers = b.counter_tiers ?? [];
  if (tiers.length === 0) return null;
  const value = b.counter_value ?? 0;
  const reached = b.counter_tier ?? 0; // 0 = none reached, 1 = first reached, etc.
  if (reached >= tiers.length) return null;
  const threshold = tiers[reached];
  return { gap: Math.max(0, threshold - value), threshold, tierIndex: reached };
}

// ── Atoms ────────────────────────────────────────────────────────
const RarityPill: React.FC<{ rarity: BadgeRarity }> = ({ rarity }) => {
  const meta = RARITY_PILL[rarity] ?? RARITY_PILL.common;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
      background: meta.bg, color: meta.fg,
    }}>{meta.label}</span>
  );
};

const TierProgress: React.FC<{ value: number; threshold: number; metric: string | null }> = ({ value, threshold, metric }) => {
  const pct = Math.min(100, Math.round((value / Math.max(1, threshold)) * 100));
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        height: 4, borderRadius: 2, background: GAM.INK_06, overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: GAM.AMBER }} />
      </div>
      <div style={{ fontSize: 10, color: GAM.INK_55, marginTop: 4, ...GAM.TABULAR }}>
        {value} / {threshold}{metric ? ` ${metric.replace(/_/g, ' ')}` : ''}
      </div>
    </div>
  );
};

const BadgeRow: React.FC<{
  badge: UserBadge;
  expanded: boolean;
  onToggle: () => void;
}> = ({ badge, expanded, onToggle }) => {
  const isEarned = badge.is_earned;
  const next = nextTier(badge);
  const tiers = badge.counter_tiers ?? [];
  const reached = badge.counter_tier ?? 0;
  const isTiered = tiers.length > 0;

  // Inline secondary text
  const secondary = (() => {
    if (isEarned && badge.earned_at && !isTiered) return `Earned ${relativeDays(badge.earned_at)}`;
    if (isTiered && reached > 0) return `Tier ${reached} of ${tiers.length}${next ? ` · ${next.gap} to go` : ' · max tier'}`;
    if (!isEarned && next) return `${next.gap} to first tier`;
    if (!isEarned) return badge.description;
    return badge.description;
  })();

  return (
    <div style={{ borderBottom: `0.5px solid ${GAM.INK_10}` }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', width: '100%', textAlign: 'left',
          background: 'transparent', cursor: 'pointer',
          opacity: isEarned || next ? 1 : 0.6,
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: isEarned ? GAM.AMBER_14 : GAM.INK_06,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0, filter: isEarned ? 'none' : 'grayscale(1)',
        }}>
          <span aria-hidden>{badge.icon_name ?? '🏅'}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: GAM.INK,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {badge.title}
            </div>
            <RarityPill rarity={badge.rarity} />
          </div>
          <div style={{
            fontSize: 11, color: GAM.INK_55, marginTop: 2, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {secondary}
          </div>
        </div>
        <ChevronDown
          size={16}
          color={GAM.INK_40}
          style={{ flexShrink: 0, transition: 'transform 160ms', transform: expanded ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {expanded && (
        <div style={{ padding: '0 20px 16px 76px' }}>
          <div style={{ fontSize: 12, color: GAM.INK_70, lineHeight: 1.5 }}>
            {badge.description}
          </div>
          {next && (
            <>
              <TierProgress
                value={badge.counter_value ?? 0}
                threshold={next.threshold}
                metric={badge.counter_metric}
              />
              <div style={{ fontSize: 10, color: GAM.AMBER, marginTop: 6, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Next milestone · Tier {next.tierIndex + 1} of {tiers.length}
              </div>
            </>
          )}
          {isEarned && badge.earned_at && (
            <div style={{ fontSize: 10, color: GAM.AMBER, marginTop: 6, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Earned {relativeDays(badge.earned_at)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ header: string; tagline: string; count?: string }> = ({ header, tagline, count }) => (
  <div style={{
    padding: '20px 20px 8px', borderBottom: `0.5px solid ${GAM.INK_10}`,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
  }}>
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: GAM.INK, textTransform: 'uppercase' }}>
        {header}
      </div>
      <div style={{ fontSize: 11, color: GAM.INK_55, marginTop: 2 }}>{tagline}</div>
    </div>
    {count && (
      <div style={{ fontSize: 11, color: GAM.INK_55, ...GAM.TABULAR }}>{count}</div>
    )}
  </div>
);

// ── Main ─────────────────────────────────────────────────────────
const GamAchievementsSheet: React.FC<Props> = ({ userId, viewerUserId }) => {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => gamAchievementsBus.subscribe(() => setOpen(true)), []);

  const { data: badges = [], isLoading } = useUserAchievements(open ? userId : undefined);

  // Sort comparator: display_order ASC, rarity weight DESC, title ASC
  const cmp = (a: UserBadge, b: UserBadge) => {
    const ao = a.display_order ?? 9999;
    const bo = b.display_order ?? 9999;
    if (ao !== bo) return ao - bo;
    const aw = RARITY_WEIGHT[a.rarity] ?? 0;
    const bw = RARITY_WEIGHT[b.rarity] ?? 0;
    if (aw !== bw) return bw - aw;
    return a.title.localeCompare(b.title);
  };

  // Closest to earning: counter/tiered with unreached tiers, sorted by gap fraction
  const closest = useMemo(() => {
    return badges
      .map(b => ({ b, next: nextTier(b) }))
      .filter(x => x.next !== null)
      .map(x => ({
        b: x.b,
        gap: x.next!.gap,
        frac: x.next!.gap / Math.max(1, x.next!.threshold),
      }))
      .sort((a, b) => a.frac - b.frac || a.gap - b.gap)
      .slice(0, 3)
      .map(x => x.b);
  }, [badges]);

  const grouped = useMemo(() => {
    const map = new Map<BadgeCategory, UserBadge[]>();
    badges.forEach(b => {
      const arr = map.get(b.category) ?? [];
      arr.push(b);
      map.set(b.category, arr);
    });
    map.forEach(arr => arr.sort(cmp));
    return map;
  }, [badges]);

  const earnedCount = badges.filter(b => b.is_earned).length;
  const isFriendView = !!viewerUserId && viewerUserId !== userId;

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 max-h-[92dvh] rounded-t-2xl"
        style={{ background: '#FFFFFF', color: GAM.INK, fontFamily: GAM.FONT_GEIST }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: GAM.INK_10 }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 12px', borderBottom: `0.5px solid ${GAM.INK_10}`,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              {isFriendView ? 'Their Achievements' : 'Achievements'}
            </div>
            <div style={{ fontSize: 11, color: GAM.INK_55, marginTop: 2, ...GAM.TABULAR }}>
              {earnedCount} of {badges.length} earned
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {!isFriendView && (
              <button
                type="button"
                aria-label="Share"
                onClick={() => navigator.share?.({ title: 'My achievements' }).catch(() => {})}
                style={{ background: 'transparent', padding: 6 }}
              >
                <Share2 size={18} color={GAM.INK_70} />
              </button>
            )}
            <button
              type="button" aria-label="Close" onClick={() => setOpen(false)}
              style={{ background: 'transparent', padding: 6 }}
            >
              <X size={20} color={GAM.INK_70} />
            </button>
          </div>
        </div>

        {/* Scroll body */}
        <div style={{ overflowY: 'auto', willChange: 'transform' }}>
          {isLoading && (
            <div style={{ padding: 16 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 64, background: GAM.INK_06, borderRadius: 10, marginBottom: 8 }} />
              ))}
            </div>
          )}

          {!isLoading && closest.length > 0 && (
            <>
              <SectionHeader
                header="CLOSEST TO EARNING"
                tagline="Pick up the next milestone"
                count={`${closest.length}`}
              />
              {closest.map(b => (
                <BadgeRow
                  key={`close-${b.badge_id}`}
                  badge={b}
                  expanded={expandedId === `close-${b.badge_id}`}
                  onToggle={() => toggle(`close-${b.badge_id}`)}
                />
              ))}
            </>
          )}

          {!isLoading && CATEGORY_ORDER.map(cat => {
            const list = grouped.get(cat);
            if (!list || list.length === 0) return null;
            const earned = list.filter(b => b.is_earned).length;
            const meta = CATEGORY_META[cat];
            return (
              <React.Fragment key={cat}>
                <SectionHeader
                  header={meta.header}
                  tagline={meta.tagline}
                  count={`${earned} / ${list.length}`}
                />
                {list.map(b => (
                  <BadgeRow
                    key={`${cat}-${b.badge_id}`}
                    badge={b}
                    expanded={expandedId === `${cat}-${b.badge_id}`}
                    onToggle={() => toggle(`${cat}-${b.badge_id}`)}
                  />
                ))}
              </React.Fragment>
            );
          })}

          <div style={{ height: 48 }} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GamAchievementsSheet;
