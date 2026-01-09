/**
 * useTripTimeline - Fetches trip data and timeline items
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TripTimelineItem {
  id: string;
  type: 'game' | 'day_marker';
  title: string;
  subtitle?: string;
  occurredAt: Date;
  courseId?: string;
  courseName?: string;
  courseThumbnail?: string;
  gameId?: string;
  rsvpCounts?: {
    going: number;
    maybe: number;
    declined: number;
  };
}

export interface TripData {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  visibility: string;
  coverImageUrl?: string;
  createdBy: string;
  createdAt: Date;
}

export interface TripParticipant {
  id: string;
  userId: string;
  role: string;
  rsvpStatus: string;
  profile?: {
    displayName: string;
    profilePhotoUrl?: string;
  };
}

export function useTripTimeline(tripId: string | undefined) {
  // Fetch trip data
  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async (): Promise<TripData | null> => {
      if (!tripId) return null;
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        visibility: data.visibility,
        coverImageUrl: data.cover_image_url,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
      };
    },
    enabled: !!tripId,
  });

  // Fetch trip participants
  const participantsQuery = useQuery({
    queryKey: ['trip-participants', tripId],
    queryFn: async (): Promise<TripParticipant[]> => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from('trip_participants')
        .select(`
          id,
          user_id,
          role,
          rsvp_status,
          user_profiles:user_id (
            display_name,
            profile_photo_url
          )
        `)
        .eq('trip_id', tripId);
      
      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        role: p.role,
        rsvpStatus: p.rsvp_status,
        profile: p.user_profiles ? {
          displayName: (p.user_profiles as any).display_name,
          profilePhotoUrl: (p.user_profiles as any).profile_photo_url,
        } : undefined,
      }));
    },
    enabled: !!tripId,
  });

  // Fetch timeline items (games belonging to this trip)
  const timelineQuery = useQuery({
    queryKey: ['trip-timeline', tripId],
    queryFn: async (): Promise<TripTimelineItem[]> => {
      if (!tripId) return [];
      
      // Fetch games for this trip
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select(`
          id,
          start_time,
          status,
          course_id,
          golf_courses:course_id (
            name,
            country,
            hero_image_url
          )
        `)
        .eq('trip_id', tripId)
        .order('start_time', { ascending: true });
      
      if (gamesError) throw gamesError;
      
      const items: TripTimelineItem[] = [];
      let currentDay: string | null = null;
      
      for (const game of games || []) {
        const gameDate = new Date(game.start_time);
        const dayKey = gameDate.toISOString().split('T')[0];
        
        // Add day marker if new day
        if (dayKey !== currentDay) {
          currentDay = dayKey;
          items.push({
            id: `day-${dayKey}`,
            type: 'day_marker',
            title: gameDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            }),
            occurredAt: gameDate,
          });
        }
        
        // Add game item
        const course = game.golf_courses as any;
        items.push({
          id: game.id,
          type: 'game',
          title: course?.name || 'Golf Game',
          subtitle: gameDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          occurredAt: gameDate,
          courseId: game.course_id || undefined,
          courseName: course?.name,
          courseThumbnail: course?.hero_image_url,
          gameId: game.id,
        });
      }
      
      return items;
    },
    enabled: !!tripId,
  });

  return {
    trip: tripQuery.data,
    participants: participantsQuery.data || [],
    timeline: timelineQuery.data || [],
    isLoading: tripQuery.isLoading || participantsQuery.isLoading || timelineQuery.isLoading,
    error: tripQuery.error || participantsQuery.error || timelineQuery.error,
  };
}
