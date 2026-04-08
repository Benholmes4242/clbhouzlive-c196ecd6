import { useState, useRef, useEffect } from 'react';
import { Search, Pause, Music2, VolumeX, X } from 'lucide-react';
import { StudioEdits } from '@/types/studio';
import { MUSIC_LIBRARY, MUSIC_MOODS, MusicTrack, getSignedAudioUrl } from '@/lib/musicLibrary';

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
  const [activeMood, setActiveMood] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>(edits?.music?.trackId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredTracks = MUSIC_LIBRARY.filter(track => {
    const matchesMood = activeMood === 'all' || track.mood === activeMood;
    const matchesSearch = !searchQuery || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMood && matchesSearch;
  });

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
      {/* Status row */}
      <div className="px-3 py-1.5 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedTrack ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F7931E' }} />
              <span className="text-[11px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.70)' }}>
                {MUSIC_LIBRARY.find(t => t.id === selectedTrack)?.title || 'Music enabled'}
              </span>
            </>
          ) : (
            <div
              className="flex items-center gap-1.5"
              style={{
                background: 'rgba(247,147,30,0.07)',
                border: '1px solid rgba(247,147,30,0.14)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <VolumeX className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(247,147,30,0.70)' }} />
              <span style={{ fontSize: 11, color: 'rgba(247,147,30,0.70)' }}>
                Mutes original audio
              </span>
            </div>
          )}
        </div>
        {selectedTrack && (
          <button
            onClick={handleRemoveTrack}
            className="flex items-center gap-1 text-sm px-2 py-0.5 rounded transition-colors flex-shrink-0"
            style={{ color: '#EF4444' }}
          >
            <X className="w-3 h-3" />
            Remove music
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors"
            style={{ color: searchFocused ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)' }}
          />
          <input
            type="text"
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '11px 14px 11px 36px',
              fontSize: 15,
              color: 'rgba(255,255,255,0.92)',
              caretColor: '#F7931E',
            }}
          />
        </div>
      </div>

      {/* Mood Tabs */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', scrollbarWidth: 'none' }}>
        {MUSIC_MOODS.map(mood => (
          <button
            key={mood.key}
            onClick={() => setActiveMood(mood.key)}
            className="whitespace-nowrap transition-colors"
            style={activeMood === mood.key ? {
              background: 'rgba(255,255,255,0.92)',
              color: '#0D0D0D',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid transparent',
            } : {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="flex-1 min-h-0 overflow-y-auto relative" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Music2 className="w-10 h-10 mb-2" style={{ color: 'rgba(255,255,255,0.45)' }} />
            <p className="text-[12px] text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
              No tracks found
            </p>
          </div>
        ) : (
          <div className="pb-6">
            {filteredTracks.map(track => {
              const isPlaying = previewingTrack === track.id;
              const isSelected = selectedTrack === track.id;
              
              return (
                <div
                  key={track.id}
                  className="px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: isPlaying
                      ? 'rgba(247,147,30,0.10)'
                      : isSelected
                        ? 'rgba(255,255,255,0.06)'
                        : undefined,
                    borderLeft: isPlaying
                      ? '2px solid rgba(247,147,30,0.50)'
                      : isSelected
                        ? '2px solid rgba(255,255,255,0.90)'
                        : '2px solid transparent',
                  }}
                  onClick={() => handleSelectTrack(track)}
                >
                  {/* Preview button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewToggle(track);
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 active:scale-90"
                    style={isPlaying ? {
                      background: 'rgba(247,147,30,0.15)',
                      border: '1px solid rgba(247,147,30,0.28)',
                    } : {
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {isPlaying ? (
                      <WaveformBars />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3.5 2L11.5 7L3.5 12V2Z" fill="rgba(255,255,255,0.90)" />
                      </svg>
                    )}
                  </button>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate leading-tight text-white">
                      {track.title}
                    </div>
                    <div className="text-[11px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {MOOD_DESCRIPTORS[track.mood] || track.mood}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-[11px] flex-shrink-0 font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {track.duration}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F7931E' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Bottom fade gradient */}
        <div className="sticky bottom-0 left-0 right-0 h-8 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.98), transparent)' }} />
      </div>
    </div>
  );
}
