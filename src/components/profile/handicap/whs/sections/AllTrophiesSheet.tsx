import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  X, Trophy, Crown, Flag, Link2, Target, MapPin, Globe, Hash,
  CheckCircle2, Plane, Users, Lock,
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

const GREEN_DEEP = '#059669';
const GREEN_TINT = 'rgba(5,150,105,0.10)';
const GREEN_SOFT = 'rgba(5,150,105,0.06)';
const BLUE       = '#0EA5E9';
const BLUE_TINT  = 'rgba(14,165,233,0.10)';
const BLUE_SOFT  = 'rgba(14,165,233,0.06)';
const PURPLE     = '#7C3AED';
const PURPLE_TINT= 'rgba(124,58,237,0.10)';
const PURPLE_SOFT= 'rgba(124,58,237,0.06)';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const ICONS: Record<string, React.ComponentType<any>> = {
  Trophy, Crown, Flag, Link2, Target, MapPin, Globe, Hash,
  CheckCircle2, Plane, Users,
};

type CategoryKey = NonNullable<Achievement['category']>;

interface CategoryStyle {
  label: string;
  accent: string;
  accentBg: string;
  accentBgSoft: string;
}

const CATEGORY_STYLE: Record<CategoryKey, CategoryStyle> = {
  handicap:  { label: 'Handicap',         accent: GREEN_DEEP, accentBg: GREEN_TINT,  accentBgSoft: GREEN_SOFT },
  scoring:   { label: 'Scoring & shots',  accent: AMBER,      accentBg: AMBER_14,    accentBgSoft: AMBER_06 },
  courses:   { label: 'Courses & travel', accent: BLUE,       accentBg: BLUE_TINT,   accentBgSoft: BLUE_SOFT },
  community: { label: 'Community',        accent: PURPLE,     accentBg: PURPLE_TINT, accentBgSoft: PURPLE_SOFT },
};

const CATEGORY_ORDER: CategoryKey[] = ['handicap', 'scoring', 'courses', 'community'];

const JUST_EARNED_DAYS = 7;

const isJustEarned = (a: Achievement): boolean => {
  if (a.kind !== 'binary' || !a.earned || !a.achieved_at) return false;
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

interface Props {
  open: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

type FilterValue = 'all' | 'earned' | 'in_progress' | 'locked';

const isEarnedTrophy = (a: Achievement): boolean =>
  (a.kind === 'binary' && a.earned === true) ||
  (a.kind === 'list' && (a.list_played ?? 0) >= (a.list_total ?? 100));

const isInProgressTrophy = (a: Achievement): boolean =>
  a.kind === 'list' &&
  (a.list_played ?? 0) > 0 &&
  (a.list_played ?? 0) < (a.list_total ?? 100);

const isLockedTrophy = (a: Achievement): boolean =>
  (a.kind === 'binary' && a.earned === false) ||
  (a.kind === 'list' && (a.list_played ?? 0) === 0);

const TrophyRow: React.FC<{ a: Achievement }> = ({ a }) => {
  const Icon = ICONS[a.icon_name] ?? Trophy;
  const cat = CATEGORY_STYLE[a.category as CategoryKey] ?? CATEGORY_STYLE.handicap;
  const isCounter = a.kind === 'counter';
  const isList = a.kind === 'list';
  const isBinary = a.kind === 'binary';
  const isEarned = a.earned === true;
  const isLocked = isBinary && !isEarned;
  const justEarned = isBinary && isEarned && isJustEarned(a);
  const listComplete = isList && (a.list_played ?? 0) >= (a.list_total ?? 100);
  const iconLooksLocked = isLocked;

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 12,
        background: justEarned ? cat.accentBgSoft : iconLooksLocked ? 'transparent' : '#fff',
        border: iconLooksLocked
          ? `1px dashed ${INK_10}`
          : justEarned
            ? `1px solid ${cat.accent}`
            : `0.5px solid ${INK_10}`,
        fontFamily: FONT_GEIST,
      }}
    >
      {/* Icon disc */}
      <div
        style={{
          flex: '0 0 44px',
          height: 44,
          borderRadius: 12,
          background: iconLooksLocked ? INK_06 : cat.accentBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color={iconLooksLocked ? INK_40 : cat.accent} strokeWidth={2.2} />
      </div>

      {/* Middle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: iconLooksLocked ? INK_55 : INK,
          letterSpacing: '-0.01em', marginBottom: 6,
        }}>{a.title}</div>

        {isList && (
          <div style={{ marginBottom: 8 }}>
            <div style={{
              height: 4, background: INK_06, borderRadius: 999, overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(100, ((a.list_played ?? 0) / (a.list_total ?? 100)) * 100)}%`,
                height: '100%', background: cat.accent, borderRadius: 999,
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 5, fontSize: 10.5,
              fontVariantNumeric: 'tabular-nums', fontWeight: 600,
              letterSpacing: '-0.01em',
            }}>
              <span style={{ color: INK_55 }}>
                {a.list_played ?? 0} / {a.list_total ?? 100} played
              </span>
              {!listComplete && (
                <span style={{ color: cat.accent, fontWeight: 700 }}>
                  {(a.list_total ?? 100) - (a.list_played ?? 0)} to go
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 6,
          fontSize: 11.5, color: INK_55, fontWeight: 500, lineHeight: 1.4,
        }}>
          {iconLooksLocked && (
            <Lock size={11} color={INK_40} strokeWidth={2.2}
              style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          <span>{a.description}</span>
        </div>
      </div>

      {/* Right column */}
      {isCounter && (
        <div style={{
          textAlign: 'center', fontFamily: FONT_GEIST,
          minWidth: 60, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{
            fontSize: 24, fontWeight: 800, color: INK, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
          }}>{(a.count ?? 0).toLocaleString()}</div>
          {a.count_label && (
            <div style={{
              fontSize: 9, fontWeight: 800, color: INK_55,
              letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 3,
            }}>{a.count_label}</div>
          )}
        </div>
      )}

      {isBinary && isEarned && a.achieved_at && (
        <div style={{
          textAlign: 'center', fontFamily: FONT_GEIST,
          minWidth: 64, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 6,
        }}>
          <div style={{
            fontSize: 10.5, fontWeight: 800, color: INK_40,
            letterSpacing: '0.10em', textTransform: 'uppercase',
          }}>{formatTrophyDate(a.achieved_at)}</div>
          <div style={{ fontSize: 18, lineHeight: 1 }}>🏆</div>
        </div>
      )}

      {isList && listComplete && (
        <div style={{
          textAlign: 'center', fontFamily: FONT_GEIST,
          minWidth: 64, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 4,
        }}>
          <div style={{
            fontSize: 22, fontWeight: 800, color: INK, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
          }}>{a.list_total ?? 100}</div>
          <div style={{
            fontSize: 9, fontWeight: 800, color: INK_55,
            letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 1,
          }}>played</div>
          <div style={{ fontSize: 16, lineHeight: 1, marginTop: 3 }}>🏆</div>
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
    earned: achievements.filter(isEarnedTrophy).length,
    in_progress: achievements.filter(isInProgressTrophy).length,
    locked: achievements.filter(isLockedTrophy).length,
  }), [achievements]);

  const filtered = useMemo(() => {
    if (filter === 'all') return achievements;
    if (filter === 'earned') return achievements.filter(isEarnedTrophy);
    if (filter === 'in_progress') return achievements.filter(isInProgressTrophy);
    if (filter === 'locked') return achievements.filter(isLockedTrophy);
    return achievements;
  }, [achievements, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const a of filtered) {
      const key = a.category ?? 'community';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    // No re-sort — computeAchievements emits hardest-first
    return map;
  }, [filtered]);

  const earnedCount = achievements.filter(isEarnedTrophy).length;
  const earnableCount = achievements.filter((a) => a.kind !== 'counter').length;
  const pct = earnableCount > 0 ? (earnedCount / earnableCount) * 100 : 0;

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
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.45)',
          zIndex: 9998, animation: 'fadeIn 180ms ease-out',
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          maxHeight: '90vh', background: '#FFFFFF',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          animation: 'slideUp 240ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 30px rgba(15,23,42,0.18)',
          fontFamily: FONT_GEIST,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.18)' }} />
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 32, height: 32, borderRadius: 16,
            background: 'rgba(15,23,42,0.06)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 1,
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
            }}>Trophy Cabinet</span>
          </div>
          <h2 style={{
            margin: '0 0 16px', fontSize: 32, fontWeight: 800, color: INK,
            letterSpacing: '-0.025em', lineHeight: 1.1,
          }}>All trophies</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{
              fontSize: 56, fontWeight: 700, color: INK,
              letterSpacing: '-0.04em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>{earnedCount}</span>
            <span style={{ fontSize: 16, color: INK_55, fontWeight: 500 }}>
              of {earnableCount} earned
            </span>
            <span style={{ flex: 1 }} />
            <span style={{
              fontSize: 11, fontWeight: 800, color: AMBER,
              letterSpacing: '0.14em', fontVariantNumeric: 'tabular-nums',
            }}>{Math.round(pct)}%</span>
          </div>
          <div style={{ height: 4, background: INK_06, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: AMBER, borderRadius: 999 }} />
          </div>
        </div>

        {/* Filter chips */}
        <div
          className="all-trophies-hide-scrollbar"
          style={{
            display: 'flex', gap: 6, padding: '14px 20px 14px',
            overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
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
                  borderRadius: 999, padding: '7px 12px',
                  fontSize: 12, fontWeight: 600,
                  fontFamily: FONT_GEIST, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                }}
              >
                {o.label}
                <span style={{
                  background: active ? 'rgba(255,255,255,0.20)' : INK_06,
                  color: active ? '#fff' : INK_55,
                  borderRadius: 999, padding: '1px 6px',
                  fontSize: 10, fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>{counts[o.id]}</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            padding: '0 20px 32px', flex: 1,
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
              const categoryEarned = list.filter(isEarnedTrophy).length;
              const earnableInCategory = list.filter((a) => a.kind !== 'counter').length;
              const allEarned = earnableInCategory > 0 && categoryEarned === earnableInCategory;
              const noneEarned = categoryEarned === 0;
              const countLabel = earnableInCategory === 0
                ? `${list.length} stats`
                : noneEarned
                  ? `${earnableInCategory} to unlock`
                  : `${categoryEarned} / ${earnableInCategory}`;
              const countColor = allEarned ? cat.accent : INK_40;

              return (
                <div key={catKey} style={{ marginTop: 18 }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.accent }} />
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, color: INK_70,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                      }}>{cat.label}</span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: countColor,
                      fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
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
