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
  // Determine prompt context
  const context: PromptContext = isBusinessActor ? 'business' : hasMedia ? 'hasMedia' : 'empty';
  
  // Rotate prompts when not typing and modal is open
  const { prompt } = useRotatingPrompt(context, 7000, !isTyping && !hasMedia);

  // Don't render hero if we have media - the media stage takes over
  if (hasMedia) {
    return null;
  }

  return (
    <div 
      className="h-full w-full flex items-center justify-center pointer-events-none"
      style={{ background: 'var(--cm-surface-alt)' }}
    >
      <motion.div 
        className="text-center px-6 max-w-[520px] flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Drop zone container */}
        <div 
          className="w-full p-8 rounded-2xl flex flex-col items-center"
          style={{
            background: 'var(--cm-surface-card)',
            border: '1px dashed var(--cm-border)',
          }}
        >
          {/* Camera Icon */}
          <Camera 
            className="w-12 h-12 mb-3" 
            strokeWidth={1.5}
            aria-hidden="true"
            style={{ color: 'var(--cm-icon-primary)' }}
          />
          
          {/* Smart rotating prompt */}
          <AnimatePresence mode="wait">
            <motion.h2 
              key={prompt}
              className="text-[16px] font-medium leading-snug max-w-[480px]"
              style={{ color: 'var(--cm-text-primary)' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {prompt}
            </motion.h2>
          </AnimatePresence>
          
          <p 
            className="text-sm mt-2 mb-6"
            style={{ color: 'var(--cm-text-secondary)' }}
          >
            Share your best golf moments
          </p>
          
          {/* CTA Buttons - slate primary, secondary outline */}
          <div className="pointer-events-auto flex items-center justify-center gap-3 z-10">
            {/* Primary: Camera */}
            <button
              type="button"
              onClick={onPickFromCamera}
              aria-label="Open Camera"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm transition-all active:scale-[.98] focus:outline-none focus:ring-2"
              style={{
                background: 'var(--cm-surface-slate)',
                color: 'white',
                boxShadow: 'var(--cm-shadow-button)',
              }}
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </button>
            
            {/* Secondary: Gallery */}
            <button
              type="button"
              onClick={onPickFromLibrary}
              aria-label="Choose from Gallery"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-sm transition-all active:scale-[.98] focus:outline-none focus:ring-2"
              style={{
                background: 'var(--cm-surface-alt)',
                border: '1px solid var(--cm-border)',
                color: 'var(--cm-text-primary)',
              }}
            >
              <Images className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              <span>Gallery</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
