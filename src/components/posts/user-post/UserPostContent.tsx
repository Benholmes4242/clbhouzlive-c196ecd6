import React from 'react';
import TaggedText from '../TaggedText';
import { PostTag } from './types';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface UserPostContentProps {
  content: string | null;
  tags: PostTag[];
}

export const UserPostContent: React.FC<UserPostContentProps> = ({
  content,
  tags
}) => {
  if (!content) return null;

  // Remove golf course information from content since it's now displayed as a badge
  const cleanedContent = removeGolfCourseFromContent(content);
  
  if (!cleanedContent) return null;

  return (
    <div className="text-sm mb-3">
      <TaggedText text={cleanedContent} tags={tags} />
    </div>
  );
};