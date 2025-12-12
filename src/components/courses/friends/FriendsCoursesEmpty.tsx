import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FriendsCoursesEmpty: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-[520px] w-full mx-auto px-6 py-12">
      <div className="flex flex-col items-center text-center gap-5">
        {/* Icon disc with glass feel */}
        <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-sm border border-white/40 flex items-center justify-center">
          <Users className="w-9 h-9 text-muted-foreground" />
        </div>

        {/* Headline */}
        <h2 className="text-xl font-semibold text-foreground">
          See where your friends play
        </h2>

        {/* Body */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
          Friend golfers to unlock friends' course trails, ratings, and hidden gems.
        </p>

        {/* Primary CTA */}
        <Button
          onClick={() => navigate('/golferstofollow?source=friends_courses_empty')}
          className="w-full h-12 rounded-xl"
        >
          Find friends
        </Button>

        {/* Micro-tip - tighter spacing */}
        <p className="text-xs text-muted-foreground mt-[-8px]">
          Tip: Friending 5 golfers makes this tab come alive.
        </p>
      </div>
    </div>
  );
};

export default FriendsCoursesEmpty;
