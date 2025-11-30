import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Top100Pills from '@/components/courses/Top100Pills';

interface Top100OverlayPillsProps {
  courseId?: string;
  className?: string;
}

export const Top100OverlayPills: React.FC<Top100OverlayPillsProps> = ({ courseId, className }) => {
  const { data: memberships } = useQuery({
    queryKey: ['course-top100-memberships', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select(`
          rank,
          list_id,
          top100_lists!inner (
            id,
            slug,
            name,
            short_label
          )
        `)
        .eq('course_id', courseId)
        .order('rank', { ascending: true });

      if (error) throw error;

      return (data || []).map(membership => ({
        list_id: membership.list_id,
        list_slug: (membership.top100_lists as any).slug,
        list_name: (membership.top100_lists as any).name,
        short_label: (membership.top100_lists as any).short_label,
        rank: membership.rank,
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (!memberships || memberships.length === 0) return null;

  return (
    <div className={className}>
      <Top100Pills
        memberships={memberships}
        variant="overlay"
        size="sm"
        courseId={courseId}
      />
    </div>
  );
};
