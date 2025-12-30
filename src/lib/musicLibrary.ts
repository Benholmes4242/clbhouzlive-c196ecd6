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
 * Uses absolute URL to work in preview/dev environments
 */
const R2_PUBLIC_BASE = 'https://pub-9f6095ba86ef4833a86c1e06bec47b40.r2.dev';

/**
 * Encode R2 key path segments for URL safety (handles spaces, special chars)
 * Splits by /, encodes each segment, then rejoins
 */
function encodeR2Path(r2Key: string): string {
  return r2Key
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

export function getSignedAudioUrl(r2Key: string): string {
  // Direct public R2 URL with properly encoded path
  const encodedPath = encodeR2Path(r2Key);
  return `${R2_PUBLIC_BASE}/${encodedPath}`;
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
    id: 'ethereal-angels',
    title: 'Ethereal Angels',
    artist: 'Clbhouz Sounds',
    mood: 'ambient',
    duration: '2:30',
    r2Key: 'Tracks/Ambient/Ethereal Angels.mp3',
  },
  {
    id: 'intangable-world',
    title: 'Intangable World',
    artist: 'Clbhouz Sounds',
    mood: 'ambient',
    duration: '3:00',
    r2Key: 'Tracks/Ambient/Intangable World.mp3',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CALM
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'calm-business',
    title: 'Calm Business',
    artist: 'Clbhouz Sounds',
    mood: 'calm',
    duration: '2:30',
    r2Key: 'Tracks/Calm/Calm Business.mp3',
  },
  {
    id: 'corporate-dreams',
    title: 'Corporate Dreams',
    artist: 'Clbhouz Sounds',
    mood: 'calm',
    duration: '3:00',
    r2Key: 'Tracks/Calm/Corporate Dreams.mp3',
  },
  {
    id: 'lonely-traveller',
    title: 'Lonely Traveller',
    artist: 'Clbhouz Sounds',
    mood: 'calm',
    duration: '2:45',
    r2Key: 'Tracks/Calm/Lonely Traveller.mp3',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CINEMATIC
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'celestial-choir',
    title: 'Celestial Choir',
    artist: 'Clbhouz Sounds',
    mood: 'cinematic',
    duration: '2:30',
    r2Key: 'Tracks/Cinematic/Celestial Choir.mp3',
  },
  {
    id: 'powerful-opening',
    title: 'Powerful Opening',
    artist: 'Clbhouz Sounds',
    mood: 'cinematic',
    duration: '3:00',
    r2Key: 'Tracks/Cinematic/Powerful Opening.mp3',
  },
  {
    id: 'steep-descent',
    title: 'Steep Descent',
    artist: 'Clbhouz Sounds',
    mood: 'cinematic',
    duration: '2:40',
    r2Key: 'Tracks/Cinematic/Steep Descent.mp3',
  },
  {
    id: 'the-dark-side',
    title: 'The Dark Side',
    artist: 'Clbhouz Sounds',
    mood: 'cinematic',
    duration: '2:15',
    r2Key: 'Tracks/Cinematic/The Dark Side.mp3',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // HYPE
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'battle-of-the-navy',
    title: 'Battle of the Navy',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '2:15',
    r2Key: 'Tracks/Hype/Battle of the Navy.mp3',
  },
  {
    id: 'epic-sport',
    title: 'Epic Sport',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '2:00',
    r2Key: 'Tracks/Hype/Epic Sport.mp3',
  },
  {
    id: 'indestructable',
    title: 'Indestructable',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '1:45',
    r2Key: 'Tracks/Hype/Indestructable.mp3',
  },
  {
    id: 'million-dolla-live',
    title: 'Million Dolla Live',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '2:10',
    r2Key: 'Tracks/Hype/Million Dolla Live.mp3',
  },
  {
    id: 'slap-deep-house',
    title: 'Slap Deep House',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '2:30',
    r2Key: 'Tracks/Hype/Slap deep House.mp3',
  },
  {
    id: 'video-game-boss',
    title: 'Video Game Boss',
    artist: 'Clbhouz Sounds',
    mood: 'hype',
    duration: '2:20',
    r2Key: 'Tracks/Hype/Video Game Boss.mp3',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // UPBEAT
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'last-task',
    title: 'Last Task',
    artist: 'Clbhouz Sounds',
    mood: 'upbeat',
    duration: '1:45',
    r2Key: 'Tracks/Upbeat/Last Task.mp3',
  },
  {
    id: 'sport-rock',
    title: 'Sport Rock',
    artist: 'Clbhouz Sounds',
    mood: 'upbeat',
    duration: '2:20',
    r2Key: 'Tracks/Upbeat/Sport Rock.mp3',
  },
  {
    id: 'sports-legends-background-music',
    title: 'Sports Legends Background Music',
    artist: 'Clbhouz Sounds',
    mood: 'upbeat',
    duration: '2:30',
    r2Key: 'Tracks/Upbeat/Sports Legends Background Music.mp3',
  },
  {
    id: 'wacky-fight',
    title: 'Wacky Fight',
    artist: 'Clbhouz Sounds',
    mood: 'upbeat',
    duration: '2:15',
    r2Key: 'Tracks/Upbeat/Wacky Fight.mp3',
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
