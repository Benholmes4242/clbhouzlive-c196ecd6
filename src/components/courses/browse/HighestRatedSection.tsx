import { A, SUB_SCORE_GREEN_MIN } from '@/features/courses/components/holes/analytical/tokens';
import { useStatBrowseList } from '../useStatBrowse';
import { useSectionReady } from './PageLoadGate';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { RAIL_BLEED } from './format';
import { PhotoFigureCard, HIGHEST_RATED_COUNT, PHOTO_FIGURE_GAP } from './PhotoFigureCard';
import { PhotoRailShell } from './sectionShells';

const SUBS = [
  ['design_score', 'Design'],
  ['condition_score', 'Cond'],
  ['clubhouse_score', 'House'],
  ['facilities_score', 'Facil'],
] as const;

const fmtScore = (v: number | null) => (v == null || !Number.isFinite(v) ? '-' : v.toFixed(1));

/* Review rule (SUB_SCORE_GREEN_MIN): 9.0 and above is green. Below 9 stays white, not A.MUTE, because these figures sit on a photo. */
const onPhotoTone = (v: number | null) => (v != null && Number.isFinite(v) && v >= SUB_SCORE_GREEN_MIN ? A.GREEN : '#FFFFFF');

/** SECTION 05 — HIGHEST RATED. A rail of PhotoFigureCards (shared with 03). */
export function HighestRatedSection() {
  const { rows, isLoading } = useStatBrowseList({ lens: 'rated', country: null, region: null, limit: HIGHEST_RATED_COUNT });
  useSectionReady('highestRated', !isLoading);
  if (isLoading) return <PhotoRailShell count={HIGHEST_RATED_COUNT} />;
  if (rows.length === 0) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead tone="amber" kicker="Highest rated" title="What members rate highest" />
      <div className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: PHOTO_FIGURE_GAP, marginTop: HEAD_GAP }}>
        {rows.slice(0, HIGHEST_RATED_COUNT).map((row) => (
          <PhotoFigureCard
            key={row.course_id}
            row={row}
            figure={fmtScore(row.community_rating)}
            figureColor={onPhotoTone(row.community_rating)}
            figureLabel={`${row.review_count.toLocaleString('en-GB')} ${row.review_count === 1 ? 'rating' : 'ratings'}`}
            nameBottom={52}
            footer={
              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 13, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {SUBS.map(([key, label]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: onPhotoTone(row[key]), fontVariantNumeric: 'tabular-nums' }}>{fmtScore(row[key])}</div>
                    <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.64)' }}>{label}</div>
                  </div>
                ))}
              </div>
            }
          />
        ))}
      </div>
    </section>
  );
}
