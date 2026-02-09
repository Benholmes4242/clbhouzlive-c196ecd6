import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useMemo, useState } from 'react';
import { CreateBusinessProfileIntroModal } from '@/components/profile/CreateBusinessProfileIntroModal';
import { PageRoot } from '@/components/layout/PageRoot';
import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';
import { AddBusinessCard } from '@/components/business/AddBusinessCard';
import { useActiveActor } from '@/context/ActiveActorContext';
import { motion } from 'framer-motion';

const MyBusinessesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: businesses, isLoading } = useMyBusinesses(user?.id);
  const { activeActor } = useActiveActor();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fix 2: Sort businesses — active first, then alphabetical
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
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const handleCreateBusiness = () => {
    setShowCreateModal(true);
  };

  const handleCreateContinue = () => {
    setShowCreateModal(false);
    navigate('/business/intro');
  };

  const hasBusinesses = sortedBusinesses.length > 0;

  return (
    <PageRoot className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-xl px-4 pt-3 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-0.5 text-sm font-medium text-muted-foreground active:opacity-70 transition-opacity min-h-[44px]"
          >
            ‹ Back
          </button>
          
          <h1 className="text-2xl font-bold text-foreground text-center">Business profiles</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Manage the golf businesses you represent
          </p>
        </div>
      </header>

      <main className="w-full bg-background min-h-[calc(100vh-120px)]">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col gap-4 pt-4 px-4 max-w-xl mx-auto">
            {[1, 2].map(i => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div className="flex items-start gap-3.5 p-5">
                  <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                </div>
                <div className="px-5 pb-3">
                  <div className="bg-muted/50 rounded-xl p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="flex flex-col items-center">
                          <div className="h-5 w-8 bg-muted rounded animate-pulse mb-1" />
                          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-px bg-border mx-5" />
                <div className="flex gap-2 p-5 pt-3">
                  <div className="h-11 flex-1 rounded-xl bg-muted animate-pulse" />
                  <div className="h-11 flex-1 rounded-xl bg-muted animate-pulse" />
                  <div className="h-11 flex-1 rounded-xl bg-muted animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasBusinesses && (
          <div className="pt-4 px-4 max-w-xl mx-auto">
            <AddBusinessCard onClick={handleCreateBusiness} isFirst />
          </div>
        )}

        {/* Business list */}
        {!isLoading && hasBusinesses && (
          <div className="flex flex-col gap-4 pt-4 px-4 max-w-xl mx-auto pb-8">
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
          </div>
        )}
      </main>

      <CreateBusinessProfileIntroModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onContinue={handleCreateContinue}
      />
    </PageRoot>
  );
};

export default MyBusinessesPage;