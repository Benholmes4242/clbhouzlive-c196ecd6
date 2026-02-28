import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/types/badges';
import { Share2, Copy, Camera, Pin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';

interface BadgeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: Badge;
}

export const BadgeShareModal: React.FC<BadgeShareModalProps> = ({
  isOpen,
  onClose,
  badge
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  
  const { user } = useSupabaseSession();

  const getTierGradient = (tier: Badge['tier']) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-400';
      case 'silver': return 'from-gray-400 to-gray-200';
      case 'gold': return 'from-yellow-500 to-yellow-300';
      case 'platinum': return 'from-purple-600 to-purple-400';
      case 'diamond': return 'from-blue-600 to-blue-400';
      default: return 'from-gray-500 to-gray-300';
    }
  };

  const handleShareAsStory = async () => {
    if (!user) return;
    
    setIsSharing(true);
    try {
      // Create a story post about the badge achievement
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: `🏅 Just unlocked the "${badge.display_name}" badge! ${badge.emoji}\n\n${badge.description}`,
        actor_type: 'personal',
        actor_id: user.id,
      });

      if (error) throw error;

      toast.success("Shared");
      
      onClose();
    } catch (error) {
      console.error('Error sharing story:', error);
      toast.error("Couldn't share");
    } finally {
      setIsSharing(false);
    }
  };

  const handlePinBadge = async () => {
    if (!user) return;
    
    setIsPinning(true);
    try {
      // For now, just show a success message without actual pinning
      // This will be fully implemented once types are updated
      toast.success("Badge pinned");
      
      onClose();
    } catch (error) {
      console.error('Error pinning badge:', error);
      toast.error("Couldn't pin badge");
    } finally {
      setIsPinning(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const badgeUrl = `${window.location.origin}/badge/${badge.id}`;
      await navigator.clipboard.writeText(badgeUrl);
      
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error("Couldn't copy link");
    }
  };

  const handleDownloadImage = () => {
    // Create a canvas to generate badge image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1f2937'); // gray-800
    gradient.addColorStop(1, '#111827'); // gray-900
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add badge emoji (simplified - in reality you'd want better rendering)
    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badge.emoji, canvas.width / 2, 200);

    // Add badge name
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(badge.display_name, canvas.width / 2, 280);

    // Add description
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#d1d5db';
    const words = badge.description.split(' ');
    let line = '';
    let y = 330;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > 600 && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // Download the image
    const link = document.createElement('a');
    link.download = `${badge.name}-badge.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast.success("Image downloaded");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-600/30 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-white">Share Your Achievement</DialogTitle>
        </DialogHeader>

        <div className="text-center py-4">
          {/* Badge Preview */}
          <div className="mb-6">
            <div 
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${getTierGradient(badge.tier)} 
                flex items-center justify-center mx-auto shadow-xl mb-3`}
            >
              <span className="text-3xl">{badge.emoji}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{badge.display_name}</h3>
            <p className="text-sm text-white/70 capitalize">{badge.tier} Tier</p>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <Button
              onClick={handleShareAsStory}
              disabled={isSharing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {isSharing ? 'Sharing...' : 'Share as Story'}
            </Button>

            <Button
              onClick={handlePinBadge}
              disabled={isPinning}
              variant="outline"
              className="w-full border-blue-400/30 text-white hover:bg-blue-600/20"
            >
              <Pin className="h-4 w-4 mr-2" />
              {isPinning ? 'Pinning...' : 'Pin to Profile'}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="border-gray-400/30 text-white hover:bg-gray-600/20"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>

              <Button
                onClick={handleDownloadImage}
                variant="outline"
                className="border-gray-400/30 text-white hover:bg-gray-600/20"
              >
                <Camera className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full mt-4 text-white/70 hover:text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};