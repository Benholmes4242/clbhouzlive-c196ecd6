import React from 'react';
import { adminTheme as t } from '../theme';

export interface SectionTab {
  id: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: SectionTab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function SectionTabs({ tabs, activeId, onChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        padding: '4px 2px',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 999,
              border: `1px solid ${active ? 'transparent' : t.line}`,
              background: active ? t.brandSoft : t.surface,
              color: active ? t.brandText : t.inkMuted,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                style={{
                  background: active ? t.brand : t.line,
                  color: active ? t.surface : t.inkMuted,
                  fontSize: 11,
                  padding: '0 6px',
                  borderRadius: 999,
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
