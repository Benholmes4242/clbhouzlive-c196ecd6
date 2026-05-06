import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  X, Trophy, Flame, TrendingDown, Award, Map as MapIcon, Calendar, Star, Crown,
  Flag, Link2, Target, MapPin, BarChart3, CheckCircle2, Activity,
  Zap, Users, UserCheck, Swords, Plane,
} from 'lucide-react';
import type { Achievement } from '@/lib/whs/types';

const AMBER     = '#F7931E';
const AMBER_06  = 'rgba(247,147,30,0.06)';
const AMBER_14  = 'rgba(247,147,30,0.14)';
const INK       = '#0F172A';
const INK_70    = '#475569';
const INK_55    = 'rgba(15,23,42,0.55)';
const INK_40    = 'rgba(15,23,42,0.40)';
const INK_10    = 'rgba(15,23,42,0.10)';
const INK_06    = 'rgba(15,23,42,0.06)';
const INK_04    = 'rgba(15,23,42,0.04)';
const GREEN     = '#059669';
const GREEN_06  = 'rgba(5,150,105,0.06)';
const GREEN_14  = 'rgba(5,150,105,0.14)';
const RED       = '#9F1239';
const RED_06    = 'rgba(159,18,57,0.06)';
const RED_14    = 'rgba(159,18,57,0.14)';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const ICONS: Record<string, React.ComponentType<any>> = {
  Trophy, Flame, TrendingDown, Award, Map: MapIcon, Calendar, Star,
  Flag, Link2, Target, MapPin, BarChart3, CheckCircle2, Activity,
  Zap, Users, UserCheck, Swords, Plane, Crown,
};

type CategoryKey = NonNullable<Achievement['category']>;

interface CategoryStyle {
  label: string;
  accent: string;
  accentBg: string;
  accentBgSoft: string;
}

const CATEGORY_STYLE: Record<CategoryKey, CategoryStyle> = {
  round_quality: { label: 'Round quality', accent: AMBER,  accentBg: AMBER_14, accentBgSoft: AMBER_06 },
  volume:        { label: 'Volume',        accent: GREEN,  accentBg: GREEN_14, accentBgSoft: GREEN_06 },
  improvement:   { label: 'Improvement',   accent: RED,    accentBg: RED_14,   accentBgSoft: RED_06 },
  course:        { label: 'Course',        accent: INK_70, accentBg: INK_06,   accentBgSoft: INK_04 },
  social:        { label: 'Social',        accent: INK_70, accentBg: INK_06,   accentBgSoft: INK_04 },
  milestone:     { label: 'Milestone',     accent: INK_70, accentBg: INK_06,   accentBgSoft: INK_04 },
};

const CATEGORY_ORDER: CategoryKey[] = [
  'round_quality', 'volume', 'improvement', 'course', 'social', 'milestone',
];

const JUST_EARNED_DAYS = 7;

const isJustEarned = (a: Achievement): boolean => {
  if (!a.earned || !a.achieved_at) return false;
  const days = (Date.now() - new Date(a.achieved_at).getTime()) / 86_400_000;
  return days >= 0 && days < JUST_EARNED_DAYS;
};

const formatTrophyDate = (iso: string, now: Date = new Date()): string => {
  const d = new Date(iso);
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days === 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  if (days < 7) return `${days} DAYS AGO`;
  if (days < 14) return 'LAST WEEK';
  if (days < 30) return `${Math.floor(days / 7)} WEEKS AGO`;
  return format(d, 'd MMM yyyy').toUpperCase();
};

const computeNextRewardText = (a: Achievement): string | null => {
  if (a.progress == null || a.progressLabel == null) return null;
  const m = /^(?:Top\s)?([\d.]+)\s*\/\s*([\d.]+)/.exec(a.progressLabel);
  if (!m) return null;
  const current = parseFloat(m[1]);
  const target = parseFloat(m[2]);
  if (!Number.isFinite(current) || !Number.isFinite(target)) return null;
  const remaining = target - current;
  if (remaining <= 0) return null;
  const remainingStr = Number.isInteger(remaining)
    ? remaining.toString()
    : remaining.toFixed(1);
  if (a.earned && a.tier != null && a.totalTiers != null && a.tier < a.totalTiers) {
    return `${remainingStr} more for tier ${a.tier + 1}`;
  }
  return `${remainingStr} more to unlock`;
};

interface Props {
  open: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

type FilterValue = 'all' | 'earned' | 'in_progress' | 'locked';

const TrophyRow: React.FC<{ a: Achievement }> = ({ a }) => {
  const Icon = ICONS[a.icon_name] ?? Star;
  const isLocked = !a.earned;
  const isTiered = a.tier != null && a.totalTiers != null && a.totalTiers > 1;
  const isMaxTier = isTiered && a.earned && a.tier === a.totalTiers;
  const justEarned = isJustEarned(a);
  const cat = CATEGORY_STYLE[a.category as CategoryKey] ?? CATEGORY_STYLE.milestone;

  const showsProgressBar =
    (isTiered && a.earned && !isMaxTier) ||
    (isLocked && a.progress != null);
  const nextRewardText = computeNextRewardText(a);

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 14,
        background: justEarned ? cat.accentBgSoft : '#fff',
        border: isLocked
          ? `1px dashed ${INK_10}`
          : `0.5px solid ${justEarned ? cat.accentBg : INK_10}`,
        fontFamily: FONT_GEIST,
      }}
    >
      <div
        style={{
          flex: '0 0 44px',
          height: 44,
          borderRadius: 12,
          background: isLocked ? INK_06 : cat.accentBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color={isLocked ? INK_40 : cat.accent} strokeWidth={2.2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          flexWrap: 'wrap',
          marginBottom: a.subtitle ? 3 : 0,
        }}>
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: isLocked ? INK_55 : INK,
            letterSpacing: '-0.01em',
          }}>{a.title}</span>
          {isMaxTier && (
            <span style={{
              background: AMBER_14, color: AMBER,
              borderRadius: 999, padding: '2px 7px',
              fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em',
            }}>MAX</span>
          )}
          {isTiered && a.earned && !isMaxTier && (
            <span style={{
              background: INK_06, color: INK_55,
              borderRadius: 999, padding: '2px 7px',
              fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em',
              fontVariantNumeric: 'tabular-nums',
            }}>TIER {a.tier} / {a.totalTiers}</span>
          )}
          {justEarned && (
            <span style={{
              background: cat.accent, color: '#fff',
              borderRadius: 999, padding: '2px 7px',
              fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em',
            }}>JUST EARNED</span>
          )}
        </div>

        {a.subtitle && (
          <div style={{
            fontSize: 12.5, color: INK_55,
            marginBottom: showsProgressBar ? 10 : 0,
          }}>{a.subtitle}</div>
        )}

        {showsProgressBar && (
          <div style={{ marginTop: a.subtitle ? 0 : 6 }}>
            <div style={{
              height: 3, background: INK_06, borderRadius: 999,
              overflow: 'hidden', marginBottom: 6,
            }}>
              <div style={{
                width: `${(a.progress ?? 0) * 100}%`,
                height: '100%',
                background: isLocked ? INK_40 : cat.accent,
                borderRadius: 999,
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              gap: 8,
            }}>
              <span style={{
                fontSize: 11, color: INK_55, fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}>{a.progressLabel ?? ''}</span>
              {nextRewardText && (
                <span style={{
                  fontSize: 11, color: cat.accent, fontWeight: 700,
                }}>{nextRewardText}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {a.earned && !showsProgressBar && a.achieved_at && (
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: INK_40,
          letterSpacing: '0.12em',
          textAlign: 'right',
          flexShrink: 0,
          marginTop: 4,
          maxWidth: 90,
        }}>
          {formatTrophyDate(a.achieved_at)}
        </div>
      )}
    </div>
  );
};

export const AllTrophiesSheet: React.FC<Props> = ({ open, onClose, achievements }) => {
  const [filter, setFilter] = useState<FilterValue>('all');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const counts = useMemo(() => ({
    all: achievements.length,
    earned: achievements.filter((a) => a.earned).length,
    in_progress: achievements.filter((a) => !a.earned && (a.progress ?? 0) > 0).length,
    locked: achievements.filter((a) => !a.earned && (a.progress ?? 0) === 0).length,
  }), [achievements]);

  const filtered = useMemo(() => {
    if (filter === 'all') return achievements;
    if (filter === 'earned') return achievements.filter((a) => a.earned);
    if (filter === 'in_progress') return achievements.filter((a) => !a.earned && (a.progress ?? 0) > 0);
    if (filter === 'locked') return achievements.filter((a) => !a.earned && (a.progress ?? 0) === 0);
    return achievements;
  }, [achievements, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const a of filtered) {
      const key = a.category ?? 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.earned !== b.earned) return a.earned ? -1 : 1;
        if (a.earned && b.earned) {
          const aDate = a.achieved_at ? new Date(a.achieved_at).getTime() : 0;
          const bDate = b.achieved_at ? new Date(b.achieved_at).getTime() : 0;
          return bDate - aDate;
        }
        return (b.progress ?? 0) - (a.progress ?? 0);
      });
    }
    return map;
  }, [filtered]);

  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalCount = achievements.length;
  const pct = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  const filterOpts: Array<{ id: FilterValue; label: string }> = [
    { id: 'all',         label: 'All' },
    { id: 'earned',      label: 'Earned' },
    { id: 'in_progress', label: 'In progress' },
    { id: 'locked',      label: 'Locked' },
  ];

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.45)',
          zIndex: 9998,
          animation: 'fadeIn 180ms ease-out',
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 240ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 30px rgba(15,23,42,0.18)',
          fontFamily: FONT_GEIST,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'rgba(15,23,42,0.18)',
            }}
          />
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 16,
            background: 'rgba(15,23,42,0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <X size={16} color={INK} strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div style={{ padding: '20px 20px 24px', borderBottom: `1px solid ${INK_06}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }} />
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: INK_70,
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>
              Trophy Cabinet
            </span>
          </div>
          <h2 style={{
            margin: '0 0 16px',
            fontSize: 32, fontWeight: 800, color: INK,
            letterSpacing: '-0.025em', lineHeight: 1.1,
          }}>
            All trophies
          </h2>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12,
          }}>
            <span style={{
              fontSize: 56, fontWeight: 700, color: INK,
              letterSpacing: '-0.04em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>{earnedCount}</span>
            <span style={{ fontSize: 16, color: INK_55, fontWeight: 500 }}>
              of {totalCount} earned
            </span>
            <span style={{ flex: 1 }} />
            <span style={{
              fontSize: 11, fontWeight: 800, color: AMBER,
              letterSpacing: '0.14em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.round(pct)}%
            </span>
          </div>
          <div style={{
            height: 4, background: INK_06, borderRadius: 999, overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`,
              height: '100%', background: AMBER, borderRadius: 999,
            }} />
          </div>
        </div>

        {/* Filter chips */}
        <div
          className="all-trophies-hide-scrollbar"
          style={{
            display: 'flex', gap: 6, padding: '14px 20px 14px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            flexShrink: 0,
          }}
        >
          {filterOpts.map((o) => {
            const active = filter === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setFilter(o.id)}
                style={{
                  background: active ? INK : '#fff',
                  color: active ? '#fff' : INK_70,
                  border: `0.5px solid ${active ? INK : INK_10}`,
                  borderRadius: 999,
                  padding: '7px 12px',
                  fontSize: 12, fontWeight: 600,
                  fontFamily: FONT_GEIST,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  flexShrink: 0,
                }}
              >
                {o.label}
                <span style={{
                  background: active ? 'rgba(255,255,255,0.20)' : INK_06,
                  color: active ? '#fff' : INK_55,
                  borderRadius: 999,
                  padding: '1px 6px',
                  fontSize: 10, fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>{counts[o.id]}</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '0 20px 32px',
            flex: 1,
          }}
        >
          {filtered.length === 0 ? (
            <div style={{
              padding: '60px 20px', textAlign: 'center',
              color: INK_55, fontSize: 14, fontFamily: FONT_GEIST,
            }}>
              No trophies match this filter.
            </div>
          ) : (
            CATEGORY_ORDER.map((catKey) => {
              const list = grouped.get(catKey);
              if (!list || list.length === 0) return null;
              const cat = CATEGORY_STYLE[catKey];
              const categoryEarned = list.filter((a) => a.earned).length;
              const totalInCategory = list.length;
              const allEarned = categoryEarned === totalInCategory;
              const noneEarned = categoryEarned === 0;
              const countLabel = noneEarned
                ? `${totalInCategory} to unlock`
                : `${categoryEarned} / ${totalInCategory}`;
              const countColor = allEarned ? cat.accent : INK_40;

              return (
                <div key={catKey} style={{ marginTop: 18 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: cat.accent,
                      }} />
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, color: INK_70,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                      }}>
                        {cat.label}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: countColor,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '0.04em',
                    }}>{countLabel}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {list.map((a) => (
                      <TrophyRow key={a.id} a={a} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .all-trophies-hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
};

export default AllTrophiesSheet;
