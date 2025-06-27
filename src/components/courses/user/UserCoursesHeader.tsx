
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
      <h1 className="text-3xl font-bold mb-2">{displayName} Courses</h1>
      <p className="text-muted-foreground">
        {isOwnProfile 
          ? 'Track your golf course journey' 
          : `View ${displayName.replace("'s", '')}'s golf course checklist`
        }
      </p>
    </div>
  );
};

export default UserCoursesHeader;
