/**
 * EmojiPickerPopover - Simple emoji picker with categories and recent emojis
 */

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EMOJI_CATEGORIES = {
  recent: { label: 'Recent', icon: '🕐' },
  smileys: { label: 'Smileys', icon: '😀' },
  people: { label: 'People', icon: '👋' },
  nature: { label: 'Nature', icon: '🌿' },
  food: { label: 'Food', icon: '🍔' },
  activities: { label: 'Activities', icon: '⚽' },
  objects: { label: 'Objects', icon: '💡' },
  golf: { label: 'Golf', icon: '⛳' },
};

const EMOJIS = {
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '👀', '👁️', '👅', '👄'],
  nature: ['🌿', '🍀', '🌱', '🌲', '🌳', '🌴', '🌵', '🌷', '🌸', '🌹', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☂️', '⛱️', '⚡', '🔥', '💧', '🌊', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
  food: ['🍔', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍞', '🥐', '🥖', '🥨', '🧀', '🥓', '🥩', '🍗', '🍖', '🦴', '🌽', '🥕', '🥔', '🍠', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎖️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎪'],
  objects: ['💡', '🔦', '🏮', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎬', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💰', '💴', '💵', '💶', '💷', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🗿'],
  golf: ['⛳', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏆', '🥇', '🎯', '🔥', '💪', '👏', '🙌', '👊', '✨', '🌟', '⭐', '🎉', '🥂', '🍻', '🍾', '🎊'],
};

const RECENT_KEY = 'emoji-picker-recent';
const MAX_RECENT = 8;

function getRecentEmojis(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addToRecent(emoji: string): void {
  try {
    const recent = getRecentEmojis().filter(e => e !== emoji);
    recent.unshift(emoji);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // Ignore storage errors
  }
}

export function EmojiPickerPopover({ onEmojiSelect, className }: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setRecentEmojis(getRecentEmojis());
    }
  }, [open]);

  const handleSelect = (emoji: string) => {
    haptic('light');
    addToRecent(emoji);
    onEmojiSelect(emoji);
    setOpen(false);
  };

  const currentEmojis = activeCategory === 'recent'
    ? recentEmojis
    : EMOJIS[activeCategory as keyof typeof EMOJIS] || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            className
          )}
          style={{ background: 'transparent' }}
        >
          <Smile className="w-5 h-5" style={{ color: '#8E8E93' }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 p-0 rounded-2xl shadow-lg"
        style={{ border: '1px solid rgba(247,147,30,0.20)' }}
        sideOffset={8}
      >
        {/* Category tabs */}
        <div
          className="flex items-center gap-1 p-2 rounded-t-2xl overflow-x-auto"
          style={{ borderBottom: '1px solid rgba(247,147,30,0.20)', background: 'rgba(247,147,30,0.04)' }}
        >
          {Object.entries(EMOJI_CATEGORIES).map(([key, { icon }]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as keyof typeof EMOJI_CATEGORIES)}
              className="w-8 h-8 flex items-center justify-center text-lg rounded-lg flex-shrink-0 transition-colors"
              style={
                activeCategory === key
                  ? { background: '#F7931E', color: '#fff' }
                  : { background: 'transparent' }
              }
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="p-2 max-h-48 overflow-y-auto">
          {activeCategory === 'recent' && recentEmojis.length === 0 ? (
            <p className="text-center text-sm py-6" style={{ color: '#8E8E93' }}>
              No recent emojis
            </p>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {currentEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  onClick={() => handleSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-xl rounded-lg active:scale-90 transition-transform"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(247,147,30,0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
