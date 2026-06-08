import { memo, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Globe } from 'lucide-react';
import { useUserPassport, type UserPassportRow } from './hooks/useUserPassport';
import { ExploreSectionHeader } from './ExploreSectionHeader';

type HookFlavour = 'milestone' | 'achievement';

interface PassportHook {
  flavour: HookFlavour;
  text: string;
}

function buildHooks(p: UserPassportRow): PassportHook[] {
  const hooks: PassportHook[] = [];

  // ---- MILESTONES (forward-looking nudges) ----
  if (p.countries_played != null && p.countries_played > 0 && p.countries_played < 20) {
    hooks.push({
      flavour: 'milestone',
      text: `1 country from your ${p.countries_played + 1}th.`,
    });
  }
  if (p.friends_courses_to_try > 0) {
    hooks.push({
      flavour: 'milestone',
      text: `${p.friends_courses_to_try} ${p.friends_courses_to_try === 1 ? 'course' : 'courses'} your friends have played that you haven't.`,
    });
  }
  if (p.wishlist_count > 0) {
    hooks.push({
      flavour: 'milestone',
      text: `${p.wishlist_count} on your bucket list, waiting to be played.`,
    });
  }
  if (p.top_100_played != null && p.top_100_played > 0 && p.top_100_played < 100) {
    hooks.push({
      flavour: 'milestone',
      text: `${100 - p.top_100_played} of the Top 100 still to go.`,
    });
  }

  // ---- ACHIEVEMENTS (backward-looking facts) ----
  if (p.courses_played != null && p.courses_played > 0) {
    hooks.push({
      flavour: 'achievement',
      text:
        p.first_play_year != null
          ? `${p.courses_played} courses played since ${p.first_play_year}.`
          : `${p.courses_played} courses played and counting.`,
    });
  }
  if (p.countries_played != null && p.countries_played > 1) {
    hooks.push({
      flavour: 'achievement',
      text: `Your golf spans ${p.countries_played} countries.`,
    });
  }
  if (p.top_100_played != null && p.top_100_played > 0) {
    hooks.push({
      flavour: 'achievement',
      text: `${p.top_100_played} of the Top 100, in the bag.`,
    });
  }
  if (p.reviews_written != null && p.reviews_written > 0) {
    hooks.push({
      flavour: 'achievement',
      text: `${p.reviews_written} ${p.reviews_written === 1 ? 'review' : 'reviews'} written for the community.`,
    });
  }
  if (p.avg_rating_given != null && p.reviews_written != null && p.reviews_written >= 3) {
    hooks.push({
      flavour: 'achievement',
      text: `You rate courses ${Number(p.avg_rating_given).toFixed(1)} on average.`,
    });
  }

  return hooks;
}

const HOOK_META: Record<HookFlavour, { eyebrow: string; eyebrowColor: string }> = {
  milestone: { eyebrow: 'Next milestone', eyebrowColor: '#FBBC2E' },
  achievement: { eyebrow: 'Your season so far', eyebrowColor: '#7DD3A8' },
};


interface ExplorePassportProps {
  userId: string | undefined;
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '10px 4px', overflow: 'hidden', textAlign: 'center' }}>
      <div
        style={{
          fontSize: 'clamp(16px, 4.5vw, 19px)',
          fontWeight: 800,
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

  const hook = deriveHook(passport);



  return (
    <section>
      <ExploreSectionHeader
        title="Season passport"
        icon={Globe}
        sub={sinceLabel}
        action={{ label: 'View profile', onClick: () => navigate('/profile') }}
      />
      <div style={{ padding: '0 16px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0F4A3A 0%, #1A6A54 100%)',
            borderRadius: 16,
            padding: 20,
            position: 'relative',
          }}
        >
          {/* HOOK — focal point */}
          {hook ? (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <TrendingUp size={15} color="#FBBC2E" style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: '#FBBC2E',
                }}>
                  Next milestone
                </span>
              </div>
              <p style={{
                fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2,
                color: '#FFFFFF', margin: 0,
              }}>
                {hook}
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: 18 }}>
              <p style={{
                fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2,
                color: '#FFFFFF', margin: 0,
              }}>
                Your golf, mapped.
              </p>
            </div>
          )}

          {/* hairline divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.14)', margin: '0 0 16px' }} />

          {/* STATS — quieter supporting row */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <Stat value={passport.courses_played ?? 0} label="Courses" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.14)', margin: '4px 0' }} />
            <Stat value={passport.countries_played ?? 0} label="Countries" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.14)', margin: '4px 0' }} />
            <Stat value={passport.top_100_played ?? 0} label="Top 100" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.14)', margin: '4px 0' }} />
            <Stat
              value={passport.avg_rating_given != null ? Number(passport.avg_rating_given).toFixed(1) : '—'}
              label="Avg given"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


export const ExplorePassport = memo(ExplorePassportInner);
