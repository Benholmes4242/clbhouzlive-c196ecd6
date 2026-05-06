import React, { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
  X, Trophy, Flame, TrendingDown, Award, Map as MapIcon, Calendar, Star, Crown,
  Flag, Link2, Target, MapPin, BarChart3, CheckCircle2, Activity, Lock,
} from 'lucide-react';
import type { Achievement } from '@/lib/whs/types';

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const GOLD = '#D97706';

const ICONS: Record<string, React.ComponentType<any>> = {
  Trophy, Flame, TrendingDown, Award, Map: MapIcon, Calendar, Star,
  Flag, Link2, Target, MapPin, BarChart3, CheckCircle2, Activity,
};

const CATEGORY_ORDER: Array<{
  key: NonNullable<Achievement['category']>;
  label: string;
}> = [
  { key: 'round_quality', label: 'Round quality' },
  { key: 'volume', label: 'Volume' },
  { key: 'improvement', label: 'Improvement' },
  { key: 'course', label: 'Course' },
  { key: 'milestone', label: 'Milestone' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

const TrophyRow: React.FC<{ a: Achievement }> = ({ a }) => {
  const Icon = ICONS[a.icon_name] ?? Star;
  const isHighlight = a.highlight && a.earned;
  const isLocked = !a.earned;
  const isTiered = a.tier != null && a.totalTiers != null && a.totalTiers > 1;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '14px 12px',
        borderRadius: 12,
        background: isHighlight
          ? 'linear-gradient(135deg, rgba(247,147,30,0.10) 0%, rgba(247,147,30,0.02) 100%)'
          : isLocked
          ? 'rgba(15,23,42,0.025)'
          : '#FAFAF7',
        border: isHighlight
          ? `1.5px solid rgba(247,147,30,0.45)`
          : isLocked
          ? `1px dashed rgba(15,23,42,0.18)`
          : `1px solid ${INK_10}`,
        opacity: isLocked ? 0.92 : 1,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          flex: '0 0 40px',
          height: 40,
          borderRadius: 10,
          background: isHighlight
            ? 'rgba(247,147,30,0.14)'
            : isLocked
            ? 'rgba(15,23,42,0.05)'
            : 'rgba(15,23,42,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLocked ? (
          <Lock size={18} color="#94A3B8" strokeWidth={2} />
        ) : (
          <Icon size={20} color={isHighlight ? AMBER : '#64748B'} strokeWidth={2} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: isLocked ? INK_55 : INK,
              letterSpacing: '-0.01em',
            }}
          >
            {a.title}
          </span>
          {isHighlight && <Crown size={12} color={GOLD} fill={GOLD} strokeWidth={2} />}
          {isTiered && a.earned && !isHighlight && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: AMBER_DEEP,
                background: 'rgba(247,147,30,0.10)',
                padding: '2px 6px',
                borderRadius: 4,
                letterSpacing: '0.06em',
              }}
            >
              TIER {a.tier} / {a.totalTiers}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isLocked ? INK_40 : '#64748B',
            marginTop: 2,
            lineHeight: 1.35,
          }}
        >
          {a.subtitle}
        </div>

        {(isTiered || isLocked) && a.progress != null && (
          <>
            <div
              style={{
                marginTop: 8,
                height: 4,
                borderRadius: 2,
                background: INK_06,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.round((a.progress ?? 0) * 100)}%`,
                  background: isLocked ? 'rgba(247,147,30,0.55)' : AMBER,
                  borderRadius: 2,
                }}
              />
            </div>
            {a.progressLabel && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: isLocked ? 'rgba(15,23,42,0.45)' : '#64748B',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {a.progressLabel}
              </div>
            )}
          </>
        )}
      </div>

      {a.earned && !isTiered && a.achieved_at && (
        <div
          style={{
            flex: '0 0 auto',
            fontSize: 10,
            fontWeight: 700,
            color: '#94A3B8',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {format(new Date(a.achieved_at), 'd MMM yyyy').toUpperCase()}
        </div>
      )}
    </div>
  );
};

export const AllTrophiesSheet: React.FC<Props> = ({ open, onClose, achievements }) => {
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

  const grouped = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const a of achievements) {
      const key = a.category ?? 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.earned !== b.earned) return a.earned ? -1 : 1;
        if (a.earned && b.earned) {
          if (a.highlight !== b.highlight) return a.highlight ? -1 : 1;
          const aDate = a.achieved_at ? new Date(a.achieved_at).getTime() : 0;
          const bDate = b.achieved_at ? new Date(b.achieved_at).getTime() : 0;
          return bDate - aDate;
        }
        return (b.progress ?? 0) - (a.progress ?? 0);
      });
    }
    return map;
  }, [achievements]);

  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalCount = achievements.length;

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
          }}
        >
          <X size={16} color={INK} strokeWidth={2.5} />
        </button>

        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${INK_06}` }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: AMBER,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Trophy Cabinet
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: INK,
              margin: '4px 0 4px',
              letterSpacing: '-0.02em',
            }}
          >
            All trophies
          </h2>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: INK_55,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {earnedCount}
            {' of '}
            {totalCount}
            {' earned'}
          </div>
        </div>

        <div
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '8px 20px 32px',
            flex: 1,
          }}
        >
          {CATEGORY_ORDER.map((cat) => {
            const list = grouped.get(cat.key);
            if (!list || list.length === 0) return null;
            const categoryEarned = list.filter((a) => a.earned).length;
            return (
              <div key={cat.key} style={{ marginTop: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: INK,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {cat.label}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: INK_55,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {categoryEarned} / {list.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {list.map((a) => (
                    <TrophyRow key={a.id} a={a} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
};

export default AllTrophiesSheet;
