import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Zap, Check, Target, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ManualHandicapModal from './ManualHandicapModal';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

interface ProfileHandicapViewProps {
  userId: string;
  profile: {
    eg_handicap_index?: number | null;
    handicap_sync_interest?: boolean | null;
    updated_at?: string | null;
    [key: string]: any;
  } | null;
  isOwnProfile: boolean;
}

const ProfileHandicapView: React.FC<ProfileHandicapViewProps> = ({
  userId,
  profile,
  isOwnProfile,
}) => {
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hasRegisteredInterest, setHasRegisteredInterest] = useState(
    profile?.handicap_sync_interest ?? false
  );
  const [isRegistering, setIsRegistering] = useState(false);

  const handicapIndex = profile?.eg_handicap_index ?? null;
  const lastUpdatedAt = profile?.updated_at;

  const formatHandicap = (value: number | null): string => {
    if (value === null) return '—';
    if (value < 0) return `+${Math.abs(value).toFixed(1)}`;
    return value.toFixed(1);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'd MMM yyyy');
    } catch {
      return '';
    }
  };

  const handleRegisterInterest = async () => {
    if (!userId) return;
    setIsRegistering(true);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        handicap_sync_interest: true,
        handicap_sync_interest_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to register interest');
      setIsRegistering(false);
      return;
    }

    setHasRegisteredInterest(true);
    setIsRegistering(false);
    toast.success("You're on the list");
    queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
  };

  const handleHandicapSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
  };

  if (!profile) {
    return (
      <div className="px-5 pt-10 pb-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-3 w-28 bg-muted rounded mb-5" />
          <div className="h-16 w-24 bg-muted rounded mb-4" />
          <div className="h-4 w-44 bg-muted/60 rounded" />
        </div>
        <div className="h-px bg-border/40" />
        <div className="animate-pulse flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-3 w-full bg-muted/60 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-2 space-y-0">
      <ScrollToTopGlass />

      {/* Handicap Display — Cardless, Centered */}
      {handicapIndex !== null ? (
        <div className="pb-8 text-center">
          {/* Eyebrow Label */}
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground mb-4">
            Handicap Index
          </p>
          
          {/* Handicap Number — Hero */}
          <div className="mb-2">
            <span className="text-6xl font-thin text-foreground tracking-tight tabular-nums">
              {formatHandicap(handicapIndex)}
            </span>
          </div>
          
          {/* Meta line */}
          {lastUpdatedAt && (
            <p className="text-[13px] text-muted-foreground">
              Last edited {formatDate(lastUpdatedAt)}{isOwnProfile ? ' · By you' : ''}
            </p>
          )}

          {/* Edit CTA — standalone centered */}
          {isOwnProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 mt-3 text-[0.8125rem] font-medium text-muted-foreground min-h-[44px] active:scale-95 transition-transform"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit handicap
            </button>
          )}
        </div>
      ) : (
        // Empty State — Cardless
        <div className="pb-8">
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-4">
              <Target className="h-7 w-7 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isOwnProfile ? 'Add Your Handicap' : 'No Handicap Set'}
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {isOwnProfile 
                ? 'Track your handicap index to see your progress over time'
                : "This golfer hasn't added their handicap yet"
              }
            </p>
            {isOwnProfile && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-colors min-h-[44px] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Add Handicap
              </button>
            )}
          </div>
        </div>
      )}

      {/* Faded Divider */}
      {isOwnProfile && (
        <div className="mb-8">
          <div className="h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--border)) 30%, hsl(var(--border)) 70%, transparent)' }} />
        </div>
      )}

      {/* Official Sync Callout — Premium tinted section, no card */}
      {isOwnProfile && (
        <div className="rounded-2xl px-5 py-5 border-l-[3px] border-amber-400/60" style={{ backgroundColor: 'hsla(38, 92%, 50%, 0.04)' }}>
          <div className="flex gap-4">
            {/* Icon — gold gradient square */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Official handicap sync coming soon!
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                We're currently finalising integrations with the relevant golfing authorities in your region. At the moment, your governing body appears to still be completing its onboarding process – a little slow off the tee!
                <br /><br />
                Once everything is live, your handicap will update automatically in real time across clbhouz.
              </p>
              
              {/* CTA */}
              {!hasRegisteredInterest ? (
                <button
                  onClick={handleRegisterInterest}
                  disabled={isRegistering}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[1.5px] text-amber-500 min-h-[44px] active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isRegistering ? 'Saving...' : (
                    <>
                      Get early access
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600">
                  <Check className="h-4 w-4" />
                  You're on the list
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {isOwnProfile && (
        <ManualHandicapModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          currentHandicap={handicapIndex}
          userId={userId}
          onSaved={handleHandicapSaved}
        />
      )}
    </div>
  );
};

export default ProfileHandicapView;
