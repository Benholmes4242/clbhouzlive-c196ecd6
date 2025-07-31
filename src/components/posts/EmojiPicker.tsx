import React from 'react';
import { X } from 'lucide-react';

interface EmojiPickerProps {
  isVisible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const popularEmojis = [
  '😂', '❤️', '🔥', '👏', '😍', '🎉', '💪', '👌',
  '🙌', '✨', '💯', '🏌️', '⛳', '🏆', '🥇', '🎯',
  '👍', '😎', '🤩', '😊', '🤘', '💥', '⚡', '🌟',
  '🙏', '💚', '🎊', '🥳', '😤', '💎', '🔴', '⭐'
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isVisible,
  onSelect,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Emoji Picker */}
      <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 w-72">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Add Emoji</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <div className="grid grid-cols-8 gap-2">
          {popularEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            More emojis coming soon!
          </p>
        </div>
      </div>
    </>
  );
};

export default EmojiPicker;