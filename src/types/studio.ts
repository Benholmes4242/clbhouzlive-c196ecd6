export type FilterId =
  | 'normal'
  | 'vivid'
  | 'bw'
  | 'dramatic'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'matte'
  | 'pop'
  | 'fade';

export type TextStyle = 
  | 'modern_bold'
  | 'classic_serif'
  | 'signature'
  | 'impact'
  | 'outline'
  | 'neon'
  | 'glass'
  | 'scoreboard'
  // Legacy support
  | 'modern'
  | 'classic';

export type TextOverlay = {
  id: string;
  text: string;
  x: number;        // 0..1 relative position
  y: number;        // 0..1 relative position
  scale: number;    // 0.6..3
  rotation?: number; // degrees, default 0
  style: TextStyle;
  color?: string;   // hex
};

export type AudioMode = 'original' | 'music_only';

export type StudioEdits = {
  filter?: FilterId;
  crop?: { ratio: 'original' | '1:1' | '4:5' | '16:9' };
  rotate?: number;  // degrees, multiples of 90
  textOverlays?: TextOverlay[];
  music?: {
    trackId: string;
    title: string;
    artist?: string;
    url: string;       // Primary playback URL (public R2)
    r2Key?: string;    // R2 object key - kept for reference/fallback
    startAt?: number;  // seconds
    volume?: number;   // 0..1
  } | null;
  audioMode?: AudioMode;  // Controls whether original video audio plays
};

export type StudioState = Record<string /* mediaId */, StudioEdits>;

export type StudioTool = 'music' | 'text' | 'filter' | 'edit' | null;
