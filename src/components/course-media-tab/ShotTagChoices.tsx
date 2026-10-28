/** Media v3 simultaneous grids. The adapters enforce one selection and own writes;
 * HolePhotoPicker remains independent for the frozen upload/retag paths. */
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COURSE_PLACES, type CoursePlace } from '@/lib/courseMedia/places';
import './media-v3.css';
export const PLACE_LABELS: Record<CoursePlace, string> = { clubhouse: 'Clubhouse', food_drink: 'Food & drink', practice: 'Practice', pro_shop: 'Pro shop', views: 'Views', golfers: 'Golfers', conditions: 'Conditions', stay: 'Stay', other: 'Something else' };
export function ShotTagChoices({ holes, hole, onHole, place, onPlace, disabled, lockedHole = false }: {
  holes: readonly number[];
  hole: number | null; onHole: (h: number) => void; place: CoursePlace | null; onPlace: (p: CoursePlace) => void;
  disabled?: boolean; lockedHole?: boolean;
}) {
  const { t } = useTranslation('courses');
  return <>{holes.length > 0 && <section data-tag-holes>
    <h3 className="media-v2-label media-v3-tag-label">{t('media.v3.holes', { defaultValue: 'A hole on the course' })}</h3>
    <div className="media-v3-tag-holes">{holes.map(n => <Button key={n} variant="ghost" className="media-v3-tag-hole" aria-label={t('media.v3.hole', { n, defaultValue: `Hole ${n}` })}
      aria-pressed={hole === n} data-state={hole === n ? 'closed' : 'open'} data-dim={lockedHole && hole !== n || undefined}
      disabled={disabled || lockedHole} onClick={() => onHole(n)}>{n}</Button>)}</div>
  </section>}
    <section><h3 className="media-v2-label media-v3-tag-label">{t('media.v3.around', { defaultValue: 'Around the club' })}</h3>
      <div className="media-v3-tag-places">{COURSE_PLACES.map(({ id, icon: Icon }) => <Button key={id} variant="ghost" className="media-v3-tag-place" data-place={id} aria-pressed={place === id} disabled={disabled} onClick={() => onPlace(id)}><Icon size={17} strokeWidth={2} /><span>{t(`media.v2.places.${id}`, { defaultValue: PLACE_LABELS[id] })}</span>{place === id && <i><Check size={11} strokeWidth={2.4} /></i>}</Button>)}</div>
    </section>
  </>;
}
