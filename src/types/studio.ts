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

/** Area defining the crop region (percentage-based) */
export interface CropArea {
  x: number;      // 0-100 percentage from left
  y: number;      // 0-100 percentage from top
  width: number;  // 0-100 percentage
  height: number; // 0-100 percentage
}

/** Crop settings including ratio, area, and zoom */
export interface CropSettings {
  ratio: 'original' | '1:1' | '4:5' | '16:9' | '9:16';
  area?: CropArea;      // The crop region (if user dragged to adjust)
  zoom?: number;        // 1-3 zoom level
}

export type StudioEdits = {
  filter?: FilterId;
  filterIntensity?: number;  // 0-100, default 100
  crop?: CropSettings;  // Updated to full crop settings
  rotate?: number;  // degrees, multiples of 90
  flipH?: boolean;   // horizontal flip
  flipV?: boolean;   // vertical flip
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
