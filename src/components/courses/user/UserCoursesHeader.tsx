
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-white">Top 100 courses</h2>
      </div>
      <div className="text-center">
        <p className="text-lg text-foreground font-normal">
          {introText}
        </p>
      </div>
    </div>
  );
};

export default UserCoursesHeader;
