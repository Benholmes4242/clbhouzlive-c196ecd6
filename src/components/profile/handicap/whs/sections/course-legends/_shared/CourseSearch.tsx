import React from 'react';
import { Search } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Optional helper subtitle rendered below the input. */
  helper?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  autoFocus?: boolean;
}

export const CourseSearch: React.FC<Props> = ({ value, onChange, helper, inputRef, autoFocus }) => (
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
    {helper && (
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: 'var(--hcp-t-40)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          paddingLeft: 4,
          fontFamily: FONT,
        }}
      >
        <Search size={9} color="var(--hcp-t-40)" strokeWidth={2.2} />
        {helper}
      </div>
    )}
  </div>
);

export default CourseSearch;
