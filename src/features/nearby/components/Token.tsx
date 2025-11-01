import React from 'react';
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
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          <span className="tokenInit">{initials ?? 'G'}</span>
        )}
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
