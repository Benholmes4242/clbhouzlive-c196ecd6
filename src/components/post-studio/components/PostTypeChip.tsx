// PostTypeChip — Standard / Review chip toggle
import React from 'react';
import type { PostType } from '../types';

interface PostTypeChipProps {
  postType: PostType;
  onChange: (type: PostType) => void;
}

export function PostTypeChip({ postType, onChange }: PostTypeChipProps) {
  return (
    <button
      onClick={() => onChange(postType === 'standard' ? 'review' : 'standard')}
      className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[44px] flex items-center transition-colors ${
        postType === 'review'
          ? 'bg-primary/15 text-primary'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {postType === 'review' ? '⭐ Review' : 'Post'}
    </button>
  );
}
