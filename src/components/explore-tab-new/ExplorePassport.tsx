import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useUserPassport, type UserPassportRow } from './hooks/useUserPassport';
import { ExploreSectionHeader } from './ExploreSectionHeader';

function deriveHook(p: UserPassportRow): string | null {
  if (p.countries_played != null && p.countries_played > 0 && p.countries_played < 20) {
    return `1 country from your ${p.countries_played + 1}th.`;
  }
  if (p.friends_courses_to_try > 0) {
    return `${p.friends_courses_to_try} courses your friends have played that you haven't.`;
  }
  if (p.wishlist_count > 0) {
    return `${p.wishlist_count} on your bucket list, waiting to be played.`;
  }
  if (p.top_100_played != null && p.top_100_played < 100) {
    return `${100 - p.top_100_played} of the Top 100 still to go.`;
  }
  return null;
}


interface ExplorePassportProps {
  userId: string | undefined;
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '10px 4px', overflow: 'hidden', textAlign: 'center' }}>
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
    <section>
      <ExploreSectionHeader
        kicker="Your Journey"
        title="Season passport"
        sub={sinceLabel}
      />
      <div style={{ padding: '0 16px' }}>
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
          {hook && (
            <div
              style={{
                marginTop: 16,
                padding: '11px 13px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <TrendingUp size={16} color="#FBBC2E" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>
                {hook}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


export const ExplorePassport = memo(ExplorePassportInner);
