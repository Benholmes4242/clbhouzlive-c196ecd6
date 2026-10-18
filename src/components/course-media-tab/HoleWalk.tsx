/** State A and State B keep one mounted grid; no scroll, gallery cap or alias
 * correction. Real stored photos supply imagery, never illustrative mock art.
 */
import { useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { A, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { capitalPhotoCount } from '@/lib/courseMedia/holePhotoData';
import { captureMonth, captureMonthLabel, deriveHoleWalk, holeOrdinal, holePhotoMonths } from '@/lib/courseMedia/holeWalk';
import './hole-walk.css';

export function HoleWalk({ available, holes, rows, totalMedia, courseName, authors, onAddFirst }: {
  available: boolean; holes: readonly CourseHole[]; rows: readonly HolePhoto[];
  totalMedia: number; courseName?: string; authors?: ReadonlyMap<string, string>;
  onAddFirst: (hole: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  if (!available || !holes.length) return null;
  const walk = deriveHoleWalk(holes, rows);
  const tile = walk.tiles.find(item => item.hole.hole_no === selected);
  const active = tile?.photos.find(photo => photo.id === photoId) ?? tile?.photos[0];
  const months = tile ? holePhotoMonths(tile.photos) : [];
  const field = tile ? toParParts(tile.hole.avg_to_par) : null;
  const author = active ? authors?.get(active.user_id) : undefined;
  const month = active ? captureMonth(active) : null;
  return <div className="hole-walk" style={{ color: A.INK, '--hole-walk-ink': A.INK, '--hole-walk-canvas': A.CANVAS, '--hole-walk-muted': A.MUTE, '--hole-walk-body': A.BODY, '--hole-walk-dim': A.DIM, '--hole-walk-faint': A.FAINT, '--hole-walk-soft': A.SOFT, '--hole-walk-rule': A.SOFT, '--hole-walk-track': A.TRACK } as CSSProperties}>
    <section className="hole-walk-section">
      <p className="hole-walk-kicker">Walk the course</p>
      <h2 className="hole-walk-title">{walk.headline}</h2>
      <p className="hole-walk-lede">{capitalPhotoCount(walk.photoCount)} of the {totalMedia.toLocaleString()} are tied to a hole. Tap one to walk it.</p>
      <div className="hole-walk-grid">
        {walk.tiles.map(item => <Button key={item.hole.hole_no} variant="ghost" aria-label={`Hole ${item.hole.hole_no}`} aria-pressed={selected === item.hole.hole_no}
          className={`hole-walk-tile ${item.photos.length ? '' : 'hole-walk-open'} ${selected === item.hole.hole_no ? 'hole-walk-selected' : ''}`}
          onClick={() => { setSelected(item.hole.hole_no); setPhotoId(null); }}>
          {item.photos[0] && <img src={item.photos[0].media_url} alt="" loading="lazy" />}
          <span className="hole-walk-number">{item.hole.hole_no}</span>
          <span className="hole-walk-count">{item.photos.length || 'Open'}</span>
        </Button>)}
      </div>
      <div className="hole-walk-legend"><span><i className="hole-walk-swatch" />Photographed</span><span><i className="hole-walk-swatch hole-walk-swatch-open" />Nobody has yet</span></div>
      {!tile && (walk.most != null || walk.openCount > 0) && <p className="hole-walk-observation">
        {walk.most != null && <>The <strong>{holeOrdinal(walk.most)}</strong> is the most photographed hole on the course. </>}
        {walk.openCount > 0 && <><strong>{capitalPhotoCount(walk.openCount)} holes here have never been shot</strong>{walk.hardestOpen != null ? <> — including the <strong>{holeOrdinal(walk.hardestOpen)}</strong>, which the field loses most shots to.</> : '.'}</>}
      </p>}
    </section>
    {tile && <section className="hole-walk-section">
      <p className="hole-walk-kicker">The {holeOrdinal(tile.hole.hole_no)}</p>
      <h2 className="hole-walk-title">Par {tile.hole.par}{tile.hole.yards != null && <> · {tile.hole.yards.toLocaleString()} yards</>}</h2>
      <div className={`hole-walk-photo ${active ? '' : 'hole-walk-photo-open'}`}>
        {active ? <><img src={active.media_url} alt={`Hole ${tile.hole.hole_no}`} />{(author || month) && <div className="hole-walk-caption">{author && <strong>{author}</strong>}{month && <span>{captureMonthLabel(month)}</span>}</div>}</> : <span>No photograph yet</span>}
      </div>
      <div className="hole-walk-stats">
        <div><b>{tile.hole.par}</b><span>Par</span></div>
        {tile.hole.yards != null && <div><b>{tile.hole.yards.toLocaleString()}</b><span>Yards</span></div>}
        {tile.hole.stroke_index != null && <div><b>{tile.hole.stroke_index}</b><span>Stroke index</span></div>}
        {field && <div><b style={{ color: field.tone }}>{field.text}</b><span>Field loses</span></div>}
      </div>
      {tile.photos.length >= 2 && <div className="hole-walk-strip">{tile.photos.filter(photo => photo.id !== active?.id).map(photo => <Button variant="ghost" key={photo.id} aria-label="View photograph" className="hole-walk-thumbnail" onClick={() => setPhotoId(photo.id)}><img src={photo.media_url} alt={`Hole ${tile.hole.hole_no}`} loading="lazy" /></Button>)}</div>}
      {months.length > 0 && <div className="hole-walk-months">{months.map(item => <span key={item.month}>{capitalPhotoCount(item.count)} in {captureMonthLabel(item.month)}</span>)}</div>}
      {tile.photos.length > 0 && <p className="hole-walk-observation">{capitalPhotoCount(tile.photos.length)} shots of one hole{months.length > 0 && <> across {months.length === 2 ? 'two' : capitalPhotoCount(months.length).toLowerCase()} seasons</>}.</p>}
      {!active && <><p className="hole-walk-observation">{walk.hardestOpen === tile.hole.hole_no && <>The field loses more shots here than on any hole{courseName ? ` at ${courseName}` : ' on the course'}. </>}<strong>Nobody has photographed it.</strong></p>
        <Button variant="ghost" className="hole-walk-add" onClick={() => onAddFirst(tile.hole.hole_no)}>Add the first</Button></>}
    </section>}
  </div>;
}