
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Camera, BarChart3, MapPin } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: {
    overview: React.ReactNode;
    top100: React.ReactNode;
    activity: React.ReactNode;
    stats: React.ReactNode;
    courses: React.ReactNode;
  };
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  children
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'top100', label: 'Top 100', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Camera },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'courses', label: 'Courses', icon: MapPin }
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mt-6">
      <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger 
              key={tab.id}
              value={tab.id}
              className="flex flex-col gap-1 py-3 px-2 data-[state=active]:bg-white data-[state=active]:text-[#b66b41] text-gray-600 hover:text-[#b66b41] transition-colors"
            >
              <IconComponent className="h-4 w-4" />
              <span className="text-xs font-medium">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="mt-6">
        <TabsContent value="overview" className="mt-0">
          {children.overview}
        </TabsContent>
        <TabsContent value="top100" className="mt-0">
          {children.top100}
        </TabsContent>
        <TabsContent value="activity" className="mt-0">
          {children.activity}
        </TabsContent>
        <TabsContent value="stats" className="mt-0">
          {children.stats}
        </TabsContent>
        <TabsContent value="courses" className="mt-0">
          {children.courses}
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default ProfileTabs;
