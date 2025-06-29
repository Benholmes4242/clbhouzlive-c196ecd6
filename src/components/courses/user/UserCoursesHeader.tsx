
import React from 'react';

interface UserCoursesHeaderProps {
  displayName: string;
  isOwnProfile: boolean;
}

const UserCoursesHeader: React.FC<UserCoursesHeaderProps> = ({ 
  displayName, 
  isOwnProfile 
}) => {
  // Remove the header text as it's redundant with the tab navigation
  return null;
};

export default UserCoursesHeader;
