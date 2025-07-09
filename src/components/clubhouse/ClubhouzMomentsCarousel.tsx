import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Heart, MessageCircle, Play } from 'lucide-react';

const ClubhouzMomentsCarousel = () => {
  const moments = [
    {
      id: 1,
      title: "Epic Shot at Augusta",
      author: "Jordan T.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      thumbnail: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop",
      likes: 234,
      comments: 45,
      duration: "0:30",
      isVideo: true
    },
    {
      id: 2,
      title: "Perfect Putt",
      author: "Sarah M.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      thumbnail: "https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=400&h=300&fit=crop",
      likes: 156,
      comments: 28,
      duration: "0:15",
      isVideo: true
    },
    {
      id: 3,
      title: "Course Overview",
      author: "Mike R.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      thumbnail: "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=400&h=300&fit=crop",
      likes: 89,
      comments: 12,
      isVideo: false
    },
    {
      id: 4,
      title: "Morning Practice",
      author: "Alex K.",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
      thumbnail: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
      likes: 67,
      comments: 8,
      duration: "0:22",
      isVideo: true
    },
    {
      id: 5,
      title: "Sunset Golf",
      author: "Emma L.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      likes: 145,
      comments: 19,
      isVideo: false
    }
  ];

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Clubhouz Moments</h2>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>
      
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {moments.map((moment) => (
            <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-[280px] md:basis-[320px]">
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <div className="relative">
                  <img
                    src={moment.thumbnail}
                    alt={moment.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  {moment.isVideo && (
                    <>
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white bg-opacity-80 rounded-full p-3">
                          <Play className="h-6 w-6 text-black" fill="currentColor" />
                        </div>
                      </div>
                      
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {moment.duration}
                      </div>
                    </>
                  )}
                  
                  <div className="absolute top-2 left-2">
                    <img
                      src={moment.avatar}
                      alt={moment.author}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                  </div>
                </div>
                
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm mb-1 line-clamp-1">{moment.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">by {moment.author}</p>
                  
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{moment.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{moment.comments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};

export default ClubhouzMomentsCarousel;