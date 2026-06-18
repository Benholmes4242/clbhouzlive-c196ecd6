import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { PageRoot } from '@/components/layout/PageRoot';
import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';
import { AddBusinessCard } from '@/components/business/AddBusinessCard';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { BIZ } from '@/components/business/businessTokens';

// Inline skeleton used by loading state — kept local since it is private to this page.
function BusinessCardSkeleton() {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: BIZ.card,
        border: `1px solid ${BIZ.hair}`,
        borderRadius: BIZ.rCard,
      }}
    >
      <div className="p-4 flex items-center gap-3">
        <div
          className="w-12 h-12 animate-pulse"
          style={{ background: BIZ.fillStrong, borderRadius: BIZ.rInner }}
        />
        <div className="flex-1 space-y-2">
          <div
            className="h-4 animate-pulse rounded-lg w-2/3"
            style={{ background: BIZ.fillStrong }}
          />
          <div
            className="h-3 animate-pulse rounded-lg w-1/3"
            style={{ background: BIZ.fill }}
          />
        </div>
      </div>
      <div style={{ height: '0.5px', background: BIZ.hair }} />
      <div className="p-4 space-y-3">
        <div
          className="h-16 animate-pulse"
          style={{ background: BIZ.fillStrong, borderRadius: BIZ.rInner }}
        />
        <div
          className="h-11 animate-pulse"
          style={{ background: BIZ.fill, borderRadius: BIZ.rInner }}
        />
      </div>
    </div>
  );
}

const MyBusinessesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: businesses, isLoading, error } = useMyBusinesses(user?.id);
  const { activeActor } = useActiveActor();

  useHideBottomNav();
  useHideHeader();

  // Sort businesses — active first, then alphabetical.
  const sortedBusinesses = useMemo(() => {
    if (!businesses || businesses.length === 0) return [];
    return [...businesses].sort((a, b) => {
      const aIsActive = activeActor?.type === 'business' && activeActor?.id === a.business.id;
      const bIsActive = activeActor?.type === 'business' && activeActor?.id === b.business.id;
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      return a.business.name.localeCompare(b.business.name);
    });
  }, [businesses, activeActor]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  if (!authLoading && !user) return null;

  const handleCreateBusiness = () => {
    // TODO(phase-3): repoint to unified business editor.
    navigate('/business/create');
  };

  if (error) {
    return (
      <PageRoot>
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ background: BIZ.pageBg }}
        >
          <p className="text-sm text-center" style={{ color: BIZ.inkMute }}>
            Failed to load your businesses.
          </p>
        </div>
      </PageRoot>
    );
  }

  const hasBusinesses = sortedBusinesses.length > 0;

  return (
    <PageRoot>
      <div className="min-h-screen" style={{ background: BIZ.pageBg }}>

        {/* Header — canonical eyebrow + h1 pattern, left-aligned */}
        <div
          className="sticky top-0 z-10 backdrop-blur-xl"
          style={{
            background: 'rgba(248,250,252,0.97)',
            borderBottom: `0.5px solid ${BIZ.hair}`,
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5">
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 active:scale-[0.97] transition-transform"
              style={{ color: BIZ.ink }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0">
              <SectionEyebrow label="BUSINESSES" color="amber" />
              <h1
                className="truncate"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: BIZ.ink,
                  letterSpacing: '-0.01em',
                  marginTop: 2,
                }}
              >
                Your business profiles
              </h1>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col gap-4 pt-4 px-4 max-w-xl mx-auto">
            <BusinessCardSkeleton />
            <BusinessCardSkeleton />
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <div className="flex flex-col gap-4 pt-4 px-4 max-w-xl mx-auto pb-8">
            {!hasBusinesses ? (
              <AddBusinessCard isFirst onClick={handleCreateBusiness} />
            ) : (
              <>
                {sortedBusinesses.map((membership, index) => {
                  // A business is "active" only if it is the currently selected actor.
                  // No default-to-first guesswork — reflects the real posting context.
                  const isActive =
                    activeActor?.type === 'business' &&
                    activeActor?.id === membership.business.id;

                  return (
                    <BusinessCommandCard
                      key={membership.id}
                      membership={membership}
                      userId={user?.id || ''}
                      index={index}
                      isActive={isActive}
                    />
                  );
                })}

                <AddBusinessCard onClick={handleCreateBusiness} />
              </>
            )}
          </div>
        )}
      </div>
    </PageRoot>
  );
};

export default MyBusinessesPage;
