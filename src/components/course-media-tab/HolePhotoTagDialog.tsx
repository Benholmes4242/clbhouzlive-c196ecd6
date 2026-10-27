import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HoleMediaThumbnail } from './HoleMediaVideo';
import type { OwnMediaSource } from '@/lib/courseMedia/holePhotoData';
import type { PlaceMedia } from './hooks/useCoursePlaceMedia';
import type { CoursePlace } from '@/lib/courseMedia/places';
import { ShotTagChoices, PLACE_LABELS } from './ShotTagChoices';

export function HolePhotoTagDialog({ imageUrl, mediaSource, mediaSources = [], imageOptions, onImageChange, initialHole = null, holeCount, knownHoleNumbers, pending, error, onClose, onSubmit, initialPlaceTag, onSubmitPlace, onRemovePlace }: {
  imageUrl: string; mediaSource?: Partial<OwnMediaSource>; mediaSources?: readonly OwnMediaSource[]; imageOptions?: readonly string[]; onImageChange?: (url: string) => void; initialHole?: number | null;
  holeCount: number; knownHoleNumbers: readonly number[]; pending: boolean;
  error: string | null; onClose: () => void; onSubmit: (hole: number) => void;
  initialPlaceTag?: PlaceMedia; onSubmitPlace?: (place: CoursePlace) => void; onRemovePlace?: (row: PlaceMedia) => void;
}) {
  const { t } = useTranslation('courses');
  const [hole, setHole] = useState<number | null>(initialHole);
  const [segment, setSegment] = useState<'hole' | 'place'>(initialPlaceTag || holeCount === 0 ? 'place' : 'hole');
  const [place, setPlace] = useState<CoursePlace | null>(initialPlaceTag?.place as CoursePlace ?? null);
  const canSubmit = !pending && !!imageUrl && (segment === 'hole' ? hole != null : place != null && !initialPlaceTag && !!onSubmitPlace);
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent className="shot-tag-sheet" onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onPointerDownOutside={event => { if (pending) event.preventDefault(); }}>
      <div className="shot-tag-grabber" />
      <div className="shot-tag-top"><div className="shot-tag-thumb"><HoleMediaThumbnail url={imageUrl} {...mediaSource} alt={mediaSource?.mediaType === 'video' ? 'Your video' : 'Your photo'} /></div><div className="shot-tag-heading"><DialogTitle className="shot-tag-title">{t('media.v2.tagTitle', { defaultValue: "What's in this shot?" })}</DialogTitle></div></div>
      <DialogDescription className="sr-only">{t('media.v2.tagDescription', { defaultValue: 'Choose a hole or a place for your shot.' })}</DialogDescription>
      {imageOptions && imageOptions.length > 1 && <div className="grid grid-cols-4 gap-1">{imageOptions.map(url => <Button key={url} variant="ghost" aria-label={mediaSources.find(s => s.url === url)?.mediaType === 'video' ? 'Choose video' : 'Choose photograph'} aria-pressed={url === imageUrl} disabled={pending} className="relative aspect-square h-auto p-0 overflow-hidden rounded-lg" onClick={() => onImageChange?.(url)}><HoleMediaThumbnail url={url} {...mediaSources.find(s => s.url === url)} alt="" /></Button>)}</div>}
      <ShotTagChoices holes={knownHoleNumbers} segment={segment} onSegment={setSegment} hole={hole} onHole={value => { if (!pending && imageUrl) setHole(value); }} place={place} onPlace={value => { if (!pending && !initialPlaceTag) setPlace(value); }} disabled={pending} />
      {segment === 'place' && initialPlaceTag && onRemovePlace && <Button variant="ghost" className="shot-tag-remove" disabled={pending} onClick={() => onRemovePlace(initialPlaceTag)}>{t('media.v2.removeTag', { defaultValue: 'Remove tag' })}</Button>}
      {error && <p role="alert" className="shot-tag-note">{error}</p>}
      <div className="shot-tag-buttons"><Button variant="outline" className="shot-tag-skip" disabled={pending} onClick={onClose}>{t('media.v2.skip', { defaultValue: 'Skip' })}</Button><Button className="shot-tag-primary" data-tag-primary disabled={!canSubmit} onClick={() => { if (!canSubmit) return; if (segment === 'hole' && hole != null) onSubmit(hole); else if (place) onSubmitPlace?.(place); }}>{pending ? t('media.v2.tagging', { defaultValue: 'Tagging...' }) : segment === 'hole' ? t('media.v2.confirmHole', { defaultValue: 'Confirm tag' }) : t('media.v2.tagAs', { label: place ? t(`media.v2.places.${place}`, { defaultValue: PLACE_LABELS[place] }) : '', defaultValue: place ? `Tag as ${PLACE_LABELS[place]}` : 'Tag as' })}</Button></div>
    </DialogContent>
  </Dialog>;
}
