
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import UpcomingEvents from '@/components/tour/UpcomingEvents';
import LiveLeaderboards from '@/components/tour/LiveLeaderboards';
import TeeTimesSection from '@/components/tour/TeeTimesSection';
import RankingsSection from '@/components/tour/RankingsSection';

const TourCentral = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center">Tour Central</h1>
          <p className="text-muted-foreground text-center mt-2">
            Your hub for global golf competitions and live events
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Events</TabsTrigger>
            <TabsTrigger value="leaderboards">Live</TabsTrigger>
            <TabsTrigger value="teetimes">Tee Times</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <UpcomingEvents />
          </TabsContent>

          <TabsContent value="leaderboards" className="mt-6">
            <LiveLeaderboards />
          </TabsContent>

          <TabsContent value="teetimes" className="mt-6">
            <TeeTimesSection />
          </TabsContent>

          <TabsContent value="rankings" className="mt-6">
            <RankingsSection />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default TourCentral;
