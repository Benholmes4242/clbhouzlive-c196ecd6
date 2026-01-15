import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Zap, Check, Target } from 'lucide-react';
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
  
  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Early access state
  const [hasRegisteredInterest, setHasRegisteredInterest] = useState(
    profile?.handicap_sync_interest ?? false
  );
  const [isRegistering, setIsRegistering] = useState(false);

  const handicapIndex = profile?.eg_handicap_index ?? null;
  const lastUpdatedAt = profile?.updated_at;

  const formatHandicap = (value: number | null): string => {
    if (value === null) return '—';
    // Handle plus handicaps (negative numbers)
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
    toast.success("You're on the list!");
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
  };

  const handleHandicapSaved = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
  };

  // Loading skeleton
  if (!profile) {
    return (
      <div className="px-4 py-6 space-y-6">
        {/* Handicap Card Skeleton */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
          <div className="h-12 w-20 bg-slate-200 rounded mb-3" />
          <div className="h-4 w-40 bg-slate-100 rounded" />
        </div>
        
        {/* Promo Card Skeleton */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-[#e2e8f0] p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-8 w-28 bg-slate-200 rounded-full mt-3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <ScrollToTopGlass />

      {/* Handicap Display Card */}
      {handicapIndex !== null ? (
        // Populated State
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
          {/* Header */}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-3">
            Handicap Index
          </p>
          
          {/* Handicap Number */}
          <div className="mb-3">
            <span className="text-5xl font-bold text-[#1e293b] tracking-tight">
              {formatHandicap(handicapIndex)}
            </span>
          </div>
          
          {/* Meta Info */}
          {lastUpdatedAt && isOwnProfile && (
            <p className="text-sm text-[#64748b] mb-4">
              Last edited {formatDate(lastUpdatedAt)} · Added by you
            </p>
          )}
          
          {/* Edit Button - Only for own profile */}
          {isOwnProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit handicap
            </button>
          )}
        </div>
      ) : (
        // Empty State
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-4">
              <Target className="h-7 w-7 text-amber-500" />
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-[#1e293b] mb-2">
              {isOwnProfile ? 'Add Your Handicap' : 'No Handicap Set'}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-[#64748b] mb-5 max-w-xs">
              {isOwnProfile 
                ? 'Track your handicap index to see your progress over time'
                : "This golfer hasn't added their handicap yet"
              }
            </p>
            
            {/* CTA - Only for own profile */}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] text-white text-sm font-medium rounded-full hover:bg-[#334155] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Handicap
              </button>
            )}
          </div>
        </div>
      )}

      {/* Official Handicap Sync Promo Card - Only show for own profile */}
      {isOwnProfile && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-[#e2e8f0] p-5">
          {/* Header Row */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#1e293b] mb-1">
                Official handicap sync — launching soon
              </h4>
              <p className="text-sm text-[#64748b] leading-relaxed mb-4">
                We're finalising connections with official handicap authorities. Once live, your handicap will update automatically across clbhouz.
              </p>
              
              {/* CTA */}
              <div>
                {!hasRegisteredInterest ? (
                  <button
                    onClick={handleRegisterInterest}
                    disabled={isRegistering}
                    className="inline-flex items-center px-4 py-2 bg-white border border-[#e2e8f0] text-sm font-medium text-[#1e293b] rounded-full shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? 'Saving...' : 'Get early access'}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full">
                    <Check className="h-4 w-4" />
                    You're on the list
                  </div>
                )}
              </div>
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
