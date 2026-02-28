import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Play, Image as ImageIcon, GripVertical, Scissors, Edit } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useR2Upload } from '@/hooks/useR2Upload';

import { MediaItem } from '@/types/media';
import { getStreamPoster } from '@/utils/stream';

interface LocalMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number;
  display_order: number;
  file_name?: string;
  header_extended_url?: string;
  header_strip_url?: string;
  video_method?: string;
}

interface MediaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  mediaItems: LocalMediaItem[];
  onMediaUpdate: () => void;
}

const MediaManagerModal: React.FC<MediaManagerModalProps> = ({
  isOpen,
  onClose,
  userId,
  mediaItems,
  onMediaUpdate
}) => {
  const [items, setItems] = useState<LocalMediaItem[]>(mediaItems);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadVideo, uploading: videoUploading } = useCloudflareStream();
  const { uploadImage, uploading: imageUploading } = useR2Upload();

  // Update items when mediaItems prop changes
  React.useEffect(() => {
    setItems(mediaItems.sort((a, b) => a.display_order - b.display_order));
  }, [mediaItems]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Check if adding these files would exceed the 5-video limit
    if (items.length + files.length > 5) {
      toast.error(`Cannot add ${files.length} videos. Maximum 5 videos allowed. You currently have ${items.length} videos.`);
      return;
    }

    setUploading(true);

    try {
      const newItems: LocalMediaItem[] = [];

      for (const file of Array.from(files)) {
        // Only accept video files
        if (!file.type.startsWith('video/')) {
          toast.error(`"${file.name}" is not a video file. Only videos are allowed for immersive media.`);
          continue;
        }

        // Check video duration (max 20s)
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            if (video.duration > 20) {
              reject(new Error(`Video "${file.name}" is ${Math.round(video.duration)}s long. Maximum 20 seconds allowed.`));
            } else {
              resolve(void 0);
            }
          };
          video.onerror = () => reject(new Error('Invalid video file'));
          video.src = URL.createObjectURL(file);
        });

        const result = await uploadVideo(file);
        if (result.success && result.videoUrl) {
          newItems.push({
            id: crypto?.randomUUID?.() ?? `temp-${Date.now()}-${newItems.length}`,
            media_type: 'video' as const,
            media_url: result.videoUrl,
            thumbnail_url: result.thumbnailUrl,
            duration: Math.round(Math.min(video.duration * 1000, 20000)), // Convert to ms, cap at 20s, ensure integer
            display_order: items.length + newItems.length,
            file_name: file.name,
            video_method: 'upload'
          });
        }
      }

      // Update local state with new items (already have IDs)
      setItems(prev => [...prev, ...newItems]);
      toast.success(`Added ${newItems.length} video(s). Remember to save your changes.`);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // Update display_order
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      display_order: index
    }));

    setItems(updatedItems);
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing media for this user
      await supabase
        .from('profile_media')
        .delete()
        .eq('user_id', userId)
        .eq('is_immersive', true);

      // Insert new media items (only if there are items to insert)
      if (items.length > 0) {
        const mediaToInsert = items.map((item, index) => ({
          user_id: userId,
          media_type: item.media_type,
          media_url: item.media_url,
          thumbnail_url: item.thumbnail_url,
          duration: Math.round(item.duration || 3000), // Ensure integer value
          display_order: index,
          is_immersive: true,
          file_name: item.file_name,
          video_method: item.video_method || 'upload'
        }));

        const { error } = await supabase
          .from('profile_media')
          .insert(mediaToInsert);

        if (error) throw error;
      }

      toast.success('Media saved');
      onMediaUpdate();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error("Couldn't save media");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Immersive Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Add Media</h3>
                <p className="text-sm text-muted-foreground">
                  Upload up to 5 videos total. Videos max 20s.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently: {items.length}/5 videos
                </p>
              </div>
              
              <Button
                onClick={handleFileSelect}
                disabled={uploading || items.length >= 5}
                variant="outline"
              >
                {uploading ? 'Uploading...' : 'Choose Videos'}
              </Button>
            </div>
          </div>

          {/* Media List */}
          {items.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Your Videos ({items.length}/5)</h3>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="media-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center space-x-4 p-4 border rounded-lg ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>

                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                <video
                                  src={item.media_url}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play className="h-6 w-6 text-white drop-shadow-lg" />
                                </div>
                              </div>

                              <div className="flex-1">
                                <p className="font-medium">
                                  Video {index + 1}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {(item.duration / 1000).toFixed(1)}s
                                  {item.file_name && ` • ${item.file_name}`}
                                </p>
                              </div>

                              {/* Future: Trim/Edit buttons */}
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  title="Coming soon"
                                >
                                  <Scissors className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemove(item.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaManagerModal;