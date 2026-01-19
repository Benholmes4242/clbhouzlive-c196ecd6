import React from 'react';
import { Video, Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedVideoSlotProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  isOwner: boolean;
  onEditClick?: () => void;
  className?: string;
}

/**
 * Phase 3.2: Featured Video Slot for Creators
 * 
 * Allows creators to feature a video at the top of their profile.
 * Shows empty state with CTA for owners, hidden for non-owners if no video.
 */
export function FeaturedVideoSlot({ 
  videoUrl, 
  posterUrl, 
  isOwner, 
  onEditClick,
  className 
}: FeaturedVideoSlotProps) {
  // If no video and not owner, don't show the slot
  if (!videoUrl && !isOwner) {
    return null;
  }

  // Empty state for owners
  if (!videoUrl && isOwner) {
    return (
      <div 
        className={className}
        style={{ 
          background: 'white',
          border: '1px dashed rgba(31,36,40,0.15)',
          borderRadius: '18px',
        }}
      >
        <button
          onClick={onEditClick}
          className="w-full py-8 flex flex-col items-center gap-3 hover:bg-[#F4F5F7]/50 transition-colors rounded-sq-lg"
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: '#EDEFF2' }}
          >
            <Video className="h-6 w-6 text-[#97A1AA]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#1F2428]">Feature a video</p>
            <p className="text-xs text-[#97A1AA] mt-0.5">
              Pin your best content to the top of your profile
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-1 rounded-full text-[#1F2428] border-[#1F2428]/10 hover:bg-[#EDEFF2]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add video
          </Button>
        </button>
      </div>
    );
  }

  // Video display
  return (
    <div 
      className={className}
      style={{ 
        background: 'white',
        border: '1px solid rgba(31,36,40,0.08)',
        borderRadius: '18px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(31,36,40,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-[#F7931E]" />
          <span className="text-xs font-medium text-[#5E666D]">Featured</span>
        </div>
        {isOwner && (
          <button
            onClick={onEditClick}
            className="text-xs text-[#F7931E] font-medium hover:underline"
          >
            Change
          </button>
        )}
      </div>

      {/* Video thumbnail */}
      <div className="relative aspect-video bg-[#0A0A0A]">
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt="Featured video" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-12 w-12 text-white/30" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          >
            <Play className="h-6 w-6 text-[#1F2428] ml-1" fill="#1F2428" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturedVideoSlot;
