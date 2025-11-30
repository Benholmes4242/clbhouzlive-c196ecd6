
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Users, Globe } from 'lucide-react';

const FriendsCourses = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="text-4xl mb-4">🌍</div>
        <h3 className="text-xl font-semibold mb-2">Explore the Global Top 100</h3>
        <p className="text-muted-foreground mb-6">
          Discover the world's greatest golf courses and follow the community's journey through the Top 100.
        </p>
          <Button onClick={() => navigate('/top100')} className="w-full">
            <Globe className="h-4 w-4 mr-2" />
            Visit Global Top 100
        </Button>
      </div>
    </div>
  );
};

export default FriendsCourses;
