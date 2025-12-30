/**
 * Music Library - Curated tracks hosted on Cloudflare R2
 * All tracks served via signed Worker endpoint: /api/audio/sign?key=...
 */

export type MusicMood = 'ambient' | 'calm' | 'cinematic' | 'hype' | 'upbeat';

export interface MusicTrack {
  id: string;              // slug, unique
  title: string;           // user-facing
  artist: string;          // default: "Clbhouz Sounds"
  mood: MusicMood;
  duration: string;        // display format "2:30"
  durationSec?: number;    // optional for now
  r2Key: string;           // EXACT R2 object key (case-sensitive)
}

/**
 * Generate a signed URL for audio playback via the Worker endpoint
 */
export function getSignedAudioUrl(r2Key: string): string {
  return `/api/audio/sign?key=${encodeURIComponent(r2Key)}`;
}

/**
 * Helper to prettify filename into title
 */
function prettifyFilename(filename: string): string {
  return filename
    .replace(/\.mp3$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Helper to create slug from filename
 */
function slugify(filename: string): string {
  return filename
    .replace(/\.mp3$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// MUSIC LIBRARY - Tracks from R2 clbhouz-audio bucket
// R2 Keys are case-sensitive and match: Tracks/<Folder>/<Filename>.mp3
// ============================================================================

export const MUSIC_LIBRARY: MusicTrack[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // AMBIENT
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'ambient-dawn-chorus',
    title: 'Dawn Chorus',
    artist: 'Clbhouz Sounds',
    mood: 'ambient',
    duration: '2:30',
    durationSec: 150,
    r2Key: 'Tracks/Ambient/Dawn-Chorus.mp3',
  },
  {
    id: 'ambient-morning-mist',
    title: 'Morning Mist',
    artist: 'Clbhouz Sounds',
    mood: 'ambient',
    duration: '3:00',
    durationSec: 180,
    r2Key: 'Tracks/Ambient/Morning-Mist.mp3',
  },
  {
    id: 'ambient-green-serenity',
    title: 'Green Serenity',
    artist: 'Clbhouz Sounds',
    mood: 'ambient',
    duration: '2:45',
    durationSec: 165,
    r2Key: 'Tracks/Ambient/Green-Serenity.mp3',
  },
  {
    id: 'ambient-links-at-dawn',
    title: 'Links At Dawn',
    artist: 'Clbhouz Sounds',
    mood: 'ambient',
    duration: '2:50',
    durationSec: 170,
    r2Key: 'Tracks/Ambient/Links-At-Dawn.mp3',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CALM
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'calm-fairway-dreams',
    title: 'Fairway Dreams',
    artist: 'Clbhouz Sounds',
    mood: 'calm',
    duration: '2:30',
    durationSec: 150,
    r2Key: 'Tracks/Calm/Fairway-Dreams.mp3',
  },
  {
    id: 'calm-sunset-putt',
    title: 'Sunset Putt',
    artist: 'Clbhouz Sounds',
    mood: 'calm',
    duration: '3:12',
    durationSec: 192,
    r2Key: 'Tracks/Calm/Sunset-Putt.mp3',
  },
  {
    id: 'calm-morning-dew',
    title: 'Morning Dew',
    artist: 'Clbhouz Sounds',
    mood: 'calm',
    duration: '2:45',
    durationSec: 165,
    r2Key: 'Tracks/Calm/Morning-Dew.mp3',
  },
  {
    id: 'calm-peaceful-greens',
    title: 'Peaceful Greens',
    artist: 'Clbhouz Sounds',
    mood: 'calm',
    duration: '2:20',
    durationSec: 140,
    r2Key: 'Tracks/Calm/Peaceful-Greens.mp3',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CINEMATIC
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'cinematic-the-perfect-drive',
    title: 'The Perfect Drive',
    artist: 'Clbhouz Sounds',
    mood: 'cinematic',
    duration: '2:30',
    durationSec: 150,
    r2Key: 'Tracks/Cinematic/The-Perfect-Drive.mp3',
  },
  {
    id: 'cinematic-championship-moment',
    title: 'Championship Moment',
    artist: 'Clbhouz Sounds',
    mood: 'cinematic',
    duration: '3:00',
    durationSec: 180,
    r2Key: 'Tracks/Cinematic/Championship-Moment.mp3',
  },
  {
    id: 'cinematic-epic-finish',
    title: 'Epic Finish',
    artist: 'Clbhouz Sounds',
    mood: 'cinematic',
    duration: '2:40',
    durationSec: 160,
    r2Key: 'Tracks/Cinematic/Epic-Finish.mp3',
  },
  {
    id: 'cinematic-glory-shot',
    title: 'Glory Shot',
    artist: 'Clbhouz Sounds',
    mood: 'cinematic',
    duration: '2:15',
    durationSec: 135,
    r2Key: 'Tracks/Cinematic/Glory-Shot.mp3',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // HYPE
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'hype-birdie-energy',
    title: 'Birdie Energy',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '2:15',
    durationSec: 135,
    r2Key: 'Tracks/Hype/Birdie-Energy.mp3',
  },
  {
    id: 'hype-eagle-rush',
    title: 'Eagle Rush',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '2:00',
    durationSec: 120,
    r2Key: 'Tracks/Hype/Eagle-Rush.mp3',
  },
  {
    id: 'hype-power-drive',
    title: 'Power Drive',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '1:45',
    durationSec: 105,
    r2Key: 'Tracks/Hype/Power-Drive.mp3',
  },
  {
    id: 'hype-ace-moment',
    title: 'Ace Moment',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '2:10',
    durationSec: 130,
    r2Key: 'Tracks/Hype/Ace-Moment.mp3',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // UPBEAT
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'upbeat-par-celebration',
    title: 'Par Celebration',
    artist: 'Clbhouz Sounds',
    mood: 'upbeat',
    duration: '1:45',
    durationSec: 105,
    r2Key: 'Tracks/Upbeat/Par-Celebration.mp3',
  },
  {
    id: 'upbeat-sunny-round',
    title: 'Sunny Round',
    artist: 'Clbhouz Sounds',
    mood: 'upbeat',
    duration: '2:20',
    durationSec: 140,
    r2Key: 'Tracks/Upbeat/Sunny-Round.mp3',
  },
  {
    id: 'upbeat-good-vibes',
    title: 'Good Vibes',
    artist: 'Clbhouz Sounds',
    mood: 'upbeat',
    duration: '2:30',
    durationSec: 150,
    r2Key: 'Tracks/Upbeat/Good-Vibes.mp3',
  },
  {
    id: 'upbeat-weekend-golf',
    title: 'Weekend Golf',
    artist: 'Clbhouz Sounds',
    mood: 'upbeat',
    duration: '2:15',
    durationSec: 135,
    r2Key: 'Tracks/Upbeat/Weekend-Golf.mp3',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get tracks filtered by mood
 */
export function getTracksByMood(mood: MusicMood): MusicTrack[] {
  return MUSIC_LIBRARY.filter(t => t.mood === mood);
}

/**
 * Get a track by ID
 */
export function getTrackById(id: string): MusicTrack | undefined {
  return MUSIC_LIBRARY.find(t => t.id === id);
}

/**
 * Get a track by R2 key (for resolving stored references)
 */
export function getTrackByR2Key(r2Key: string): MusicTrack | undefined {
  return MUSIC_LIBRARY.find(t => t.r2Key === r2Key);
}

/**
 * Categories/moods for the music panel tabs
 */
export const MUSIC_MOODS = [
  { key: 'all', label: 'All' },
  { key: 'ambient', label: 'Ambient' },
  { key: 'calm', label: 'Calm' },
  { key: 'cinematic', label: 'Cinematic' },
  { key: 'hype', label: 'Hype' },
  { key: 'upbeat', label: 'Upbeat' },
] as const;

// Legacy export for backwards compatibility
export const MUSIC_CATEGORIES = MUSIC_MOODS;
