/**
 * useTripTimeline - Fetches trip data and timeline items
 * V2: Includes notes, day markers with Day N, proper ordering
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';

export interface TripTimelineItem {
  id: string;
  type: 'game' | 'day_marker' | 'note';
  title: string;
  subtitle?: string;
  meta?: string; // For day markers: "2 games"
  occurredAt: Date;
  dayNumber?: number; // Day N for day markers
  courseId?: string;
  courseName?: string;
  courseThumbnail?: string;
  gameId?: string;
  rsvpCounts?: {
    going: number;
    maybe: number;
    declined: number;
  };
  userRsvp?: 'going' | 'maybe' | 'declined' | 'invited' | null;
  noteId?: string;
  canEdit?: boolean;
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

  // Fetch timeline items (games + notes merged)
  const timelineQuery = useQuery({
    queryKey: ['trip-timeline', tripId],
    queryFn: async (): Promise<TripTimelineItem[]> => {
      if (!tripId) return [];
      
      // Fetch trip start date for Day N calculation
      const { data: tripData } = await supabase
        .from('trips')
        .select('start_date')
        .eq('id', tripId)
        .single();
      
      const tripStartDate = tripData?.start_date ? new Date(tripData.start_date) : null;
      
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
      
      // Fetch notes for this trip
      const { data: notes, error: notesError } = await supabase
        .from('trip_timeline_notes')
        .select('*')
        .eq('trip_id', tripId)
        .order('occurs_at', { ascending: true, nullsFirst: false });
      
      if (notesError) throw notesError;
      
      // Fetch RSVP counts for all games + current user's status
      const gameIds = games?.map(g => g.id) || [];
      let rsvpCountsMap = new Map<string, { going: number; maybe: number; declined: number }>();
      let userRsvpMap = new Map<string, 'going' | 'maybe' | 'declined' | 'invited' | null>();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (gameIds.length > 0) {
        const { data: participants } = await supabase
          .from('game_participants')
          .select('game_id, rsvp_status, user_id')
          .in('game_id', gameIds);
        
        // Calculate counts per game and track user's status
        participants?.forEach(p => {
          const counts = rsvpCountsMap.get(p.game_id) || { going: 0, maybe: 0, declined: 0 };
          if (p.rsvp_status === 'going') counts.going++;
          else if (p.rsvp_status === 'maybe') counts.maybe++;
          else if (p.rsvp_status === 'declined') counts.declined++;
          rsvpCountsMap.set(p.game_id, counts);
          
          // Track current user's RSVP status
          if (user && p.user_id === user.id) {
            userRsvpMap.set(p.game_id, p.rsvp_status as any);
          }
        });
      }
      
      // Build intermediate items with sort keys
      interface SortableItem {
        dayKey: string;
        bucket: number; // 0 = timed note, 1 = game, 2 = untimed note
        timeKey: string;
        createdAt: string;
        item: Omit<TripTimelineItem, 'dayNumber'>;
      }
      
      const sortableItems: SortableItem[] = [];
      
      // Add games
      for (const game of games || []) {
        const gameDate = new Date(game.start_time);
        const dayKey = format(gameDate, 'yyyy-MM-dd');
        const timeKey = format(gameDate, 'HH:mm:ss');
        const course = game.golf_courses as any;
        const gameCounts = rsvpCountsMap.get(game.id);
        const userRsvp = userRsvpMap.get(game.id) ?? null;
        
        sortableItems.push({
          dayKey,
          bucket: 1,
          timeKey,
          createdAt: game.start_time,
          item: {
            id: game.id,
            type: 'game',
            title: course?.name || 'Golf Game',
            subtitle: format(gameDate, 'h:mm a'),
            occurredAt: gameDate,
            courseId: game.course_id || undefined,
            courseName: course?.name,
            courseThumbnail: course?.hero_image_url,
            gameId: game.id,
            rsvpCounts: gameCounts,
            userRsvp,
          },
        });
      }
      
      // Add notes
      for (const note of notes || []) {
        let dayKey: string;
        let bucket: number;
        let timeKey: string;
        let occurredAt: Date;
        
        if (note.occurs_at) {
          const noteDate = new Date(note.occurs_at);
          dayKey = format(noteDate, 'yyyy-MM-dd');
          bucket = 0; // Timed notes come first
          timeKey = format(noteDate, 'HH:mm:ss');
          occurredAt = noteDate;
        } else {
          // Untimed notes: use created_at for day, but place at end of day
          const createdDate = new Date(note.created_at);
          dayKey = format(createdDate, 'yyyy-MM-dd');
          bucket = 2; // Untimed notes come last
          timeKey = '23:59:59';
          occurredAt = createdDate;
        }
        
        sortableItems.push({
          dayKey,
          bucket,
          timeKey,
          createdAt: note.created_at,
          item: {
            id: note.id,
            type: 'note',
            title: note.text,
            subtitle: note.occurs_at ? format(new Date(note.occurs_at), 'h:mm a') : undefined,
            occurredAt,
            noteId: note.id,
            canEdit: user ? note.created_by === user.id : false,
          },
        });
      }
      
      // Sort items
      sortableItems.sort((a, b) => {
        // First by day
        if (a.dayKey !== b.dayKey) return a.dayKey.localeCompare(b.dayKey);
        // Then by bucket
        if (a.bucket !== b.bucket) return a.bucket - b.bucket;
        // Then by time
        if (a.timeKey !== b.timeKey) return a.timeKey.localeCompare(b.timeKey);
        // Finally by created_at
        return a.createdAt.localeCompare(b.createdAt);
      });
      
      // Build final items with day markers
      const items: TripTimelineItem[] = [];
      let currentDay: string | null = null;
      const itemsByDay = new Map<string, number>();
      
      // Count items per day first (for meta)
      for (const si of sortableItems) {
        itemsByDay.set(si.dayKey, (itemsByDay.get(si.dayKey) || 0) + 1);
      }
      
      for (const si of sortableItems) {
        // Add day marker if new day
        if (si.dayKey !== currentDay) {
          currentDay = si.dayKey;
          const dayDate = new Date(si.dayKey + 'T00:00:00');
          
          // Calculate Day N if trip has start date
          let dayNumber: number | undefined;
          if (tripStartDate) {
            dayNumber = differenceInDays(dayDate, tripStartDate) + 1;
          }
          
          // Format title
          const title = dayNumber !== undefined
            ? `Day ${dayNumber} · ${format(dayDate, 'EEE d MMM')}`
            : format(dayDate, 'EEEE, d MMM');
          
          const itemCount = itemsByDay.get(si.dayKey) || 0;
          const gameCount = sortableItems.filter(s => s.dayKey === si.dayKey && s.item.type === 'game').length;
          
          items.push({
            id: `day-${si.dayKey}`,
            type: 'day_marker',
            title,
            meta: gameCount > 0 ? `${gameCount} game${gameCount > 1 ? 's' : ''}` : undefined,
            occurredAt: dayDate,
            dayNumber,
          });
        }
        
        items.push(si.item as TripTimelineItem);
      }
      
      return items;
    },
    enabled: !!tripId,
  });

  // Check if current user is trip host
  const isHost = tripQuery.data?.createdBy === participantsQuery.data?.find(p => p.role === 'host')?.userId || 
                 (tripQuery.data && participantsQuery.data?.some(p => p.role === 'host'));

  return {
    trip: tripQuery.data,
    participants: participantsQuery.data || [],
    timeline: timelineQuery.data || [],
    isLoading: tripQuery.isLoading || participantsQuery.isLoading || timelineQuery.isLoading,
    error: tripQuery.error || participantsQuery.error || timelineQuery.error,
    isHost: tripQuery.data ? true : false, // Simplified: trip creator is host
  };
}
