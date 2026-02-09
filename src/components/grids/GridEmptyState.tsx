/**
 * GridEmptyState - Empty state component for content grids
 * Uses Hub design system with gradient icon containers
 */

import { ImageIcon, Film, Video, Users } from 'lucide-react';
import { ContentFilter, GridEmptyStateConfig } from './types';

interface GridEmptyStateProps {
  filter: ContentFilter;
  canCreate?: boolean;
  onCreatePost?: () => void;
  config?: GridEmptyStateConfig;
  profileType: 'personal' | 'business';
  profileName?: string;
  isTaggedTab?: boolean;
}

const DEFAULT_CONFIG: Record<ContentFilter, { icon: typeof ImageIcon; title: string; description: string; ctaLabel?: string }> = {
  all: {
    icon: ImageIcon,
    title: 'No posts yet',
    description: 'Share your first update.',
    ctaLabel: 'Create your first post',
  },
  longform: {
    icon: Film,
    title: 'No long-form videos yet',
    description: 'Videos over 4 minutes will appear here.',
    ctaLabel: 'Upload a video',
  },
  shorts: {
    icon: Video,
    title: 'No shorts yet',
    description: 'Short videos under 4 minutes will appear here.',
    ctaLabel: 'Create a short',
  },
  images: {
    icon: ImageIcon,
    title: 'No images yet',
    description: 'Photos and images will appear here.',
    ctaLabel: 'Share an image',
  },
};

const TAGGED_CONFIG: Record<ContentFilter, { icon: typeof ImageIcon; title: string; description: string }> = {
  all: {
    icon: Users,
    title: 'No tagged posts yet',
    description: "When golfers tag {name}, you'll see it here.",
  },
  longform: {
    icon: Film,
    title: 'No long-form videos yet',
    description: 'No long-form videos have tagged {name} yet.',
  },
  shorts: {
    icon: Video,
    title: 'No shorts yet',
    description: 'No shorts have tagged {name} yet.',
  },
  images: {
    icon: ImageIcon,
    title: 'No images yet',
    description: 'No image posts have tagged {name} yet.',
  },
};

export function GridEmptyState({
  filter,
  canCreate,
  onCreatePost,
  config,
  profileType,
  profileName,
  isTaggedTab,
}: GridEmptyStateProps) {
  const defaultConfig = isTaggedTab ? TAGGED_CONFIG[filter] : DEFAULT_CONFIG[filter];
  const Icon = defaultConfig.icon;
  
  const title = config?.title || defaultConfig.title;
  const description = (config?.description || defaultConfig.description).replace('{name}', profileName || 'this profile');
  const ctaLabel = config?.ctaLabel || ('ctaLabel' in defaultConfig ? (defaultConfig as any).ctaLabel : undefined);
  const showCTA = config?.showCTA ?? (canCreate && !isTaggedTab);
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Icon in circle - semantic tokens */}
      <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      
      <h3 className="text-base font-semibold text-foreground mb-1 text-center">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground text-center max-w-[280px] mb-5">
        {description}
      </p>
      
      {showCTA && onCreatePost && ctaLabel && (
        <button
          onClick={onCreatePost}
          className="px-5 py-3 min-h-[44px] bg-[#334E3D] text-white text-sm font-medium rounded-full hover:bg-[#2a4032] transition-colors active:scale-[0.97] transition-transform"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
