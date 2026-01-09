/**
 * Create Game/Trip V2 - Types
 */

export type SheetMode = 'game' | 'trip';

export type GameVisibility = 'public' | 'friends' | 'club' | 'private';
export type TripVisibility = 'invite' | 'friends' | 'club';
export type Visibility = GameVisibility | TripVisibility;

export type GameType = 'casual' | 'practice' | 'match';
export type HoleCount = 9 | 18;

export interface SelectedCourse {
  id: string;
  name: string;
  location?: string;
  thumbnail_image?: string;
}

export interface SelectedPlayer {
  id: string;
  name: string;
  display_name?: string;
  profile_photo_url?: string;
  isGuest?: boolean;
}

export interface TripCourseStop {
  id: string;
  courseId: string;
  courseName: string;
  courseLocation?: string;
  dayIndex: number;
  playDateTime?: Date;
  notes?: string;
}

// Draft models for Phase 2
export interface GameDraft {
  courseId: string;
  playerIds: string[];
  guestPlayers: string[];
  maxPlayers: number;
  visibility: GameVisibility;
  dateTime?: Date;
  holes?: HoleCount;
  gameType?: GameType;
  notes?: string;
}

export interface TripDraft {
  tripName?: string;
  startDate: Date;
  endDate: Date;
  visibility: TripVisibility;
  attendeeIds: string[];
  guestAttendees: string[];
  notes?: string;
  itinerary: TripCourseStop[];
}
