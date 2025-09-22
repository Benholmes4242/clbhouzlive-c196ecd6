// Swing Analysis Visual Types

export interface SwingVisual {
  id: string;
  analysisId: string;
  frameIndex: number;      // 0..19
  label: string;           // "P1 Setup", "P3 Backswing", etc.
  overlay: {
    lines?: Array<{x1:number,y1:number,x2:number,y2:number,label?:string}>;
    angles?: Array<{cx:number,cy:number,a:number,b:number,label?:string}>;
    keypoints?: Array<{x:number,y:number,label:string,conf?:number}>;
    notes?: string;
  };
  url: string;             // signed URL
  width: number;
  height: number;
  createdAt: string;
}

export interface VisualPlanItem {
  frameHint: "P1"|"P2"|"P3"|"P4"|"P5"|"P6"|"P7"|"P8"|"P9";
  caption: string;
  overlays: SwingVisual["overlay"];
}

export interface SwingVisualPack {
  analysisId: string;
  visuals: SwingVisual[];
  exportUrl?: string;
  createdAt: string;
}

export interface SwingFrameData {
  index: number;
  imageData: string; // base64
  timestamp: number;
}