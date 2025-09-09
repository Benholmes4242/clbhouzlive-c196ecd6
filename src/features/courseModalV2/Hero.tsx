import React from 'react';
import BadgePill from './primitives/BadgePill';
import { Button } from '@/components/ui/button';

export default function Hero({ course, isLoading }: {
  course: { id: string; name: string; imageUrl: string; region: string; country: string; rankWorld?: number; rankCountry?: number; };
  isLoading: boolean;
}) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-b-2xl md:aspect-[21/9]">
      {/* Image */}
      <img
        src={course.imageUrl}
        alt={course.name}
        className="h-full w-full object-cover"
        loading="eager"
      />

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent backdrop-blur-[1px]" />

      {/* Title & meta */}
      <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2 text-white md:inset-x-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">{course.name}</h1>
        <p className="text-white/85">{course.region}, {course.country}</p>
        <div className="mt-2 flex items-center gap-2">
          {course.rankWorld ? <BadgePill>#{course.rankWorld}</BadgePill> : null}
          {course.rankCountry ? <BadgePill>🇬🇧 #{course.rankCountry}</BadgePill> : null}
        </div>
      </div>

      {/* Floating actions */}
      <div className="absolute right-4 top-4 flex flex-col gap-3 md:right-6">
        <Button variant="secondary" className="rounded-full shadow-lg"
          onClick={() => {
            // TODO action: open rate modal
            // TODO analytics: fire('rate_click', { courseId: course.id })
          }}>
          ★ Rate
        </Button>
        <Button variant="secondary" className="rounded-full shadow-lg"
          onClick={() => {
            // TODO action: add to played
            // TODO analytics: fire('add_to_played_click', { courseId: course.id })
          }}>
          ♥ Add to Played
        </Button>
      </div>
    </div>
  );
}