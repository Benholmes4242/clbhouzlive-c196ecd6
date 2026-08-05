// SlideThumb - one composer slide rendered as a thumbnail.
// Images go through CroppedImage (so the applied crop shows); videos use a
// cached poster frame rather than a live <video> element per tile.

import { useEffect, useState } from 'react';
import type { StageMediaItem } from '../hooks/useStageComposer';
import CroppedImage from './CroppedImage';
import { extractPoster, getCachedPoster } from '../lib/videoPoster';

export function PlayGlyph({ size = 22 }: { size?: number }) {
  return (
    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <span style={{ width: size, height: size, borderRadius: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
      </span>
    </span>
  );
}

interface Props {
  item: StageMediaItem;
  /** Play glyph diameter; 0 hides it. */
  glyph?: number;
}

export default function SlideThumb({ item, glyph = 22 }: Props) {
  const [poster, setPoster] = useState<string | null>(() => getCachedPoster(item.id));

  useEffect(() => {
    if (item.type !== 'video') return;
    if (poster) return;
    let cancelled = false;
    void extractPoster(item.id, item.previewUrl, item.posterTimestamp ?? 0.1).then((url) => {
      if (!cancelled && url) setPoster(url);
    });
    return () => { cancelled = true; };
  }, [item.id, item.previewUrl, item.type, item.posterTimestamp, poster]);

  if (item.type === 'video') {
    return (
      <>
        {poster
          ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: 'rgba(248,250,252,0.06)' }} />}
        {glyph > 0 && <PlayGlyph size={glyph} />}
      </>
    );
  }

  return <CroppedImage item={item} />;
}
