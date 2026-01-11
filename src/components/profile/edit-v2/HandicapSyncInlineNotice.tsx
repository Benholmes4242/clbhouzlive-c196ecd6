import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface HandicapSyncInlineNoticeProps {
  userId: string;
  hasRegisteredInterest: boolean;
}

const HandicapSyncInlineNotice: React.FC<HandicapSyncInlineNoticeProps> = ({
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
    <div className="flex items-center gap-3 py-2 px-3 bg-[#F8FAFC] border border-border rounded-sq-sm mt-2">
      <Zap className="h-4 w-4 text-primary-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">
          Automatic handicap updates launching soon.
        </span>
      </div>
      {isRegistered ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5" />
          Early access registered
        </span>
      ) : (
        <button
          type="button"
          onClick={handleRegisterInterest}
          disabled={isLoading}
          className="text-xs font-medium px-3 py-1 rounded-full bg-[#E2E8F0] text-foreground hover:bg-slate-300 whitespace-nowrap disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Registering...' : 'Get early access'}
        </button>
      )}
    </div>
  );
};

export default HandicapSyncInlineNotice;
