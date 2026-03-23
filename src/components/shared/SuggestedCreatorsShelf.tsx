import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuggestedCreators } from '@/components/watch/hooks/useSuggestedCreators';
import { SuggestedCreatorCard, SuggestedCreatorCardShimmer } from './SuggestedCreatorCard';

interface SuggestedCreatorsShelfProps {
  userId: string | undefined;
  title?: string;
  variant?: 'light' | 'dark';
  showViewAll?: boolean;
  onViewAll?: () => void;
  containerStyle?: React.CSSProperties;
}

export const SuggestedCreatorsShelf: React.FC<SuggestedCreatorsShelfProps> = ({
  userId,
  title = 'People to follow',
  variant = 'light',
  showViewAll = false,
  onViewAll,
  containerStyle,
}) => {
  const { data: creators, isLoading } = useSuggestedCreators(userId);
  const isDark = variant === 'dark';

  // Guard: don't render if not loading and < 2 creators
  if (!isLoading && (!creators || creators.length < 1)) return null;

  return (
    <div
      style={{
        width: '100%',
        paddingTop: 16,
        paddingBottom: 20,
        background: isDark ? 'transparent' : 'hsl(var(--background))',
        borderTop: isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid hsl(var(--border) / 0.6)',
        borderBottom: isDark ? 'none' : '1px solid hsl(var(--border) / 0.6)',
        ...containerStyle,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '0 16px', marginBottom: 14 }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isDark ? 'rgba(255,255,255,0.7)' : 'hsl(var(--foreground))',
          }}
        >
          {title}
        </span>
      </div>

      {/* Scroll row */}
      <div
        className="flex"
        style={{
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          padding: '0 16px',
        }}
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <SuggestedCreatorCardShimmer key={i} />
            ))
          : creators?.map((creator) => (
              <SuggestedCreatorCard
                key={creator.userId}
                creator={creator}
                currentUserId={userId!}
                variant={variant}
              />
            ))}
      </div>
    </div>
  );
};
