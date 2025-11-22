import { useState } from 'react';
import { Search, TrendingUp, Mic, Bookmark } from 'lucide-react';
import { StudioEdits } from '@/types/studio';

type StudioPanelMusicProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
};

const MOCK_TRACKS = [
  { id: '1', title: 'Summer Vibes', artist: 'Artist One', duration: '3:24', url: '/audio/track1.mp3' },
  { id: '2', title: 'Chill Beat', artist: 'Artist Two', duration: '2:45', url: '/audio/track2.mp3' },
  { id: '3', title: 'Uplifting', artist: 'Artist Three', duration: '4:12', url: '/audio/track3.mp3' },
];

export default function StudioPanelMusic({ edits, updateEdits, onApply, onReset }: StudioPanelMusicProps) {
  const [activeTab, setActiveTab] = useState<'foryou' | 'trending' | 'original' | 'saved'>('foryou');
  const [selectedTrack, setSelectedTrack] = useState(edits?.music?.trackId || '');
  const [volume, setVolume] = useState((edits?.music?.volume ?? 0.9) * 100);

  const handleSelectTrack = (track: typeof MOCK_TRACKS[0]) => {
    setSelectedTrack(track.id);
    updateEdits({
      music: {
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        startAt: 0,
        volume: volume / 100
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-zinc-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search music..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-[rgba(255,156,64,0.5)]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-zinc-200 overflow-x-auto">
        {[
          { key: 'foryou', label: 'For you', icon: null },
          { key: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
          { key: 'original', label: 'Original', icon: <Mic className="w-4 h-4" /> },
          { key: 'saved', label: 'Saved', icon: <Bookmark className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {MOCK_TRACKS.map(track => (
          <button
            key={track.id}
            onClick={() => handleSelectTrack(track)}
            className={`w-full px-4 py-3 flex items-center justify-between border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
              selectedTrack === track.id ? 'bg-zinc-50' : ''
            }`}
          >
            <div className="flex-1 text-left">
              <div className="font-medium text-zinc-900">{track.title}</div>
              <div className="text-sm text-zinc-500">{track.artist}</div>
            </div>
            <div className="text-sm text-zinc-400">{track.duration}</div>
          </button>
        ))}
      </div>

      {/* Controls */}
      {selectedTrack && (
        <div className="p-4 border-t border-zinc-200 bg-white space-y-3">
          <div>
            <label className="block text-body-sm font-medium text-zinc-700 mb-2">Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setVolume(v);
                if (edits?.music) {
                  updateEdits({ music: { ...edits.music, volume: v / 100 } });
                }
              }}
              className="w-full"
            />
            <div className="text-xs text-zinc-500 mt-1">{volume}%</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-zinc-200 flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          disabled={!selectedTrack}
          className="flex-1 py-2.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
