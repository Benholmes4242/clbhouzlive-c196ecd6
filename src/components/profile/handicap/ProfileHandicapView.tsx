import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

interface ProfileHandicapViewProps {
  userId: string;
  profile: {
    eg_handicap_index?: number | null;
    handicap_sync_interest?: boolean | null;
    updated_at?: string | null;
    [key: string]: any;
  };
  isOwnProfile: boolean;
}

const ProfileHandicapView: React.FC<ProfileHandicapViewProps> = ({
  userId,
  profile,
  isOwnProfile,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRegistered, setIsRegistered] = useState(profile?.handicap_sync_interest ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const handicapIndex = profile?.eg_handicap_index ?? null;
  const lastUpdatedAt = handicapIndex != null ? profile?.updated_at ?? null : null;

  const formatHandicap = (hcp: number): string => {
    if (hcp < 0) return `+${Math.abs(hcp).toFixed(1)}`;
    return hcp.toFixed(1);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleRegisterInterest = async () => {
    if (isRegistered || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          handicap_sync_interest: true,
          handicap_sync_interest_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setIsRegistered(true);
      toast.success("You're registered. We'll email you as soon as official sync goes live.");
      
      queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
    } catch (error) {
      console.error('Error registering interest:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Empty state - no handicap set
  if (handicapIndex === null) {
    return (
      <div className="px-6 py-8">
        <ScrollToTopGlass />
        
        {/* Hero section - empty state */}
        <section className="mb-12">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Handicap Index
          </p>
          <p className="text-5xl font-semibold text-muted-foreground/40 mb-2">
            —
          </p>
          <p className="text-sm text-muted-foreground">
            {isOwnProfile ? 'No handicap set' : "This golfer hasn't added their handicap yet"}
          </p>
          
          {isOwnProfile && (
          <button
            onClick={() => navigate('/edit-profile?tab=basic')}
            className="mt-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
              Add handicap
            </button>
          )}
        </section>

        {/* Official sync section - own profile only */}
        {isOwnProfile && (
          <>
            <div className="h-px bg-border mb-10" />
            
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Official handicap sync — launching soon
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                We're finalising connections with official handicap authorities. 
                Once live, your handicap will update automatically across clbhouz.
              </p>
            </section>

            <section className="flex justify-center">
              <Button
                onClick={handleRegisterInterest}
                disabled={isRegistered || isLoading}
                variant={isRegistered ? 'secondary' : 'default'}
                className={isRegistered ? 'gap-2 pointer-events-none opacity-70' : ''}
              >
                {isRegistered ? (
                  <>
                    <Check className="h-4 w-4" />
                    You're on the list
                  </>
                ) : (
                  'Get early access'
                )}
              </Button>
            </section>
          </>
        )}
      </div>
    );
  }

  // Has handicap
  return (
    <div className="px-6 py-8">
      <ScrollToTopGlass />
      
      {/* Hero metric */}
      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Handicap Index
        </p>
        <p className="text-5xl font-semibold text-foreground mb-1">
          {formatHandicap(handicapIndex)}
        </p>
        {lastUpdatedAt && (
          <p className="text-sm text-muted-foreground">
            Last edited {formatDate(lastUpdatedAt)}{isOwnProfile ? ' · Added by you' : ''}
          </p>
        )}
        
        {isOwnProfile && (
          <button
            onClick={() => navigate('/edit-profile?tab=basic')}
            className="mt-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit handicap
          </button>
        )}
      </section>

      {/* Official sync section - own profile only */}
      {isOwnProfile && (
        <>
          <div className="h-px bg-border mb-10" />
          
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Official handicap sync — launching soon
              </p>
            </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                We're finalising connections with official handicap authorities. 
                Once live, your handicap will update automatically across clbhouz.
            </p>
          </section>

          <section className="flex justify-center">
            <Button
              onClick={handleRegisterInterest}
              disabled={isRegistered || isLoading}
              variant={isRegistered ? 'secondary' : 'default'}
              className={isRegistered ? 'gap-2 pointer-events-none opacity-70' : ''}
            >
              {isRegistered ? (
                <>
                  <Check className="h-4 w-4" />
                  You're on the list
                </>
              ) : (
                'Get early access'
              )}
            </Button>
          </section>
        </>
      )}
    </div>
  );
};

export default ProfileHandicapView;
