import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPassport } from './hooks/useUserPassport';

interface ExplorePassportProps {
  userId: string | undefined;
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '10px 4px', overflow: 'hidden' }}>
      <div
        style={{
          fontSize: 'clamp(18px, 5vw, 22px)',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: '#FFFFFF',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)',
          marginTop: 6,
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ExplorePassportInner({ userId }: ExplorePassportProps) {
  const navigate = useNavigate();
  const { data: passport, isLoading } = useUserPassport(userId);

  if (!userId) return null;

  if (isLoading) {
    return (
      <section style={{ padding: '24px 16px 0' }}>
        <div
          className="animate-pulse"
          style={{ height: 110, background: 'rgba(15,23,42,0.06)', borderRadius: 14 }}
        />
      </section>
    );
  }

  if (!passport) return null;

  const sinceLabel =
    passport.first_play_year != null
      ? `Lifetime · since ${passport.first_play_year}`
      : 'Lifetime totals';

  return (
    <section style={{ padding: '24px 16px 0' }}>
      <div style={{ padding: '0 0 12px' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#F7931E',
            margin: 0,
            lineHeight: 1,
          }}
        >
          Your Journey
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: '4px 0 0', lineHeight: 1.15 }}>
          Season passport
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
          {sinceLabel}
        </p>
      </div>
      <div
        style={{
          background: 'linear-gradient(135deg, #0F4A3A 0%, #1A6A54 100%)',
          border: 'none',
          borderRadius: 14,
          padding: 18,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <Stat value={passport.courses_played ?? 0} label="Courses" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.18)', margin: '8px 0' }} />
          <Stat value={passport.countries_played ?? 0} label="Countries" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.18)', margin: '8px 0' }} />
          <Stat value={passport.top_100_played ?? 0} label="Top 100" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.18)', margin: '8px 0' }} />
          <Stat
            value={
              passport.avg_rating_given != null
                ? Number(passport.avg_rating_given).toFixed(1)
                : '—'
            }
            label="Avg given"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="active:scale-[0.97] transition-transform"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: '#FFFFFF',
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            View profile
          </button>
        </div>
      </div>
    </section>
  );
}

export const ExplorePassport = memo(ExplorePassportInner);
