import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useState } from 'react';
import { CreateBusinessProfileIntroModal } from '@/components/profile/CreateBusinessProfileIntroModal';
import { PageRoot } from '@/components/layout/PageRoot';
import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';
import { AddBusinessCard } from '@/components/business/AddBusinessCard';
import { motion } from 'framer-motion';

const MyBusinessesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: businesses, isLoading } = useMyBusinesses(user?.id);
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
    <PageRoot className="min-h-screen bg-muted/30">
      {/* Header - sticky */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="mx-auto max-w-xl px-4 pt-3 pb-4">
          {/* Back CTA */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            ‹ Back
          </button>
          
          {/* Title stack - centered */}
          <h1 className="text-xl font-semibold text-foreground text-center">Business profiles</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Manage the golf businesses you represent
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-xl">
        {/* Loading state - flat skeleton */}
        {isLoading && (
          <div>
            {[1, 2].map(i => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                {/* Business row skeleton */}
                <div className="flex items-start gap-4 px-4 py-4">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                </div>
                <div className="h-px bg-border/30 mx-4" />
                
                {/* Metrics skeleton */}
                <div className="grid grid-cols-3 gap-4 px-4 py-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="text-center">
                      <div className="h-5 w-10 mx-auto bg-muted rounded animate-pulse mb-1" />
                      <div className="h-3 w-12 mx-auto bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="h-px bg-border/30 mx-4" />
                
                {/* Actions skeleton */}
                <div className="flex gap-3 px-4 py-4">
                  <div className="h-9 flex-1 rounded-sq-sm bg-muted animate-pulse" />
                  <div className="h-9 flex-1 rounded-sq-sm bg-muted animate-pulse" />
                </div>
                <div className="h-px bg-border/40" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasBusinesses && (
          <AddBusinessCard onClick={handleCreateBusiness} isFirst />
        )}

        {/* Business list - flat layout */}
        {!isLoading && hasBusinesses && (
          <div>
            {businesses.map((membership, index) => (
              <BusinessCommandCard
                key={membership.id}
                membership={membership}
                userId={user?.id || ''}
                index={index}
              />
            ))}

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
