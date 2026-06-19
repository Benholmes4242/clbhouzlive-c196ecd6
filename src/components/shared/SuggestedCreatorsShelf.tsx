import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSuggestedCreators } from '@/components/watch/hooks/useSuggestedCreators';
import { SuggestedCreatorCard, SuggestedCreatorCardShimmer } from './SuggestedCreatorCard';

const INK = '#0F172A';

interface SuggestedCreatorsShelfProps {
  userId: string | undefined;
  title?: string;
  variant?: 'light' | 'dark';
  showViewAll?: boolean;
  onViewAll?: () => void;
  containerStyle?: React.CSSProperties;
  /**
   * Header scale variant.
   * - 'default' (15/700): standalone page contexts (Watch, profile pages)
   * - 'search' (13/600/-0.01em): inside the search overlay, alongside other 13/600 section headers
   */
  headerScale?: 'default' | 'search';
}

export const SuggestedCreatorsShelf: React.FC<SuggestedCreatorsShelfProps> = ({
  userId,
  title = 'People to follow',
  variant = 'light',
  showViewAll = false,
  onViewAll,
  containerStyle,
  headerScale = 'default',
}) => {
  const { data: creators, isLoading } = useSuggestedCreators(userId);
  const isDark = variant === 'dark';

  // Guard: don't render if not loading and < 2 creators
  if (!isLoading && (!creators || creators.length < 1)) return null;

  const isSearchScale = headerScale === 'search';
  const headerPadding = isSearchScale ? '16px 16px 8px' : '0 16px';
  const headerMarginBottom = isSearchScale ? 4 : 14;
  const labelStyle: React.CSSProperties = isSearchScale
    ? {
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: isDark ? 'rgba(255,255,255,0.7)' : '#64748B',
      }
    : {
        fontSize: 15,
        fontWeight: 700,
        color: isDark ? 'rgba(255,255,255,0.7)' : 'hsl(var(--foreground))',
      };

  return (
    <div
      style={{
        width: '100%',
        paddingTop: isSearchScale ? 0 : 16,
        paddingBottom: 20,
        background: isDark ? 'transparent' : 'hsl(var(--background))',
        borderTop: isSearchScale
          ? 'none'
          : isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid hsl(var(--border) / 0.6)',
        borderBottom: isSearchScale || isDark ? 'none' : '1px solid hsl(var(--border) / 0.6)',
        ...containerStyle,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: headerPadding, marginBottom: headerMarginBottom }}
      >
        <span style={labelStyle}>
          {title}
        </span>
        {showViewAll && onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.005em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            See all
            <ChevronRight size={12} strokeWidth={2.4} />
          </button>
        )}
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
          padding: '0 16px 0 24px',
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
