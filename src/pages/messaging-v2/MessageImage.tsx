import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import { useSignedUrl } from '@/hooks/messaging/useSignedUrl';
import { Skeleton } from '@/components/ui/skeleton';
import type { MessageAttachment } from '@/types/messaging';
import { CHIP_GLASS_BG } from '@/styles/photoScrim';

interface Props {
  attachment: MessageAttachment;
  isOutgoing: boolean;
  /** Fires when the user taps the image. Parent opens the shared viewer. */
  onOpen?: (resolvedUrl: string) => void;
}

const MAX_W = 240;
const MAX_H = 320;
const RADIUS = 14;

export const MessageImage: React.FC<Props> = ({ attachment, onOpen }) => {
  const { t } = useTranslation('messaging');
  const hasLocal = !!attachment.localUrl;
  const { url: signedUrl, loading, error } = useSignedUrl(
    hasLocal ? null : attachment.path,
  );
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const src = attachment.localUrl ?? signedUrl;
  const uploading = attachment.uploadStatus === 'uploading';
  const failed = attachment.uploadStatus === 'failed';

  // Aspect ratio is used ONLY while the image hasn't loaded yet — so the
  // shimmer has a sensible box. Once loaded, we clear it and let the image
  // define its own height (no letterboxing).
  const w = attachment.w ?? undefined;
  const h = attachment.h ?? undefined;
  const placeholderAspect = w && h ? `${w} / ${h}` : '4 / 3';

  const isError = (!hasLocal && (error || imgError)) || (hasLocal && imgError);
  const showPlaceholder = !imgLoaded && !isError;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: MAX_W,
        maxHeight: MAX_H,
        borderRadius: RADIUS,
        overflow: 'hidden',
        // Transparent — no dark frame around loaded media.
        background: 'transparent',
        // Reserve space with a neutral shimmer only while loading.
        aspectRatio: showPlaceholder ? placeholderAspect : undefined,
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
          onLoad={() => setImgLoaded(true)}
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            maxHeight: MAX_H,
            objectFit: 'contain',
            borderRadius: RADIUS,
            opacity: uploading ? 0.55 : 1,
          }}
        />
      ) : loading ? (
        <Skeleton className="rounded-none" style={{ width: '100%', height: '100%' }} />
      ) : null}

      {showPlaceholder && src ? (
        <Skeleton
          className="rounded-none"
          style={{ position: 'absolute', inset: 0 }}
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
            background: CHIP_GLASS_BG,
            borderRadius: RADIUS,
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
            borderRadius: RADIUS,
          }}
        >
          <AlertCircle size={14} />
          {t('error.imageFailed')}
        </div>
      ) : null}
    </div>
  );
};

export default MessageImage;
