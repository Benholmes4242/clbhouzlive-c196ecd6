import React from 'react';
import { CoursePodiumSlot } from './CoursePodiumSlot';

interface Course {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url: string | null;
  avg_rating: number | null;
  times_played: number;
  rank_change: number;
}

interface Props {
  courses: Course[];
  sort: 'most_played' | 'highest_rated' | 'rising';
  seasonColor?: string;
  onCourseClick: (courseId: string) => void;
}

export const CoursePodium: React.FC<Props> = ({ courses, sort, seasonColor, onCourseClick }) => {
  if (courses.length < 3) return null;

  return (
    <div className="relative px-5 pt-4 pb-8">
      {/* Podium slots: #2, #1, #3 — flex items-start for stepped layout */}
      <div className="flex items-start justify-center gap-3">
        {/* #2 - Left */}
        <CoursePodiumSlot
          course={courses[1]}
          rank={2}
          position="left"
          sort={sort}
          seasonColor={seasonColor}
          onClick={() => onCourseClick(courses[1].course_id)}
        />

        {/* #1 - Center (largest, highest) */}
        <CoursePodiumSlot
          course={courses[0]}
          rank={1}
          position="center"
          sort={sort}
          seasonColor={seasonColor}
          showGlow
          onClick={() => onCourseClick(courses[0].course_id)}
        />

        {/* #3 - Right */}
        <CoursePodiumSlot
          course={courses[2]}
          rank={3}
          position="right"
          sort={sort}
          seasonColor={seasonColor}
          onClick={() => onCourseClick(courses[2].course_id)}
        />
      </div>
    </div>
  );
};
