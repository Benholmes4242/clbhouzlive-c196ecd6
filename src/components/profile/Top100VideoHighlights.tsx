import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Play, MapPin } from 'lucide-react';

interface VideoHighlight {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  course_name: string;
  course_location: string;
  course_rank: number;
  media_url: string;
}

interface Top100VideoHighlightsProps {
  userId?: string;
}

const Top100VideoHighlights: React.FC<Top100VideoHighlightsProps> = ({ userId }) => {
  const { data: videoHighlights = [], isLoading } = useQuery({
    queryKey: ['top100VideoHighlights', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner (
            media_url,
            media_type
          ),
          post_tags!inner (
            taggable_entities!inner (
              name,
              entity_id,
              entity_type
            )
          )
        `)
        .eq('user_id', userId)
        .eq('post_media.media_type', 'video')
        .eq('post_tags.taggable_entities.entity_type', 'golf_club')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching video highlights:', error);
        return [];
      }

      // Filter for posts tagged with top 100 courses and get user details
      const processedHighlights: VideoHighlight[] = [];
      
      for (const post of data || []) {
        // Get course details to check ranking
        const courseId = post.post_tags[0]?.taggable_entities?.entity_id;
        if (!courseId) continue;

        const { data: courseData } = await supabase
          .from('golf_courses')
          .select('name, global_rank, regional_rank, usa_rank, country, region, sub_country')
          .eq('id', courseId)
          .single();

        // Check if course is in top 100 of any ranking
        const isTop100 = courseData && (
          (courseData.global_rank && courseData.global_rank <= 100) ||
          (courseData.regional_rank && courseData.regional_rank <= 100) ||
          (courseData.usa_rank && courseData.usa_rank <= 100)
        );

        if (!isTop100) continue;

        // Create location string
        const location = [courseData?.sub_country, courseData?.region, courseData?.country]
          .filter(Boolean)
          .join(', ');

        processedHighlights.push({
          id: post.id,
          content: post.content || '',
          created_at: post.created_at,
          user_id: post.user_id,
          course_name: courseData?.name || 'Unknown Course',
          course_location: location || 'Unknown Location',
          course_rank: courseData?.global_rank || courseData?.regional_rank || courseData?.usa_rank || 0,
          media_url: post.post_media[0]?.media_url || ''
        });

        if (processedHighlights.length >= 3) break;
      }

      return processedHighlights;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-[8px] px-4 py-3 border border-white/30">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-lg text-white">Latest Highlights</h3>
            <p className="text-white/80 text-sm">Recent videos from Top 100 courses</p>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-16 h-12 bg-white/20 rounded"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-white/20 rounded mb-1"></div>
                    <div className="h-2 bg-white/20 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-[8px] px-4 py-3 border border-white/30">
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-lg text-white">Latest Highlights</h3>
          <p className="text-white/80 text-sm">Recent videos from Top 100 courses</p>
        </div>
        
        {videoHighlights.length > 0 ? (
          <div 
            className="max-h-32 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent space-y-2"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}
          >
            {videoHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className="flex items-center gap-3 p-2 rounded-lg border bg-white/10 border-white/30 hover:bg-white/15 transition-colors cursor-pointer"
              >
                {/* Video Thumbnail */}
                <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                  <video 
                    src={highlight.media_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400"></div>
                        <span className="text-sm text-white font-medium truncate">
                          {highlight.course_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/70">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{highlight.course_location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Play className="w-8 h-8 text-white/40 mx-auto mb-2" />
            <p className="text-white/60 text-sm">No video highlights yet</p>
            <p className="text-white/40 text-xs">Be the first to share a moment!</p>
          </div>
        )}
        
        {videoHighlights.length > 0 && (
          <>
            {/* Scroll indicator gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/10 to-transparent pointer-events-none rounded-b-lg"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default Top100VideoHighlights;