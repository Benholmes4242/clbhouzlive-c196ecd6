import React from 'react';
import { buildEyebrow } from './eyebrowLabel';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const AMBER = '#F7931E';

export const CourseEyebrow: React.FC<{
  type?: string | null;
  region?: string | null;
  country?: string | null;
}> = ({ type, region, country }) => {
  const label = buildEyebrow(type, region, country);
  if (!label) return null;
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: AMBER,
        textTransform: 'uppercase',
        lineHeight: 1.2,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
  );
};

export default CourseEyebrow;
