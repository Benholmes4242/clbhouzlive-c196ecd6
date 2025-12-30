import { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, Music2, Volume2 } from 'lucide-react';
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
  const [volume, setVolume] = useState((edits?.music?.volume ?? 0.8) * 100);
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
    audio.volume = volume / 100;

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
    // Store r2Key instead of url - SoundtrackStrip will resolve the signed URL
    updateEdits({
      music: {
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        r2Key: track.r2Key,
        startAt: 0,
        volume: volume / 100
      }
    });
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v / 100;
    }
    if (edits?.music) {
      updateEdits({ music: { ...edits.music, volume: v / 100 } });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div 
        className="p-4"
        style={{ borderBottom: '1px solid var(--cm-border-subtle)' }}
      >
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: 'var(--cm-text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
            style={{ 
              background: 'var(--cm-surface-alt)',
              border: '1px solid var(--cm-border-subtle)',
              color: 'var(--cm-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Mood Tabs */}
      <div 
        className="flex gap-2 px-4 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--cm-border-subtle)' }}
      >
        {MUSIC_MOODS.map(mood => (
          <button
            key={mood.key}
            onClick={() => setActiveMood(mood.key)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
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

      {/* Track list - scrollable with min-h-0 */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Music2 
              className="w-12 h-12 mb-3" 
              style={{ color: 'var(--cm-text-tertiary)' }} 
            />
            <p 
              className="text-sm text-center"
              style={{ color: 'var(--cm-text-secondary)' }}
            >
              No tracks found
            </p>
          </div>
        ) : (
          filteredTracks.map(track => (
            <div
              key={track.id}
              className="px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer"
              style={{ 
                borderBottom: '1px solid var(--cm-border-subtle)',
                background: selectedTrack === track.id ? 'var(--cm-surface-alt)' : 'transparent',
              }}
              onClick={() => handleSelectTrack(track)}
            >
              {/* Preview button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewToggle(track);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                style={{ 
                  background: previewingTrack === track.id ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                }}
              >
                {previewingTrack === track.id ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play 
                    className="w-4 h-4 ml-0.5" 
                    style={{ color: 'var(--cm-text-primary)' }}
                  />
                )}
              </button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <div 
                  className="font-medium truncate"
                  style={{ color: 'var(--cm-text-primary)' }}
                >
                  {track.title}
                </div>
                <div 
                  className="text-sm truncate"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  {track.artist} • {track.mood}
                </div>
              </div>

              {/* Duration */}
              <div 
                className="text-sm flex-shrink-0"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
                {track.duration}
              </div>

              {/* Selected indicator */}
              {selectedTrack === track.id && (
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: 'var(--cm-surface-slate)' }}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Volume control when track selected */}
      {selectedTrack && (
        <div 
          className="p-4 space-y-3"
          style={{ 
            borderTop: '1px solid var(--cm-border-subtle)',
            background: 'var(--cm-surface-card)',
          }}
        >
          <div className="flex items-center gap-3">
            <Volume2 
              className="w-4 h-4 flex-shrink-0" 
              style={{ color: 'var(--cm-text-secondary)' }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="flex-1"
              style={{ accentColor: 'var(--cm-surface-slate)' }}
            />
            <span 
              className="text-xs w-8 text-right"
              style={{ color: 'var(--cm-text-tertiary)' }}
            >
              {volume}%
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div 
        className="p-4 flex gap-3"
        style={{ borderTop: '1px solid var(--cm-border-subtle)' }}
      >
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-xl font-medium transition-colors"
          style={{ 
            background: 'var(--cm-surface-alt)',
            border: '1px solid var(--cm-border-subtle)',
            color: 'var(--cm-text-primary)',
          }}
        >
          Reset
        </button>
        <button
          onClick={onApply}
          disabled={!selectedTrack}
          className="flex-1 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            background: 'var(--cm-surface-slate)',
            color: 'white',
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
