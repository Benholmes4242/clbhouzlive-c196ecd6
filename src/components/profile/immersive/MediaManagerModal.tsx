import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Play, Image as ImageIcon, GripVertical, Scissors, Edit, Check, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'sonner';
import { useMediaManagerState } from '@/hooks/useMediaManagerState';
import { useBackgroundMediaUpload } from '@/hooks/useBackgroundMediaUpload';
import type { StagedMediaItem } from '@/types/mediaManager';

interface MediaItem {
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
  mediaItems: MediaItem[];
  onMediaUpdate: () => void;
}

const MediaManagerModal: React.FC<MediaManagerModalProps> = ({
  isOpen,
  onClose,
  userId,
  mediaItems,
  onMediaUpdate
}) => {
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    stagedItems,
    hasChanges,
    canSave,
    addFiles,
    updateItemState,
    removeItem,
    reorderItems,
    commitChanges
  } = useMediaManagerState(mediaItems);
  
  const {
    queueUpload,
    startProcessing,
    isProcessing,
    queueLength
  } = useBackgroundMediaUpload();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Check if adding these files would exceed the 5-item limit
    if (stagedItems.length + files.length > 5) {
      toast.error(`Cannot add ${files.length} files. Maximum 5 items allowed. You currently have ${stagedItems.length} items.`);
      return;
    }

    try {
      // Basic validation first
      for (const file of Array.from(files)) {
        if (file.type.startsWith('video/')) {
          // Quick duration check
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
        }
      }

      // Add files to staging immediately
      const newItems = addFiles(Array.from(files));
      
      // Queue uploads for background processing
      newItems.forEach(item => {
        if (item.file) {
          queueUpload({
            id: `upload_${item.id}`,
            mediaItemId: item.id,
            file: item.file,
            type: item.media_type,
            userId,
            onProgress: (progress) => {
              updateItemState(item.id, { 
                state: 'uploading', 
                uploadProgress: progress 
              });
            },
            onComplete: (result) => {
              updateItemState(item.id, {
                state: 'ready',
                media_url: result.media_url,
                thumbnail_url: result.thumbnail_url,
                duration: result.duration,
                video_method: result.video_method,
                uploadProgress: 100
              });
            },
            onError: (error) => {
              updateItemState(item.id, {
                state: 'error',
                error
              });
            }
          });
        }
      });

      // Start processing uploads
      startProcessing();

      toast.success(`Added ${newItems.length} item(s) to staging.`);

    } catch (error: any) {
      console.error('File validation error:', error);
      toast.error(error.message || 'Failed to add files');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderItems(result.source.index, result.destination.index);
  };

  const handleRemove = (id: string) => {
    const item = stagedItems.find(item => item.id === id);
    if (item?.state === 'uploading') {
      // Cancel upload if in progress
      updateItemState(id, { state: 'removed' });
    }
    removeItem(id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await commitChanges(userId);
      
      const uploadsInProgress = stagedItems.filter(item => 
        item.state === 'uploading' || item.state === 'queued'
      ).length;
      
      if (uploadsInProgress > 0) {
        toast.success(`Changes saved. ${uploadsInProgress} items still uploading in background.`);
      } else {
        toast.success('Changes saved successfully!');
      }
      
      onMediaUpdate();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const getStateIcon = (item: StagedMediaItem) => {
    switch (item.state) {
      case 'ready':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return null; // Show progress bar instead
      default:
        return null;
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
              accept="image/*,video/*"
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
                  Upload up to 5 items total (photos or videos, any mix). Videos max 20s.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently: {stagedItems.length}/5 items
                </p>
              </div>
              
              <Button
                onClick={handleFileSelect}
                disabled={stagedItems.length >= 5}
                variant="outline"
              >
                Choose Files
              </Button>
            </div>
          </div>

          {/* Media List */}
          {stagedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Your Media ({stagedItems.length}/5)</h3>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="media-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {stagedItems.map((item, index) => (
                        <Draggable 
                          key={item.id} 
                          draggableId={item.id} 
                          index={index}
                          isDragDisabled={item.state === 'uploading'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center space-x-4 p-4 border rounded-lg ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              } ${item.state === 'error' ? 'border-red-200 bg-red-50' : ''}`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className={`text-gray-400 hover:text-gray-600 ${
                                  item.state === 'uploading' ? 'opacity-50' : ''
                                }`}
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>

                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                {item.media_type === 'video' ? (
                                  <>
                                    <video
                                      src={item.media_url}
                                      poster={item.thumbnail_url}
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Play className="h-6 w-6 text-white drop-shadow-lg" />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <img
                                      src={item.media_url}
                                      alt="Media thumbnail"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-1 left-1">
                                      <ImageIcon className="h-4 w-4 text-white drop-shadow-lg" />
                                    </div>
                                  </>
                                )}
                                
                                {/* Status overlay */}
                                <div className="absolute top-1 right-1">
                                  {getStateIcon(item)}
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {item.media_type === 'video' ? 'Video' : 'Photo'} {index + 1}
                                  </p>
                                  {item.isNew && (
                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {item.media_type === 'video' 
                                    ? `${(item.duration / 1000).toFixed(1)}s` 
                                    : '3s'
                                  }
                                  {item.file_name && ` • ${item.file_name}`}
                                </p>
                                
                                {/* Progress bar */}
                                {(item.state === 'uploading' || item.state === 'processing') && (
                                  <div className="mt-2">
                                    <Progress 
                                      value={item.uploadProgress || 0} 
                                      className="h-2"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.state === 'uploading' ? 'Uploading...' : 'Processing...'}
                                      {' '}
                                      {item.uploadProgress?.toFixed(0) || 0}%
                                    </p>
                                  </div>
                                )}
                                
                                {/* Error state */}
                                {item.state === 'error' && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {item.error || 'Upload failed'}
                                  </p>
                                )}
                                
                                {/* Upload complete */}
                                {item.state === 'ready' && item.isNew && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Upload complete
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2">
                                {item.media_type === 'video' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={item.state === 'uploading'}
                                    title="Coming soon"
                                  >
                                    <Scissors className="h-4 w-4" />
                                  </Button>
                                )}
                                
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
              disabled={saving || !canSave}
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