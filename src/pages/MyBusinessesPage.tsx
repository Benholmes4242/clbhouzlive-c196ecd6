import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useEffect, useMemo } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';
import { AddBusinessCard } from '@/components/business/AddBusinessCard';
import { useActiveActor } from '@/context/ActiveActorContext';
import { ChevronLeft } from 'lucide-react';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const MyBusinessesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: businesses, isLoading, error } = useMyBusinesses(user?.id);
  const { activeActor } = useActiveActor();

  useHideBottomNav();
  useHideHeader();

  // Sort businesses — active first, then alphabetical
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

  if (error) {
    return (
      <PageRoot>
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <p className="text-sm text-muted-foreground text-center">
            Failed to load your businesses.
          </p>
        </div>
      </PageRoot>
    );
  }

  const handleCreateBusiness = () => {
    navigate('/business/create');
  };

  const hasBusinesses = sortedBusinesses.length > 0;

  return (
    <PageRoot>
      <div className="min-h-screen bg-background">

        {/* Header */}
        <div
          className="sticky top-0 z-10 backdrop-blur-xl"
          style={{ background: 'rgba(248,250,252,0.97)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}
        >
          <div className="flex items-center px-4 h-14">
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-foreground active:scale-[0.97] transition-transform"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Title — centred */}
            <div className="flex-1 text-center">
              <h1 className="text-[16px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>
                Business Profiles
              </h1>
            </div>

            {/* Right spacer to balance back button */}
            <div className="w-11" />
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col gap-4 pt-4 px-4 max-w-xl mx-auto">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl animate-pulse" style={{ background: 'rgba(15,23,42,0.08)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 animate-pulse rounded-lg w-2/3" style={{ background: 'rgba(15,23,42,0.08)' }} />
                    <div className="h-3 animate-pulse rounded-lg w-1/3" style={{ background: 'rgba(15,23,42,0.06)' }} />
                  </div>
                </div>
                <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-16 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
                  <div className="h-11 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.06)' }} />
                </div>
              </div>
            ))}
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
                  const isSingleBusiness = sortedBusinesses.length === 1;
                  const hasActiveActor = activeActor?.type === 'business' && activeActor?.id;
                  const isExactMatch = activeActor?.type === 'business' && activeActor?.id === membership.business.id;
                  const isFirstBusiness = index === 0;

                  const isActive = isSingleBusiness || isExactMatch || (!hasActiveActor && isFirstBusiness);

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
