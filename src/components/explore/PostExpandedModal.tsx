
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Heart, MessageCircle, Share, UserPlus } from 'lucide-react';
import VideoPreview from '@/components/posts/VideoPreview';
import { MediaContentItem } from './types';

interface PostExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaContentItem | null;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
}

const PostExpandedModal: React.FC<PostExpandedModalProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  onLike, 
  onFollow 
}) => {
  if (!item) return null;

  const handleLike = () => onLike(item.id);
  const handleFollow = () => onFollow(item.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 flex items-center justify-center">
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Media Content */}
          <div className="w-full h-full relative flex items-center justify-center">
            {item.type === 'video' ? (
              <VideoPreview
                src={item.src}
                className="max-w-full max-h-full object-contain"
                videoId={`modal-${item.id}`}
              />
            ) : (
              <img
                src={item.src}
                alt={item.title}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* User info and actions overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-black/80 rounded-lg p-4 text-white">
              {/* User Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={item.user.avatar}
                    alt={item.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="font-medium">{item.user.name}</p>
                      {item.user.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-white/70">@{item.user.username}</p>
                  </div>
                </div>
                
                {!item.isFollowing && (
                  <Button
                    size="sm"
                    onClick={handleFollow}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </Button>
                )}
              </div>

              {/* Title */}
              {item.title && (
                <p className="text-lg mb-3">{item.title}</p>
              )}

              {/* Action buttons */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                >
                  <Heart className="h-5 w-5" />
                  <span>{item.likes.toLocaleString()}</span>
                </button>
                
                <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  <span>{item.comments}</span>
                </button>
                
                <button className="flex items-center space-x-1 hover:text-green-400 transition-colors">
                  <Share className="h-5 w-5" />
                  <span>{item.shares}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostExpandedModal;
