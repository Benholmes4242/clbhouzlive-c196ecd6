/**
 * GolfItinerary - Phase 7: Lightweight trip planning
 * No dates, no hotels, no bookings - just a saved plan
 */
import React, { useState } from 'react';
import { Map, Plus, GripVertical, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/lib/toast';

interface Itinerary {
  id: string;
  name: string;
  courses: { courseId: string; courseName: string; order: number }[];
  createdAt: string;
}

interface GolfItineraryProps {
  className?: string;
}

export const GolfItinerary: React.FC<GolfItineraryProps> = ({ className }) => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const [newTripName, setNewTripName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // For now, use course_shortlists with list_key as trip name
  const { data: itineraries, isLoading } = useQuery({
    queryKey: ['golf-itineraries', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Itinerary[]> => {
      if (!user?.id) return [];

      const { data: shortlists } = await supabase
        .from('course_shortlists')
        .select(`
          id,
          course_id,
          list_key,
          created_at,
          golf_courses!inner(name)
        `)
        .eq('user_id', user.id)
        .not('list_key', 'in', '("want_to_play","next_up")')
        .not('list_key', 'is', null)
        .order('created_at', { ascending: true });

      // Group by list_key (trip name)
      const tripMap: Record<string, Itinerary> = {};
      
      shortlists?.forEach((s: any, index: number) => {
        const tripName = s.list_key;
        if (!tripName) return;

        if (!tripMap[tripName]) {
          tripMap[tripName] = {
            id: tripName,
            name: tripName,
            courses: [],
            createdAt: s.created_at,
          };
        }
        
        tripMap[tripName].courses.push({
          courseId: s.course_id,
          courseName: s.golf_courses?.name || 'Unknown',
          order: index,
        });
      });

      return Object.values(tripMap);
    },
    staleTime: 3 * 60 * 1000,
  });

  const createItinerary = useMutation({
    mutationFn: async (name: string) => {
      // Just validate name for now - courses added separately
      if (!name.trim()) throw new Error('Name required');
      return { name: name.trim() };
    },
    onSuccess: () => {
      toast.success('Trip created');
      setNewTripName('');
      setIsCreating(false);
    },
    onError: () => {
      toast.error('Failed to create trip');
    },
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-xl p-5", className)}>
        <Skeleton className="h-5 w-24 mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-xl p-5 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-slate-500" />
          <h3 className="text-base font-semibold text-slate-900">My Trips</h3>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-slate-500">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create a Trip</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="e.g. Scotland 2026"
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                Give your trip a name. You can add courses later.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createItinerary.mutate(newTripName)}
                  disabled={!newTripName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Itineraries list */}
      {itineraries && itineraries.length > 0 ? (
        <div className="space-y-3">
          {itineraries.map((trip) => (
            <button
              key={trip.id}
              className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{trip.name}</p>
                <p className="text-xs text-slate-500">
                  {trip.courses.length} {trip.courses.length === 1 ? 'course' : 'courses'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Map className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-3">
            Plan your next golf trip
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Trip
          </Button>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-slate-400 text-center pt-2">
        Your trips are private
      </p>
    </div>
  );
};

export default GolfItinerary;
