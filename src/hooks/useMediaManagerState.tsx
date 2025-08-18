import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { StagedMediaItem, MediaManagerState } from '@/types/mediaManager';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number;
  display_order: number;
  file_name?: string;
  video_method?: string;
}

export const useMediaManagerState = (initialItems: MediaItem[]) => {
  const [stagedItems, setStagedItems] = useState<StagedMediaItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize staged items from existing media
  useEffect(() => {
    const staged = initialItems.map(item => ({
      ...item,
      state: 'ready' as const,
      isNew: false,
      originalId: item.id
    }));
    setStagedItems(staged);
    setHasChanges(false);
  }, [initialItems]);

  const addFiles = useCallback((files: File[]) => {
    const newItems: StagedMediaItem[] = files.map((file, index) => ({
      id: `temp_${Date.now()}_${index}`,
      file,
      media_type: file.type.startsWith('video/') ? 'video' : 'image',
      media_url: URL.createObjectURL(file),
      duration: file.type.startsWith('video/') ? 30000 : 3000,
      display_order: stagedItems.length + index,
      file_name: file.name,
      state: 'queued',
      isNew: true,
      uploadProgress: 0
    }));

    setStagedItems(prev => [...prev, ...newItems]);
    setHasChanges(true);
    
    return newItems;
  }, [stagedItems.length]);

  const updateItemState = useCallback((id: string, updates: Partial<StagedMediaItem>) => {
    setStagedItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setStagedItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      // Reorder display_order
      return newItems.map((item, index) => ({
        ...item,
        display_order: index,
        isModified: item.originalId ? true : item.isModified
      }));
    });
    setHasChanges(true);
  }, []);

  const reorderItems = useCallback((startIndex: number, endIndex: number) => {
    setStagedItems(prev => {
      const items = [...prev];
      const [removed] = items.splice(startIndex, 1);
      items.splice(endIndex, 0, removed);
      
      // Update display_order and mark as modified
      return items.map((item, index) => ({
        ...item,
        display_order: index,
        isModified: item.originalId && index !== item.display_order ? true : item.isModified
      }));
    });
    setHasChanges(true);
  }, []);

  const commitChanges = useCallback(async (userId: string) => {
    try {
      // Get only ready items for database commit
      const readyItems = stagedItems.filter(item => 
        item.state === 'ready' || item.state === 'uploaded'
      );

      // Delete existing media
      await supabase
        .from('profile_media')
        .delete()
        .eq('user_id', userId)
        .eq('is_immersive', true);

      // Insert new/updated media
      if (readyItems.length > 0) {
        const mediaToInsert = readyItems.map((item, index) => ({
          user_id: userId,
          media_type: item.media_type,
          media_url: item.media_url,
          thumbnail_url: item.thumbnail_url,
          duration: Math.round(item.duration || 3000),
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

      setHasChanges(false);
      return true;
    } catch (error) {
      console.error('Failed to commit changes:', error);
      throw error;
    }
  }, [stagedItems]);

  const canSave = hasChanges || stagedItems.some(item => item.isNew);

  return {
    stagedItems,
    hasChanges,
    canSave,
    addFiles,
    updateItemState,
    removeItem,
    reorderItems,
    commitChanges
  };
};