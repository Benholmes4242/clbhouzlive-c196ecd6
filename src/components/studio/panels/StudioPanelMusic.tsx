import { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, Music2, VolumeX } from 'lucide-react';
import { StudioEdits } from '@/types/studio';
import { MUSIC_LIBRARY, MUSIC_MOODS, MusicTrack, getSignedAudioUrl } from '@/lib/musicLibrary';

type StudioPanelMusicProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
};

export default function StudioPanelMusic({ edits, updateEdits, onApply, onReset }: StudioPanelMusicProps) {
  const [activeMood, setActiveMood] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>(edits?.music?.trackId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter tracks by mood and search
  const filteredTracks = MUSIC_LIBRARY.filter(track => {
    const matchesMood = activeMood === 'all' || track.mood === activeMood;
    const matchesSearch = !searchQuery || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMood && matchesSearch;
  });

  // Cleanup audio on unmount
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
      // Stop preview
      audioRef.current?.pause();
      setPreviewingTrack(null);
      return;
    }

    // Start new preview
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Use signed Worker URL for playback (worker should 302 -> /api/audio/play)
    // Avoid fetch() here: it requires CORS, while the Audio element can follow redirects directly.
    const signedUrl = getSignedAudioUrl(track.r2Key);
    const audio = new Audio(signedUrl);
    audio.volume = 1; // Always 100% volume

    // Add error handling with detailed logging
    audio.onerror = (e) => {
      console.error('[StudioMusic] Audio load failed:', {
        trackId: track.id,
        r2Key: track.r2Key,
        signedUrl,
        currentSrc: audio.currentSrc,
        error: e,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message,
      });
      setPreviewingTrack(null);
    };

    audio.play()
      .then(() => {
        console.log('[StudioMusic] Playing:', {
          trackId: track.id,
          r2Key: track.r2Key,
          signedUrl,
          currentSrc: audio.currentSrc,
        });
      })
      .catch((err) => {
        console.error('[StudioMusic] Play failed:', {
          trackId: track.id,
          r2Key: track.r2Key,
          signedUrl,
          error: err?.message ?? String(err),
        });
        setPreviewingTrack(null);
      });

    audio.addEventListener('ended', () => setPreviewingTrack(null));
    audioRef.current = audio;
    setPreviewingTrack(track.id);
  };

  const handleSelectTrack = (track: MusicTrack) => {
    setSelectedTrack(track.id);
    // Stop any preview
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewingTrack(null);
    }
    // Store resolved public URL for direct playback (not r2Key)
    // Also set audioMode to music_only to mute original video audio
    const resolvedUrl = getSignedAudioUrl(track.r2Key);
    updateEdits({
      music: {
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        r2Key: track.r2Key,  // Keep for reference
        url: resolvedUrl,    // Primary playback URL
        startAt: 0,
        volume: 1  // Always 100% volume
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
    updateEdits({
      music: null,
      audioMode: 'original'
    });
  };


  return (
    <div className="flex flex-col h-full">
      {/* Compact mute notice + status row */}
      <div 
        className="px-3 py-1.5 flex items-center justify-between gap-2"
        style={{ borderBottom: '1px solid var(--cm-border-subtle)' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedTrack ? (
            <>
              <div 
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#22C55E' }}
              />
              <span className="text-[11px] font-medium truncate" style={{ color: '#22C55E' }}>
                {MUSIC_LIBRARY.find(t => t.id === selectedTrack)?.title || 'Music enabled'}
              </span>
            </>
          ) : (
            <>
              <VolumeX className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--cm-text-tertiary)', opacity: 0.7 }} />
              <span className="text-[10px]" style={{ color: 'var(--cm-text-tertiary)' }}>
                Mutes original audio
              </span>
            </>
          )}
        </div>
        {selectedTrack && (
          <button
            onClick={handleRemoveTrack}
            className="text-[10px] px-1.5 py-0.5 rounded transition-colors flex-shrink-0"
            style={{ 
              color: 'var(--cm-text-secondary)',
            }}
          >
            Remove
          </button>
        )}
      </div>

      {/* Search - tighter padding */}
      <div 
        className="px-3 py-2"
        style={{ borderBottom: '1px solid var(--cm-border-subtle)' }}
      >
        <div className="relative">
          <Search 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" 
            style={{ color: 'var(--cm-text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm focus:outline-none"
            style={{ 
              background: 'var(--cm-surface-alt)',
              border: '1px solid var(--cm-border-subtle)',
              color: 'var(--cm-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Mood Tabs - tighter */}
      <div 
        className="flex gap-1.5 px-3 py-2 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--cm-border-subtle)' }}
      >
        {MUSIC_MOODS.map(mood => (
          <button
            key={mood.key}
            onClick={() => setActiveMood(mood.key)}
            className="px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors"
            style={{
              background: activeMood === mood.key ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
              color: activeMood === mood.key ? 'white' : 'var(--cm-text-secondary)',
              border: activeMood === mood.key ? 'none' : '1px solid var(--cm-border-subtle)',
            }}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {/* Track list - denser rows */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Music2 
              className="w-10 h-10 mb-2" 
              style={{ color: 'var(--cm-text-tertiary)' }} 
            />
            <p 
              className="text-[12px] text-center"
              style={{ color: 'var(--cm-text-secondary)' }}
            >
              No tracks found
            </p>
          </div>
        ) : (
          filteredTracks.map(track => (
            <div
              key={track.id}
              className="px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer"
              style={{ 
                borderBottom: '1px solid var(--cm-border-subtle)',
                background: selectedTrack === track.id ? 'var(--cm-surface-alt)' : 'transparent',
              }}
              onClick={() => handleSelectTrack(track)}
            >
              {/* Preview button - smaller */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewToggle(track);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                style={{ 
                  background: previewingTrack === track.id ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                }}
              >
                {previewingTrack === track.id ? (
                  <Pause className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play 
                    className="w-3.5 h-3.5 ml-0.5" 
                    style={{ color: 'var(--cm-text-primary)' }}
                  />
                )}
              </button>

              {/* Track info - tighter */}
              <div className="flex-1 min-w-0">
                <div 
                  className="text-[13px] font-medium truncate leading-tight"
                  style={{ color: 'var(--cm-text-primary)' }}
                >
                  {track.title}
                </div>
                <div 
                  className="text-[11px] truncate leading-tight"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  {track.artist}
                </div>
              </div>

              {/* Duration */}
              <div 
                className="text-[11px] flex-shrink-0"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
                {track.duration}
              </div>

              {/* Selected indicator */}
              {selectedTrack === track.id && (
                <div 
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: '#22C55E' }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
