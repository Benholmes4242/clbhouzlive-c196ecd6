/** Brief 50 Part D — Played it / Want to play / Rate it under the course hero,
 * plus the rate nudge when played and unrated. Signed-out: nothing. Played
 * state comes only from usePlayedCourses; want-to-play keeps the existing
 * shortlist path in useCoursePersonalStatus. */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePlayedCourses } from '@/hooks/played/usePlayedCourses';
import { useSetCoursePlayed } from '@/hooks/played/useSetCoursePlayed';
import { formatRating, isPlayed, isRated } from '@/hooks/played/playedRules';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { CheckIcon } from './PlayedIcons';
import './played.css';

export function CoursePlayedRow({ courseId, courseName }: { courseId: string; courseName: string }) {
  const navigate = useNavigate();
  const played = usePlayedCourses();
  const { toggle } = useSetCoursePlayed();
  const { setWantToPlay } = useCoursePersonalStatus(courseId);
  const userId = played.userId;
  /* Shortlist membership read on its own, because a played course's status is
     'played' and would otherwise hide a want-to-play selection. Keyed under
     course-personal-status so the existing toggle's invalidation refreshes it. */
  const shortlist = useQuery({
    queryKey: ['course-personal-status', 'shortlist', courseId, userId],
    enabled: Boolean(userId && courseId),
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('course_shortlists').select('id')
        .eq('course_id', courseId).eq('user_id', userId as string).maybeSingle();
      if (error) throw error;
      return data != null;
    },
  });
  if (!userId) return null;
  const entry = played.get(courseId);
  const isOn = isPlayed(entry);
  const rated = isRated(entry);
  const want = shortlist.data === true;
  const rate = () => {
    analyticsEvents.track('played_rate_tap', { course_id: courseId, source: 'course_page' });
    navigate(`/courses/${courseId}/rate`);
  };
  return (
    <div data-course-played-row>
      <div className="pl-acts">
        <button type="button" className="pl-act" data-on={isOn} aria-pressed={isOn}
          onClick={() => toggle(entry, courseId, courseName, 'course_page')}>
          <CheckIcon size={15} /><span>{isOn ? 'Played' : 'Played it'}</span>
        </button>
        <button type="button" className="pl-act" data-on={want} aria-pressed={want}
          onClick={() => setWantToPlay(!want)}>
          <Bookmark aria-hidden /><span>Want to play</span>
        </button>
        {rated
          ? <button type="button" className="pl-act" onClick={rate}><Star aria-hidden /><span>Rated {formatRating(entry?.rating)}</span></button>
          : <button type="button" className="pl-act" data-prim="true" onClick={rate}><Star aria-hidden /><span>Rate it</span></button>}
      </div>
      {isOn && !rated ? (
        <div className="pl-nudge" data-played-nudge>
          <div className="pl-nudge-t">
            <b>You've played {shortCoursePart(courseName)}</b>
            <small>Rate it and it counts towards the golfers' order. Takes about a minute.</small>
          </div>
          <button type="button" className="pl-solid" onClick={rate}>Rate it</button>
        </div>
      ) : null}
    </div>
  );
}
