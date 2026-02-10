import React from 'react';
import { cn } from '@/lib/utils';
import { Users, MessageCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommunityEmptyStateProps {
  variant: 'no-community' | 'quiet' | 'no-results';
  className?: string;
  onClearFilter?: () => void;
}

/**
 * CommunityEmptyState - Empty states for Community tab
 * Polish 7: Premium empty states with consistent design system
 */
export const CommunityEmptyState: React.FC<CommunityEmptyStateProps> = ({
  variant,
  className,
  onClearFilter,
}) => {
  const navigate = useNavigate();

  if (variant === 'no-community') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-6", className)}>
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-gray-200" />
        </div>
        <h3 className="text-base font-semibold text-gray-600 mb-1">
          Your community is empty
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-[260px] mb-6">
          Follow golfers or connect with friends to see their posts here
        </p>
        <button
          onClick={() => navigate('/golferstofollow')}
          className="rounded-full bg-emerald-600 text-white text-sm font-medium px-6 py-2.5 active:scale-[0.97] transition-transform"
        >
          Discover golfers
        </button>
      </div>
    );
  }

  if (variant === 'no-results') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-6", className)}>
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-gray-200" />
        </div>
        <h3 className="text-base font-semibold text-gray-600 mb-1">
          No posts found
        </h3>
        <p className="text-sm text-gray-400 text-center mb-6">
          Try another filter or search
        </p>
        {onClearFilter && (
          <button
            onClick={onClearFilter}
            className="rounded-full bg-emerald-600 text-white text-sm font-medium px-6 py-2.5 active:scale-[0.97] transition-transform"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  // quiet variant
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6", className)}>
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <MessageCircle className="w-6 h-6 text-gray-200" />
      </div>
      <h3 className="text-base font-semibold text-gray-600 mb-1">
        It's quiet here
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-[260px] mb-6">
        Your community hasn't posted yet — be the first to share
      </p>
      <button
        onClick={() => navigate('/create-moment')}
        className="rounded-full bg-emerald-600 text-white text-sm font-medium px-6 py-2.5 active:scale-[0.97] transition-transform"
      >
        Share a moment
      </button>
    </div>
  );
};

export default CommunityEmptyState;
