import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * CourseMasthead — the one head shared by the Courses page hero and the
 * course detail hero: KICKER (region + surface parts, amber), NAME, PLACE
 * (macro area), then a hairline above whatever each hero puts beneath it.
 * Region and macro area arrive as separate fields from each hero's source;
 * never split a joined display string to feed this.
 */

const HERO_HAIRLINE = 'rgba(255,255,255,0.18)';
const PLACE_INK = 'rgba(255,255,255,0.78)';
const SKELETON_FILL = 'rgba(255,255,255,0.28)';

export const MASTHEAD_KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.15em',
  lineHeight: 1.2,
  textTransform: 'uppercase',
  color: A.AMBER,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontVariantNumeric: 'tabular-nums lining-nums',
};

export const MASTHEAD_NAME: React.CSSProperties = {
  fontSize: 'clamp(24px, 7.7vw, 30px)',
  fontWeight: 800,
  lineHeight: 0.99,
  letterSpacing: '-0.032em',
  color: '#fff',
  margin: 0,
};

export const MASTHEAD_PLACE: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: PLACE_INK,
  marginTop: 6,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

/**
 * HERO FIGURE CELL — label above value, for every hero figure row. Not the
 * round card's FigureCell: that one is 9px label / 15px value on card ground,
 * and taking these sizes would change every round card.
 */
export const HERO_FIGURE_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: 'rgba(248,250,252,0.58)',
  whiteSpace: 'nowrap',
};
export const HERO_FIGURE_VALUE: React.CSSProperties = {
  fontSize: 19,
  fontWeight: 800,
  marginTop: 4,
  lineHeight: 1,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums lining-nums',
  color: '#fff',
};

export function HeroFigureCell({ label, value, tone, cjk = false, align = 'start' }: {
  label: string; value: React.ReactNode; tone?: string; cjk?: boolean; align?: 'start' | 'center';
}) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', minWidth: 0, flex: 1 }}>
      <span style={{ ...HERO_FIGURE_LABEL, letterSpacing: cjk ? 0 : HERO_FIGURE_LABEL.letterSpacing, textTransform: cjk ? 'none' : 'uppercase' }}>{label}</span>
      <span style={{ ...HERO_FIGURE_VALUE, color: tone ?? HERO_FIGURE_VALUE.color }}>{value}</span>
    </span>
  );
}

export interface CourseMastheadProps {
  kicker: string | null;
  name: string;
  place: string | null;
  /** Each hero keeps its own clamp; undefined = no clamp. */
  nameClamp?: number;
  /** Rendered left of the name block, baseline-aligned (Courses ranked variant). */
  nameLead?: React.ReactNode;
  as?: 'h1' | 'div';
  children?: React.ReactNode;
}

export function MastheadRule({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 13, paddingTop: 11, borderTop: `1px solid ${HERO_HAIRLINE}` }}>
      {children}
    </div>
  );
}

export const CourseMasthead: React.FC<CourseMastheadProps> = ({
  kicker, name, place, nameClamp, nameLead, as = 'div', children,
}) => {
  const NameTag = as;
  const clamp: React.CSSProperties = nameClamp
    ? { display: '-webkit-box', WebkitLineClamp: nameClamp, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
    : {};
  return (
    <div>
      {kicker && <div style={{ ...MASTHEAD_KICKER, marginBottom: 8 }}>{kicker}</div>}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        {nameLead}
        <div style={{ minWidth: 0, flex: 1 }}>
          <NameTag style={{ ...MASTHEAD_NAME, ...clamp }}>{name}</NameTag>
          {place && <div style={MASTHEAD_PLACE}>{place}</div>}
        </div>
      </div>
      {children != null && children !== false && <MastheadRule>{children}</MastheadRule>}
    </div>
  );
};

/** Loading shape of the masthead: kicker bar, tall name block, place bar, then the row beneath. */
export function CourseMastheadSkeleton({ rowHeight }: { rowHeight: number }) {
  const bar = (h: number, w: string | number, mb = 0): React.CSSProperties => ({
    height: h, width: w, background: SKELETON_FILL, borderRadius: 4, marginBottom: mb,
  });
  return (
    <div style={{ opacity: 0.35 }} aria-hidden>
      <div className="animate-pulse" style={bar(11, 140, 8)} />
      <div className="animate-pulse" style={bar(30, '70%', 6)} />
      <div className="animate-pulse" style={bar(12.5, 120)} />
      <MastheadRule>
        <div className="animate-pulse" style={bar(rowHeight, '80%')} />
      </MastheadRule>
    </div>
  );
}

export default CourseMasthead;
