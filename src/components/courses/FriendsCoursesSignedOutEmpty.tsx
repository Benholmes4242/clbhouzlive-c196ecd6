import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FriendsCoursesSignedOutEmpty: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Friends' Courses</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to see where your friends are playing.
        </p>
      </div>
      <Card className="p-6 flex flex-col items-start gap-3">
        <div className="text-base font-medium">
          Sign in to see friends' courses
        </div>
        <p className="text-sm text-muted-foreground">
          Discover where your friends have been playing and which courses are
          trending in your circle.
        </p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </Card>
    </div>
  );
};

export default FriendsCoursesSignedOutEmpty;
