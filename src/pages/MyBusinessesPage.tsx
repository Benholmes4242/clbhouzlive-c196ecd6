import { useNavigate } from 'react-router-dom';
import { Building2, ChevronLeft, ChevronRight, Plus, BarChart3, CheckCircle2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useState } from 'react';
import { CreateBusinessProfileIntroModal } from '@/components/profile/CreateBusinessProfileIntroModal';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  analyst: 'Analyst',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-primary/10 text-primary border-primary/20',
  admin: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  editor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  analyst: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

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

  // Auto-redirect if user has exactly 1 business
  if (!isLoading && businesses && businesses.length === 1) {
    navigate(`/business/${businesses[0].business.id}`, { replace: true });
    return null;
  }

  const handleCreateBusiness = () => {
    setShowCreateModal(true);
  };

  const handleCreateContinue = () => {
    navigate('/edit-profile');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-muted rounded-sq-sm transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Your Businesses</h1>
              <p className="text-sm text-muted-foreground">
                See and manage the golf businesses you own or help run
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-sq-md border bg-card p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-muted" />
                    <div className="h-3 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!businesses || businesses.length === 0) && (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No businesses yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create a business profile to list your golf club, academy, shop, or brand on Clbhouz.
            </p>
            <Button onClick={handleCreateBusiness} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Business Profile
            </Button>
          </div>
        )}

        {/* Business list */}
        {!isLoading && businesses && businesses.length > 0 && (
          <div className="space-y-4">
            {businesses.map(membership => (
              <div
                key={membership.id}
                className="rounded-sq-md border bg-card p-4 hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  {membership.business.logo_url ? (
                    <img
                      src={membership.business.logo_url}
                      alt={membership.business.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl font-medium">
                      {membership.business.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium truncate">{membership.business.name}</span>
                      {membership.business.is_verified && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Role badge */}
                      <span className={`text-xs px-2 py-0.5 rounded-sq-pill border ${ROLE_COLORS[membership.role]}`}>
                        {ROLE_LABELS[membership.role]}
                      </span>
                      
                      {membership.business.category && (
                        <span className="text-xs text-muted-foreground">
                          {membership.business.category}
                        </span>
                      )}
                    </div>

                    {membership.business.location && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{membership.business.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {(membership.role === 'owner' || membership.role === 'admin' || membership.role === 'analyst') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/business/insights?businessId=${membership.business.id}`)}
                        className="gap-1.5"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Insights</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/business/${membership.business.id}`)}
                      className="gap-1"
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add another business CTA */}
            <button
              onClick={handleCreateBusiness}
              className="w-full rounded-sq-md border border-dashed p-4 text-center hover:border-foreground/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add another business</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Create Business Modal */}
      <CreateBusinessProfileIntroModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onContinue={handleCreateContinue}
      />
    </div>
  );
};

export default MyBusinessesPage;
