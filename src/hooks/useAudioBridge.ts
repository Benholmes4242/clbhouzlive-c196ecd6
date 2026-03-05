import { useEffect } from 'react';
import { useMediaStore } from '@/components/media-system/store/mediaStore';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

/**
 * Bidirectional sync between the new media player's Zustand store
 * and the legacy GlobalAudioContext.
 * 
 * When either system's mute state changes, the other is updated.
 * This ensures consistent audio behavior across all app surfaces.
 * 
 * Call this hook ONCE at the app level (e.g., in AppInner).
 */
export function useAudioBridge() {
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const mediaMuted = useMediaStore((s) => s.isMuted);

  // Sync: GlobalAudioContext → MediaStore
  useEffect(() => {
    if (isGloballyMuted !== mediaMuted) {
      useMediaStore.setState({ isMuted: isGloballyMuted });
    }
  }, [isGloballyMuted]);

  // Sync: MediaStore → GlobalAudioContext
  useEffect(() => {
    if (isGloballyMuted !== mediaMuted) {
      setGlobalMute(mediaMuted);
    }
  }, [mediaMuted]);
}
