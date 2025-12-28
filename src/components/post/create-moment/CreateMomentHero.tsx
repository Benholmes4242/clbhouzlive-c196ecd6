import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Images } from "lucide-react";
import { useRotatingPrompt, PromptContext } from "./CreateMomentPrompts";

interface CreateMomentHeroProps {
  hasMedia: boolean;
  isBusinessActor: boolean;
  isTyping: boolean;
  onPickFromCamera: () => void;
  onPickFromLibrary: () => void;
}

export default function CreateMomentHero({
  hasMedia,
  isBusinessActor,
  isTyping,
  onPickFromCamera,
  onPickFromLibrary,
}: CreateMomentHeroProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const context: PromptContext = isBusinessActor ? 'business' : hasMedia ? 'hasMedia' : 'empty';
  const { prompt } = useRotatingPrompt(context, 7000, !isTyping && !hasMedia);

  if (hasMedia) return null;

  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, []);

  return (
    <div 
      className="h-full w-full flex items-center justify-center pointer-events-none"
      style={{ background: 'var(--cm-surface-alt)' }}
    >
      <motion.div 
        className="text-center px-6 max-w-[520px] flex flex-col items-center pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <motion.div 
          className="p-8 rounded-2xl flex flex-col items-center cursor-pointer"
          style={{
            width: '360px',
            minWidth: '360px',
            background: 'var(--cm-surface-card)',
            border: '1px dashed var(--cm-border)',
          }}
          animate={{ scale: isPressed ? 0.98 : 1 }}
          transition={{ duration: 0.1 }}
          onTouchStart={() => { setIsPressed(true); triggerHaptic(); }}
          onTouchEnd={() => setIsPressed(false)}
          onMouseDown={() => { setIsPressed(true); triggerHaptic(); }}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
        >
          <Camera className="w-12 h-12 mb-3" strokeWidth={1.5} style={{ color: 'var(--cm-icon-primary)' }} />
          
          <h2 className="text-[16px] font-medium leading-snug" style={{ color: 'var(--cm-text-primary)' }}>
            Capture the moment
          </h2>
          
          <p className="text-sm mt-2 mb-6" style={{ color: 'var(--cm-text-secondary)' }}>
            From the tee, the green, or anywhere in between
          </p>
          
          <div className="flex items-center justify-center gap-3 z-10">
            <motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); triggerHaptic(); onPickFromCamera(); }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm"
              style={{
                background: 'var(--cm-surface-slate)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </motion.button>
            
            <motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPickFromLibrary(); }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-sm"
              style={{
                background: 'var(--cm-surface-alt)',
                border: '1px solid var(--cm-border)',
                color: 'var(--cm-text-primary)',
              }}
            >
              <Images className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              <span>Gallery</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}