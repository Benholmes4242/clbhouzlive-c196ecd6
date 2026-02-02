import React, { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGallery } from '@/hooks/useGallery';
import { galleryItemToFile, GalleryMediaItem } from '@/utils/capacitor/galleryService';
import type { ComposerMediaItem } from '@/hooks/useSnapModal';
import { haptic } from '@/utils/haptics';

import { GalleryGrid } from './GalleryGrid';
import { GalleryGridSkeleton } from './GalleryGridSkeleton';
import { AlbumSelector } from './AlbumSelector';
import { MediaSourceTabs, MediaSourceTab } from './MediaSourceTabs';
import { CameraCapture } from './CameraCapture';
import { PermissionDeniedCard } from './PermissionDeniedCard';

interface CustomGalleryPickerProps {
  maxSelection: number;
  currentSelectionCount: number;
  onMediaSelected: (items: ComposerMediaItem[]) => void;
  onClose: () => void;
}

export function CustomGalleryPicker({
  maxSelection,
  currentSelectionCount,
  onMediaSelected,
  onClose,
}: CustomGalleryPickerProps) {
  const [activeTab, setActiveTab] = useState<MediaSourceTab>('gallery');
  const [selectedGalleryItems, setSelectedGalleryItems] = useState<GalleryMediaItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  
  const remainingSlots = maxSelection - currentSelectionCount;
  
  const {
    permissionStatus,
    albums,
    currentAlbum,
    mediaItems,
    isLoading,
    isLoadingMore,
    hasMore,
    selectAlbum,
    loadMore,
    requestPermission,
  } = useGallery({ autoLoad: true, pageSize: 50 });
  
  // Selected IDs for the grid
  const selectedIds = useMemo(
    () => selectedGalleryItems.map(item => item.id),
    [selectedGalleryItems]
  );
  
  // Handle selecting an item from the gallery grid
  const handleSelectGalleryItem = useCallback((item: GalleryMediaItem) => {
    if (selectedGalleryItems.length >= remainingSlots) {
      haptic('heavy');
      return;
    }
    
    setSelectedGalleryItems(prev => [...prev, item]);
    haptic('light');
  }, [selectedGalleryItems.length, remainingSlots]);
  
  // Handle deselecting an item
  const handleDeselectGalleryItem = useCallback((itemId: string) => {
    setSelectedGalleryItems(prev => prev.filter(item => item.id !== itemId));
    haptic('light');
  }, []);
  
  // Handle confirming selection - convert gallery items to ComposerMediaItems
  const handleConfirmSelection = useCallback(async () => {
    if (selectedGalleryItems.length === 0) return;
    
    setIsConverting(true);
    haptic('medium');
    
    try {
      const composerItems: ComposerMediaItem[] = await Promise.all(
        selectedGalleryItems.map(async (galleryItem, index) => {
          const file = await galleryItemToFile(galleryItem);
          const previewUrl = URL.createObjectURL(file);
          
          return {
            id: crypto.randomUUID?.() ?? `${Date.now()}-${index}`,
            type: galleryItem.type,
            file,
            previewUrl,
            thumbnailUrl: galleryItem.type === 'video' ? galleryItem.thumbnailUri : previewUrl,
            duration: galleryItem.duration,
            width: galleryItem.width,
            height: galleryItem.height,
          } as ComposerMediaItem;
        })
      );
      
      onMediaSelected(composerItems);
      haptic('medium');
    } catch (error) {
      console.error('[CustomGalleryPicker] Failed to convert media:', error);
      haptic('heavy');
    } finally {
      setIsConverting(false);
    }
  }, [selectedGalleryItems, onMediaSelected]);
  
  // Handle camera capture
  const handleCameraCapture = useCallback((item: ComposerMediaItem) => {
    onMediaSelected([item]);
    haptic('medium');
  }, [onMediaSelected]);
  
  // Handle camera permission denied
  const handleCameraPermissionDenied = useCallback(() => {
    setPermissionDenied('camera');
    setActiveTab('gallery');
    haptic('heavy');
  }, []);
  
  // Handle retry permission
  const handleRetryPermission = useCallback(async () => {
    setPermissionDenied(null);
    if (permissionDenied === 'photos') {
      await requestPermission();
    } else {
      setActiveTab('camera');
    }
  }, [permissionDenied, requestPermission]);
  
  // Handle tab change
  const handleTabChange = useCallback((tab: MediaSourceTab) => {
    setActiveTab(tab);
    if (tab === 'gallery') {
      setPermissionDenied(null);
    }
  }, []);
  
  // Check for photo library permission denied
  const isPhotosPermissionDenied = permissionStatus === 'denied';
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {activeTab === 'gallery' && (
          <AlbumSelector
            albums={albums}
            currentAlbum={currentAlbum}
            onSelect={selectAlbum}
            disabled={isLoading || isConverting}
          />
        )}
        
        {activeTab === 'camera' && (
          <span className="font-semibold">Camera</span>
        )}
        
        {/* Confirm button - only show when items are selected */}
        {selectedGalleryItems.length > 0 && (
          <button
            type="button"
            onClick={handleConfirmSelection}
            disabled={isConverting}
            className={cn(
              'px-4 py-2 rounded-full font-semibold text-sm',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center gap-2'
            )}
          >
            {isConverting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>Add ({selectedGalleryItems.length})</>
            )}
          </button>
        )}
        
        {/* Spacer when no selection */}
        {selectedGalleryItems.length === 0 && activeTab === 'gallery' && (
          <div className="w-10" />
        )}
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Permission Denied State */}
        {(permissionDenied || (activeTab === 'gallery' && isPhotosPermissionDenied)) && (
          <PermissionDeniedCard
            type={permissionDenied || 'photos'}
            onRetry={handleRetryPermission}
          />
        )}
        
        {/* Gallery View */}
        {activeTab === 'gallery' && !isPhotosPermissionDenied && !permissionDenied && (
          <>
            {isLoading ? (
              <GalleryGridSkeleton />
            ) : (
              <GalleryGrid
                items={mediaItems}
                selectedIds={selectedIds}
                maxSelection={remainingSlots}
                onSelect={handleSelectGalleryItem}
                onDeselect={handleDeselectGalleryItem}
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
              />
            )}
          </>
        )}
        
        {/* Camera View */}
        {activeTab === 'camera' && !permissionDenied && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onPermissionDenied={handleCameraPermissionDenied}
            disabled={isConverting}
          />
        )}
      </div>
      
      {/* Selection indicator bar */}
      {selectedGalleryItems.length > 0 && activeTab === 'gallery' && (
        <div className="border-t border-border bg-background px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {selectedGalleryItems.map((item, index) => (
              <div
                key={item.id}
                className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden"
              >
                <img
                  src={item.thumbnailUri || item.uri}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeselectGalleryItem(item.id)}
                  className="absolute top-0 right-0 w-5 h-5 bg-black/70 rounded-bl-lg flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center rounded-tr-lg">
                  {index + 1}
                </div>
              </div>
            ))}
            <span className="text-sm text-muted-foreground whitespace-nowrap pl-2">
              {selectedGalleryItems.length} of {remainingSlots} selected
            </span>
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <MediaSourceTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        disabled={isConverting}
      />
    </div>
  );
}
