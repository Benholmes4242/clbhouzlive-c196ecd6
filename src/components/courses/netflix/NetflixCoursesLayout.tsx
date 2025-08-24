import React, { useState, useMemo, useRef } from 'react';
import { useUserCoursesData } from '../user/useUserCoursesData';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NetflixCourseRow from './NetflixCourseRow';
import NetflixHeroBanner from './NetflixHeroBanner';
import NetflixProgressRings from './NetflixProgressRings';

interface NetflixCoursesLayoutProps {
  username?: string;
  isOwnProfile?: boolean;
  displayName?: string;
}

const NetflixCoursesLayout: React.FC<NetflixCoursesLayoutProps> = ({
  username,
  isOwnProfile = false,
  displayName
}) => {
  const {
    targetUserId,
    displayName: hookDisplayName,
    isOwnProfile: hookIsOwnProfile,
  } = useUserCoursesData(username);

  const finalDisplayName = displayName || hookDisplayName;
  const finalIsOwnProfile = isOwnProfile !== undefined ? isOwnProfile : hookIsOwnProfile;

  const { regionProgress } = useTop100CoursesData(
    targetUserId || '',
    finalIsOwnProfile
  );

  // Query to get all played courses
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['allPlayedCourses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played_date,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', targetUserId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', targetUserId);

      if (ratedError) throw ratedError;

      const combinedCourses = [
        ...(top100Data || []).map(course => ({
          ...course,
          rating: null,
          id: `top100-${course.course_id}`
        })),
        ...(ratedData || []).map(course => ({
          ...course,
          played_date: course.created_at,
          id: `rating-${course.course_id}`
        }))
      ];

      const uniqueCoursesMap = new Map();
      
      combinedCourses.forEach(course => {
        const courseId = course.course_id;
        const existing = uniqueCoursesMap.get(courseId);
        
        if (!existing) {
          uniqueCoursesMap.set(courseId, course);
        } else {
          if (course.rating !== null && course.rating !== undefined && 
              (existing.rating === null || existing.rating === undefined)) {
            uniqueCoursesMap.set(courseId, course);
          }
        }
      });

      return Array.from(uniqueCoursesMap.values());
    },
    enabled: !!targetUserId,
  });

  // Recently played courses (sorted by date)
  const recentlyPlayed = useMemo(() => {
    return [...allPlayedCourses]
      .sort((a, b) => {
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 10);
  }, [allPlayedCourses]);

  // Top 10 rated courses
  const topRatedCourses = useMemo(() => {
    return allPlayedCourses
      .filter(course => course.rating !== null && course.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);
  }, [allPlayedCourses]);

  // Courses by region
  const coursesByRegion = useMemo(() => {
    const regions = {
      'britain-ireland': allPlayedCourses.filter(course => 
        course.golf_courses?.country === 'Britain & Ireland'
      ),
      'europe': allPlayedCourses.filter(course => 
        course.golf_courses?.country === 'Continental Europe'
      ),
      'usa': allPlayedCourses.filter(course => 
        course.golf_courses?.country === 'USA'
      ),
      'worldwide': allPlayedCourses.filter(course => 
        course.golf_courses?.global_rank && course.golf_courses.global_rank <= 100
      )
    };

    return regions;
  }, [allPlayedCourses]);

  // Hero banner course (highest rated course)
  const heroCourse = useMemo(() => {
    return topRatedCourses[0] || recentlyPlayed[0];
  }, [topRatedCourses, recentlyPlayed]);

  // Refs for smooth scrolling
  const gbIrelandRef = useRef<HTMLDivElement>(null);
  const europeRef = useRef<HTMLDivElement>(null);
  const usaRef = useRef<HTMLDivElement>(null);
  const worldwideRef = useRef<HTMLDivElement>(null);

  const scrollToRegion = (region: string) => {
    const refs = {
      'britain-ireland': gbIrelandRef,
      'europe': europeRef,
      'usa': usaRef,
      'worldwide': worldwideRef
    };
    
    const ref = refs[region as keyof typeof refs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8 bg-background">
      {/* Progress Rings Section */}
      <NetflixProgressRings 
        regionProgress={Object.fromEntries(
          Object.entries(regionProgress).map(([key, progress]) => [
            key, 
            { 
              ...progress, 
              percentage: progress.total > 0 ? (progress.played / progress.total) * 100 : 0 
            }
          ])
        )}
        onRegionClick={scrollToRegion}
      />

      {/* Recently Played Row */}
      {recentlyPlayed.length > 0 && (
        <NetflixCourseRow
          title="Recently Played"
          courses={recentlyPlayed}
          targetUserId={targetUserId}
          isOwnProfile={finalIsOwnProfile}
          cardSize="large"
        />
      )}

      {/* Top 10 Rated Row */}
      {topRatedCourses.length > 0 && (
        <NetflixCourseRow
          title="Top 10 Rated by You"
          courses={topRatedCourses}
          targetUserId={targetUserId}
          isOwnProfile={finalIsOwnProfile}
          cardSize="medium"
        />
      )}

      {/* Hero Banner */}
      {heroCourse && (
        <NetflixHeroBanner
          course={heroCourse}
          targetUserId={targetUserId}
          isOwnProfile={finalIsOwnProfile}
        />
      )}

      {/* Courses by Region */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white px-4">Courses by Region</h2>
        
        {coursesByRegion['britain-ireland'].length > 0 && (
          <div ref={gbIrelandRef}>
            <NetflixCourseRow
              title="Great Britain & Ireland"
              courses={coursesByRegion['britain-ireland']}
              targetUserId={targetUserId}
              isOwnProfile={finalIsOwnProfile}
              cardSize="medium"
            />
          </div>
        )}

        {coursesByRegion['europe'].length > 0 && (
          <div ref={europeRef}>
            <NetflixCourseRow
              title="Europe"
              courses={coursesByRegion['europe']}
              targetUserId={targetUserId}
              isOwnProfile={finalIsOwnProfile}
              cardSize="medium"
            />
          </div>
        )}

        {coursesByRegion['usa'].length > 0 && (
          <div ref={usaRef}>
            <NetflixCourseRow
              title="USA"
              courses={coursesByRegion['usa']}
              targetUserId={targetUserId}
              isOwnProfile={finalIsOwnProfile}
              cardSize="medium"
            />
          </div>
        )}

        {coursesByRegion['worldwide'].length > 0 && (
          <div ref={worldwideRef}>
            <NetflixCourseRow
              title="Worldwide"
              courses={coursesByRegion['worldwide']}
              targetUserId={targetUserId}
              isOwnProfile={finalIsOwnProfile}
              cardSize="medium"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NetflixCoursesLayout;