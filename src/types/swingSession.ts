export type PhaseName = 'setup' | 'takeaway' | 'backswing' | 'top' | 'downswing' | 'impact' | 'followThrough';

export interface PhaseState {
  status: 'idle' | 'queued' | 'running' | 'done' | 'error';
  frameIndex?: number;
  metrics?: Record<string, any>;
  tips?: string[];
  visualPlan?: {
    caption?: string;
    overlays?: {
      lines?: Array<{ x1: number; y1: number; x2: number; y2: number; label?: string }>;
      angles?: Array<{ cx: number; cy: number; a: number; b: number; label?: string }>;
    };
  };
  error?: string;
}

export interface SessionState {
  sessionId: string;
  phases: Record<PhaseName, PhaseState>;
  order: PhaseName[];
  frames?: Array<{
    index: number;
    t: number;
    url: string;
    width: number;
    height: number;
    hash: string;
  }>;
  activeFrameIndex?: number;
  summary?: {
    text: string;
    createdAt: string;
    analysisId?: string;
  };
}