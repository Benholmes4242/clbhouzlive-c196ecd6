
import React from 'react';

interface UserCoursesHeaderProps {
  displayName: string;
  isOwnProfile: boolean;
}

const UserCoursesHeader: React.FC<UserCoursesHeaderProps> = ({ 
  displayName, 
  isOwnProfile 
}) => {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">{displayName} Courses</h1>
    </div>
  );
};

export default UserCoursesHeader;
