import React, { useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Flame, Shield, Trophy, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { useStreaks, type StreakResult, type StreaksData } from '@/lib/whs/useStreaks';
import { analyticsEvents } from '@/utils/analyticsEvents';

const AMBER = '#F7931E';
const AMBER_14 = 'rgba(247,147,30,0.14)';
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

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 800,
      color: INK_55,
      letterSpacing: '0.22em',
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

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
          const activeBg = isFaded ? 'rgba(247,147,30,0.18)' : AMBER;
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
            background: `linear-gradient(90deg, transparent, ${AMBER})`,
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

const formatBest = (s: StreakResult): string => {
  if (s.best === 0) return 'No streak yet';
  const dateBit = s.bestEndedAt
    ? ` · ${format(parseISO(s.bestEndedAt), 'MMM yyyy')}`
    : '';
  return `Best: ${s.best}${dateBit}`;
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
      <section style={{ padding: '0 20px', marginTop: 32 }}>
        <Eyebrow>STREAKS</Eyebrow>
        <div
          style={{
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

  const allZero =
    streaks.noUp.current === 0 &&
    streaks.cutting.current === 0 &&
    streaks.counter.current === 0;
  if (allZero && totalRounds < 3) return null;

  const handleRecordsTap = () => {
    analyticsEvents.track('streaks_records_tap', { user_id: userId });
    toast('All-time records — coming soon');
  };

  return (
    <section
      ref={sectionRef}
      style={{ padding: '0 20px', marginTop: 32, fontFamily: FONT_GEIST }}
    >
      <Eyebrow>STREAKS</Eyebrow>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          margin: '0 0 4px',
        }}
      >
        Your runs
      </h2>
      <div style={{ fontSize: 13, color: INK_55, marginBottom: 14 }}>
        Pulled from every counted round, updated daily
      </div>

      {/* Hero — No-up streak */}
      <div
        style={{
          background: '#fff',
          border: `0.5px solid ${INK_10}`,
          borderRadius: 14,
          padding: 16,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: AMBER_14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={20} color={AMBER} strokeWidth={2.2} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: INK_55,
                  letterSpacing: '0.16em',
                  marginBottom: 2,
                }}
              >
                NO-UP STREAK
              </div>
              <div style={{ fontSize: 11.5, color: INK_70 }}>
                Rounds without your handicap going up
              </div>
            </div>
          </div>
          {streaks.noUp.isActive && (
            <div
              style={{
                background: AMBER_14,
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 9,
                fontWeight: 800,
                color: AMBER,
                letterSpacing: '0.14em',
              }}
            >
              ACTIVE
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {streaks.noUp.current}
          </span>
          <span style={{ fontSize: 16, color: INK_55, fontWeight: 500 }}>rounds</span>
          <span style={{ flex: 1 }} />
          <BestCaption streak={streaks.noUp} />
        </div>

        <Timeline timeline={streaks.timeline} />
      </div>

      {/* Two secondaries */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <SecondaryStreakTile
          Icon={TrendingDown}
          label="CUTTING STREAK"
          value={streaks.cutting.current}
          bestText={formatBest(streaks.cutting)}
          accent={GREEN}
        />
        <SecondaryStreakTile
          Icon={Shield}
          label="COUNTER STREAK"
          value={streaks.counter.current}
          bestText={formatBest(streaks.counter)}
          accent={INK_70}
        />
      </div>

      {/* All-time records */}
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
    </section>
  );
};

export default StreaksSection;
