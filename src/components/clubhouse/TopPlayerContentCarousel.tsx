
import React from 'react';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import VideoPreview from '@/components/posts/VideoPreview';
import { topPlayers } from '@/data/clubhouseFeedData';

const TopPlayerContentCarousel = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Top Player Content</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {topPlayers.map((player) => (
            <CarouselItem key={player.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="relative bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                {player.type === 'video' ? (
                  <VideoPreview
                    src={player.contentImage}
                    videoId={`player-${player.id}`}
                    className="w-full h-48"
                  />
                ) : (
                  <img src={player.contentImage} alt={player.name} className="w-full h-48 object-cover" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {player.type === 'video' && (
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {player.duration}
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{player.name}</h3>
                      <p className="text-white/80 text-xs">{player.bio}</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                    <UserPlus className="h-3 w-3 mr-2" />
                    Follow
                  </Button>
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

export default TopPlayerContentCarousel;
