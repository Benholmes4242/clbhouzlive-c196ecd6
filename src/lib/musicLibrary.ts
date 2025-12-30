/**
 * Music Library - Curated tracks for Studio Music
 * URLs point to royalty-free/licensed tracks for user-generated content
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

// Curated tracks - royalty-free music from various sources
// Replace URLs with actual licensed track URLs when available
export const MUSIC_LIBRARY: MusicTrack[] = [
  // Chill / Lo-fi
  {
    id: 'lofi_001',
    title: 'Fairway Dreams',
    artist: 'Clbhouz Sounds',
    duration: '2:30',
    durationSeconds: 150,
    url: 'https://cdn.pixabay.com/audio/2024/11/04/audio_c4c5a97f98.mp3',
    category: 'chill',
    bpm: 85,
  },
  {
    id: 'lofi_002',
    title: 'Morning Dew',
    artist: 'Ambient Golf',
    duration: '2:45',
    durationSeconds: 165,
    url: 'https://cdn.pixabay.com/audio/2024/09/18/audio_69c7060983.mp3',
    category: 'chill',
    bpm: 75,
  },
  {
    id: 'lofi_003',
    title: 'Sunset Putt',
    artist: 'Clbhouz Sounds',
    duration: '3:12',
    durationSeconds: 192,
    url: 'https://cdn.pixabay.com/audio/2024/08/27/audio_40f4c52f13.mp3',
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
    url: 'https://cdn.pixabay.com/audio/2024/10/07/audio_1c63e71aa0.mp3',
    category: 'upbeat',
    bpm: 120,
  },
  {
    id: 'upbeat_002',
    title: 'Eagle Rush',
    artist: 'Tempo Links',
    duration: '2:00',
    durationSeconds: 120,
    url: 'https://cdn.pixabay.com/audio/2024/09/12/audio_7ddd8bd113.mp3',
    category: 'upbeat',
    bpm: 128,
  },
  {
    id: 'upbeat_003',
    title: 'Par Celebration',
    artist: 'Golf Vibes',
    duration: '1:45',
    durationSeconds: 105,
    url: 'https://cdn.pixabay.com/audio/2024/07/18/audio_7f9e00a2e4.mp3',
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
    url: 'https://cdn.pixabay.com/audio/2024/05/07/audio_1e77c9a32f.mp3',
    category: 'dramatic',
    bpm: 95,
  },
  {
    id: 'dramatic_002',
    title: 'Championship Moment',
    artist: 'Cinematic Golf',
    duration: '3:00',
    durationSeconds: 180,
    url: 'https://cdn.pixabay.com/audio/2024/08/15/audio_d93cd01ee2.mp3',
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
    url: 'https://cdn.pixabay.com/audio/2024/03/12/audio_f1e6970c82.mp3',
    category: 'ambient',
    bpm: 60,
  },
  {
    id: 'ambient_002',
    title: 'Links at Dawn',
    artist: 'Clbhouz Sounds',
    duration: '2:50',
    durationSeconds: 170,
    url: 'https://cdn.pixabay.com/audio/2024/06/21/audio_a5b7b3cd23.mp3',
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
