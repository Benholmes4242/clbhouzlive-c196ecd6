import { useState, useRef, useEffect } from 'react';
import { Music2, X } from 'lucide-react';
import { StudioEdits } from '@/types/studio';
import { MUSIC_LIBRARY, MusicTrack, getSignedAudioUrl } from '@/lib/musicLibrary';

type StudioPanelMusicProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
};

const MOOD_DESCRIPTORS: Record<string, string> = {
  ambient: 'Ambient · Slow',
  calm: 'Calm · Gentle',
  cinematic: 'Cinematic · Building',
  hype: 'Hype · Energetic',
  upbeat: 'Upbeat · Bright',
};

/* Animated waveform bars for playing state */
function WaveformBars() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
      {[0, 0.15, 0.3, 0.1].map((delay, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 14,
            borderRadius: 1.5,
            background: '#F7931E',
            animation: `wavebar 0.8s ease-in-out ${delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes wavebar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

export default function StudioPanelMusic({ edits, updateEdits, onApply, onReset }: StudioPanelMusicProps) {
  const [selectedTrack, setSelectedTrack] = useState<string>(edits?.music?.trackId || '');
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredTracks = MUSIC_LIBRARY;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePreviewToggle = (track: MusicTrack) => {
    if (previewingTrack === track.id) {
      audioRef.current?.pause();
      setPreviewingTrack(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();

    const signedUrl = getSignedAudioUrl(track.r2Key);
    const audio = new Audio(signedUrl);
    audio.volume = 1;
    audio.onerror = () => setPreviewingTrack(null);
    audio.play().catch(() => setPreviewingTrack(null));
    audio.addEventListener('ended', () => setPreviewingTrack(null));
    audioRef.current = audio;
    setPreviewingTrack(track.id);
  };

  const handleSelectTrack = (track: MusicTrack) => {
    setSelectedTrack(track.id);
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewingTrack(null);
    }
    const resolvedUrl = getSignedAudioUrl(track.r2Key);
    updateEdits({
      music: {
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        r2Key: track.r2Key,
        url: resolvedUrl,
        startAt: 0,
        volume: 1
      },
      audioMode: 'music_only'
    });
  };

  const handleRemoveTrack = () => {
    setSelectedTrack('');
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewingTrack(null);
    }
    updateEdits({ music: null, audioMode: 'original' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Selected track status + remove */}
      {selectedTrack && (
        <div className="px-4 py-2 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F7931E' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.70)' }} className="truncate">
              {MUSIC_LIBRARY.find(t => t.id === selectedTrack)?.title || 'Music enabled'}
            </span>
          </div>
          <button
            onClick={handleRemoveTrack}
            className="flex items-center gap-1 px-2 py-0.5 rounded transition-colors flex-shrink-0"
            style={{ fontSize: 11, color: '#EF4444' }}
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        </div>
      )}

      {/* Track list */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Music2 className="w-8 h-8 mb-2" style={{ color: 'rgba(255,255,255,0.20)' }} />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>
              No tracks found
            </p>
          </div>
        ) : (
          <div className="px-4 pt-1 pb-6">
            {/* Section label */}
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.28)', padding: '8px 0 6px' }}>
              ADD MUSIC
            </p>

            <div className="flex flex-col gap-2">
              {filteredTracks.map((track) => {
                const isPlaying = previewingTrack === track.id;
                const isSelected = selectedTrack === track.id;

                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 cursor-pointer"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: isPlaying
                        ? 'rgba(247,147,30,0.08)'
                        : isSelected
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(255,255,255,0.04)',
                      border: isPlaying
                        ? '1px solid rgba(247,147,30,0.18)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                    onClick={() => handleSelectTrack(track)}
                  >
                    {/* Play button — squircle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewToggle(track);
                      }}
                      className="flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isPlaying ? 'rgba(247,147,30,0.15)' : 'rgba(255,255,255,0.06)',
                        border: isPlaying ? '1px solid rgba(247,147,30,0.28)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {isPlaying ? (
                        <WaveformBars />
                      ) : (
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ marginLeft: 2 }}>
                          <path d="M1 1.5L10.5 7L1 12.5V1.5Z" fill="rgba(255,255,255,0.55)" />
                        </svg>
                      )}
                    </button>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate leading-tight" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>
                        {track.title}
                      </div>
                      <div className="truncate leading-tight" style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>
                        {MOOD_DESCRIPTORS[track.mood] || track.mood} · {track.duration}
                      </div>
                    </div>

                    {/* Selected dot */}
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F7931E' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
