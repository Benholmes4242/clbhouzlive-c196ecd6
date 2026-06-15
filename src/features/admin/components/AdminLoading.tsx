import React from 'react';
import { adminTheme as t } from '../theme';

export default function AdminLoading() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: t.canvas,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: `3px solid ${t.line}`,
          borderTopColor: t.brand,
          borderRadius: '50%',
          animation: 'admin-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
