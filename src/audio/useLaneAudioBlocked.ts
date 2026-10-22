/** CB48: UI reads the engine's boolean directly; no local blocked-sound mirror. */
import { useSyncExternalStore } from 'react';
import { VideoEngine, type LaneId } from '@/video/VideoEngine';

export function useLaneAudioBlocked(laneId?: LaneId | null): boolean {
  return useSyncExternalStore(
    (notify) => VideoEngine.subscribeAudioBlocked(notify),
    () => laneId ? VideoEngine.isAudioBlocked(laneId) : false,
    () => false,
  );
}