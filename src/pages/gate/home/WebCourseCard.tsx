import { fmt, ordinal, signed, type WebCourse } from './useWebHomeData';
const RAMP = ['#E24B3F', '#b2453f', '#94493f', '#7a5250'];
/** Dark course card built like the mock's cardHTML; WEB_HOMEPAGE_1 card rules unchanged. */
export function WebCourseCard({ course }: { course: WebCourse }) {
  const n = course.ratings_count ?? 0;
  const rate = course.rating_avg != null ? <>Rated <b className="fig" style={{ color: 'var(--ink)', letterSpacing: 0 }}>{Number(course.rating_avg).toFixed(1)}</b> by golfers · {n} ratings</> : n === 1 ? '1 rating so far' : n > 1 ? `${n} ratings so far` : 'Not rated yet';
  let read: React.ReactNode;
  if (course.read_available) {
    const hh = course.hardest_hole; const holes = (course.top_holes ?? []).slice(0, 4);
    const sub = course.card_hardest_hole != null ? `card says ${ordinal(course.card_hardest_hole)}` : hh?.stroke_index != null ? `card says SI ${hh.stroke_index}` : '';
    const pv = Number(course.plays_vs_par ?? 0); const max = Math.max(...holes.map(h => Number(h.avg_to_par)), 0.01);
    read = <><div className="tiles" data-web-read-tiles=""><div className="card"><div className="sk">Rounds</div><div className="fig n">{fmt(Math.max(course.rounds ?? 0, course.hole_rounds ?? 0), 'en-GB')}</div><div className="u">shared here</div></div><div className="card"><div className="sk">Plays</div><div className="fig n" style={pv < 0 ? { color: '#E24B3F' } : undefined}>{signed(pv, 1)}</div><div className="u">vs par, average</div></div><div className="card"><div className="sk">Hardest</div><div className="fig n">{hh ? ordinal(hh.hole_no) : '—'}</div><div className="u">{sub}</div></div></div>
      {holes.length > 0 && <div className="card" style={{ marginTop: 10, padding: '2px 16px' }}><div className="hr" style={{ borderTop: 0, fontSize: 9, fontWeight: 700, letterSpacing: '.14em', color: 'var(--dim)' }}><span>HOLE</span><span/><span style={{ textAlign: 'right' }}>VS PAR</span><span style={{ textAlign: 'right' }}>CARD</span></div>
        {holes.map((h, k) => <div className="hr" key={h.hole_no}><b className="fig" style={{ fontSize: 16 }}>{h.hole_no}</b><i style={{ background: RAMP[k], width: `${Math.max(4, Math.round(Number(h.avg_to_par) / max * 100))}%` }}/><span className="fig" style={{ textAlign: 'right', fontSize: 14, letterSpacing: 0 }}>{signed(Number(h.avg_to_par), 2)}</span><span className="fig" style={{ textAlign: 'right', color: 'var(--dim)', fontSize: 13, letterSpacing: 0 }}>{h.stroke_index ? `SI ${h.stroke_index}` : ''}</span></div>)}</div>}</>;
  } else {
    read = <div className="card" style={{ marginTop: 18 }} data-web-thin-read=""><div className="sk">How it plays</div><div style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 8 }}>We read a course once golfers have shared 10 hole-by-hole rounds there.{course.hole_rounds > 0 && <> <b className="fig">{course.hole_rounds}</b> so far.</>} Play it and yours counts.</div></div>;
  }
  return <div data-web-course-card={course.id ?? ''}><div className="sk" style={{ fontSize: 10 }}>{course.area ?? ''}</div><div className="nm">{course.name}</div><div className="rt">{rate}</div>{course.quote && <div className="qt">{`“${course.quote}”`}</div>}{read}</div>;
}
