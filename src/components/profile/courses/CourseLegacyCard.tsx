// A share card is the one surface a member puts in front of other people, so every figure on it must already be true somewhere else on this page. It recomputes nothing. A figure we do not have is a row that is not drawn, never a zero.
import React from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import type { CoursePoint } from '@/hooks/useUserCourseSummary';

export interface CourseLegacyCardProps {
  isOwnProfile: boolean;
  /** The record block's values, passed down unchanged. */
  coursesPlayed: number | null;
  countriesPlayed: number | null;
  top100Played: number | null;
  /** Plotted courses (own position, else club's) from the course summary. */
  points: CoursePoint[];
  /** Course names from the same course summary read. */
  names: Record<string, string>;
  /** The member's own ratings, from the tab's one course_ratings read. */
  ratings: { course_id: string; rating: number | null }[];
  displayName?: string;
  year?: number;
}

const MIN_PLOTTED_FOR_FURTHEST = 3;
const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in radians on the unit sphere. */
function arc(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Plotted course furthest from the spherical centroid of all plotted courses. */
export function furthestFromCentre(points: CoursePoint[]): CoursePoint | null {
  if (points.length < MIN_PLOTTED_FOR_FURTHEST) return null;
  let x = 0, y = 0, z = 0;
  for (const p of points) {
    const la = toRad(p.lat), ln = toRad(p.lng);
    x += Math.cos(la) * Math.cos(ln);
    y += Math.cos(la) * Math.sin(ln);
    z += Math.sin(la);
  }
  const centre = {
    lat: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
    lng: (Math.atan2(y, x) * 180) / Math.PI,
  };
  let best: CoursePoint | null = null;
  let bestD = -1;
  for (const p of points) {
    const d = arc(centre, p);
    if (d > bestD) { bestD = d; best = p; }
  }
  return best;
}

const ROW: React.CSSProperties = {
  marginTop: 9,
  paddingTop: 8,
  borderTop: '1px solid rgba(255,255,255,0.07)',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  fontSize: 11,
};

export const CourseLegacyCard: React.FC<CourseLegacyCardProps> = ({
  isOwnProfile, coursesPlayed, countriesPlayed, top100Played, points, names, ratings, displayName,
  year = new Date().getFullYear(),
}) => {
  if (!isOwnProfile || coursesPlayed == null) return null;

  const clauses = ['courses'];
  if (countriesPlayed != null) clauses.push(`${countriesPlayed} ${countriesPlayed === 1 ? 'country' : 'countries'}`);
  if (top100Played != null) clauses.push(`${top100Played} of the Top 100`);

  const best = ratings
    .filter((r) => r.rating != null && names[r.course_id])
    .reduce<{ course_id: string; rating: number | null } | null>(
      (m, r) => (m == null || (r.rating as number) > (m.rating as number) ? r : m), null);

  const far = furthestFromCentre(points);
  const farName = far ? names[far.id] : undefined;

  return (
    <section style={{ padding: '0 16px', fontFamily: SANS }}>
      <SectionHeader kicker="SHARE" title="Your card, ready to post" accent={MEDAL_GOLD} />
      <div
        data-testid="legacy-card"
        style={{
          background: 'linear-gradient(160deg,#1b1b20,#0E0E12)',
          border: '1px solid rgba(214,168,75,0.3)',
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span data-testid="legacy-brand" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.02em', color: MEDAL_GOLD }}>
            clbhouz
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: A.DIM, fontVariantNumeric: 'tabular-nums' }}>
            {year}
          </span>
        </div>
        <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.85, marginTop: 12, color: A.INK, fontVariantNumeric: 'tabular-nums' }}>
          {coursesPlayed}
        </div>
        <div data-testid="legacy-line" style={{ fontSize: 11.5, lineHeight: 1.45, color: A.MUTE, marginTop: 6 }}>
          {clauses.join(' · ')}
        </div>
        {best && (
          <div data-testid="legacy-best" style={ROW}>
            <span style={{ color: A.DIM }}>Best rated</span>
            <span style={{ color: A.BODY, fontWeight: 700, textAlign: 'right' }}>
              {names[best.course_id]} {(best.rating as number).toFixed(1)}
            </span>
          </div>
        )}
        {farName && (
          <div data-testid="legacy-furthest" style={ROW}>
            <span style={{ color: A.DIM }}>Furthest</span>
            <span style={{ color: A.BODY, fontWeight: 700, textAlign: 'right' }}>{farName}</span>
          </div>
        )}
        {displayName && (
          <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.FAINT }}>
            {displayName}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => {}}
        style={{
          marginTop: 12, width: '100%', borderRadius: 10, padding: 11, border: 0,
          background: MEDAL_GOLD, color: A.CANVAS ?? A.INK, fontFamily: SANS, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Create card
      </button>
    </section>
  );
};

export default CourseLegacyCard;
