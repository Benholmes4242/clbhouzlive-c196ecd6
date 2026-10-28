import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HoleMediaThumbnail } from './HoleMediaVideo';
import type { OwnMediaSource } from '@/lib/courseMedia/holePhotoData';
import type { PlaceMedia } from './hooks/useCoursePlaceMedia';
import type { CoursePlace } from '@/lib/courseMedia/places';
import { ShotTagCard } from './ShotTagCard';

export function HolePhotoTagDialog({ imageUrl, mediaSource, mediaSources = [], imageOptions, onImageChange, initialHole = null, holeCount, knownHoleNumbers, pending, error, onClose, onSubmit, initialPlaceTag, onSubmitPlace, onRemovePlace }: {
  imageUrl: string; mediaSource?: Partial<OwnMediaSource>; mediaSources?: readonly OwnMediaSource[]; imageOptions?: readonly string[]; onImageChange?: (url: string) => void; initialHole?: number | null;
  holeCount: number; knownHoleNumbers: readonly number[]; pending: boolean;
  error: string | null; onClose: () => void; onSubmit: (hole: number) => void;
  initialPlaceTag?: PlaceMedia; onSubmitPlace?: (place: CoursePlace) => void; onRemovePlace?: (row: PlaceMedia) => void;
}) {
  const { t } = useTranslation('courses');
  const [hole, setHole] = useState<number | null>(initialHole);
  const [place, setPlace] = useState<CoursePlace | null>(initialPlaceTag?.place as CoursePlace ?? null);
  const canSubmit = !pending && !!imageUrl && !initialPlaceTag && (hole != null || (place != null && !!onSubmitPlace));
  return <ShotTagCard shot={{ ...mediaSource, url: imageUrl }} holes={knownHoleNumbers} hole={hole} place={place}
    pending={pending} locked={!!initialPlaceTag} canSubmit={canSubmit} onClose={onClose} onSkip={onClose}
    onHole={value => { if (!pending && imageUrl && !initialPlaceTag) { setHole(value); setPlace(null); } }}
    onPlace={value => { if (!pending && !initialPlaceTag) { setPlace(value); setHole(null); } }}
    onSubmit={() => { if (!canSubmit) return; if (hole != null) onSubmit(hole); else if (place) onSubmitPlace?.(place); }}
    remove={initialPlaceTag && onRemovePlace ? { onClick: () => onRemovePlace(initialPlaceTag) } : undefined}
    strip={imageOptions && imageOptions.length > 1 ? <div className="media-v3-tag-strip"><div className="media-v3-tag-row">{imageOptions.map(url => <Button key={url} variant="ghost" aria-label={mediaSources.find(s => s.url === url)?.mediaType === 'video' ? 'Choose video' : 'Choose photograph'} aria-pressed={url === imageUrl} disabled={pending} className={`media-v3-tag-thumb${url === imageUrl ? ' is-current' : ''}`} onClick={() => onImageChange?.(url)}><HoleMediaThumbnail url={url} {...mediaSources.find(s => s.url === url)} alt="" /></Button>)}</div></div> : undefined}>
    {error && <p role="alert" className="media-v3-tag-status">{error}</p>}
  </ShotTagCard>;
}
