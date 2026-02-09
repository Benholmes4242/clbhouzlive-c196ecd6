import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFollow } from '@/hooks/useFollow';
import { toast } from 'sonner';

interface FollowBackButtonProps {
  actorId: string;
  actorDisplayName: string;
  isMock?: boolean;
}

export const FollowBackButton: React.FC<FollowBackButtonProps> = ({
  actorId,
  actorDisplayName,
  isMock = false,
}) => {
  const { isFollowing, busy, follow, ensureInitial } = useFollow(actorId);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && actorId) {
      ensureInitial().then(() => setInitialized(true));
    }
  }, [actorId, ensureInitial, initialized]);

  const handleFollowBack = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    if (isMock) {
      // For mock data, simulate the action
      toast.info('This is sample data');
      return;
    }
    
    try {
      await follow();
      toast.success(`You're now following ${actorDisplayName}.`);
    } catch (error) {
      toast.error("We couldn't follow them. Please try again.");
    }
  };

  // Don't show anything until we've checked the follow status
  if (!initialized || isFollowing === 'unknown') {
    return null;
  }

  // Shared base pill class for unified styling - SDS corners
  const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-3 h-7 text-[11px] font-semibold transition-colors active:scale-[0.93]";

  // Already following - show muted "Following" state with unified styling
  if (isFollowing === 'following') {
    return (
      <div className="min-h-[44px] flex items-center">
        <span className={cn(basePillClass, "border-blue-200 bg-blue-50 text-blue-500 gap-1")}>
          <Check className="h-3 w-3" />
          Following
        </span>
      </div>
    );
  }

  // Not following - show "Follow back" button with blue styling (Fix 8)
  return (
    <div className="min-h-[44px] flex items-center">
      <button
        onClick={handleFollowBack}
        disabled={busy}
        className={cn(
          basePillClass,
          "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {busy ? 'Following...' : 'Follow back'}
      </button>
    </div>
  );
};
