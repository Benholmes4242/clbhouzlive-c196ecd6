import React from 'react';

interface AdminMiniCardProps {
  label: string;
  value: number | string;
  borderColor?: string;
  isLoading?: boolean;
}

export function AdminMiniCard({ label, value, borderColor = '#F5A623', isLoading }: AdminMiniCardProps) {
  if (isLoading) {
    return (
      <div
        className="animate-pulse"
        style={{
          padding: '12px 16px', background: '#FFFFFF',
          border: '1px solid #E2E8F0', borderRadius: 12,
          borderTop: `2px solid ${borderColor}`,
        }}
      >
        <div className="h-6 w-12 rounded mb-1" style={{ background: '#F1F5F9' }} />
        <div className="h-3 w-16 rounded" style={{ background: '#F1F5F9' }} />
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px 16px', background: '#FFFFFF',
      border: '1px solid #E2E8F0', borderRadius: 12,
      borderTop: `2px solid ${borderColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', letterSpacing: -0.5 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
