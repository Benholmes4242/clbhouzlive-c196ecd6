// SlideThumb - one composer slide rendered as a thumbnail.
// Images go through CroppedImage (so the applied crop shows); videos use a
// cached poster frame rather than a live <video> element per tile.

import { useEffect, useState } from 'react';
import type { StageMediaItem } from '../hooks/useStageComposer';
import CroppedImage from './CroppedImage';
import { extractPoster, getCachedPoster } from '../lib/videoPoster';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';
import { getThumbnailUrl } from '@/utils/thumbnail';
import type { StageMediaItem as Item } from '../hooks/useStageComposer';

/** Brief 21 H3: the media's existing poster, used only after extraction fails. */
export const fallbackPoster = (item: Pick<Item, 'posterUrl' | 'streamId'>): string | null =>
  item.posterUrl ?? (item.streamId ? getThumbnailUrl({ streamId: item.streamId, size: 'medium' }) : null);

/** Brief 21 H3: the shared skeleton shimmer while a still is pending. */
export function StillShimmer() {
  return <div className="clb-shimmer-dark" data-still-pending="" style={{ position: 'absolute', inset: 0, background: inkWithAlpha(SURFACE.dark.ink, 0.06) }} />;
}

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
  const [poster, setPoster] = useState<string | null>(
    () => item.posterUrl ?? getCachedPoster(item.id),
  );

  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (item.type !== 'video') return;
    if (poster) return;
    if (item.posterUrl) return;
    let cancelled = false;
    setFailed(false);
    void extractPoster(item.id, item.previewUrl, item.posterTimestamp ?? 0.1).then((url) => {
      if (cancelled) return;
      if (url) setPoster(url); else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [item.id, item.previewUrl, item.posterUrl, item.type, item.posterTimestamp, poster]);

  if (item.type === 'video') {
    const shown = poster ?? (failed ? fallbackPoster(item) : null);
    return (
      <>
        {shown
          ? <img src={shown} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : failed
            ? <div data-still-failed="" style={{ width: '100%', height: '100%', background: inkWithAlpha(SURFACE.dark.ink, 0.06) }} />
            : <div style={{ position: 'relative', width: '100%', height: '100%' }}><StillShimmer /></div>}
        {glyph > 0 && <PlayGlyph size={glyph} />}
      </>
    );
  }

  return <CroppedImage item={item} />;
}
