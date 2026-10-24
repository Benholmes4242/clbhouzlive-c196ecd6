import { useEffect, useId, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassDurationBadge, GLASS_CHROME } from '@/components/media/GlassDurationBadge';
import { attachTileHls } from '@/components/explore-tab-new/courseled/tileHlsPlayer';
import { buildHlsUrl } from '@/utils/streamId';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { audioDuck } from '@/audio/audioDuckStore';
import './hole-walk.css';

/** Stage1: shared manual player for member hole panels and moderator preview.
 * One local speaker and the existing global audioDuck silence engine lanes.
 * HLS attachment owns teardown; no autoplay/engine-lane borrowing. */
let activeVideo: HTMLVideoElement | null = null;
export function HoleMediaVideo({ media, label }: {
  media: { media_url: string; stream_id?: string | null; poster_url?: string | null; duration_seconds?: number | null };
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachment = useRef<ReturnType<typeof attachTileHls> | null>(null);
  const pendingPlay = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const id = useId();
  const duckKey = `hole-media-${id}`;
  const poster = holeMediaPoster({ ...media, media_type: 'video' });
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      pendingPlay.current = false;
      video?.pause();
      attachment.current?.detach();
      attachment.current = null;
      audioDuck.release(duckKey);
      if (activeVideo === video) activeVideo = null;
    };
  }, [media.media_url, duckKey]);
  const pause = () => {
    pendingPlay.current = false;
    videoRef.current?.pause();
    setPlaying(false);
    audioDuck.release(duckKey);
  };
  stopRef.current = pause;
  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing || pendingPlay.current) { pause(); return; }
    if (activeVideo && activeVideo !== video) activeVideo.pause();
    activeVideo = video;
    audioDuck.hold(duckKey);
    video.muted = false;
    setFailed(false);
    pendingPlay.current = true;
    if (!attachment.current) {
      const hls = buildHlsUrl(media.stream_id || media.media_url) || (/\.m3u8(?:\?|$)/.test(media.media_url) ? media.media_url : '');
      if (hls) attachment.current = attachTileHls(video, hls, () => {
        pause(); setFailed(true); setStarted(false);
        attachment.current?.detach(); attachment.current = null;
      });
      else video.src = media.media_url;
    }
    // Calling in the tap preserves sound permission; canplay retries after lazy HLS attaches.
    void video.play().catch(() => { if (video.readyState >= 2) { pause(); setFailed(true); } });
  };
  return <div className="hole-media-video">
    <img src={poster} alt={label} />
    <video ref={videoRef} playsInline preload="none" poster={poster} className={started ? 'is-started' : ''}
      onCanPlay={() => { if (pendingPlay.current) void videoRef.current?.play().catch(() => { pause(); setFailed(true); }); }}
      onPlaying={() => { pendingPlay.current = false; setStarted(true); setPlaying(true); }}
      onPause={() => { pendingPlay.current = false; setPlaying(false); audioDuck.release(duckKey); }}
      onEnded={() => { pause(); setStarted(false); }}
      onError={() => { pause(); setFailed(true); setStarted(false); }} />
    <Button variant="ghost" className={playing ? 'hole-media-pause-target' : 'hole-media-play'} style={playing ? undefined : GLASS_CHROME}
      aria-label={playing ? 'Pause video' : failed ? 'Retry video' : 'Play video'} onClick={play}>
      {!playing && <Play size={24} fill="currentColor" />}
    </Button>
    <GlassDurationBadge seconds={media.duration_seconds} />
  </div>;
}

export function HoleMediaThumbnail({ url, mediaType = 'image', posterUrl, streamId, durationSeconds, alt }: {
  url: string; mediaType?: string; posterUrl?: string | null; streamId?: string | null; durationSeconds?: number | null; alt: string;
}) {
  return <><img src={holeMediaPoster({ media_url: url, media_type: mediaType, poster_url: posterUrl, stream_id: streamId })} alt={alt} />
    {mediaType === 'video' && <GlassDurationBadge seconds={durationSeconds} fontSize={9} bottom={3} right={3} />}</>;
}