import React, { useState } from 'react';
import { ChevronDown, Folder, Image, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GalleryAlbum } from '@/utils/capacitor/galleryService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AlbumSelectorProps {
  albums: GalleryAlbum[];
  currentAlbum: GalleryAlbum | null;
  onSelect: (albumId: string | null) => void;
  disabled?: boolean;
}

export function AlbumSelector({
  albums,
  currentAlbum,
  onSelect,
  disabled,
}: AlbumSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get icon based on album name
  const getAlbumIcon = (album: GalleryAlbum) => {
    const nameLower = album.name.toLowerCase();
    
    if (nameLower.includes('recent') || nameLower.includes('camera roll') || nameLower.includes('all photos')) {
      return Clock;
    }
    if (nameLower.includes('favorite') || nameLower.includes('starred')) {
      return Star;
    }
    if (album.type === 'smart') {
      return Image;
    }
    return Folder;
  };
  
  const displayName = currentAlbum?.name || 'Recents';
  const displayCount = currentAlbum?.count;
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        disabled={disabled || albums.length === 0}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-muted hover:bg-accent',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <span className="font-medium text-sm truncate max-w-[150px]">
          {displayName}
        </span>
        {displayCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            ({displayCount.toLocaleString()})
          </span>
        )}
        <ChevronDown 
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
        />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-64 max-h-[300px] overflow-y-auto z-50 bg-popover"
        sideOffset={8}
      >
        {albums.map((album) => {
          const Icon = getAlbumIcon(album);
          const isSelected = currentAlbum?.id === album.id;
          
          return (
            <DropdownMenuItem
              key={album.id}
              onClick={() => {
                onSelect(album.id);
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 py-2.5 cursor-pointer',
                isSelected && 'bg-primary/10'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'bg-muted',
                isSelected && 'bg-primary/20'
              )}>
                <Icon className={cn(
                  'w-4 h-4',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-sm font-medium truncate',
                  isSelected && 'text-primary'
                )}>
                  {album.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {album.count.toLocaleString()} items
                </div>
              </div>
              
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        {albums.length === 0 && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No albums found
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
