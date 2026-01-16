import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Images } from "lucide-react";
import { triggerHaptic } from "@/lib/ui/haptics";

interface CreateMomentHeroProps {
  hasMedia: boolean;
  isBusinessActor: boolean;
  isTyping: boolean;
  onPickFromCamera: () => void;
  onPickFromLibrary: () => void;
}

export default function CreateMomentHero({
  hasMedia,
  onPickFromCamera,
  onPickFromLibrary,
}: CreateMomentHeroProps) {
  const [isPressed, setIsPressed] = useState(false);

  if (hasMedia) return null;

  const handlePressStart = useCallback(() => {
    setIsPressed(true);
    triggerHaptic('selection');
  }, []);

  const handlePressEnd = useCallback(() => {
    setIsPressed(false);
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
        {/* Hero card with actual scale transform on press */}
        <motion.div 
          className="px-6 py-6 rounded-3xl flex flex-col items-center cursor-pointer"
          style={{
            width: '340px',
            minWidth: '340px',
            background: 'linear-gradient(180deg, var(--cm-surface-card) 0%, rgba(248, 250, 252, 0.95) 100%)',
            border: '1px dashed var(--cm-border)',
          }}
          animate={{ 
            scale: isPressed ? 0.98 : 1,
          }}
          transition={{ 
            duration: 0.12, 
            ease: "easeOut" 
          }}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
        >
          <Camera className="w-10 h-10 mb-2.5" strokeWidth={1.5} style={{ color: 'var(--cm-icon-primary)' }} />
          
          <h2 className="text-[15px] font-medium leading-snug" style={{ color: 'var(--cm-text-primary)' }}>
            Capture the moment
          </h2>
          
          <p className="text-[13px] mt-1.5 mb-5" style={{ color: 'var(--cm-text-secondary)', opacity: 0.75 }}>
            From the tee, the green, or anywhere in between
          </p>
          
          <div className="flex items-center justify-center gap-3 z-10">
            <motion.button
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHaptic('selection'); 
                onPickFromCamera(); 
              }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm"
              style={{
                background: '#e2e8f0',
                color: 'var(--cm-text-primary)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </motion.button>
            
            <motion.button
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHaptic('light');
                onPickFromLibrary(); 
              }}
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
