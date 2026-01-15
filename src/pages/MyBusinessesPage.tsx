import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useState } from 'react';
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

  const hasBusinesses = businesses && businesses.length > 0;

  return (
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
      {/* Header - sticky */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-xl px-4 pt-3 pb-4">
          {/* Back CTA */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-0.5 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors mb-2"
          >
            ‹ Back
          </button>
          
          {/* Title stack - centered */}
          <h1 className="text-xl font-semibold text-[#1e293b] text-center">Business profiles</h1>
          <p className="text-sm text-[#64748b] mt-1 text-center">
            Manage the golf businesses you represent
          </p>
        </div>
      </header>

      <main 
        className="w-full"
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        {/* Loading state - flat skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3 pt-3">
            {[1, 2].map(i => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white"
              >
                {/* Business row skeleton */}
                <div className="flex items-start gap-3.5 px-4 py-3.5">
                  <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                </div>
                <div className="h-px bg-border/20" />
                
                {/* Metrics skeleton */}
                <div className="grid grid-cols-3 px-4 py-3.5">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex flex-col items-center">
                      <div className="h-5 w-8 bg-muted rounded animate-pulse mb-1" />
                      <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="h-px bg-border/20" />
                
                {/* Actions skeleton */}
                <div className="flex gap-3 px-4 py-3.5">
                  <div className="h-9 flex-1 rounded-lg bg-[#e2e8f0] animate-pulse" />
                  <div className="h-9 flex-1 rounded-lg bg-[#e2e8f0] animate-pulse" />
                  <div className="h-9 flex-1 rounded-sq-sm bg-muted animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasBusinesses && (
          <div className="pt-3">
            <AddBusinessCard onClick={handleCreateBusiness} isFirst />
          </div>
        )}

        {/* Business list - white cards with gap */}
        {!isLoading && hasBusinesses && (
          <div className="flex flex-col gap-3 pt-3">
            {businesses.map((membership, index) => {
              // Resilient Active pill logic:
              // - If only 1 business → always show Active
              // - If multiple businesses → show Active based on activeActor match
              // - If no activeActor set → default to first business
              const isSingleBusiness = businesses.length === 1;
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

            {/* Add another business row */}
            <AddBusinessCard onClick={handleCreateBusiness} />
          </div>
        )}
      </main>

      {/* Create Business Modal */}
      <CreateBusinessProfileIntroModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onContinue={handleCreateContinue}
      />
    </PageRoot>
  );
};

export default MyBusinessesPage;
