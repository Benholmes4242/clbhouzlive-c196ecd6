
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import VideoPreview from '@/components/posts/VideoPreview';
import { trendingTips } from '@/data/clubhouseFeedData';

const TrendingTipsCarousel = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Trending Tips</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {trendingTips.map((tip) => (
            <CarouselItem key={tip.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2">
              <div className="bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="relative">
                  {tip.type === 'video' ? (
                    <VideoPreview
                      src={tip.image}
                      videoId={`tip-${tip.id}`}
                      className="w-full h-40"
                    />
                  ) : (
                    <img src={tip.image} alt={tip.title} className="w-full h-40 object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <Badge variant="secondary" className="mb-2">#{tip.tag}</Badge>
                  <h3 className="font-semibold mb-1">{tip.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">@{tip.user}</p>
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

export default TrendingTipsCarousel;
