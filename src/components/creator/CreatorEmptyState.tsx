import { Film, Video, ImageIcon, Grid3X3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreatorEmptyStateProps {
  filter: 'all' | 'longform' | 'shorts' | 'images';
  isTaggedTab: boolean;
  creatorName: string;
  canCreate: boolean;
  onCreatePost?: () => void;
}

const CONFIG = {
  all: {
    icon: Grid3X3,
    title: 'No posts yet',
    description: 'Share your first update with your audience.',
    taggedDescription: 'When golfers tag {name}, posts will appear here.',
    cta: 'Create your first post',
  },
  longform: {
    icon: Film,
    title: 'No long-form videos yet',
    description: 'Videos over 4 minutes will appear here.',
    taggedDescription: 'No long-form videos have tagged {name} yet.',
    cta: 'Upload a video',
  },
  shorts: {
    icon: Video,
    title: 'No shorts yet',
    description: 'Short videos under 4 minutes will appear here.',
    taggedDescription: 'No shorts have tagged {name} yet.',
    cta: 'Create a short',
  },
  images: {
    icon: ImageIcon,
    title: 'No images yet',
    description: 'Photos and images will appear here.',
    taggedDescription: 'No image posts have tagged {name} yet.',
    cta: 'Share an image',
  },
};

export function CreatorEmptyState({
  filter,
  isTaggedTab,
  creatorName,
  canCreate,
  onCreatePost,
}: CreatorEmptyStateProps) {
  const config = CONFIG[filter];
  const Icon = isTaggedTab ? Users : config.icon;
  const description = isTaggedTab 
    ? config.taggedDescription.replace('{name}', creatorName)
    : config.description;
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Gradient icon circle - Hub standard */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-7 h-7 text-[#64748b]" />
      </div>
      
      <h3 className="text-base font-semibold text-[#1e293b] mb-1.5 text-center">
        {config.title}
      </h3>
      
      <p className="text-sm text-[#64748b] text-center max-w-[280px] mb-5">
        {description}
      </p>
      
      {canCreate && !isTaggedTab && onCreatePost && (
        <Button
          onClick={onCreatePost}
          className="rounded-full bg-[#1e293b] hover:bg-[#334155] text-white px-6"
        >
          {config.cta}
        </Button>
      )}
    </div>
  );
}
