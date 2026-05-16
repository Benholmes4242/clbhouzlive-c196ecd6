import React from 'react';
import { splitCourseName } from '@/components/profile/handicap/whs/sections/last-round-card/splitCourseName';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = "Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export const HAIR: React.CSSProperties = {
  height: 0,
  borderTop: '0.5px solid rgba(255,255,255,0.15)',
};

export const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.55)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontFamily: FONT_GEIST,
};

export const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: 28,
  fontWeight: 300,
  color,
  fontFamily: FONT_MONO,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  marginTop: 3,
  fontVariantNumeric: 'tabular-nums',
});

export const GlassShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      padding: '12px 14px',
      borderRadius: 14,
      background: 'rgba(255,255,255,0.08)',
      border: '0.5px solid rgba(255,255,255,0.18)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      fontFamily: FONT_GEIST,
    }}
  >
    {children}
  </div>
);

export const CourseHeader: React.FC<{
  courseName: string | null;
  meta?: string | null;
  metaColor?: string;
  metaLetterSpacing?: string;
}> = ({ courseName, meta, metaColor = 'rgba(255,255,255,0.60)', metaLetterSpacing = '0.06em' }) => {
  const { title } = splitCourseName(courseName ?? 'Round played');
  return (
    <>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      {meta && (
        <div
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: 600,
            color: metaColor,
            letterSpacing: metaLetterSpacing,
            textTransform: 'uppercase',
          }}
        >
          {meta}
        </div>
      )}
    </>
  );
};
