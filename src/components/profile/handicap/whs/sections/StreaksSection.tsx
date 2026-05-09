import React, { useEffect, useRef } from 'react';

import { ChevronRight, Flame, Shield, Trophy, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import SectionHeader from './SectionHeader';
import { useStreaks, type StreakResult, type StreaksData } from '@/lib/whs/useStreaks';
import { analyticsEvents } from '@/utils/analyticsEvents';

const AMBER = '#F7931E';
const AMBER_14 = 'rgba(247,147,30,0.14)';
const GOLD = '#FBBC2E';
const AMBER_GOLD_GRADIENT = `linear-gradient(90deg, ${AMBER} 0%, ${GOLD} 100%)`;
const INK = '#0F172A';
const INK_70 = '#475569';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const GREEN = '#059669';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  connectionId: string;
  userId: string;
}


const BestCaption: React.FC<{ streak: StreakResult }> = ({ streak }) => {
  if (streak.bestEndedAt == null && streak.isActive && streak.best > 0) {
    return (
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: GREEN,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <span style={{ fontSize: 14 }}>↑</span>
        Personal best — keep going
      </span>
    );
  }
  if (streak.best === 0) return null;
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: INK_55,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <span style={{ fontSize: 14, color: GREEN }}>↑</span>
      Personal best · {streak.best}
    </span>
  );
};

const Timeline: React.FC<{ timeline: StreaksData['timeline'] }> = ({ timeline }) => {
  const slots = [
    ...Array(Math.max(0, 12 - timeline.length)).fill(null),
    ...timeline,
  ];
  const activeCount = slots.filter((s) => s != null && !s.isUp).length;
  const fillPct = (activeCount / 12) * 100;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 3,
          height: 36,
          alignItems: 'flex-end',
        }}
      >
        {slots.map((slot, i) => {
          const isFaded = i < 4;
          if (slot == null) {
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '40%',
                  background: INK_06,
                  borderRadius: 3,
                }}
              />
            );
          }
          const isUp = slot.isUp;
          const activeBg = isFaded ? 'rgba(247,147,30,0.18)' : AMBER_GOLD_GRADIENT;
          return (
            <div
              key={slot.id}
              style={{
                flex: 1,
                height: isUp ? '40%' : '100%',
                background: isUp ? INK_10 : activeBg,
                borderRadius: 3,
                boxShadow:
                  !isUp && !isFaded
                    ? `inset 0 0 0 1px rgba(247,147,30,0.4), 0 0 8px rgba(247,147,30,0.30)`
                    : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Continuation gradient line under the bar */}
      <div style={{ marginTop: 6, width: '100%', display: 'flex' }}>
        <div
          style={{
            marginLeft: 'auto',
            width: `${fillPct}%`,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${AMBER}, ${GOLD})`,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 9.5,
          fontWeight: 700,
          color: INK_40,
          letterSpacing: '0.14em',
        }}
      >
        <span>12 ROUNDS AGO</span>
        <span>NOW</span>
      </div>
    </div>
  );
};

const SecondaryStreakTile: React.FC<{
  Icon: React.ComponentType<any>;
  label: string;
  value: number;
  bestText: string;
  accent: string;
}> = ({ Icon, label, value, bestText, accent }) => {
  const tintBg = accent === INK_70 ? INK_06 : `${accent}1F`;
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        background: '#fff',
        border: `0.5px solid ${INK_10}`,
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: FONT_GEIST,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: tintBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={accent} strokeWidth={2.2} />
      </div>
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: INK_55,
            letterSpacing: '0.16em',
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          <span style={{ fontSize: 13, color: INK_55, fontWeight: 500 }}>rounds</span>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: INK_55, marginTop: 'auto' }}>{bestText}</div>
    </div>
  );
};

interface StreakCardProps {
  streak: StreakResult;
  label: string;
  sub: string;
  color: string;
  colorTint: string;
  icon: 'flame' | 'trending-down' | 'shield';
}

const StreakCard: React.FC<StreakCardProps> = ({
  streak, label, sub, color, colorTint, icon,
}) => {
  const isPb = streak.current > 0 && streak.current === streak.best;
  const remaining = Math.max(0, streak.best - streak.current);
  const fillPct = streak.best > 0
    ? Math.min(100, (streak.current / streak.best) * 100)
    : 0;
  const isActive = streak.isActive;

  const renderIcon = () => {
    const iconColor = isActive ? color : INK_40;
    const fill = isActive && icon === 'flame' ? color : 'none';
    if (icon === 'flame') {
      return <Flame size={16} color={iconColor} strokeWidth={2.4} fill={fill} />;
    }
    if (icon === 'trending-down') {
      return <TrendingDown size={16} color={iconColor} strokeWidth={2.4} />;
    }
    return <Shield size={16} color={iconColor} strokeWidth={2.4} />;
  };

  return (
    <div
      style={{
        flexShrink: 0,
        width: 240,
        background: '#fff',
        borderRadius: 18,
        border: `0.5px solid ${INK_10}`,
        padding: '16px 14px 14px',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        fontFamily: FONT_GEIST,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: isActive ? colorTint : INK_06,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderIcon()}
        </div>
        <span
          style={{
            padding: '3px 9px',
            borderRadius: 99,
            background: isActive ? color : INK_10,
            color: isActive ? '#fff' : INK_55,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.10em',
          }}
        >
          {isActive ? 'ACTIVE' : 'DORMANT'}
        </span>
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: INK_55,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11,
          color: INK_40,
          fontWeight: 500,
          lineHeight: 1.35,
          marginBottom: 16,
          minHeight: 30,
        }}
      >
        {sub}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 5,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: INK,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {streak.current}
        </span>
        <span style={{ fontSize: 14, color: INK_55, fontWeight: 600 }}>
          rounds
        </span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            height: 6,
            background: INK_06,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${fillPct}%`,
              background: color,
              borderRadius: 3,
              transition: 'width 320ms ease',
            }}
          />
        </div>
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            fontWeight: 700,
            color: INK_40,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.04em',
          }}
        >
          <span>{streak.current}</span>
          <span style={{ color: isPb ? AMBER : INK_55 }}>
            {isPb ? 'NEW PB!' : streak.best > 0 ? `PB · ${streak.best}` : 'NO PB YET'}
          </span>
        </div>
      </div>
      {!isPb && remaining > 0 && (
        <div
          style={{
            marginTop: 'auto',
            padding: '6px 10px',
            background: isActive ? colorTint : INK_06,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            color: isActive ? color : INK_55,
            textAlign: 'center',
          }}
        >
          {isActive
            ? `${remaining} more to beat PB`
            : `Last PB ${streak.best} rounds`}
        </div>
      )}
      {isPb && (
        <div
          style={{
            marginTop: 'auto',
            padding: '6px 10px',
            background: AMBER_14,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            color: AMBER,
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          🏆 NEW PERSONAL BEST
        </div>
      )}
      {streak.best === 0 && (
        <div
          style={{
            marginTop: 'auto',
            padding: '6px 10px',
            background: INK_06,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            color: INK_55,
            textAlign: 'center',
          }}
        >
          Start your first run
        </div>
      )}
    </div>
  );
};

export const StreaksSection: React.FC<Props> = ({ connectionId, userId }) => {
  const { data: streaks, isLoading, totalRounds } = useStreaks(connectionId);
  const sectionRef = useRef<HTMLElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!streaks || firedRef.current || !sectionRef.current) return;
    const node = sectionRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            analyticsEvents.track('streaks_section_viewed', {
              user_id: userId,
              no_up_current: streaks.noUp.current,
              no_up_active: streaks.noUp.isActive,
              cutting_current: streaks.cutting.current,
              counter_current: streaks.counter.current,
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [streaks, userId]);

  if (isLoading) {
    return (
      <section style={{ marginTop: 28 }}>
        <SectionHeader eyebrow="STREAKS" title="Three runs to beat" />
        <div
          style={{
            margin: '0 20px',
            height: 168,
            background: INK_06,
            borderRadius: 14,
          }}
          className="animate-pulse"
        />
      </section>
    );
  }

  if (!streaks) return null;

  const allZero = streaks.noUp.current === 0;
  if (allZero && totalRounds < 3) return null;

  const handleRecordsTap = () => {
    analyticsEvents.track('streaks_records_tap', { user_id: userId });
    toast('All-time records — coming soon');
  };

  return (
    <section
      ref={sectionRef}
      style={{ marginTop: 28, fontFamily: FONT_GEIST }}
    >
      <SectionHeader
        eyebrow="STREAKS"
        title="Three runs to beat"
        sub="Each one tracks a different chapter of your form."
      />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      {/* Streak gallery — horizontal scroll */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '4px 20px 12px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        className="hide-scrollbar"
      >
        <StreakCard
          streak={streaks.noUp}
          label="NO-UP STREAK"
          sub="Rounds without your handicap going up"
          color={AMBER}
          colorTint={AMBER_14}
          icon="flame"
        />
        <StreakCard
          streak={streaks.cutting}
          label="CUTTING STREAK"
          sub="Consecutive rounds dropping handicap"
          color="#22C55E"
          colorTint="rgba(34,197,94,0.12)"
          icon="trending-down"
        />
        <StreakCard
          streak={streaks.counter}
          label="COUNTER STREAK"
          sub="Consecutive rounds being counted"
          color="#7C3AED"
          colorTint="rgba(124,58,237,0.12)"
          icon="shield"
        />
      </div>
      <div style={{ height: 12 }} />


      {/* All-time records */}
      <div style={{ padding: '0 20px' }}>
        <button
          type="button"
          onClick={handleRecordsTap}
          style={{
            width: '100%',
            textAlign: 'left',
            background: '#fff',
            border: `0.5px solid ${INK_10}`,
            borderRadius: 14,
            padding: 14,
            fontFamily: FONT_GEIST,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: INK_06,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={16} color={INK_70} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>
              All-time records
            </div>
            <div style={{ fontSize: 11.5, color: INK_55, marginTop: 2 }}>
              Lowest round, biggest cut, longest run
            </div>
          </div>
          <ChevronRight size={16} color={INK_40} />
        </button>
      </div>
    </section>
  );
};

export default StreaksSection;
