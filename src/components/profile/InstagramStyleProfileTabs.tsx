
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
      <TabsList className="grid w-full grid-cols-2 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b h-auto">
        <TabsTrigger 
          value="activity"
          className="flex flex-col items-center gap-1 py-3 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className="text-sm font-medium">Activity</span>
          </div>
          {activeTab === 'activity' && (
            <div 
              className="w-1.5 h-1.5 rounded-full bg-[#b66b41] mt-1 animate-fade-in"
              style={{ marginTop: '4px' }}
            />
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="courses"
          className="flex flex-col items-center gap-1 py-3 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">Top 100</span>
          </div>
          {activeTab === 'courses' && (
            <div 
              className="w-1.5 h-1.5 rounded-full bg-[#b66b41] mt-1 animate-fade-in"
              style={{ marginTop: '4px' }}
            />
          )}
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
