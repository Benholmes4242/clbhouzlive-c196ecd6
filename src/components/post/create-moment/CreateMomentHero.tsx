import { motion, AnimatePresence } from "framer-motion";
import { Camera, Images, Sparkles } from "lucide-react";
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
  // Determine prompt context
  const context: PromptContext = isBusinessActor ? 'business' : hasMedia ? 'hasMedia' : 'empty';
  
  // Rotate prompts when not typing and modal is open
  const { prompt } = useRotatingPrompt(context, 7000, !isTyping && !hasMedia);

  // Don't render hero if we have media - the media stage takes over
  if (hasMedia) {
    return null;
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-transparent pointer-events-none">
      <motion.div 
        className="text-center px-6 max-w-[520px] flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Camera Icon */}
        <Camera 
          className="w-16 h-16 mb-4 opacity-80" 
          strokeWidth={1.5}
          aria-hidden="true"
          style={{ color: 'white' }}
        />
        
        {/* Smart rotating prompt */}
        <AnimatePresence mode="wait">
          <motion.h2 
            key={prompt}
            className="text-white/90 text-[18px] font-medium leading-snug max-w-[520px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {prompt}
          </motion.h2>
        </AnimatePresence>
        
        {/* Spacer */}
        <div className="h-5" />
        
        {/* CTA Buttons - Camera primary, Gallery secondary */}
        <div className="pointer-events-auto flex items-center justify-center gap-3 sm:gap-4 z-10">
          {/* Primary: Camera */}
          <button
            type="button"
            onClick={onPickFromCamera}
            aria-label="Open Camera"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-white/30 font-semibold transition-transform"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              color: 'rgba(15, 15, 15, 0.9)',
            }}
          >
            <Camera className="w-5 h-5" />
            <span>Camera</span>
          </button>
          
          {/* Secondary: Gallery */}
          <button
            type="button"
            onClick={onPickFromLibrary}
            aria-label="Choose from Gallery"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-white/30 font-medium transition-transform"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px) saturate(150%)',
              WebkitBackdropFilter: 'blur(12px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: 'rgba(255, 255, 255, 0.96)'
            }}
          >
            <Images className="w-5 h-5" />
            <span>Gallery</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
