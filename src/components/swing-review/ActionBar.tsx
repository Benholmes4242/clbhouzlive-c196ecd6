import React from 'react';
import { Share2, Plus } from 'lucide-react';

interface ActionBarProps {
  onShare?: () => void;
  onAddVoiceNote?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  onShare,
  onAddVoiceNote
}) => {
  return (
    <div className="rounded-2xl bg-white/95 border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex items-center gap-2">
        {onShare && (
          <button
            onClick={onShare}
            className="flex-1 h-9 rounded-full border border-black/10 bg-white text-[14px] text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
          >
            <Share2 className="h-4 w-4" />
            Share My Swing
          </button>
        )}
        
        {onAddVoiceNote && (
          <button
            onClick={onAddVoiceNote}
            className="flex-1 h-9 rounded-full bg-[#2A9D8F] border border-[#2A9D8F] text-white text-[14px] shadow-md hover:brightness-105 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Voice Note
          </button>
        )}
      </div>
    </div>
  );
};