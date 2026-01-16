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
  if (hasMedia) return null;

  return (
    <div 
      className="h-full w-full flex items-center justify-center pointer-events-none"
      style={{ background: '#F8FAFC' }}
    >
      <motion.div 
        className="text-center px-6 max-w-[520px] flex flex-col items-center pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Dashed card container */}
        <div className="border border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Camera className="h-6 w-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-900 mb-1">Capture the moment</p>
          <p className="text-sm text-gray-500 text-center mb-4">
            From the tee, the green, or anywhere in between
          </p>
          <div className="flex gap-3">
            <motion.button
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHaptic('selection'); 
                onPickFromCamera(); 
              }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{ background: '#e2e8f0', color: 'var(--cm-text-primary)' }}
            >
              <Camera className="h-4 w-4" />
              Camera
            </motion.button>
            <motion.button
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHaptic('light');
                onPickFromLibrary(); 
              }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Images className="h-4 w-4" />
              Gallery
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
