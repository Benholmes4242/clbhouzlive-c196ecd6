
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UpcomingEvents from '@/components/tour/UpcomingEvents';
import LiveLeaderboards from '@/components/tour/LiveLeaderboards';
import NewsComponent from '@/components/News';
import RankingsSection from '@/components/tour/RankingsSection';

const TourCentral = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <h1 className="text-2xl font-bold mb-6">Tour Central</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            <UpcomingEvents />
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            <p className="text-center text-muted-foreground">Past events coming soon...</p>
          </TabsContent>
          
          <TabsContent value="favorites" className="space-y-4">
            <p className="text-center text-muted-foreground">Favorite venues coming soon...</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TourCentral;
