import { useNavigate } from 'react-router-dom';
import { useGamRpc } from '@/hooks/gam/_useGamRpc';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { addedMonthLabel } from '@/lib/courseMedia/addedMonth';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { useSectionReady } from './PageLoadGate';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { RAIL_BLEED } from './format';
import { PHOTO_FIGURE_GAP } from './PhotoFigureCard';
import { LatestHolesShell } from './sectionShells';
import './latestHoles.css';

/** The RPC owns newest-first ordering, up to two shots per course, at most 30, and public eligibility.
 * Credit shows the month the member added the shot to clbhouz (added_at), never its EXIF capture date; this rail never starts video playback.
 * Geometry is shared with the loading shell, not PhotoFigureCard.
 */
export const LATEST_HOLE_W = 220;
export const LATEST_HOLE_H = 293;

export interface LatestHoleMedia {
  id: string;
  course_id: string;
  course_name: string;
  hole_no: number;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url: string | null;
  stream_id: string | null;
  duration_seconds: number | null;
  exif_captured_at: string | null;
  added_at: string;
  created_at: string;
  member_id: string;
  member_name: string | null;
  par: number | null;
  yards: number | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function addedCreditMonth(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return `${MONTHS[date.getUTCMonth()]} ${String(date.getUTCFullYear()).padStart(4, '0')}`;
}

function LatestHoleCard({ row }: { row: LatestHoleMedia }) {
  const navigate = useNavigate();
  const credit = [row.member_name, addedCreditMonth(row.added_at)].filter(Boolean).join(' \u00B7 ');
  const seconds = Math.round(row.duration_seconds ?? 0);
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <button type="button" className="latest-hole-card" aria-label={`Hole ${row.hole_no}, ${row.course_name}`}
      style={{ width: LATEST_HOLE_W, height: LATEST_HOLE_H, background: A.PANEL }}
      onClick={() => navigate(`/courses/${row.course_id}?tab=media&hole=${row.hole_no}&shot=${row.id}`)}>
      <img src={row.media_type === 'video' ? holeMediaPoster(row) : row.media_url} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />
      <div className="latest-hole-scrim" style={{ background: SCRIM_STANDOUT }} />
      <div className="latest-hole-figure">
        <div className="latest-hole-number">{row.hole_no}</div>
        <div className="latest-hole-label">{row.par != null ? `Par ${row.par}${row.yards != null ? ` \u00B7 ${row.yards} yds` : ''}` : 'Hole'}</div>
      </div>
      <div className="latest-hole-name">
        <div className="latest-hole-course">{row.course_name}</div>
        {credit && <div className="latest-hole-credit">{credit}</div>}
      </div>
      {row.media_type === 'video' && <span className="glass-chip latest-hole-video">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" /></svg>
        {duration}
      </span>}
    </button>
  );
}

export function LatestHolesSection() {
  const { data, isLoading, isError } = useGamRpc<LatestHoleMedia[]>('get_latest_hole_media', { p_limit: 30 }, { staleTime: 60_000 });
  useSectionReady('latestHoles', !isLoading);
  if (isLoading) return <LatestHolesShell />;
  if (isError || !data || data.length < 3) return null;
  return <section style={SECTION_WRAP}>
    <SectionHead tone="amber" kicker="Through members' eyes" title="Latest holes" />
    <div className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: PHOTO_FIGURE_GAP, marginTop: HEAD_GAP }}>
      {data.map(row => <LatestHoleCard key={row.id} row={row} />)}
    </div>
  </section>;
}