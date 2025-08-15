
import React from 'react';

interface UserCoursesHeaderProps {
  displayName: string;
  isOwnProfile: boolean;
}

const UserCoursesHeader: React.FC<UserCoursesHeaderProps> = ({ 
  displayName, 
  isOwnProfile 
}) => {
  // Extract first name from display name or use display name if it's a single word
  const firstName = displayName?.split(' ')[0] || displayName || 'User';

  // Dynamic intro text based on profile ownership
  const introText = isOwnProfile 
    ? "Here's how you rate the world's top courses"
    : `Here's how ${firstName} rates the world's top courses`;

  return (
    <div>
    </div>
  );
};

export default UserCoursesHeader;
