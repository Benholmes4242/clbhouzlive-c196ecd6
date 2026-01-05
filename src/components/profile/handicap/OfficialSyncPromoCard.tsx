import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface OfficialSyncPromoCardProps {
  userId: string;
  hasRegisteredInterest: boolean;
}

const OfficialSyncPromoCard: React.FC<OfficialSyncPromoCardProps> = ({
  userId,
  hasRegisteredInterest: initialRegistered,
}) => {
  const [isRegistered, setIsRegistered] = useState(initialRegistered);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

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
      
      // Invalidate profile queries (both keys used across the app)
      queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
    } catch (error) {
      console.error('Error registering interest:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted border border-border rounded-sq-lg p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-primary-accent/10 rounded-sq-md flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-1">
            Official Handicap Sync — Launching Soon
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            We're in the final stages of connecting with official handicap authorities. 
            Once live, your handicap will update automatically across Clubhouse.
          </p>
          <Button
            onClick={handleRegisterInterest}
            disabled={isRegistered || isLoading}
            variant={isRegistered ? 'secondary' : 'default'}
            className="gap-2"
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
        </div>
      </div>
    </div>
  );
};

export default OfficialSyncPromoCard;
