import React from 'react';
import TaggedText from '../TaggedText';
import { PostTag } from './types';

interface UserPostContentProps {
  content: string | null;
  tags: PostTag[];
}

export const UserPostContent: React.FC<UserPostContentProps> = ({
  content,
  tags
}) => {
  if (!content) return null;

  return (
    <div className="text-sm mb-3">
      <TaggedText text={content} tags={tags} />
    </div>
  );
};