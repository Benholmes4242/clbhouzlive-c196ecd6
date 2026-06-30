import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TourHubShell } from '../components';
import { ShellSlot } from '@/components/header/ShellSlot';

import { CollegeCompareHero } from '../components/college/CollegeCompareHero';
import { useCollegeCompare } from '../hooks/useCollegeCompare';
import { useTourSeason } from '../hooks/useTourHubData';
import { collegeProfileRoute } from '../routes';
import {
  INK,
  INK_FAINT,
  INK_TINT_06,
  INK_TINT_07,
  SLATE_50,
  SURFACE,
} from '../_shared/tokens';

/**
 * College Compare Page - Side-by-side comparison of two colleges.
 * Route: /tourhub/college-golf/compare?c1=<slug>&c2=<slug>
 *
 * Picker UI lives in CollegeComparePickerSheet (opened from H2HRivalStrip's
 * "Browse all"). This page now only renders the comparison hero.
 */
export function CollegeComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const c1 = searchParams.get('c1') || '';
  const c2 = searchParams.get('c2') || '';

  // Old deep links shaped like ?c1=texas (no c2) shouldn't show a blank.
  // Redirect back to the college profile.
  useEffect(() => {
    if (c1 && !c2) {
      navigate(collegeProfileRoute(c1), { replace: true });
    }
  }, [c1, c2, navigate]);

  const { data, isLoading, error } = useCollegeCompare(c1, c2);

  const hasValidParams = Boolean(c1 && c2);

  const { data: season } = useTourSeason();
  const seasonYear = season?.year || new Date().getFullYear();

  const seasonLabel = `Season ${seasonYear === 2026 ? '2025-26' : `${seasonYear - 1}-${String(seasonYear).slice(-2)}`}`;

  const h1Text = (() => {
    if (isLoading || !data) return 'Head-to-Head';
    const n1 = data.college1.media?.short_name || data.college1.media?.college_name || 'College 1';
    const n2 = data.college2.media?.short_name || data.college2.media?.college_name || 'College 2';
    return `${n1} vs ${n2}`;
  })();

  const subheadText = (() => {
    if (data) {
      const totalAlumni =
        (data.college1.stats?.player_count || 0) +
        (data.college2.stats?.player_count || 0);
      return `${seasonLabel} . ${totalAlumni} alumni compared`;
    }
    return seasonLabel;
  })();

  if (c1 && !c2) return null;

  return (
    <TourHubShell>
      <ShellSlot>
        <button
          type="button"
          onClick={() => navigate('/tourhub/college-golf')}
          aria-label="Head-to-Head - open College Franchise"
          style={{
            background: SLATE_50,
            border: 'none',
            padding: '14px 16px 12px',
            cursor: 'pointer',
            display: 'block',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {h1Text}
          </h1>
          {subheadText && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: INK_FAINT,
                lineHeight: 1.4,
                marginTop: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subheadText}
            </div>
          )}
        </button>
      </ShellSlot>

      <div
        className="relative min-h-screen"
        style={{ paddingTop: 'var(--chrome-total-h, 0px)', background: SLATE_50 }}
      >
        <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
          {isLoading && hasValidParams && (
            <div style={{ padding: '12px 16px' }}>
              <div
                className="animate-pulse"
                style={{
                  height: 10,
                  width: 180,
                  borderRadius: 4,
                  background: INK_TINT_06,
                }}
              />
            </div>
          )}
          {isLoading ? (
            <div>
              <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 20px',
                      borderBottom: `0.5px solid ${INK_TINT_07}`,
                      height: '48px',
                    }}
                  >
                    <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: INK_TINT_06 }} />
                    <div style={{ width: '80px', height: '3px', borderRadius: '2px', background: INK_TINT_06, margin: '0 8px' }} />
                    <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: INK_TINT_06 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <p style={{ fontSize: '15px', color: INK_FAINT }}>
                Failed to load comparison data
              </p>
            </div>
          ) : data ? (
            <CollegeCompareHero data={data} />
          ) : null}
        </div>
      </div>
    </TourHubShell>
  );
}
