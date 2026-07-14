/**
 * CollegeProfilePage — "The Season Story".
 *
 * Composes: Masthead (charcoal, safe-area padded) · ThisWeek (self-hides
 * when empty) · TheClass (full roster, ported star rule). Uses the yearbook
 * standings query to derive the college's rank + points; falls back
 * gracefully when unranked. Not-found state renders when standings load
 * and no matching slug exists.
 *
 * Route contract: /tourhub/college-golf/:collegeSlug is unchanged.
 */

import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { TourHubShell } from '@/features/tourhub/components/TourHubShell';
import {
  CHARCOAL,
  FONT,
  INK,
  INK_MUTE,
  SLATE_50,
} from '@/features/tourhub/_shared/tokens';
import { collegeHubRoute } from '@/features/tourhub/routes';
import { useFranchiseStandings } from '@/features/tourhub/college-v2/hub/data/useFranchiseStandings';
import { useLiveAlumni } from '@/features/tourhub/college-v2/hub/data/useLiveAlumni';
import { Masthead } from './sections/Masthead';
import { ThisWeek } from './sections/ThisWeek';
import { TheClass } from './sections/TheClass';
import { scrollPageToTop } from '@/lib/getScrollParent';

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const slug = collegeSlug ?? '';

  const { data, isLoading, refetch } = useFranchiseStandings();
  const { data: liveAlumni } = useLiveAlumni();

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

  const notFound = !isLoading && data && !standing;

  return (
    <TourHubShell immersiveStatusBar>
      <div
        style={{
          background: SLATE_50,
          minHeight: '100vh',
          fontFamily: FONT,
          paddingBottom: 88,
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
            <div style={{ width: 66, height: 66, borderRadius: '34%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, width: 130, background: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
              <div style={{ height: 20, width: '70%', background: 'rgba(255,255,255,0.12)', marginBottom: 8 }} />
              <div style={{ height: 10, width: '55%', background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </div>
        )}

        {standing && (
          <Masthead
            slug={slug}
            displayName={displayName}
            rank={standing.rank}
            pointsTotal={standing.pointsTotal}
            alumniCount={standing.alumniCount}
            playingNow={playingNow}
            brandHex={standing.brandHex}
            rankChange={standing.rankChange}
          />
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
            <div style={{ fontSize: 14, fontWeight: 800, color: INK, marginBottom: 4 }}>
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
                color: '#fff',
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
        {!notFound && slug && (
          <>
            <ThisWeek slug={slug} collegeName={displayName} />
            <TheClass slug={slug} collegeName={displayName} />
          </>
        )}
      </div>
    </TourHubShell>
  );
}

export default CollegeProfilePage;
