import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="mx-auto max-w-xl px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-muted rounded-sq-sm transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">Your businesses</h1>
              <p className="text-sm text-muted-foreground">
                Manage and grow the golf businesses you represent on Clbhouz.
              </p>
            </div>
            {/* Desktop-only Add CTA */}
            {hasBusinesses && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateBusiness}
                className="hidden sm:flex gap-1.5 h-9"
              >
                <Plus className="h-4 w-4" />
                Add business
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {/* Loading state - premium skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-sq-lg border bg-card p-5 animate-pulse"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded-sq-pill bg-muted" />
                      <div className="h-5 w-14 rounded-sq-pill bg-muted" />
                    </div>
                  </div>
                </div>
                <div className="rounded-sq-md bg-muted/50 h-14 mb-4" />
                <div className="flex gap-2">
                  <div className="h-9 flex-1 rounded-sq-sm bg-muted" />
                  <div className="h-9 flex-1 rounded-sq-sm bg-muted" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasBusinesses && (
          <AddBusinessCard onClick={handleCreateBusiness} isFirst />
        )}

        {/* Business list */}
        {!isLoading && hasBusinesses && (
          <div className="space-y-4">
            {businesses.map((membership, index) => (
              <BusinessCommandCard
                key={membership.id}
                membership={membership}
                userId={user?.id || ''}
                index={index}
              />
            ))}

            {/* Add another business CTA (mobile + desktop fallback) */}
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
