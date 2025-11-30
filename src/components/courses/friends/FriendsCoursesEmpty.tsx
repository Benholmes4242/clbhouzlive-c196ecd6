import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const FriendsCoursesEmpty: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Icon in circular background */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">No friends' courses yet</h3>

      {/* Body text */}
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Follow other golfers to see where they've been playing and discover new courses.
      </p>

      {/* Button - tier two secondary style */}
      <Button
        variant="secondary"
        onClick={() => navigate('/golferstofollow')}
        className="w-full max-w-[320px]"
      >
        Find golfers to follow
      </Button>
    </div>
  );
};

export default FriendsCoursesEmpty;
