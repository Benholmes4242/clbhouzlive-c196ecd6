import { posterSeconds } from '@/uploads/posterUrl';

/** Preview-only lifecycle shared by Watch lead and tiles; fullscreen never imports it.
 * Seek completes before play, and the poster remains visible until the start frame plays. */
export function attachPosterPreview(video: HTMLVideoElement, poster: string | null, show: (playing: boolean) => void) {
  let start = 0;
  let ready = false;
  let disposed = false;
  let awaitingSeek = false;
  const play = () => { if (!disposed) video.play()?.catch(() => show(false)); };
  const restart = () => {
    if (!ready || disposed) return;
    show(false);
    awaitingSeek = true;
    video.currentTime = start;
    if (!video.seeking) { awaitingSeek = false; play(); }
  };
  const metadata = () => {
    const time = posterSeconds(poster);
    start = time != null && time > 0 && time < video.duration - 1 ? time : 0;
    ready = true;
    restart();
  };
  const seeked = () => { if (awaitingSeek) { awaitingSeek = false; play(); } };
  const playing = () => show(ready && !awaitingSeek && !video.seeking && video.currentTime >= start);
  const pause = () => show(false);
  video.addEventListener('loadedmetadata', metadata);
  video.addEventListener('seeked', seeked);
  video.addEventListener('playing', playing);
  video.addEventListener('timeupdate', () => {});
  video.addEventListener('pause', pause);
  video.addEventListener('ended', restart);
  show(false);
  return () => {
    disposed = true;
    video.removeEventListener('loadedmetadata', metadata);
    video.removeEventListener('seeked', seeked);
    video.removeEventListener('playing', playing);
    video.removeEventListener('pause', pause);
    video.removeEventListener('ended', restart);
    show(false);
  };
}