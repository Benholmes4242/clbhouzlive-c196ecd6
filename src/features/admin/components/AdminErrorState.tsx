import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { adminTheme as t } from '../theme';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export default function AdminErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retrying,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
        color: t.inkMuted,
        gap: 12,
      }}
    >
      <div style={{ color: t.dangerText, display: 'flex' }}>
        <AlertTriangle size={28} />
      </div>
      <div style={{ color: t.ink, fontWeight: 600, fontSize: 15 }}>{title}</div>
      {message && (
        <div style={{ color: t.inkMuted, fontSize: 13, maxWidth: 360, lineHeight: 1.45 }}>
          {message}
        </div>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          style={{
            marginTop: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: t.radius.md,
            border: `1px solid ${t.line}`,
            background: t.surface,
            color: t.ink,
            fontSize: 13,
            fontWeight: 600,
            cursor: retrying ? 'default' : 'pointer',
            opacity: retrying ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} style={{ animation: retrying ? 'admin-spin .6s linear infinite' : undefined }} />
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  );
}
