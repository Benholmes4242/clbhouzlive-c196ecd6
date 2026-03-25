import React from 'react';

interface AdminStatRowProps {
  label: string;
  value: string | number;
  subValue?: string;
  barPct?: number;
  color?: string;
  onClick?: () => void;
}

export function AdminStatRow({
  label,
  value,
  subValue,
  barPct,
  color = '#F5A623',
  onClick,
}: AdminStatRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 0', borderBottom: '1px solid #F8FAFC',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={onClick ? e => { (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA'; } : undefined}
      onMouseLeave={onClick ? e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; } : undefined}
    >
      <span style={{ flex: 1, fontSize: 13, color: '#334155', fontWeight: 500 }}>{label}</span>
      {barPct !== undefined && (
        <div style={{ width: 80, height: 4, borderRadius: 2, background: '#F1F5F9', flexShrink: 0 }}>
          <div style={{
            width: `${Math.min(100, barPct)}%`, height: '100%',
            borderRadius: 2, background: color, transition: 'width 0.6s ease',
          }} />
        </div>
      )}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {subValue && (
          <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>{subValue}</span>
        )}
      </div>
    </div>
  );
}
