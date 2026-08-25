import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { useSignedUrl } from '@/hooks/messaging/useSignedUrl';
import type { MessageAttachment } from '@/types/messaging';
import { FIGURE } from '@/lib/tokens/type';

interface Props {
  attachment: MessageAttachment;
  isOutgoing: boolean;
}

const BAR_COUNT = 24;

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const VoiceNote: React.FC<Props> = ({ attachment, isOutgoing }) => {
  const { t } = useTranslation('messaging');
  const hasLocal = !!attachment.localUrl;
  const { url: signedUrl, error } = useSignedUrl(
    hasLocal ? null : attachment.path,
  );
  const src = attachment.localUrl ?? signedUrl;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(attachment.duration ?? 0);

  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, (_, i) => 0.35 + ((i * 37) % 65) / 100),
    [],
  );

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => {
      if (a.duration && isFinite(a.duration)) setDuration(a.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !src) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const fg = isOutgoing ? '#F5F6F7' : '#1F2428';
  const trackDim = isOutgoing ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)';
  const timeColor = isOutgoing ? 'rgba(245,246,247,0.7)' : '#8A9099';

  const progress = duration > 0 ? current / duration : 0;
  const activeIdx = Math.floor(progress * BAR_COUNT);

  if (error && !src) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: timeColor,
          fontSize: 12,
        }}
      >
        <AlertCircle size={14} />
        {t('error.voiceUnavailable')}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: 200,
      }}
    >
      {src ? <audio ref={audioRef} src={src} preload="metadata" /> : null}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t('action.pause') : t('action.play')}
        disabled={!src}
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: `1px solid ${trackDim}`,
          color: fg,
          cursor: src ? 'pointer' : 'default',
          padding: 0,
        }}
      >
        {playing ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" style={{ marginLeft: 1 }} />
        )}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            height: 20,
          }}
        >
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                width: 2,
                height: `${h * 100}%`,
                borderRadius: 1,
                background: i < activeIdx ? fg : trackDim,
              }}
            />
          ))}
        </div>
        <div
          style={{
            ...FIGURE,
            // READ 11: a duration readout, not a waveform tick.
            fontSize: 11,
            color: timeColor,
          }}
        >
          {formatTime(playing || current > 0 ? current : duration)}
        </div>
      </div>
    </div>
  );
};

export default VoiceNote;
