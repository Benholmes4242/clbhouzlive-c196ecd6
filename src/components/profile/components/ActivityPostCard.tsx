
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Maximize2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import TaggedText from '@/components/posts/TaggedText';
import VideoPreview from '@/components/posts/VideoPreview';
import { ActivityPost } from '../types/ActivityTypes';

interface ActivityPostCardProps {
  post: ActivityPost;
  attributionText: string;
  onClick: (post: ActivityPost) => void;
}

const ActivityPostCard: React.FC<ActivityPostCardProps> = ({ post, attributionText, onClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <Card 
      key={post.id} 
      className="aspect-square cursor-pointer hover:shadow-md transition-shadow overflow-hidden" 
      onClick={() => onClick(post)}
    >
      <div className="h-full flex flex-col">
        {/* Media Section - Takes up full space */}
        {post.post_media && post.post_media.length > 0 ? (
          <div className="flex-1 relative group">
            {post.post_media.length > 1 ? (
              <div className="relative h-full">
                <Carousel 
                  className="w-full h-full"
                  setApi={(api) => {
                    if (api) {
                      api.on('select', () => {
                        setCurrentSlide(api.selectedScrollSnap());
                      });
                    }
                  }}
                >
                  <CarouselContent className="h-full">
                    {post.post_media.map((media, index) => (
                      <CarouselItem key={media.id} className="h-full">
                        <div className="relative h-full">
                          {media.media_type === 'image' ? (
                            <img
                              src={media.media_url}
                              alt="Post content"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="relative h-full">
                              <VideoPreview
                                src={media.media_url}
                                className="w-full h-full"
                                onFullscreen={() => onClick(post)}
                                videoId={`activity-post-${post.id}-${index}`}
                              />
                              {/* Enlarge icon on hover for videos */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg">
                                  <Maximize2 className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                
                {/* Dot indicators */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {post.post_media.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full relative">
                {post.post_media[0].media_type === 'image' ? (
                  <img
                    src={post.post_media[0].media_url}
                    alt="Post content"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative h-full">
                    <VideoPreview
                      src={post.post_media[0].media_url}
                      className="w-full h-full"
                      onFullscreen={() => onClick(post)}
                      videoId={`activity-post-${post.id}-0`}
                    />
                    {/* Enlarge icon on hover for videos */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg">
                        <Maximize2 className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Text-only post - takes up full space
          <div className="flex-1 p-4 flex flex-col justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-sm text-center">
              <TaggedText text={post.content} tags={post.post_tags} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityPostCard;
