/**
 * SoundtrackStrip - Legacy stub
 *
 * Post-level music has been removed alongside the old studio editor.
 * Kept as a no-op shim so legacy consumers keep compiling.
 */

import React from 'react';

export interface SoundtrackData {
  trackId: string;
  title: string;
  artist?: string;
  url?: string;
  r2Key?: string;
  startAt?: number;
  volume?: number;
}

type AnyProps = Record<string, unknown>;

const SoundtrackStrip: React.FC<AnyProps> = () => null;

export default SoundtrackStrip;
export { SoundtrackStrip };
