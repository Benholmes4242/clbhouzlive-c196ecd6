export type DraftTextBox = {
  id: string;
  value: string;
  xPct: number;   // 0–100, position relative to media bounds
  yPct: number;   // 0–100
  font: 'Modern' | 'Classic' | 'Signature';
  size: number;   // px
  color: string;  // hex
  align: 'left' | 'center' | 'right';
};

export type DraftEdits = {
  music?: { 
    trackId: string; 
    url: string; 
    start: number; 
    volume: number; 
    ducking?: boolean 
  };
  text?: DraftTextBox[];
  filter?: { 
    name: 'normal' | 'fade' | 'warm' | 'cool'; 
    intensity: number // 0–100
  };
  edit?: {
    crop?: { 
      x: number; 
      y: number; 
      w: number; 
      h: number; 
      ratio?: 'original' | '1:1' | '4:5' | '16:9' 
    };
    rotate?: 0 | 90 | 180 | 270;
    trim?: { 
      start: number; 
      end: number  // seconds
    };
    speed?: 0.5 | 1 | 1.5;
  };
};

export type DraftEditsMap = Map<string /* mediaId */, DraftEdits>;

export type StudioTool = 'music' | 'text' | 'filter' | 'edit' | null;
