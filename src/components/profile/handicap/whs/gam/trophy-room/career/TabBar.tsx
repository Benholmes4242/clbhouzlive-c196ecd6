/** Career record tabs: Records / Top 100 / Courses. Presentation only. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { REC } from './tokens';

export type CareerTab = 'records' | 'top100' | 'courses';

const TABS: Array<{ id: CareerTab; label: string }> = [
  { id: 'records', label: 'career.tabRecords' },
  { id: 'top100', label: 'career.tabTop100' },
  { id: 'courses', label: 'career.tabCourses' },
];

interface Props {
  tab: CareerTab;
  onSelect: (tab: CareerTab) => void;
}

export const TabBar: React.FC<Props> = ({ tab, onSelect }) => {
  const { t } = useTranslation('handicap');
  return (
  <div
    role="tablist"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 3,
      padding: 3,
      borderRadius: 11,
      background: REC.CANVAS,
      marginBottom: 22,
    }}
  >
    {TABS.map(({ id, label }) => {
      const on = id === tab;
      return (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={on}
          onClick={() => onSelect(id)}
          style={{
            padding: '9px 0',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: REC.FONT,
            background: on ? REC.TAB_ON : 'transparent',
            color: on ? REC.INK : REC.MUTE,
            cursor: 'pointer',
          }}
        >
          {t(label)}
        </button>
      );
    })}
  </div>
  );
};

export default TabBar;
