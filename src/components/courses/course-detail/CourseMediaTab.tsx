import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Play, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';

interface CourseMediaTabProps {
  courseId: string;
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

const CourseMediaTab = ({ courseId }: CourseMediaTabProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['course-media', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-club-media', {
        body: { clubId: courseId, limit: 30 }
      });

      if (error) throw error;
      return data?.media || [];
    },
    enabled: !!courseId,
  });

  const openMediaViewer = (media: MediaItem, index: number) => {
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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mediaItems.map((media, index) => (
          <div
            key={media.id}
            className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
            onClick={() => openMediaViewer(media, index)}
          >
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt={'Course media'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-media-loading animate-pulse flex items-center justify-center">
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-3">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Overlay with user info */}
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
                <div className="bg-black/50 rounded-full p-1">
                  <Play className="h-4 w-4 text-white fill-white" />
                </div>
              ) : (
                <div className="bg-black/50 rounded-full p-1">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Media Viewer Modal */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedMedia && (
            <div className="relative">
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt={'Course media'}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  className="w-full h-auto max-h-[80vh]"
                  autoPlay
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CourseMediaTab;