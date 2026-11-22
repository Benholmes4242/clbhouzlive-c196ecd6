import React from 'react';
import { buildEyebrow } from './eyebrowLabel';
import { SECTION_EYEBROW } from '@/lib/tokens/type';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';


export const CourseEyebrow: React.FC<{
  type?: string | null;
  region?: string | null;
  country?: string | null;
  onPhoto?: boolean;
}> = ({ type, region, country, onPhoto = false }) => {
  const label = buildEyebrow(type, region, country);
  if (!label) return null;
  return (
    <div
      style={{
        fontFamily: FONT,
        ...SECTION_EYEBROW,
        color: onPhoto ? '#FFFFFF' : '#F8FAFC',
        marginBottom: 4,
        ...(onPhoto && { textShadow: '0 1px 3px rgba(0,0,0,0.55)' }),
      }}
    >
      {label}
    </div>
  );
};

export default CourseEyebrow;
