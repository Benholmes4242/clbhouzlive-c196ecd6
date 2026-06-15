import React from 'react';
import { Lock } from 'lucide-react';
import { adminTheme as t } from '../theme';

export default function AdminAccessDenied() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: t.canvas,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.line}`,
          borderRadius: t.radius.lg,
          padding: 28,
          maxWidth: 360,
          textAlign: 'center',
          boxShadow: t.shadowCard,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: t.brandSoft,
            color: t.brand,
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={22} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.ink }}>
          Access denied
        </div>
        <div style={{ fontSize: 14, color: t.inkMuted, marginTop: 6 }}>
          You don't have permission to access this console.
        </div>
        <a
          href="/clubhouse"
          style={{
            display: 'inline-block',
            marginTop: 18,
            padding: '10px 18px',
            background: t.ink,
            color: t.surface,
            borderRadius: t.radius.md,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Back to app
        </a>
      </div>
    </div>
  );
}
