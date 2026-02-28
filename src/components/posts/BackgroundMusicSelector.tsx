import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

interface MusicTrack {
  id: string;
  name: string;
  duration: number;
  previewUrl: string;
  fullUrl: string;
  genre: string;
  mood: string;
}

interface BackgroundMusicSelectorProps {
  onMusicSelect: (music: {
    track: string;
    audioUrl: string;
    replaceOriginalAudio: boolean;
  } | null) => void;
  disabled?: boolean;
  hasVideo?: boolean; // Show replace audio toggle only for videos
}

const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'none',
    name: 'None',
    duration: 0,
    previewUrl: '',
    fullUrl: '',
    genre: '',
    mood: ''
  }
  // TODO: Add actual music tracks when audio files are available
  // Example format:
  // {
  //   id: 'track-id',
  //   name: 'Track Name',
  //   duration: 120,
  //   previewUrl: '/music/previews/track-preview.mp3',
  //   fullUrl: '/music/tracks/track.mp3',
  //   genre: 'genre',
  //   mood: 'mood'
  // }
];

const BackgroundMusicSelector: React.FC<BackgroundMusicSelectorProps> = ({
  onMusicSelect,
  disabled = false,
  hasVideo = false
}) => {
  
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack>(MUSIC_TRACKS[0]);
  const [replaceOriginalAudio, setReplaceOriginalAudio] = useState(true);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Initialize audio elements only for tracks with valid preview URLs
  useEffect(() => {
    // Clear any existing audio refs first
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    audioRefs.current = {};

    // Only create audio elements for tracks that have preview URLs
    MUSIC_TRACKS.forEach(track => {
      if (track.previewUrl && track.previewUrl.trim() !== '' && !audioRefs.current[track.id]) {
        try {
          const audio = new Audio(track.previewUrl);
          audio.volume = 0.7;
          audio.loop = true;
          audioRefs.current[track.id] = audio;
        } catch (error) {
          console.warn(`Failed to create audio element for ${track.name}:`, error);
        }
      }
    });

    return () => {
      // Cleanup audio elements
      Object.values(audioRefs.current).forEach(audio => {
        try {
          audio.pause();
          audio.src = '';
        } catch (error) {
          console.warn('Error cleaning up audio:', error);
        }
      });
      audioRefs.current = {};
    };
  }, []);

  // Handle track selection
  const handleTrackSelect = (track: MusicTrack) => {
    setSelectedTrack(track);
    
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(null);
      setCurrentAudio(null);
    }

    // Notify parent component
    if (track.id === 'none') {
      onMusicSelect(null);
    } else {
      onMusicSelect({
        track: track.name,
        audioUrl: track.fullUrl,
        replaceOriginalAudio
      });
    }
  };

  // Handle audio preview
  const handlePlayPreview = async (track: MusicTrack, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!track.previewUrl) return;

    const audio = audioRefs.current[track.id];
    if (!audio) return;

    try {
      if (isPlaying === track.id) {
        // Stop current track
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(null);
        setCurrentAudio(null);
      } else {
        // Stop any other playing track
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }

        // PLAYBACK_AUTHORITY_ALLOWED (audio UI control - not video autoplay)
        // Play new track - audio preview is exempt from video runtime
        await audio.play();
        setCurrentAudio(audio);

        // Auto-stop after 5 seconds for preview
        setTimeout(() => {
          if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(null);
            setCurrentAudio(null);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      toast.error("Unable to play preview for this track");
    }
  };

  // Handle replace audio toggle
  const handleReplaceAudioChange = (checked: boolean) => {
    setReplaceOriginalAudio(checked);
    
    // Update parent if a track is selected
    if (selectedTrack.id !== 'none') {
      onMusicSelect({
        track: selectedTrack.name,
        audioUrl: selectedTrack.fullUrl,
        replaceOriginalAudio: checked
      });
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-gray-100">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-700">
            Background Music
            <span className="text-gray-400 text-xs ml-1">(Optional)</span>
          </h3>
        </div>

        {/* Music Track Selector */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
            {MUSIC_TRACKS.map((track) => (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedTrack.id === track.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* Selection indicator */}
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedTrack.id === track.id 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedTrack.id === track.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>

                  {/* Track info */}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{track.name}</p>
                    {track.id !== 'none' && (
                      <p className="text-xs text-gray-500">
                        {track.mood} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview button */}
                {track.previewUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handlePlayPreview(track, e)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    {isPlaying === track.id ? (
                      <Pause className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Play className="h-4 w-4 text-blue-600" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Audio Control Toggle - Only show for videos */}
          {hasVideo && selectedTrack.id !== 'none' && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {replaceOriginalAudio ? (
                  <VolumeX className="h-4 w-4 text-gray-600" />
                ) : (
                  <Volume2 className="h-4 w-4 text-gray-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Replace original audio</p>
                  <p className="text-xs text-gray-600">
                    {replaceOriginalAudio 
                      ? 'Music will replace video audio' 
                      : 'Music will mix with video audio'
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={replaceOriginalAudio}
                onCheckedChange={handleReplaceAudioChange}
                disabled={disabled}
              />
            </div>
          )}

          {/* Helper text */}
          {selectedTrack.id !== 'none' && (
            <p className="text-xs text-gray-500">
              🎵 {selectedTrack.name} will be added to your post
              {hasVideo && ' • Music will fade out in the last 1.5 seconds'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundMusicSelector;