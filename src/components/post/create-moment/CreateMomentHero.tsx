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
    <div className="h-full w-full flex items-center justify-center bg-muted/30 pointer-events-none">
      <motion.div 
        className="text-center px-6 max-w-[520px] flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Camera Icon - reduced size */}
        <Camera 
          className="w-12 h-12 mb-3 text-muted-foreground/60" 
          strokeWidth={1.5}
          aria-hidden="true"
        />
        
        {/* Smart rotating prompt */}
        <AnimatePresence mode="wait">
          <motion.h2 
            key={prompt}
            className="text-foreground/80 text-[16px] font-medium leading-snug max-w-[480px]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {prompt}
          </motion.h2>
        </AnimatePresence>
        
        {/* Spacer - reduced */}
        <div className="h-4" />
        
        {/* CTA Buttons - Camera primary, Gallery secondary */}
        <div className="pointer-events-auto flex items-center justify-center gap-3 z-10">
          {/* Primary: Camera */}
          <button
            type="button"
            onClick={onPickFromCamera}
            aria-label="Open Camera"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold text-sm transition-transform bg-primary text-primary-foreground"
          >
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </button>
          
          {/* Secondary: Gallery */}
          <button
            type="button"
            onClick={onPickFromLibrary}
            aria-label="Choose from Gallery"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium text-sm transition-transform bg-muted text-foreground border border-border hover:bg-muted/80"
          >
            <Images className="w-4 h-4" />
            <span>Gallery</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
