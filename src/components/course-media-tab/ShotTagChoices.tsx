/** Member-only place/hole choice grammar. The existing hole picker and admin batch remain independent. */
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HolePhotoPicker } from './HolePhotoPicker';
import { COURSE_PLACES, type CoursePlace } from '@/lib/courseMedia/places';
import { analyticsEvents } from '@/utils/analyticsEvents';
import './shot-tag-choices.css';
export const PLACE_LABELS: Record<CoursePlace, string> = { clubhouse: 'Clubhouse', food_drink: 'Food & drink', practice: 'Practice', pro_shop: 'Pro shop', views: 'Views', golfers: 'Golfers', conditions: 'Conditions', stay: 'Stay', other: 'Something else' };
export function ShotTagChoices({ holes, segment, onSegment, hole, onHole, place, onPlace, disabled, lockedHole = false }: {
  holes: readonly number[]; segment: 'hole' | 'place'; onSegment: (s: 'hole' | 'place') => void;
  hole: number | null; onHole: (h: number) => void; place: CoursePlace | null; onPlace: (p: CoursePlace) => void;
  disabled?: boolean; lockedHole?: boolean;
}) {
  const { t } = useTranslation('courses');
  return <>{holes.length > 0 && <div className="shot-tag-segments" role="tablist" aria-label={t('media.v2.tagKind', { defaultValue: 'Shot type' })}>{(['hole', 'place'] as const).map(s => <Button key={s} role="tab" aria-selected={segment === s} disabled={disabled} onClick={() => { onSegment(s); void analyticsEvents.track('media_tag_sheet_segment', { segment: s }); }}>{t(s === 'hole' ? 'media.v2.aHole' : 'media.v2.around', { defaultValue: s === 'hole' ? 'A hole' : 'Around the club' })}</Button>)}</div>}
    {segment === 'hole' && holes.length > 0 ? <HolePhotoPicker holeCount={holes.length} knownHoleNumbers={holes} selectedHole={hole} disabled={disabled || lockedHole} dimOthers={lockedHole} onSelect={onHole} /> : <><div className="shot-tag-places">{COURSE_PLACES.map(({ id, icon: Icon }) => <Button key={id} variant="ghost" className="shot-tag-place" data-place={id} aria-pressed={place === id} disabled={disabled} onClick={() => onPlace(id)}><Icon size={19} /><span>{t(`media.v2.places.${id}`, { defaultValue: PLACE_LABELS[id] })}</span>{place === id && <i><Check size={12} /></i>}</Button>)}</div><p className="shot-tag-note">{t('media.v2.alsoHole', { defaultValue: 'Taken on the course too? You can also tag it to a hole.' })}</p></>}
  </>;
}
