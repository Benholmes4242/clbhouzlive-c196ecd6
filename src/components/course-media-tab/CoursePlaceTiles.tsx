import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { COURSE_PLACES, type CoursePlace } from '@/lib/courseMedia/places';
import type { PlaceMedia } from './hooks/useCoursePlaceMedia';
import { PLACE_LABELS } from './ShotTagChoices';
import { ReadyShotCover } from './ReadyShotCover';

export function placeAge(addedAt: string, now = Date.now()): { key: string; count?: number } {
  const added = new Date(addedAt);
  const today = new Date(now);
  const days = Math.max(0, Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(added.getFullYear(), added.getMonth(), added.getDate())) / 86400000));
  if (!Number.isFinite(days) || days === 0) return { key: 'today' };
  if (days === 1) return { key: 'yesterday' };
  if (days < 7) return { key: 'days', count: days };
  if (days < 30) return { key: 'weeks', count: Math.floor(days / 7) };
  return { key: 'months', count: Math.floor(days / 30) };
}
export function approvedPlaceGroups(rows: readonly PlaceMedia[]) {
  return COURSE_PLACES.flatMap(place => {
    const shots = rows.filter(row => row.status === 'approved' && row.place === place.id)
      .sort((a, b) => Date.parse(b.added_at) - Date.parse(a.added_at));
    return shots.length ? [{ ...place, shots }] : [];
  });
}
export function CoursePlaceTiles({ rows, onOpen }: { rows: readonly PlaceMedia[]; onOpen: (place: CoursePlace, rows: PlaceMedia[]) => void }) {
  const { t } = useTranslation('courses');
  const groups = approvedPlaceGroups(rows);
  if (!groups.length) return null;
  const count = groups.reduce((sum, group) => sum + group.shots.length, 0);
  return <section className="media-v2-places">
    <div className="media-v2-head"><h3>{t('media.v2.around', { defaultValue: "Around the club" })}</h3><span className="media-v2-label">{t('media.v2.shots', { count, defaultValue: "{{count}} shots" })}</span></div>
    <div className="media-v3-place-rail">{groups.map(({ id, icon: Icon, shots }) => {
      const label = t(`media.v2.places.${id}`, { defaultValue: PLACE_LABELS[id] });
      const age = placeAge(shots[0].added_at);
      return <Button variant="ghost" className="media-v2-place-tile" key={id} aria-label={label} onClick={() => onOpen(id, shots)}>
        <ReadyShotCover shots={shots} />
        <Icon className="media-v3-place-icon" size={17} strokeWidth={2} />
        <span className="media-v2-place-caption"><b>{label}</b><span>{t('media.v3.shots', { count: shots.length, defaultValue: `${shots.length} ${shots.length === 1 ? 'shot' : 'shots'}` })}</span></span>
        {id === 'conditions' && <span className="media-v2-condition media-v2-label">{t(`media.v2.age.${age.key}`, { count: age.count, defaultValue: age.key === 'today' ? 'Today' : age.key === 'yesterday' ? 'Yesterday' : `${age.count} ${age.key} ago` })}</span>}
      </Button>;
    })}</div>
  </section>;
}