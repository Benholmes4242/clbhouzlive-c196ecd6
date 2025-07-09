import React from 'react';

interface UserPostContentProps {
  content: string | null;
}

export const UserPostContent: React.FC<UserPostContentProps> = ({
  content
}) => {
  if (!content) return null;

  return (
    <div className="text-sm mb-3">
      {content}
    </div>
  );
};