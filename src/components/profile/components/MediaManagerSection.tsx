import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Video, Upload } from 'lucide-react';
import MediaManagerModal from '../immersive/MediaManagerModal';
import { useProfileMedia } from '@/hooks/useProfileMedia';

interface MediaManagerSectionProps {
  userId: string;
}

export const MediaManagerSection: React.FC<MediaManagerSectionProps> = ({ userId }) => {
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
  const { mediaItems, refetch } = useProfileMedia(userId);

  const videoCount = mediaItems.filter(item => item.media_type === 'video').length;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold">Immersive Video Media</Label>
        <p className="text-sm text-muted-foreground">
          Manage your immersive profile videos (up to 5 videos, 20 seconds each)
        </p>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Video Media</p>
            <p className="text-sm text-muted-foreground">
              {videoCount} of 5 videos uploaded
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={() => setIsMediaManagerOpen(true)}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Manage Videos
        </Button>
      </div>

      <MediaManagerModal
        isOpen={isMediaManagerOpen}
        onClose={() => setIsMediaManagerOpen(false)}
        userId={userId}
        mediaItems={mediaItems.filter(item => item.media_type === 'video').map(item => ({
          ...item,
          media_type: 'video' as const
        }))}
        onMediaUpdate={refetch}
      />
    </div>
  );
};