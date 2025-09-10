import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Play, Image as ImageIcon, X } from 'lucide-react';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';

interface CourseMediaTabProps {
  courseId: string;
  portalTarget?: HTMLElement | null;
}

interface MediaItem {
  id: string;
  source: 'post' | 'review';
  sourceId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
  };
}

const CourseMediaTab = ({ courseId, portalTarget }: CourseMediaTabProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['course-media', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-club-media', {
        body: { clubId: courseId, limit: 30 }
      });

      if (error) throw error;
      return data?.edges || [];
    },
    enabled: !!courseId,
  });

  const openMediaViewer = (media: MediaItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMedia(media);
    setSelectedIndex(index);
  };

  const getUserDisplayName = (media: MediaItem) => {
    return media.author.displayName;
  };

  const getUserInitials = (media: MediaItem) => {
    const name = media.author.displayName;
    if (name === 'Anonymous') return 'A';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No media yet</h3>
        <p className="text-muted-foreground">Share photos and videos of this course in your posts or reviews!</p>
      </div>
    );
  }

  const renderLightbox = () => {
    if (!selectedMedia) return null;

    const lightboxContent = (
      <div className="fixed inset-0 z-[1001] bg-black/85 flex items-center justify-center p-4">
        <div className="relative max-w-[90vw] max-h-[90vh] bg-black rounded-lg overflow-hidden">
          {/* Close button */}
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Media content */}
          {selectedMedia.type === 'image' ? (
            <img
              src={selectedMedia.url}
              alt="Course media"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              key={selectedMedia.url}
              src={selectedMedia.url}
              poster={selectedMedia.thumbnailUrl}
              controls
              playsInline
              preload="metadata"
              className="max-w-full max-h-full"
            />
          )}

          {/* User info overlay */}
          <div className="absolute bottom-4 left-4 bg-black/80 rounded-lg p-3 text-white">
            <div className="flex items-center gap-3">
              <OptimizedAvatar
                src={selectedMedia.author.avatarUrl}
                alt={getUserDisplayName(selectedMedia)}
                size={32}
                className="w-8 h-8"
                fallback={getUserInitials(selectedMedia)}
              />
              <div>
                <p className="font-medium">{getUserDisplayName(selectedMedia)}</p>
                <p className="text-sm opacity-80">@{selectedMedia.author.username || 'user'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Backdrop click to close */}
        <div 
          className="absolute inset-0 -z-10"
          onClick={() => setSelectedMedia(null)}
        />
      </div>
    );

    // Use portal if target is provided, otherwise render normally
    return portalTarget ? createPortal(lightboxContent, portalTarget) : lightboxContent;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mediaItems.map((media, index) => (
          <button
            key={media.id}
            type="button"
            className="relative aspect-[4/5] bg-muted rounded-xl overflow-hidden group hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={(e) => openMediaViewer(media, index, e)}
            aria-label={media.type === 'video' ? 'Play video' : 'View image'}
          >
            {/* Always show thumbnail/image for both types */}
            <img
              src={media.thumbnailUrl || media.url}
              alt="Course media"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Video play icon overlay */}
            {media.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </div>
            )}

            {/* User info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2">
                <OptimizedAvatar
                  src={media.author.avatarUrl}
                  alt={getUserDisplayName(media)}
                  size={24}
                  className="w-6 h-6"
                  fallback={getUserInitials(media)}
                />
                <span className="text-white text-sm font-medium truncate">
                  @{media.author.username || 'user'}
                </span>
              </div>
            </div>

            {/* Media type indicator */}
            <div className="absolute top-2 right-2">
              {media.type === 'video' ? (
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-1">
                  <Play className="h-4 w-4 text-white fill-white" />
                </div>
              ) : (
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-1">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {renderLightbox()}
    </>
  );
};

export default CourseMediaTab;