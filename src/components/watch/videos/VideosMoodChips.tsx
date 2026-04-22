import { memo } from 'react';
import { VIDEOS_MOODS, type VideosMoodId } from './hooks/useVideosMood';

interface VideosMoodChipsProps {
  active: VideosMoodId;
  onChange: (id: VideosMoodId) => void;
}

/**
 * Pro Shop chip strip for the Videos subpage. Same visual treatment as the
 * Clips chips (solid #0F172A active, white inactive, cream surface) so the
 * three Pro Shop surfaces feel like one system. Right-edge fade signals
 * horizontal overflow when the row exceeds viewport width.
 */
function VideosMoodChipsInner({ active, onChange }: VideosMoodChipsProps) {
  return (
    <div
      className="relative"
      style={{
        background: '#F8FAFC',
        borderBottom: '0.5px solid rgba(15,23,42,0.06)',
      }}
    >
      <div
        role="tablist"
        aria-label="Filter Videos by mood"
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ paddingRight: 32 }}
      >
        {VIDEOS_MOODS.map((m) => {
          const isActive = active === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(m.id)}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center gap-1.5"
              style={{
                height: 36,
                padding: '0 14px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 999,
                background: isActive ? '#0F172A' : '#FFFFFF',
                border: isActive ? '1px solid transparent' : '1px solid rgba(15,23,42,0.12)',
                color: isActive ? '#FFFFFF' : '#0F172A',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              <span aria-hidden style={{ fontSize: 13 }}>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right-edge fade to cream */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full"
        style={{
          width: 40,
          background: 'linear-gradient(to right, rgba(248,250,252,0) 0%, #F8FAFC 100%)',
        }}
      />
    </div>
  );
}

export const VideosMoodChips = memo(VideosMoodChipsInner);
export default VideosMoodChips;
