import React from 'react';
import { ChevronLeft, Crown } from 'lucide-react';
import { CourseEyebrow } from '../_shared/CourseEyebrow';
import type { CourseSelection } from '../types';

interface Props {
  state: CourseSelection;
  onBack: () => void;
  youOwnedCount: number;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const DrilldownHeader: React.FC<Props> = ({ state, onBack, youOwnedCount }) => (
  <>
    <div style={{ padding: '20px 16px 0', fontFamily: FONT }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: 'var(--hcp-t-60)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        <ChevronLeft size={16} />
        All courses
      </button>
    </div>

    <div
      style={{
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <CourseEyebrow
          type={state.courseType}
          region={state.courseRegion}
          country={state.courseCountry}
        />
        <div
          style={{
            marginTop: 4,
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            fontFamily: FONT,
          }}
        >
          {state.courseName}
        </div>
      </div>
      <div
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          borderRadius: 999,
          background: 'rgba(251,188,46,0.14)',
          border: '1px solid rgba(251,188,46,0.40)',
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 800,
          color: '#FBBC2E',
          letterSpacing: '0.08em',
        }}
      >
        <Crown size={12} strokeWidth={2.5} />
        {youOwnedCount}/5
      </div>
    </div>
  </>
);
