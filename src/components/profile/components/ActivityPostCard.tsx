
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
      className="p-4 cursor-pointer hover:shadow-md transition-shadow" 
      onClick={() => onClick(post)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{attributionText}</span>
          <span className="text-xs text-muted-foreground">• {post.timeAgo}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm mb-3">
        <TaggedText text={post.content} tags={post.post_tags} />
      </div>

      {post.post_media && post.post_media.length > 0 && (
        <div className="mb-3">
          {post.post_media.length > 1 ? (
            <div className="relative">
              <Carousel className="w-full">
                <CarouselContent>
                  {post.post_media.map((media) => (
                    <CarouselItem key={media.id}>
                      <div className="relative">
                        {media.media_type === 'image' ? (
                          <img
                            src={media.media_url}
                            alt="Post content"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <VideoPreview
                            src={media.media_url}
                            className="w-full h-48 rounded-lg overflow-hidden"
                            onFullscreen={() => onClick(post)}
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
              <div className="flex justify-center mt-2 space-x-1">
                {post.post_media.map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-muted-foreground/30"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              {post.post_media[0].media_type === 'image' ? (
                <img
                  src={post.post_media[0].media_url}
                  alt="Post content"
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <VideoPreview
                  src={post.post_media[0].media_url}
                  className="w-full h-48 rounded-lg overflow-hidden"
                  onFullscreen={() => onClick(post)}
                />
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-red-500">
            <Heart className="h-4 w-4" />
            {post.likes}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {post.comments}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Share className="h-4 w-4" />
            {post.shares}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ActivityPostCard;
