import React from 'react';

type Props = {
  id: string;
  hlsUrl: string;
  posterUrl?: string;
  shouldAutoplay: boolean;
  inView: boolean;
  onClick?: () => void;
};

export default function ShortsVideoTile({
  id,
  hlsUrl,
  posterUrl,
  shouldAutoplay,
  inView,
  onClick
}: Props) {
  const ref = React.useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = React.useState(false);

  // Preload aggressively to avoid black frames
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ensure attributes (critical for mobile autoplay)
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = 'auto';

    const onCanPlay = () => setReady(true);
    el.addEventListener('canplay', onCanPlay);

    if (el.readyState >= 2) setReady(true);

    return () => el.removeEventListener('canplay', onCanPlay);
  }, []);

  // Visibility + alternating policy → play/pause
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const canPlay = ready && inView && shouldAutoplay;
    if (canPlay) {
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      el.pause();
    }
  }, [ready, inView, shouldAutoplay]);

  return (
    <div
      className="group relative aspect-[9/16] overflow-hidden rounded bg-muted cursor-pointer"
      onClick={onClick}
    >
      {/* Poster underneath as a safety net */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150
                      ${ready ? 'opacity-0' : 'opacity-100'}`}
          draggable={false}
          loading="eager"
        />
      )}

      <video
        ref={ref}
        src={hlsUrl}
        poster={posterUrl}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150
                    ${ready ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        muted
        loop
        controls={false}
      />

      {/* Hover overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
    </div>
  );
}
