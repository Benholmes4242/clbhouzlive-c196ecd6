/**
 * CollegeProfilePage - "The Season Story".
 *
 * Composes: Masthead (charcoal, safe-area padded) - ThisWeek (self-hides
 * when empty) - TheClass (full roster, ranked by earnings). Uses the yearbook

 * standings query to derive the college's rank + points; falls back
 * gracefully when unranked. Not-found state renders when standings load
 * and no matching slug exists.
 *
 * Route contract: /tourhub/college-golf/:collegeSlug is unchanged.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { TourHubShell } from '@/features/tourhub/components/TourHubShell';
import {
  CHARCOAL,
  FONT,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
} from '@/features/tourhub/_shared/tokens';
import { collegeHubRoute } from '@/features/tourhub/routes';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useFranchiseStandings } from '@/features/tourhub/college-v2/hub/data/useFranchiseStandings';
import { useLiveAlumni } from '@/features/tourhub/college-v2/hub/data/useLiveAlumni';
import { useThisWeekAlumni } from './data/useThisWeekAlumni';
import { Masthead } from './sections/Masthead';
import { ThisWeek } from './sections/ThisWeek';
import { TheClass } from './sections/TheClass';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { Skeleton } from '@/components/ui/skeleton';

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const slug = collegeSlug ?? '';
  const { t } = useTranslation('tourhub');

  const { data, isLoading, isError, refetch } = useFranchiseStandings();
  const { data: liveAlumni } = useLiveAlumni();
  const { data: weekRows } = useThisWeekAlumni(slug);

  // Scroll to top when slug changes.
  useEffect(() => {
    scrollPageToTop('auto');
  }, [slug]);

  const standing = useMemo(
    () => data?.standings.find((s) => s.normalizedName === slug) ?? null,
    [data, slug],
  );

  const displayName =
    standing?.shortName || standing?.collegeName || slug || 'College';
  const playingNow = liveAlumni?.byCollege?.[slug] ?? 0;

  const notFound = !isLoading && !isError && data && !standing;

  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current || !standing) return;
    viewedRef.current = true;
    analyticsEvents.track('tour_college_profile_viewed', {
      slug,
      rank: standing.rank,
      alumni: standing.alumniCount,
      playing_now: playingNow,
      week_rows: weekRows?.length ?? 0,
    });
  }, [standing, slug, playingNow, weekRows]);

  return (
    <TourHubShell immersiveStatusBar>
      <div
        style={{
          background: SLATE_50,
          minHeight: '100vh',
          fontFamily: FONT,
        }}
      >

        {/* Masthead skeleton while standings load */}
        {isLoading && !standing && (
          <div
            style={{
              background: CHARCOAL,
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
              paddingLeft: 16,
              paddingRight: 16,
              paddingBottom: 16,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <Skeleton variant="dark" style={{ width: 66, height: 66, borderRadius: '34%' }} />
            <div style={{ flex: 1 }}>
              <Skeleton variant="dark" style={{ height: 10, width: 130, marginBottom: 8, borderRadius: 3 }} />
              <Skeleton variant="dark" style={{ height: 20, width: '70%', marginBottom: 8, borderRadius: 4 }} />
              <Skeleton variant="dark" style={{ height: 10, width: '55%', borderRadius: 3 }} />
            </div>
          </div>
        )}

        {standing && (
          <Masthead
            slug={slug}
            displayName={displayName}
            rank={standing.rank}
            pointsTotal={standing.earningsTotal}
            alumniCount={standing.alumniCount}
            playingNow={playingNow}
            brandHex={standing.brandHex}
            rankChange={standing.rankChange}
          />
        )}

        {/* Error */}
        {isError && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>
              Couldn't load this college
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: INK_MUTE, maxWidth: 280 }}>
              Check your connection and try again.
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              style={{ background: INK, color: SLATE_50, border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                margin: '0 auto 12px',
                borderRadius: 999,
                background: 'rgba(220,38,38,0.10)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={20} color="#DC2626" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>
              Couldn't load school data
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: INK_MUTE, marginBottom: 12 }}>
              This program isn't in the current standings.
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 999,
                border: 'none',
                background: INK,
                color: SLATE_50,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              Tap to retry
            </button>
            <div style={{ marginTop: 12 }}>
              <Link
                to={collegeHubRoute()}
                style={{ fontSize: 12, fontWeight: 700, color: INK_MUTE, textDecoration: 'underline' }}
              >
                Browse all colleges
              </Link>
            </div>
          </div>
        )}

        {/* Sections */}
        {!isError && !notFound && slug && (
          <>
            <ThisWeek slug={slug} collegeName={displayName} />
            <div style={{ height: 10 }} />
            <TheClass slug={slug} collegeName={displayName} />
            <div
              style={{
                padding: '16px 24px 0',
                textAlign: 'center',
                fontSize: 10.5,
                fontWeight: 600,
                color: INK_FAINT,
                letterSpacing: '0.01em',
              }}
            >
              {t('college.profile.footer', { year: new Date().getFullYear() })}
            </div>
          </>
        )}

        {/* Bottom nav clearance */}
        <div style={{ height: 'calc(var(--bottom-nav-height, 88px) + 16px)' }} />
      </div>

    </TourHubShell>
  );
}

export default CollegeProfilePage;
