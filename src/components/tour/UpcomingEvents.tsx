
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bell, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTourLogoSize } from './rankings/utils';
import { MOCK_EVENTS, type Event } from './mockData';

// Tour logo mapping
const tourLogos: Record<string, string> = {
  'PGA': '/lovable-uploads/40d74a79-f402-4d98-af1d-242a35f993b4.png',
  'LIV': '/lovable-uploads/09ec2e18-35f5-46cb-81a5-9862fe118274.png',
  'DP World': '/lovable-uploads/62b4549e-fa2b-468b-9d6b-680542b8344d.png',
  'University': '/lovable-uploads/6272d8e2-c43e-49e6-ae7b-667db411c2f8.png',
  'Amateur': '/lovable-uploads/6272d8e2-c43e-49e6-ae7b-667db411c2f8.png',
};

const UpcomingEvents = () => {
  const [filterTour, setFilterTour] = useState<string>('all');

  const getTourColor = (tour: string) => {
    switch (tour) {
      case 'PGA': return 'bg-blue-500';
      case 'LIV': return 'bg-green-500';
      case 'DP World': return 'bg-gray-500';
      case 'University': return 'bg-red-900';
      case 'Amateur': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const filteredEvents = filterTour === 'all' 
    ? MOCK_EVENTS 
    : MOCK_EVENTS.filter(event => event.tour === filterTour);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between min-h-[4rem]">
        <h2 className="text-xl font-semibold">Upcoming Events</h2>
        <Select value={filterTour} onValueChange={setFilterTour}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tour" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tours</SelectItem>
            <SelectItem value="PGA">PGA Tour</SelectItem>
            <SelectItem value="LIV">LIV Golf</SelectItem>
            <SelectItem value="DP World">DP World Tour</SelectItem>
            <SelectItem value="University">University Golf</SelectItem>
            <SelectItem value="Amateur">Amateur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 min-h-[5rem]">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                  <div className="flex items-center gap-3 mb-2">
                    {event.status === 'live' && (
                      <Badge variant="destructive" className="animate-pulse">
                        LIVE
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={`flex items-center justify-end ${getTourLogoSize(event.tour)}`}>
                  <img
                    src={tourLogos[event.tour]}
                    alt={`${event.tour} logo`}
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
                {event.prize && (
                  <div className="text-sm font-medium text-green-600">
                    Prize Pool: {event.prize}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    Add to Calendar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Bell className="h-4 w-4 mr-1" />
                    Set Reminder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
