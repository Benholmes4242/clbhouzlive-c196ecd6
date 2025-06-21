
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

const EmptyFriendsState: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
        <p className="text-muted-foreground">
          Add some friends to see their course progress and golfing journey
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyFriendsState;
