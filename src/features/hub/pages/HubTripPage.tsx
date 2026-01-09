/**
 * HubTripPage - Trip detail page with timeline
 */

import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, Share2 } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TripHeader } from '../components/trip/TripHeader';
import { TripTimeline } from '../components/trip/TripTimeline';
import { useTripTimeline } from '../hooks/useTripTimeline';
import { Loader2 } from 'lucide-react';

const tabTriggerClass = "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]";

export default function HubTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'timeline';

  const { trip, participants, timeline, isLoading, error } = useTripTimeline(tripId);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/hub');
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (isLoading) {
    return (
      <PageRoot className="bg-background">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageRoot>
    );
  }

  if (error || !trip) {
    return (
      <PageRoot className="bg-background">
        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
          <h2 className="font-semibold text-foreground mb-1">Trip not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This trip may have been deleted or you don't have access.
          </p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="font-medium text-foreground truncate mx-4">
            {trip.name}
          </span>
          
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        <TripHeader trip={trip} participants={participants} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
          <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none p-0 h-auto">
            <TabsTrigger value="timeline" className={tabTriggerClass}>
              Timeline
            </TabsTrigger>
            <TabsTrigger value="players" className={tabTriggerClass}>
              Players
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <TripTimeline items={timeline} isLoading={false} />
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            <div className="space-y-2">
              {participants.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                >
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {p.profile?.displayName || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.role} · {p.rsvpStatus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageRoot>
  );
}
