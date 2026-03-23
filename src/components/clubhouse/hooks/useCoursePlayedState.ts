import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCoursePlayedState(courseId: string | null | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: playedData } = useQuery({
    queryKey: ['course-played', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) return null;
      const { data } = await supabase
        .from('user_top100_courses')
        .select('id, played')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!courseId && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Bucket list — localStorage keyed by courseId
  const bucketKey = courseId ? `clbhouz_bucket_${courseId}` : null;
  const [isBucket, setIsBucket] = useState(() =>
    bucketKey ? localStorage.getItem(bucketKey) === '1' : false
  );

  const isPlayed = playedData?.played ?? false;

  const togglePlayed = async () => {
    if (!courseId || !userId) return;
    const newVal = !isPlayed;
    queryClient.setQueryData(['course-played', courseId, userId], (old: any) =>
      old ? { ...old, played: newVal } : { played: newVal }
    );
    if (playedData?.id) {
      await supabase
        .from('user_top100_courses')
        .update({ played: newVal })
        .eq('id', playedData.id);
    } else {
      await supabase
        .from('user_top100_courses')
        .upsert({ course_id: courseId, user_id: userId, played: newVal });
    }
    queryClient.invalidateQueries({ queryKey: ['course-played', courseId, userId] });
  };

  const toggleBucket = () => {
    if (!bucketKey) return;
    const newVal = !isBucket;
    setIsBucket(newVal);
    if (newVal) {
      localStorage.setItem(bucketKey, '1');
    } else {
      localStorage.removeItem(bucketKey);
    }
  };

  return { isPlayed, isBucket, togglePlayed, toggleBucket };
}
