/** Four visible tiles keep real media indexes; source/loading/taps share single media. */
import React, { useLayoutEffect, useRef, useState } from 'react';
import type { MediaItem } from '@/components/media-system/types/media';
import LqipUnderlay from '@/components/shared/LqipUnderlay';
import { postImageProps } from '@/utils/imageSrc';
import { SingleMediaTapButton } from './SingleMediaTapButton';
import { mediaMaxHeight } from './feedMediaSizing';
import { CARD } from './feedTokens';
import type { feedPhotoGridLayout } from './feedPhotoGrid';
import './feedPhotoGrid.css';
type Layout = NonNullable<ReturnType<typeof feedPhotoGridLayout>>;
function PhotoTile({ item, index, more, postId, alt, feedIndex, isActive, onOpen, onDouble, primaryImgRef, overlays }: { item: MediaItem; index: number; more: number; postId: string; alt: string; feedIndex?: number; isActive?: boolean; onOpen: (index: number, el: HTMLElement | null, posterUrl: string | null) => void; onDouble: () => void; primaryImgRef?: React.RefObject<HTMLImageElement>; overlays?: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const url = item.imageUrl || item.thumbnailUrl || '';
  return <div className="feed-photo-tile" data-feed-photo-tile={index}><SingleMediaTapButton innerRef={ref} fill postId={postId} onSingle={() => onOpen(index, ref.current, item.thumbnailUrl ?? item.imageUrl ?? null)} onDouble={onDouble}>
    {url && <>{feedIndex != null && feedIndex >= 1 && <LqipUnderlay from={url} />}<img ref={primaryImgRef} {...postImageProps(url)} alt={alt} loading="lazy" decoding="async" {...(isActive ? { fetchpriority: 'high' } : {})} className="feed-photo-image" /></>}
    {more > 0 && <span className="feed-photo-more">+{more}</span>}
  </SingleMediaTapButton>{overlays}</div>;
}
export function FeedPhotoGrid({ items, layout, postId, alt, feedIndex, isActive, onOpen, onDouble, primaryImgRef, overlays, perTileOverlay }: { items: MediaItem[]; layout: Layout; postId: string; alt: string; feedIndex?: number; isActive?: boolean; onOpen: (index: number, el: HTMLElement | null, posterUrl: string | null) => void; onDouble: () => void; primaryImgRef?: React.RefObject<HTMLImageElement>; overlays?: React.ReactNode; perTileOverlay?: (index: number) => React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null), [width, setWidth] = useState(0);
  useLayoutEffect(() => { const el = root.current; if (!el) return; let frame = 0; const measure = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setWidth(el.getBoundingClientRect().width)); }; setWidth(el.getBoundingClientRect().width); if (typeof ResizeObserver === 'undefined') return; const observer = new ResizeObserver(measure); observer.observe(el); return () => { observer.disconnect(); cancelAnimationFrame(frame); }; }, []);
  return <div ref={root} className="feed-photo-grid" data-feed-photo-grid data-shape={layout.shape} style={{ '--feed-photo-ground': CARD, '--feed-photo-cap': mediaMaxHeight(), '--feed-photo-row': `${width / 3}px`, '--feed-photo-ratio': String(layout.leadRatio) } as React.CSSProperties}>{layout.shown.map(index => { const item = items[index]; return item ? <PhotoTile key={item.id || index} item={item} index={index} more={index === 3 ? layout.more : 0} postId={postId} alt={alt} feedIndex={feedIndex} isActive={isActive} onOpen={onOpen} onDouble={onDouble} primaryImgRef={index === 0 ? primaryImgRef : undefined} overlays={<>{index === 0 ? overlays : null}{perTileOverlay?.(index)}</>} /> : null; })}</div>;
}