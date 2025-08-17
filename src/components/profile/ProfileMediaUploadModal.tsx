import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useR2Upload } from '@/hooks/useR2Upload';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, 
  Video, 
  Image as ImageIcon, 
  X, 
  GripVertical, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProfileMediaItem } from '@/hooks/useProfileMediaManager';

interface ProfileMediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingMedia: ProfileMediaItem[];
  onMediaUpdated: () => void;
}

interface PendingMediaItem {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  duration?: number;
}

// Sortable media item component
const SortableMediaItem: React.FC<{
  item: ProfileMediaItem | PendingMediaItem;
  onDelete: (id: string) => void;
  showStatus?: boolean;
}> = ({ item, onDelete, showStatus = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPending = 'file' in item;
  const isVideo = isPending ? item.type === 'video' : item.media_type === 'video';
  const imageUrl = isPending 
    ? item.preview 
    : (isVideo ? item.thumbnail_url || item.media_url : item.media_url);

  const getStatusBadge = () => {
    if (isPending) {
      switch (item.status) {
        case 'uploading':
          return (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Uploading...
            </Badge>
          );
        case 'success':
          return (
            <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3" />
              Uploaded
            </Badge>
          );
        case 'error':
          return (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              Failed
            </Badge>
          );
        default:
          return (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Pending
            </Badge>
          );
      }
    } else if (showStatus) {
      switch (item.header_processing_status) {
        case 'processing':
          return (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Enhancing...
            </Badge>
          );
        case 'success':
          return (
            <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3" />
              Enhanced
            </Badge>
          );
        case 'error':
          return (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              Enhancement failed
            </Badge>
          );
        default:
          return (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Pending enhancement
            </Badge>
          );
      }
    }
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-background"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Thumbnail */}
      <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Media thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? (
              <Video className="w-6 h-6 text-muted-foreground" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {isPending ? item.file.name : (item.file_name || `${item.media_type} #${item.display_order}`)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {isVideo ? 'Video' : 'Image'}
          </Badge>
          {item.duration && (
            <Badge variant="outline" className="text-xs">
              {Math.round(item.duration)}s
            </Badge>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(item.id)}
        className="text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

const ProfileMediaUploadModal: React.FC<ProfileMediaUploadModalProps> = ({
  isOpen,
  onClose,
  userId,
  existingMedia,
  onMediaUpdated
}) => {
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadImage } = useR2Upload();
  const { uploadVideo } = useCloudflareStream();

  // Combined media list for sorting
  const allMediaItems = [...existingMedia, ...pendingMedia];
  const totalCount = allMediaItems.length;
  const canAddMore = totalCount < 5;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = allMediaItems.findIndex(item => item.id === active.id);
      const newIndex = allMediaItems.findIndex(item => item.id === over.id);
      
      const newOrder = arrayMove(allMediaItems, oldIndex, newIndex);
      
      // Update display_order for existing items
      const updatedExisting = newOrder
        .filter(item => !('file' in item))
        .map((item, index) => ({ ...item as ProfileMediaItem, display_order: index + 1 }));
      
      // Update pending items order
      const updatedPending = newOrder
        .filter(item => 'file' in item)
        .map(item => item as PendingMediaItem);
      
      setPendingMedia(updatedPending);
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const availableSlots = 5 - totalCount;
    const filesToProcess = newFiles.slice(0, availableSlots);

    if (newFiles.length > availableSlots) {
      toast.error(`Can only add ${availableSlots} more items (5 max total)`);
    }

    const newPendingItems: PendingMediaItem[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }

      // Check video duration (20s max)
      if (file.type.startsWith('video/')) {
        try {
          const duration = await getVideoDuration(file);
          if (duration > 20) {
            toast.error(`Video ${file.name} is too long (${Math.round(duration)}s). Max 20 seconds.`);
            continue;
          }
        } catch (error) {
          console.error('Error checking video duration:', error);
        }
      }

      const preview = URL.createObjectURL(file);
      const pendingItem: PendingMediaItem = {
        id: `pending-${Date.now()}-${Math.random()}`,
        file,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        preview,
        status: 'pending'
      };

      newPendingItems.push(pendingItem);
    }

    setPendingMedia(prev => [...prev, ...newPendingItems]);
  }, [totalCount]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const deletePendingItem = (itemId: string) => {
    setPendingMedia(prev => {
      const item = prev.find(item => item.id === itemId);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter(item => item.id !== itemId);
    });
  };

  const deleteExistingItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('profile_media')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      onMediaUpdated();
      toast.success('Media item deleted');
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media');
    }
  };

  const handleSave = async () => {
    if (pendingMedia.length === 0) {
      onClose();
      return;
    }

    setIsProcessing(true);

    try {
      for (const item of pendingMedia) {
        setPendingMedia(prev => 
          prev.map(p => p.id === item.id ? { ...p, status: 'uploading' } : p)
        );

        try {
          let mediaUrl: string;
          let thumbnailUrl: string | undefined;
          let duration: number | undefined;

          if (item.type === 'video') {
            const result = await uploadVideo(item.file);
            if (!result.success) throw new Error(result.error);
            mediaUrl = result.videoUrl!;
            thumbnailUrl = result.thumbnailUrl;
            duration = await getVideoDuration(item.file);
          } else {
            const result = await uploadImage(item.file);
            if (!result.success) throw new Error(result.error);
            mediaUrl = result.imageUrl!;
          }

          // Get next display order
          const existingOrders = existingMedia.map(m => m.display_order);
          const pendingCount = pendingMedia.slice(0, pendingMedia.indexOf(item)).length;
          const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
          const newOrder = maxOrder + pendingCount + 1;

          // Insert into database
          const { error } = await supabase
            .from('profile_media')
            .insert({
              user_id: userId,
              media_url: mediaUrl,
              media_type: item.type,
              display_order: newOrder,
              thumbnail_url: thumbnailUrl,
              file_name: item.file.name,
              file_size: item.file.size,
              duration,
              header_processing_status: 'pending'
            });

          if (error) throw error;

          setPendingMedia(prev => 
            prev.map(p => p.id === item.id ? { ...p, status: 'success' } : p)
          );

        } catch (error) {
          console.error('Upload error:', error);
          setPendingMedia(prev => 
            prev.map(p => p.id === item.id ? { 
              ...p, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            } : p)
          );
        }
      }

      // Clear successful uploads
      setPendingMedia(prev => prev.filter(item => item.status === 'error'));
      
      onMediaUpdated();
      toast.success('Media items uploaded successfully');
      
      if (pendingMedia.every(item => item.status === 'success')) {
        onClose();
      }

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save media items');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Profile Media ({totalCount}/5)</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Upload area */}
          {canAddMore && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${isProcessing ? 'pointer-events-none opacity-50' : 'hover:border-primary/50'}
              `}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={isProcessing}
              />
              
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Add Media</p>
              <p className="text-xs text-muted-foreground">
                Images or videos (max 20s) • Up to {5 - totalCount} more
              </p>
            </div>
          )}

          {/* Media items */}
          {allMediaItems.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={allMediaItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {allMediaItems.map((item) => (
                    <SortableMediaItem
                      key={item.id}
                      item={item}
                      onDelete={'file' in item ? deletePendingItem : deleteExistingItem}
                      showStatus={true}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {totalCount >= 5 && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">Maximum of 5 media items reached</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isProcessing || pendingMedia.length === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to get video duration
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Error loading video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export default ProfileMediaUploadModal;