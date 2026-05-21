import React from 'react';
import { Search } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const CourseSearch: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <div style={{ padding: '20px 16px 0' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 12,
        padding: '10px 14px',
      }}
    >
      <Search size={16} color="var(--hcp-t-60)" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search courses by name"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: FONT,
          fontSize: 14,
          color: 'var(--hcp-t-100)',
        }}
      />
    </div>
  </div>
);

export default CourseSearch;
