/**
 * RichCommentToolbar — Toolbar above keyboard with contextual comment actions:
 * Tag Course, Tag Hole, etc.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichCommentToolbarProps {
  isDark: boolean;
  isVisible: boolean;
  onInsertText: (text: string) => void;
}

const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

export const RichCommentToolbar: React.FC<RichCommentToolbarProps> = ({
  isDark,
  isVisible,
  onInsertText,
}) => {
  const [showHolePicker, setShowHolePicker] = useState(false);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: showHolePicker ? 'auto' : 40 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "flex-shrink-0 overflow-hidden",
          isDark ? "border-t border-white/5" : "border-t border-border/20"
        )}
      >
        {!showHolePicker ? (
          <div className="flex items-center gap-1 px-4 py-1.5 overflow-x-auto scrollbar-hide">
            {[
              { icon: Flag, label: 'Tag Course', action: () => onInsertText('⛳ ') },
              { icon: Hash, label: 'Tag Hole', action: () => setShowHolePicker(true) },
            ].map((item) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.93 }}
                onClick={item.action}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors",
                  isDark
                    ? "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white/80"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                "text-[12px] font-medium",
                isDark ? "text-white/50" : "text-muted-foreground"
              )}>
                Select hole
              </span>
              <button
                onClick={() => setShowHolePicker(false)}
                className={cn(
                  "text-[12px] font-medium px-2 py-1 rounded",
                  isDark ? "text-white/40 hover:text-white/60" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-9 gap-1">
              {HOLES.map(hole => (
                <motion.button
                  key={hole}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onInsertText(`Hole ${hole} 🕳️ `);
                    setShowHolePicker(false);
                  }}
                  className={cn(
                    "w-8 h-8 rounded-lg text-[13px] font-medium transition-colors",
                    isDark
                      ? "bg-white/8 text-white/70 hover:bg-white/15"
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  )}
                >
                  {hole}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
