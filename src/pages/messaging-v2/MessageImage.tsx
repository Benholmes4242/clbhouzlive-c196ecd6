import React, { useState } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { useSignedUrl } from '@/hooks/messaging/useSignedUrl';
import type { MessageAttachment } from '@/types/messaging';

interface Props {
  attachment: MessageAttachment;
  isOutgoing: boolean;
}

const MAX_W = 220;
const MAX_H = 280;
const RADIUS = 14;

export const MessageImage: React.FC<Props> = ({ attachment }) => {
  const hasLocal = !!attachment.localUrl;
  const { url: signedUrl, loading, error } = useSignedUrl(
    hasLocal ? null : attachment.path,
  );
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const src = attachment.localUrl ?? signedUrl;
  const uploading = attachment.uploadStatus === 'uploading';
  const failed = attachment.uploadStatus === 'failed';

  const w = attachment.w ?? undefined;
  const h = attachment.h ?? undefined;
  const aspectRatio = w && h ? `${w} / ${h}` : '16 / 11';

  const isError = (!hasLocal && (error || imgError)) || (hasLocal && imgError);

  return (
    <>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: MAX_W,
          maxHeight: MAX_H,
          aspectRatio,
          borderRadius: RADIUS,
          overflow: 'hidden',
          background: '#EDEFF2',
          cursor: src && !isError ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (src && !isError && !uploading && !failed) setExpanded(true);
        }}
      >
        {isError ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: '#8A9099',
              fontSize: 12,
              gap: 6,
            }}
          >
            <AlertCircle size={14} />
            Image unavailable
          </div>
        ) : src ? (
          <img
            src={src}
            alt=""
            onError={() => setImgError(true)}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: uploading ? 0.55 : 1,
            }}
          />
        ) : loading ? (
          <div
            className="animate-pulse"
            style={{ width: '100%', height: '100%', background: '#EDEFF2' }}
          />
        ) : null}

        {uploading ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            <Loader2
              size={22}
              className="animate-spin"
              style={{ color: '#FFFFFF' }}
            />
          </div>
        ) : null}

        {failed ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(220,38,38,0.35)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 500,
              gap: 6,
            }}
          >
            <AlertCircle size={14} />
            Failed
          </div>
        ) : null}
      </div>

      {expanded && src ? (
        <div
          role="dialog"
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
              right: 12,
              width: 40,
              height: 40,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <X size={20} />
          </button>
          <img
            src={src}
            alt=""
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              padding: 16,
            }}
          />
        </div>
      ) : null}
    </>
  );
};

export default MessageImage;
