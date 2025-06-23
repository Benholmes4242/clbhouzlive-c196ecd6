
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import TaggedText from '@/components/posts/TaggedText';
import VideoPreview from '@/components/posts/VideoPreview';
import { ActivityPost } from '../types/ActivityTypes';

interface ActivityPostCardProps {
  post: ActivityPost;
  attributionText: string;
  onClick: (post: ActivityPost) => void;
}

const ActivityPostCard: React.FC<ActivityPostCardProps> = ({ post, attributionText, onClick }) => {
  return (
    <Card 
      key={post.id} 
      className="aspect-square cursor-pointer hover:shadow-md transition-shadow overflow-hidden" 
      onClick={() => onClick(post)}
    >
      <div className="h-full flex flex-col">
        {/* Media Section - Takes up most of the space */}
        {post.post_media && post.post_media.length > 0 ? (
          <div className="flex-1 relative">
            {post.post_media.length > 1 ? (
              <div className="relative h-full">
                <Carousel className="w-full h-full">
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
                            <VideoPreview
                              src={media.media_url}
                              className="w-full h-full"
                              onFullscreen={() => onClick(post)}
                              videoId={`activity-post-${post.id}-${index}`}
                            />
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {post.post_media.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
                {/* Indicator dots */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {post.post_media.map((_, index) => (
                    <div
                      key={index}
                      className="w-1.5 h-1.5 rounded-full bg-white/70"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full">
                {post.post_media[0].media_type === 'image' ? (
                  <img
                    src={post.post_media[0].media_url}
                    alt="Post content"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <VideoPreview
                    src={post.post_media[0].media_url}
                    className="w-full h-full"
                    onFullscreen={() => onClick(post)}
                    videoId={`activity-post-${post.id}-0`}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          // Text-only post
          <div className="flex-1 p-4 flex flex-col justify-center">
            <div className="text-sm text-center">
              <TaggedText text={post.content} tags={post.post_tags} />
            </div>
          </div>
        )}

        {/* Bottom section with minimal info */}
        <div className="p-2 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-red-500 p-1" onClick={(e) => e.stopPropagation()}>
                <Heart className="h-3 w-3" />
                <span className="text-xs">{post.likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground p-1" onClick={(e) => e.stopPropagation()}>
                <MessageCircle className="h-3 w-3" />
                <span className="text-xs">{post.comments}</span>
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ActivityPostCard;
