import React from 'react';
import Hero from './Hero';
import StickyTabs from './StickyTabs';
import CommunityScoreCard from './cards/CommunityScoreCard';
import AboutCard from './cards/AboutCard';
import LocationCard from './cards/LocationCard';
import MediaCard from './cards/MediaCard';
import LeaderboardCard from './cards/LeaderboardCard';
import { Button } from '@/components/ui/button';
// TODO: Replace with your real hooks
// import { useQuery } from '@tanstack/react-query';

type Course = {
  id: string;
  name: string;
  imageUrl: string;
  region: string;
  country: string;
  rankWorld?: number;
  rankCountry?: number;
  website?: string;
  // add any other fields you need
};

type RatingStats = {
  overall?: number; fun?: number; playability?: number; design?: number;
};

export default function CourseModalV2({ courseId }: { courseId: string }) {
  // TODO data: wire your existing hooks
  // const { data: course, isLoading } = useQuery(['course-detail', courseId], ...);
  // const { data: stats } = useQuery(['course-rating-stats', courseId], ...);

  // Placeholder for scaffold demo:
  const isLoading = false;
  const course: Course = {
    id: courseId,
    name: 'Sunningdale Golf Club (New)',
    imageUrl: '/api/course-image/' + courseId, // TODO: real URL
    region: 'Surrey',
    country: 'England',
    rankWorld: 41,
    rankCountry: 13,
    website: 'https://example.com'
  };
  const stats: RatingStats = { overall: 9, fun: 8.2, playability: 7.8, design: 6.5 };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <Hero course={course} isLoading={isLoading} />
      <StickyTabs
        tabs={[
          {
            id: 'about', label: 'About',
            content: (
              <div className="space-y-4">
                <CommunityScoreCard stats={stats} />
                <AboutCard course={course} />
                <div className="grid gap-4 md:grid-cols-2">
                  <LocationCard course={course} />
                  <MediaCard courseId={course.id} />
                </div>
              </div>
            )
          },
          { id: 'reviews', label: 'Reviews', content: <div className="text-muted-foreground">TODO: Reviews list (reuse existing)</div> },
          { id: 'media', label: 'Media', content: <MediaCard courseId={course.id} variant="full" /> },
          { id: 'leaderboard', label: 'Leaderboard', content: <LeaderboardCard courseId={course.id} /> },
        ]}
        ctaBar={
          course.website ? (
            <Button asChild size="lg" className="w-full rounded-full">
              <a href={course.website} target="_blank" rel="noreferrer" onClick={() => {
                // TODO analytics: fire('visit_site_click', { courseId })
              }}>
                Visit Website
              </a>
            </Button>
          ) : null
        }
      />
    </div>
  );
}