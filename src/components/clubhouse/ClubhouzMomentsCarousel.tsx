import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { UserPlus, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClubhouzMomentsCarousel = () => {
  const moments = [
    {
      id: 1,
      author: "Oliver Holmes",
      username: "@oliverholmes42",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop",
      isFollowing: true
    },
    {
      id: 2,
      author: "Golf Course",
      username: "@golfcourse",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=400&h=300&fit=crop",
      isFollowing: false
    },
    {
      id: 3,
      author: "Sundridge Park Go...",
      username: "@sundridgepark",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=400&h=300&fit=crop",
      isFollowing: false
    },
    {
      id: 4,
      author: "Neil Bryant",
      username: "@neilbryant",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
      isFollowing: true
    },
    {
      id: 5,
      author: "Danny Holmes",
      username: "@dannyholmes",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      isFollowing: true
    },
    {
      id: 6,
      author: "Simon S.",
      username: "@simons",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop",
      isFollowing: false
    }
  ];

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Moments you may like</h2>
        <div className="flex items-center space-x-2">
          <ChevronLeft className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" />
          <ChevronRight className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </div>
      
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {moments.map((moment) => (
            <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-[200px] md:basis-[220px]">
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 h-[280px]">
                <div className="relative h-full">
                  {/* Background Image */}
                  <img
                    src={moment.image}
                    alt={`${moment.author}'s moment`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* User Info Overlay */}
                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <img
                      src={moment.avatar}
                      alt={moment.author}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                    <div>
                      <p className="text-white text-sm font-medium">{moment.author}</p>
                      <p className="text-white/80 text-xs">{moment.username}</p>
                    </div>
                  </div>
                  
                  {/* Follow Button */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <Button 
                      variant={moment.isFollowing ? "secondary" : "default"}
                      size="sm"
                      className={`w-full ${
                        moment.isFollowing 
                          ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' 
                          : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      {moment.isFollowing ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
};

export default ClubhouzMomentsCarousel;