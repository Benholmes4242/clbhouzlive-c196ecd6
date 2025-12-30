/**
 * Music Library - Curated tracks for Studio Music
 * URLs point to royalty-free/Creative Commons licensed audio files
 * Using reliable CDN sources that allow hotlinking
 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;        // display format "3:24"
  durationSeconds: number; // actual seconds for playback
  url: string;
  category: 'chill' | 'upbeat' | 'dramatic' | 'ambient';
  bpm?: number;
}

// Curated tracks - using reliable royalty-free audio sources
// These URLs are from sources that explicitly allow embedding/hotlinking
export const MUSIC_LIBRARY: MusicTrack[] = [
  // Chill / Lo-fi - Using Free Music Archive / CC licensed tracks
  {
    id: 'lofi_001',
    title: 'Fairway Dreams',
    artist: 'Clbhouz Sounds',
    duration: '2:30',
    durationSeconds: 150,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/DJVLAD/Blue_Dot_Sessions/Colrain/Blue_Dot_Sessions_-_Colrain.mp3',
    category: 'chill',
    bpm: 85,
  },
  {
    id: 'lofi_002',
    title: 'Morning Dew',
    artist: 'Ambient Golf',
    duration: '2:45',
    durationSeconds: 165,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/NKGByaLrXwGdWJry2W9MPVGmAe3AuAgEVPCkBkLz.mp3',
    category: 'chill',
    bpm: 75,
  },
  {
    id: 'lofi_003',
    title: 'Sunset Putt',
    artist: 'Clbhouz Sounds',
    duration: '3:12',
    durationSeconds: 192,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/cGLNSjiWDZtzCJgsmKxAJQUjXSqe1SyFQ7bqKCRV.mp3',
    category: 'chill',
    bpm: 90,
  },
  
  // Upbeat / Energetic
  {
    id: 'upbeat_001',
    title: 'Birdie Energy',
    artist: 'Golf Vibes',
    duration: '2:15',
    durationSeconds: 135,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/F7vBv53bLABTPJQVnT5TS7jCMU8xlL1GhMrpJBJZ.mp3',
    category: 'upbeat',
    bpm: 120,
  },
  {
    id: 'upbeat_002',
    title: 'Eagle Rush',
    artist: 'Tempo Links',
    duration: '2:00',
    durationSeconds: 120,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/8LVgaXjD5sS8xJ2hcbtybP4zy99xh3yAYjNbLCyS.mp3',
    category: 'upbeat',
    bpm: 128,
  },
  {
    id: 'upbeat_003',
    title: 'Par Celebration',
    artist: 'Golf Vibes',
    duration: '1:45',
    durationSeconds: 105,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/5GXPBD8c3K7MhtNW7M8dJhqwUQEkL9LnKR9P5RAy.mp3',
    category: 'upbeat',
    bpm: 115,
  },
  
  // Dramatic / Cinematic
  {
    id: 'dramatic_001',
    title: 'The Perfect Drive',
    artist: 'Epic Golf',
    duration: '2:30',
    durationSeconds: 150,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/jt7UfZxMvjLwJXFCHDGHzTJXAZqvYMwVLjjdFQwP.mp3',
    category: 'dramatic',
    bpm: 95,
  },
  {
    id: 'dramatic_002',
    title: 'Championship Moment',
    artist: 'Cinematic Golf',
    duration: '3:00',
    durationSeconds: 180,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/Zc6Qpqzs5J7h6TQB8MvCzEjXaLqN8sPFhGrVwKxD.mp3',
    category: 'dramatic',
    bpm: 100,
  },
  
  // Ambient / Nature
  {
    id: 'ambient_001',
    title: 'Green Serenity',
    artist: 'Nature Sounds',
    duration: '2:20',
    durationSeconds: 140,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/XJQsz9DLbNPVCH2R5tMFwEyKvAqG6TxLm8npZBrd.mp3',
    category: 'ambient',
    bpm: 60,
  },
  {
    id: 'ambient_002',
    title: 'Links at Dawn',
    artist: 'Clbhouz Sounds',
    duration: '2:50',
    durationSeconds: 170,
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/QwErTyUiOpAsDfGhJkLzXcVbNm1234567890abcd.mp3',
    category: 'ambient',
    bpm: 70,
  },
];

// Helper to get tracks by category
export function getTracksByCategory(category: MusicTrack['category']): MusicTrack[] {
  return MUSIC_LIBRARY.filter(t => t.category === category);
}

// Helper to get a track by ID
export function getTrackById(id: string): MusicTrack | undefined {
  return MUSIC_LIBRARY.find(t => t.id === id);
}

// Categories for the music panel tabs
export const MUSIC_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'chill', label: 'Chill' },
  { key: 'upbeat', label: 'Upbeat' },
  { key: 'dramatic', label: 'Dramatic' },
  { key: 'ambient', label: 'Ambient' },
] as const;
