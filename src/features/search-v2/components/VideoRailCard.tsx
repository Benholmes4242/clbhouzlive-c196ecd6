import { Play } from 'lucide-react';
import type { VideoHit } from '../lib/searchNavigation';
import { S } from '../lib/tokens';

interface Props { video: VideoHit; onSelect: () => void }

function fmtDuration(s?: number | null) {
  if (!s || s < 1) return null;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function VideoRailCard({ video, onSelect }: Props) {
  const dur = fmtDuration(video.duration_seconds);
  const caption = (video.content ?? '').split('\n')[0]?.trim() || 'Video';
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        flexShrink: 0,
        width: 138,
        background: 'transparent',
        border: 'none',
        padding: 0,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 138,
          height: 86,
          borderRadius: 12,
          overflow: 'hidden',
          background: S.TILE,
        }}
      >
        {video.poster_url && (
          <img
            src={video.poster_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        )}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Play size={14} color="#fff" fill="#fff" strokeWidth={0} />
          </div>
        </div>
        {dur && (
          <span
            style={{
              position: 'absolute',
              right: 6,
              bottom: 6,
              padding: '1px 5px',
              borderRadius: 4,
              // ACCENT, not a fault: ink OVER media. The badge sits on a
              // photographic thumbnail behind a black scrim.
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dur}
          </span>
        )}
      </div>
      <div style={{ padding: '6px 2px 0' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: S.INK,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {caption}
        </div>
      </div>
    </button>
  );
}
