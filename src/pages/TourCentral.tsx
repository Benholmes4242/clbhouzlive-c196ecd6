import React, { useState } from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import BottomNavigation from '@/components/BottomNavigation';
import { TourLiveView } from '@/components/tour/TourLiveView';
import { TourEventsView } from '@/components/tour/TourEventsView';
import { TourRankingsView } from '@/components/tour/TourRankingsView';
import { TourNewsView } from '@/components/tour/TourNewsView';
import { CollegeGolfView } from '@/components/tour/CollegeGolfView';

type TourTab = 'LIVE' | 'EVENTS' | 'RANKINGS' | 'NEWS' | 'COLLEGE';

const TABS: { id: TourTab; label: string }[] = [
  { id: 'LIVE', label: 'Live' },
  { id: 'EVENTS', label: 'Events' },
  { id: 'RANKINGS', label: 'Rankings' },
  { id: 'NEWS', label: 'News' },
  { id: 'COLLEGE', label: 'College Golf' },
];

const TourCentral = () => {
  const [activeTab, setActiveTab] = useState<TourTab>('LIVE');

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />
      
      <div className="px-4 md:container md:mx-auto md:px-0 py-6 pb-24">
        {/* Top header */}
        <div className="mb-4">
          <h1 className="font-display text-2xl font-semibold text-foreground">Tour Hub</h1>
          <p className="text-sm text-muted-foreground">
            Live golf, results, rankings & college golf — all in one place.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-sq-pill text-sm border transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-foreground text-background border-foreground' 
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'LIVE' && <TourLiveView />}
          {activeTab === 'EVENTS' && <TourEventsView />}
          {activeTab === 'RANKINGS' && <TourRankingsView />}
          {activeTab === 'NEWS' && <TourNewsView />}
          {activeTab === 'COLLEGE' && <CollegeGolfView />}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default TourCentral;
