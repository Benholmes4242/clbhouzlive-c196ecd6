import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Top100Highlight {
  id: string;
  content: string | null;
  created_at: string;
  post_media: {
    id: string;
    media_type: string;
    media_url: string;
  }[];
  golf_course: {
    id: string;
    name: string;
    country: string;
    global_rank: number | null;
    regional_rank: number | null;
    usa_rank: number | null;
  };
}

export const useTop100Highlights = (userId: string) => {
  const { data: highlights = [], isLoading, error } = useQuery({
    queryKey: ['top100Highlights', userId],
    queryFn: async () => {
      if (!userId) return [];

      // First, get posts by this user that have media and golf club tags
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          post_media (
            id,
            media_type,
            media_url
          ),
          post_tags (
            taggable_entities (
              entity_id,
              entity_type
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get all golf club entity IDs from the posts
      const golfClubEntityIds = new Set<string>();
      data.forEach(post => {
        post.post_tags?.forEach(tag => {
          if (tag.taggable_entities?.entity_type === 'golf_club') {
            golfClubEntityIds.add(tag.taggable_entities.entity_id);
          }
        });
      });

      if (golfClubEntityIds.size === 0) {
        return [];
      }

      // Get golf course data for these entity IDs
      const { data: golfCourses, error: coursesError } = await supabase
        .from('golf_courses')
        .select('id, name, country, global_rank, regional_rank, usa_rank')
        .in('id', Array.from(golfClubEntityIds))
        .or('global_rank.lte.100,regional_rank.lte.100,usa_rank.lte.100');

      if (coursesError) {
        console.error('Error fetching golf courses:', coursesError);
        return [];
      }

      // Create a map of golf course ID to course data
      const courseMap = new Map();
      golfCourses?.forEach(course => {
        courseMap.set(course.id, course);
      });

      // Transform the data to create highlights
      const transformedData: Top100Highlight[] = [];
      
      data.forEach(post => {
        if (post.post_media && post.post_media.length > 0) {
          // Find golf club tags and check if any correspond to Top-100 courses
          post.post_tags?.forEach(tag => {
            if (tag.taggable_entities?.entity_type === 'golf_club') {
              const courseData = courseMap.get(tag.taggable_entities.entity_id);
              if (courseData) {
                // Check if this course is actually in a Top-100 list
                const isTop100 = (
                  (courseData.global_rank && courseData.global_rank <= 100) ||
                  (courseData.regional_rank && courseData.regional_rank <= 100) ||
                  (courseData.usa_rank && courseData.usa_rank <= 100)
                );

                if (isTop100) {
                  transformedData.push({
                    id: post.id,
                    content: post.content,
                    created_at: post.created_at,
                    post_media: post.post_media,
                    golf_course: courseData
                  });
                }
              }
            }
          });
        }
      });

      // Remove duplicates (in case a post has multiple golf course tags)
      const uniqueHighlights = transformedData.filter((highlight, index, array) => 
        array.findIndex(h => h.id === highlight.id) === index
      );

      return uniqueHighlights;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    highlights,
    isLoading,
    error
  };
};