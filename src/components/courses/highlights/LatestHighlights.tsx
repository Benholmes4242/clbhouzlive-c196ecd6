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
  averageRating?: number | null;
  filterId?: string | null;
}

interface LatestHighlightsProps {
  userId: string;
  isOwnProfile?: boolean;
  userFirstName?: string;
}

const LatestHighlights: React.FC<LatestHighlightsProps> = ({
  userId,
  isOwnProfile,
  userFirstName
}) => {
  const [highlights, setHighlights] = useState<HighlightVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserVideoHighlights = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // Get all posts with video media (no limit for infinite carousel)
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            course_id,
            badges,
            post_media!inner (
              id,
              media_type,
              media_url,
              filter_id,
              studio_edits
            )
          `)
          .eq('user_id', userId)
          .eq('post_media.media_type', 'video')
          .order('created_at', { ascending: false });

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

        // Collect course IDs from both tags AND course_id FK
        const courseIdsFromTags = tags?.map(tag => tag.taggable_entities.entity_id) || [];
        const courseIdsFromPosts = posts.map(p => p.course_id).filter(Boolean) as string[];
        const courseIds = [...new Set([...courseIdsFromTags, ...courseIdsFromPosts])];
        
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
          .in('id', courseIds)
          .or('global_rank.not.is.null,regional_rank.not.is.null,usa_rank.not.is.null'); // Only top 100 courses

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
          return;
        }

        // Get average ratings for these courses
        const { data: ratingStats, error: ratingsError } = await supabase
          .from('course_rating_aggregates')
          .select('course_id, avg_overall_score')
          .in('course_id', courseIds);

        if (ratingsError) {
          console.error('Error fetching course ratings:', ratingsError);
        }

        // Combine the data and filter for posts that have golf course tags
        const transformedHighlights: HighlightVideo[] = posts
          .map(post => {
            // Find the tag for this post (or use course_id FK)
            const postTag = tags?.find(tag => tag.post_id === post.id);
            const courseIdToUse = postTag?.taggable_entities.entity_id || post.course_id;
            if (!courseIdToUse) return null;

            // Find the course details
            const course = courses?.find(c => c.id === courseIdToUse);
            if (!course) return null;

            const media = post.post_media[0];

            // Format location
            const getLocation = () => {
              const baseLocation = course.country || course.sub_country || course.region || 'Unknown Location';
              if (course.regional_rank) {
                return `${baseLocation} #${course.regional_rank}`;
              }
              return baseLocation;
            };

            // Find the course rating stats
            const courseRating = ratingStats?.find(r => r.course_id === course.id);

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
              country: course.country,
              averageRating: courseRating?.avg_overall_score ? Math.round(courseRating.avg_overall_score * 10) / 10 : null,
              filterId: media?.filter_id ?? (media?.studio_edits as any)?.filter ?? null,
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
      <div className="py-4">
        <div className="mb-1 px-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">Highlights</h2>
          <p className="text-muted-foreground">Loading your golf highlights...</p>
        </div>
      </div>
    );
  }

  if (!highlights.length) {
    return (
      <div className="py-4">
        <div className="mb-1 px-4">
        </div>
        <div className="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-8 text-center mt-4 mx-4">
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
    <div className="relative">
      <DepthStackCarousel
        highlights={highlights}
        onVideoPlay={handleVideoPlay}
        userId={userId}
        userFirstName={userFirstName}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
};

export default LatestHighlights;