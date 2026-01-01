import React from 'react';
import { Video, Image, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PostPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onPostSelect: (postId: string) => void;
  mode: 'featured' | 'pin';
  excludePostIds?: string[];
}

interface PostItem {
  id: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
  content?: string;
}

/**
 * Post Picker Sheet for selecting featured video or posts to pin
 */
export function PostPickerSheet({ 
  open, 
  onOpenChange, 
  userId, 
  onPostSelect,
  mode,
  excludePostIds = []
}: PostPickerSheetProps) {
  // Fetch user's posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['user-posts-picker', userId, mode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          badges,
          post_media (
            id,
            media_url,
            media_type,
            poster_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data
        .filter(post => post.post_media && post.post_media.length > 0)
        .map(post => {
          const media = post.post_media?.[0];
          return {
            id: post.id,
            thumbnailUrl: media?.poster_url || media?.media_url,
            mediaType: (media?.media_type as 'image' | 'video') || 'image',
            content: post.content,
          } as PostItem;
        })
        .filter(post => !excludePostIds.includes(post.id));
    },
    enabled: open && !!userId,
  });

  // For featured mode, filter to only videos
  const filteredPosts = mode === 'featured' 
    ? posts?.filter(p => p.mediaType === 'video')
    : posts;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center text-[#1F2428]">
            {mode === 'featured' ? 'Select a video to feature' : 'Select a post to pin'}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-[#F7931E] border-t-transparent rounded-full" />
          </div>
        ) : filteredPosts && filteredPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 overflow-y-auto pb-6">
            {filteredPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => onPostSelect(post.id)}
                className="relative aspect-square rounded-sq-sm overflow-hidden bg-[#EDEFF2] hover:opacity-90 transition-opacity group"
                style={{ border: '1px solid rgba(31,36,40,0.08)' }}
              >
                {post.thumbnailUrl ? (
                  <img 
                    src={post.thumbnailUrl} 
                    alt="Post" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {post.mediaType === 'video' ? (
                      <Video className="h-8 w-8 text-[#97A1AA]" />
                    ) : (
                      <Image className="h-8 w-8 text-[#97A1AA]" />
                    )}
                  </div>
                )}

                {/* Media type indicator */}
                <span 
                  className="absolute bottom-1 right-1 flex items-center justify-center w-5 h-5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                >
                  {post.mediaType === 'video' ? (
                    <Video className="h-2.5 w-2.5 text-white" />
                  ) : (
                    <Image className="h-2.5 w-2.5 text-white" />
                  )}
                </span>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#F7931E]/0 group-hover:bg-[#F7931E]/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <Check className="h-4 w-4 text-[#F7931E]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#EDEFF2' }}
            >
              {mode === 'featured' ? (
                <Video className="h-6 w-6 text-[#97A1AA]" />
              ) : (
                <Image className="h-6 w-6 text-[#97A1AA]" />
              )}
            </div>
            <p className="text-sm font-medium text-[#1F2428] mb-1">
              {mode === 'featured' ? 'No videos found' : 'No posts found'}
            </p>
            <p className="text-xs text-[#97A1AA]">
              {mode === 'featured' 
                ? 'Upload a video to feature it on your profile'
                : 'Create a post to pin it to your profile'
              }
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default PostPickerSheet;
