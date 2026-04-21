import React from 'react';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import PostMeta from '@/components/posts/PostMeta';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  verified?: boolean;
}

interface AudioTrack {
  title: string;
  artist?: string;
  isOriginal?: boolean;
}

interface Tag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  start_index?: number;
  end_index?: number;
}

interface GolfCourse {
  id?: string | null;
  name?: string | null;
  region?: string | null;
  country?: string | null;
  sub_country?: string | null;
  slug?: string | null;
}

interface FeedMetaProps {
  user?: User;
  caption?: string;
  audioTrack?: AudioTrack;
  className?: string;
  /** Tags for @mentions */
  tags?: Tag[];
  /** Golf course for "Played at" row */
  golfCourse?: GolfCourse | null;
}

const FeedMeta: React.FC<FeedMetaProps> = ({ 
  user, 
  caption, 
  audioTrack,
  className,
  tags,
  golfCourse
}) => {
  return (
    <div 
      className={cn(
        "absolute bottom-[50px] left-4 right-28 z-20",
        "bg-black/20 backdrop-blur-xl border border-white/15 rounded-2xl",
        "p-4 shadow-2xl transition-all duration-300",
        className
      )}
      style={{ 
        backdropFilter: 'blur(40px) saturate(180%)',
        marginBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* User Profile Section */}
      {user && (
        <div className="flex items-center space-x-3 mb-3">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <SquircleAvatar
              src={user.avatar || null}
              alt={user.name || 'User'}
              userId={(user as any).id ?? null}
              size={48}
              hairlineRing
              ringColor="rgba(255,255,255,0.2)"
            />
          </div>
          
          {/* Display Name Only - Never show username */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span 
                className="font-bold text-white text-lg truncate" 
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                {user.name || 'Golfer'}
              </span>
              {user.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Caption + Course using PostMeta */}
      <PostMeta
        text={caption}
        tags={tags}
        golfCourse={golfCourse}
        isDark={true}
        textShadow={true}
        maxLines={2}
        showMore={true}
        className="mb-3"
      />

      {/* Music Pill */}
      {audioTrack && (
        <div 
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full max-w-full"
          style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
        >
          <Music className="w-4 h-4 text-white flex-shrink-0" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div 
              className="text-white text-sm font-medium truncate animate-marquee-if-needed"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              {audioTrack.isOriginal 
                ? `Original Audio - ${audioTrack.title}`
                : `${audioTrack.title}${audioTrack.artist ? ` - ${audioTrack.artist}` : ''}`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedMeta;