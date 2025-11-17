export type FilterId = 'normal' | 'vivid' | 'bw' | 'dramatic';

export type TextOverlay = {
  id: string;
  text: string;
  x: number;        // 0..1 relative position
  y: number;        // 0..1 relative position
  scale: number;    // 0..1
  style: 'modern' | 'classic' | 'signature';
  color?: string;   // hex
};

export type StudioEdits = {
  filter?: FilterId;
  crop?: { ratio: 'original' | '1:1' | '4:5' | '16:9' };
  rotate?: number;  // degrees, multiples of 90
  textOverlays?: TextOverlay[];
  music?: {
    trackId: string;
    title: string;
    artist?: string;
    startAt?: number;  // seconds
    volume?: number;   // 0..1
  } | null;
};

export type StudioState = Record<string /* mediaId */, StudioEdits>;

export type StudioTool = 'music' | 'text' | 'filter' | 'edit' | null;
