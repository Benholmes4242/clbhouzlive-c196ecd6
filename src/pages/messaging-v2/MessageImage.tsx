import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import { useSignedUrl } from '@/hooks/messaging/useSignedUrl';
import type { MessageAttachment } from '@/types/messaging';

interface Props {
  attachment: MessageAttachment;
  isOutgoing: boolean;
  /** Fires when the user taps the image. Parent opens the shared viewer. */
  onOpen?: (resolvedUrl: string) => void;
}

const MAX_W = 220;
const MAX_H = 280;
const RADIUS = 14;

export const MessageImage: React.FC<Props> = ({ attachment, onOpen }) => {
  const { t } = useTranslation('messaging');
  const hasLocal = !!attachment.localUrl;
  const { url: signedUrl, loading, error } = useSignedUrl(
    hasLocal ? null : attachment.path,
  );
  const [imgError, setImgError] = useState(false);

  const src = attachment.localUrl ?? signedUrl;
  const uploading = attachment.uploadStatus === 'uploading';
  const failed = attachment.uploadStatus === 'failed';

  const w = attachment.w ?? undefined;
  const h = attachment.h ?? undefined;
  const aspectRatio = w && h ? `${w} / ${h}` : '16 / 11';

  const isError = (!hasLocal && (error || imgError)) || (hasLocal && imgError);

  return (
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
        if (src && !isError && !uploading && !failed) onOpen?.(src);
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
          {t('error.imageUnavailable')}
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
          <Loader2 size={22} className="animate-spin" style={{ color: '#FFFFFF' }} />
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
  );
};

export default MessageImage;
