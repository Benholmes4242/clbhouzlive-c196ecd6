
import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { courseHighlights } from '@/data/clubhouseFeedData';

const CourseHighlightsCarousel = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Course Highlights</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {courseHighlights.map((course) => (
            <CarouselItem key={course.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2">
              <div className="bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <img src={course.image} alt={course.name} className="w-full h-32 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{course.name}</h3>
                  <div className="flex items-center text-muted-foreground text-sm mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    {course.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{course.posts} posts</Badge>
                    <Button size="sm" variant="outline">View More</Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
};

export default CourseHighlightsCarousel;
