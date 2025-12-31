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

/**
 * Per-media studio edits (stored on post_media.studio_edits)
 * Filter, Crop, Rotate, Text overlays are per-media
 * 
 * NOTE: music/audioMode should NOT be stored here going forward.
 * They are kept for backwards compatibility (legacy read) but new posts
 * should use PostStudioEdits (stored on posts table).
 */
export type StudioEdits = {
  filter?: FilterId;
  crop?: { ratio: 'original' | '1:1' | '4:5' | '16:9' };
  rotate?: number;  // degrees, multiples of 90
  textOverlays?: TextOverlay[];
  // LEGACY: music/audioMode - read for backwards compat, but write to PostStudioEdits
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

/**
 * Post-level studio edits (stored on posts table)
 * Music and Achievement Badge apply to the entire post
 */
export type PostStudioEdits = {
  music?: {
    trackId: string;
    title: string;
    artist?: string;
    url: string;       // Primary playback URL
    r2Key?: string;    // R2 object key for reference
    startAt?: number;  // seconds
    volume?: number;   // 0..1
  } | null;
  audioMode?: AudioMode;
  achievementBadgeId?: string | null;
};

export type StudioState = Record<string /* mediaId */, StudioEdits>;

export type StudioTool = 'music' | 'text' | 'filter' | 'edit' | null;

/**
 * Studio scope - indicates whether a tool applies per-media or per-post
 */
export type StudioScope = 'per-media' | 'per-post';

export const STUDIO_TOOL_SCOPE: Record<NonNullable<StudioTool>, StudioScope> = {
  music: 'per-post',
  text: 'per-media',
  filter: 'per-media',
  edit: 'per-media',
};
