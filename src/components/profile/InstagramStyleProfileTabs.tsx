
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Trophy, Award } from 'lucide-react';

interface InstagramStyleProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: {
    activity: React.ReactNode;
    courses: React.ReactNode;
    badges?: React.ReactNode;  // Make badges optional since it won't exist for business accounts
  };
}

const InstagramStyleProfileTabs: React.FC<InstagramStyleProfileTabsProps> = ({
  activeTab,
  onTabChange,
  children
}) => {
  const hasBadges = !!children.badges;
  const tabsCount = hasBadges ? 3 : 2;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className={`grid w-full ${tabsCount === 3 ? 'grid-cols-3' : 'grid-cols-2'} h-auto bg-transparent border-0 p-0`}>
        <TabsTrigger 
          value="activity"
          className="flex items-center justify-center gap-2 py-4 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none border-0"
        >
          <Camera className="h-4 w-4" />
          <span className="text-sm font-medium">Activity</span>
          {activeTab === 'activity' && (
            <div 
              className="w-1.5 h-1.5 rounded-full bg-[#6e9277] ml-1"
            />
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="courses"
          className="flex items-center justify-center gap-2 py-4 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none border-0"
        >
          <Trophy className="h-4 w-4" />
          <span className="text-sm font-medium">Top 100</span>
          {activeTab === 'courses' && (
            <div 
              className="w-1.5 h-1.5 rounded-full bg-[#6e9277] ml-1"
            />
          )}
        </TabsTrigger>
        {hasBadges && (
          <TabsTrigger 
            value="badges"
            className="flex items-center justify-center gap-2 py-4 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none border-0"
          >
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium">Badges</span>
            {activeTab === 'badges' && (
              <div 
                className="w-1.5 h-1.5 rounded-full bg-[#6e9277] ml-1"
              />
            )}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="activity" className="mt-0">
        {children.activity}
      </TabsContent>
      
      <TabsContent value="courses" className="mt-0">
        {children.courses}
      </TabsContent>

      {hasBadges && (
        <TabsContent value="badges" className="mt-0">
          {children.badges}
        </TabsContent>
      )}
    </Tabs>
  );
};

export default InstagramStyleProfileTabs;
