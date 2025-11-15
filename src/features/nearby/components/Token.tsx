import React from 'react';
import { Squircle } from '@/components/ui/squircle';
import './Token.css';

type Props = {
  avatarUrl?: string;
  initials?: string;
  label: string;
  meta?: string;
  onRemove?: () => void;
};

export function Token({ 
  avatarUrl, 
  initials, 
  label, 
  meta, 
  onRemove 
}: Props) {
  return (
    <span className="token" role="listitem" aria-label={label}>
      <span className="tokenAvatar">
        <Squircle width={32} height={32}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)',
              fontSize: '13px',
              fontWeight: 600
            }}>
              {initials ?? 'G'}
            </div>
          )}
        </Squircle>
      </span>
      <span className="tokenText">
        <span className="tokenLabel">{label}</span>
        {meta && <span className="tokenMeta">{meta}</span>}
      </span>
      {onRemove && (
        <button 
          className="tokenX" 
          aria-label={`Remove ${label}`} 
          onClick={onRemove}
          type="button"
        >
          ×
        </button>
      )}
    </span>
  );
}
