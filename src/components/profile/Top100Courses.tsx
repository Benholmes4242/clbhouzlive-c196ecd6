
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, MapPin } from 'lucide-react';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';


interface Top100CoursesProps {
  userId: string;
  isOwnProfile?: boolean;
  top100Visible?: boolean;
  userDisplayName?: string;
}

const Top100Courses: React.FC<Top100CoursesProps> = ({
  userId,
  isOwnProfile = false,
  top100Visible = true,
  userDisplayName
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useSupabaseSession();
  
  const {
    regionProgress,
    isLoading,
    handleVisibilityToggle
  } = useTop100CoursesData(userId, isOwnProfile);

  console.log('Top100Courses component - userId:', userId, 'isOwnProfile:', isOwnProfile, 'top100Visible:', top100Visible);

  const shouldShowSection = isOwnProfile || top100Visible;
  console.log('shouldShowSection:', shouldShowSection);

  if (!shouldShowSection) {
    console.log('Top100Courses returning null due to shouldShowSection being false');
    return null;
  }

  // Generate dynamic heading text
  const displayName = isOwnProfile ? 'you' : (userDisplayName || 'this user');
  const headlineText = `Here's how ${displayName} rate${isOwnProfile ? '' : 's'} the world's top courses`;

  const regions = [
    { key: 'britain-ireland', name: 'Britain & Ireland' },
    { key: 'usa', name: 'United States' },
    { key: 'europe', name: 'Continental Europe' },
    { key: 'global', name: 'Global' }
  ];

  const handleRegionClick = async (regionKey: string) => {
    try {
      if (isOwnProfile) {
        // For own profile, go to courses page with my-courses tab
        navigate('/courses?tab=my-courses');
      } else {
        // For other users, get their username and redirect to their courses page
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', userId)
          .maybeSingle();
        
        if (userProfile?.username) {
          // Navigate to the user's dedicated courses page which will show the My Courses tab by default
          navigate(`/user/${userProfile.username}/courses`);
        } else {
          console.warn('No username found for user:', userId);
          // Fallback - this shouldn't normally happen but provides a backup
          navigate(`/user/${userId}/courses`);
        }
      }
    } catch (error) {
      console.error('Error navigating to courses:', error);
    }
  };

  if (isLoading) {
    return (
      <section className="mt-10 py-2">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xl font-bold">Top 100 Courses</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Loading course data...
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 py-2">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-bold">Top 100 Courses</h2>
        </div>
        
        {isOwnProfile && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-top100"
              checked={top100Visible}
              onCheckedChange={(checked) => {
                console.log('Checkbox clicked:', checked);
                handleVisibilityToggle(Boolean(checked));
              }}
            />
            <label 
              htmlFor="show-top100" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              onClick={() => {
                console.log('Label clicked, current state:', top100Visible);
                handleVisibilityToggle(!top100Visible);
              }}
            >
              Show this section on my public profile
            </label>
          </div>
        )}
      </div>


      {/* Dynamic heading text */}
      <div className="text-center mb-6 px-2">
        <p className="text-lg text-foreground font-normal">{headlineText}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
        {regions.map((region) => {
          const progress = regionProgress[region.key];
          const percentage = progress?.total > 0 ? Math.round((progress.played / progress.total) * 100) : 0;
          
          return (
            <Card 
              key={region.key}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRegionClick(region.key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{region.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {progress?.played || 0}/{progress?.total || 0}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{percentage}% complete</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>View courses</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default Top100Courses;
