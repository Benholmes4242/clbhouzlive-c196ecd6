
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Calendar, User } from 'lucide-react';

interface EmptyStateProps {
  isOwnProfile: boolean;
  displayName: string;
}

export const SignInRequiredState: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-2">User's Golf Courses</h1>
      <p className="text-muted-foreground">
        Sign in to view user profiles and course checklists
      </p>
    </div>
    <Card>
      <CardContent className="p-8 text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
        <p className="text-muted-foreground mb-4">
          Create an account to view user profiles and course information
        </p>
      </CardContent>
    </Card>
  </div>
);

export const LoadingState: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-2">Loading...</h1>
      <p className="text-muted-foreground">
        Loading user profile and course information
      </p>
    </div>
  </div>
);

export const UserNotFoundState: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-2">User Not Found</h1>
      <p className="text-muted-foreground">
        The user profile you're looking for doesn't exist or isn't public
      </p>
    </div>
  </div>
);

export const EmptyTop100State: React.FC<EmptyStateProps> = ({ isOwnProfile, displayName }) => (
  <Card>
    <CardContent className="p-8 text-center">
      <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
      <h3 className="text-lg font-semibold mb-2">
        {isOwnProfile ? 'No Top 100 courses rated yet' : `${displayName.replace("'s", '')} hasn't rated any Top 100 courses yet`}
      </h3>
      <p className="text-muted-foreground">
        {isOwnProfile 
          ? 'Explore the world\'s greatest golf courses and rate them to track your journey'
          : 'Check back later to see their golf course journey'
        }
      </p>
    </CardContent>
  </Card>
);

export const EmptyRecentState: React.FC<EmptyStateProps> = ({ isOwnProfile, displayName }) => (
  <Card>
    <CardContent className="p-8 text-center">
      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">
        {isOwnProfile ? 'No recent activity' : `${displayName.replace("'s", '')} has no recent activity`}
      </h3>
      <p className="text-muted-foreground">
        {isOwnProfile 
          ? 'Play some courses in the last 30 days and they\'ll appear here'
          : 'No courses played in the last 30 days'
        }
      </p>
    </CardContent>
  </Card>
);
