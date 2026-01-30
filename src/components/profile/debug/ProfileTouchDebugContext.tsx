import React from 'react';

export type ProfileTouchDebugPoint = {
  name: string;
  ts: number;
  detail?: Record<string, unknown>;
};

export type ProfileTouchDebugGlobalEvent = {
  eventType: string;
  ts: number;
  target: string;
  elementFromPoint?: string;
  x?: number;
  y?: number;
};

export type ProfileTouchDebugState = {
  points: Record<string, number>;
  recentPoints: ProfileTouchDebugPoint[];
  recentGlobalEvents: ProfileTouchDebugGlobalEvent[];
};

export type ProfileTouchDebugApi = {
  enabled: boolean;
  logPoint: (name: string, detail?: Record<string, unknown>) => void;
  state: ProfileTouchDebugState;
  clear: () => void;
};

const noopApi: ProfileTouchDebugApi = {
  enabled: false,
  logPoint: () => {},
  state: {
    points: {},
    recentPoints: [],
    recentGlobalEvents: [],
  },
  clear: () => {},
};

export const ProfileTouchDebugContext = React.createContext<ProfileTouchDebugApi>(noopApi);
