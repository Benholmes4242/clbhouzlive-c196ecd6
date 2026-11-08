/** The ONE fullscreen sound control, shared by ImmersiveFullscreenChrome and
 * CourseGalleryChrome so the course gallery is not a second mute. CB48: the
 * engine owns refusals; only the lane actually showing controls the icon.
 * useSessionAudio is session-wide — showing or hiding the control on a photo
 * must never touch it, so photo/video/photo/video keeps the member's choice. */
import { useCallback } from 'react';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { useLaneAudioBlocked } from '@/audio/useLaneAudioBlocked';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { VideoEngine } from '@/video/VideoEngine';
import { triggerHaptic } from '@/lib/ui/haptics';

export function useFullscreenMuteControl() {
  const isAudioMuted = useSessionAudio((s) => s.isMuted);
  const soundLaneId = useFullscreenFeedStore((s) => s.borrow?.laneId ?? 'fullscreen');
  const soundBlocked = useLaneAudioBlocked(soundLaneId);
  const shownMuted = isAudioMuted || soundBlocked;

  const handleMuteTap = useCallback(() => {
    try { triggerHaptic('light'); } catch {}
    if (!isAudioMuted && soundBlocked) {
      VideoEngine.unblockFromGesture();
    } else {
      useSessionAudio.getState().toggle();
    }
  }, [soundBlocked, isAudioMuted]);

  return { soundLaneId, shownMuted, handleMuteTap };
}
