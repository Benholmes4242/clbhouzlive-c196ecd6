import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DepthStackCarousel from './DepthStackCarousel';

interface HighlightVideo {
  id: string;
  courseId: string;
  courseName: string;
  location: string;
  thumbnail: string;
  videoUrl?: string;
  caption: string;
  duration?: string;
  created_at: string;
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
  country: string;
}

interface LatestHighlightsProps {
  userId: string;
  isOwnProfile?: boolean;
}

const LatestHighlights: React.FC<LatestHighlightsProps> = ({
  userId,
  isOwnProfile
}) => {
  const [highlights, setHighlights] = useState<HighlightVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserVideoHighlights = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // First get the posts with video media
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            post_media!inner (
              id,
              media_type,
              media_url
            )
          `)
          .eq('user_id', userId)
          .eq('post_media.media_type', 'video')
          .order('created_at', { ascending: false })
          .limit(8);

        if (postsError) {
          console.error('Error fetching posts:', postsError);
          return;
        }

        if (!posts || posts.length === 0) {
          setHighlights([]);
          return;
        }

        // Get post tags for these posts
        const postIds = posts.map(p => p.id);
        const { data: tags, error: tagsError } = await supabase
          .from('post_tags')
          .select(`
            post_id,
            taggable_entities!inner (
              entity_type,
              entity_id,
              name
            )
          `)
          .in('post_id', postIds)
          .eq('taggable_entities.entity_type', 'golf_club');

        if (tagsError) {
          console.error('Error fetching tags:', tagsError);
          return;
        }

        // Get golf course details for tagged courses
        const courseIds = tags?.map(tag => tag.taggable_entities.entity_id) || [];
        if (courseIds.length === 0) {
          setHighlights([]);
          return;
        }

        const { data: courses, error: coursesError } = await supabase
          .from('golf_courses')
          .select(`
            id,
            name,
            country,
            sub_country,
            region,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          `)
          .in('id', courseIds);

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
          return;
        }

        // Combine the data and filter for posts that have golf course tags
        const transformedHighlights: HighlightVideo[] = posts
          .map(post => {
            // Find the tag for this post
            const postTag = tags?.find(tag => tag.post_id === post.id);
            if (!postTag) return null;

            // Find the course details
            const course = courses?.find(c => c.id === postTag.taggable_entities.entity_id);
            if (!course) return null;

            const media = post.post_media[0];

            // Format location
            const getLocation = () => {
              if (course.sub_country && course.country) {
                return `${course.sub_country}, ${course.country}`;
              }
              if (course.region && course.country) {
                return `${course.region}, ${course.country}`;
              }
              return course.country || 'Unknown Location';
            };

            const highlight: HighlightVideo = {
              id: post.id,
              courseId: course.id,
              courseName: course.name,
              location: getLocation(),
              thumbnail: media?.media_url || course.thumbnail_image || '/placeholder.svg',
              videoUrl: media?.media_url,
              caption: post.content || 'Golf moment at this amazing course',
              created_at: post.created_at,
              globalRank: course.global_rank,
              regionalRank: course.regional_rank,
              usaRank: course.usa_rank,
              country: course.country
            };

            return highlight;
          })
          .filter((highlight: HighlightVideo | null): highlight is HighlightVideo => highlight !== null);

        setHighlights(transformedHighlights);
      } catch (error) {
        console.error('Error fetching video highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVideoHighlights();
  }, [userId]);

  const handleVideoPlay = (videoId: string) => {
    console.log('Playing video:', videoId);
    // Implement video modal or navigation to video page
  };

  if (loading) {
    return (
      <div className="px-4">
        <div className="mb-1">
          <h2 className="text-2xl font-bold text-white mb-2">Latest Highlights</h2>
          <p className="text-white/70">Loading your golf highlights...</p>
        </div>
      </div>
    );
  }

  if (!highlights.length) {
    return (
      <div className="px-4">
        <div className="mb-1">
          <h2 className="text-2xl font-bold text-white mb-2">Latest Highlights</h2>
          <p className="text-white/70">
            {isOwnProfile 
              ? "Your most memorable moments from the world's greatest courses"
              : "Recent highlights from top golf courses"
            }
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-8 text-center mt-4">
          <p className="text-white/60">No video highlights available yet.</p>
          {isOwnProfile && (
            <p className="text-white/40 text-sm mt-2">
              Start posting videos at top courses to create your highlight reel!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="mb-1">
        <h2 className="text-2xl font-bold text-white mb-2">Latest Highlights</h2>
        <p className="text-white/70">
          {isOwnProfile 
            ? "Your most memorable moments from the world's greatest courses"
            : "Recent highlights from top golf courses"
          }
        </p>
      </div>
      
      <DepthStackCarousel 
        highlights={highlights}
        onVideoPlay={handleVideoPlay}
      />
      
      {/* Additional stats or info */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/60">
        <span>{highlights.length} highlights</span>
        <span>•</span>
        <span>{new Set(highlights.map(h => h.courseId)).size} courses featured</span>
        {highlights.length > 0 && (
          <>
            <span>•</span>
            <span>Top {Math.min(...highlights.map(h => h.globalRank || h.regionalRank || h.usaRank || 999))} course played</span>
          </>
        )}
      </div>
    </div>
  );
};

export default LatestHighlights;