
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Trophy } from 'lucide-react';

interface InstagramStyleProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: {
    activity: React.ReactNode;
    courses: React.ReactNode;
  };
}

const InstagramStyleProfileTabs: React.FC<InstagramStyleProfileTabsProps> = ({
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <TabsTrigger 
          value="activity"
          className="flex items-center gap-2 py-3 data-[state=active]:text-[#b66b41] data-[state=active]:border-b-2 data-[state=active]:border-[#b66b41]"
        >
          <Camera className="h-4 w-4" />
          <span className="text-sm font-medium">Activity</span>
        </TabsTrigger>
        <TabsTrigger 
          value="courses"
          className="flex items-center gap-2 py-3 data-[state=active]:text-[#b66b41] data-[state=active]:border-b-2 data-[state=active]:border-[#b66b41]"
        >
          <Trophy className="h-4 w-4" />
          <span className="text-sm font-medium">Top 100</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="activity" className="mt-0">
        {children.activity}
      </TabsContent>
      
      <TabsContent value="courses" className="mt-0">
        {children.courses}
      </TabsContent>
    </Tabs>
  );
};

export default InstagramStyleProfileTabs;
