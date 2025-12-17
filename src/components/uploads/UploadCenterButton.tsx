// Upload Center button for header

import { useState } from 'react';
import { Cloud, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadJobs } from '@/uploads/useUploadJobs';
import { UploadCenterPanel } from './UploadCenterPanel';

export function UploadCenterButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { hasPending, hasFailed, pendingJobs } = useUploadJobs();

  const showIndicator = hasPending || hasFailed;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="View uploads"
      >
        {hasPending ? (
          <CloudUpload className="w-5 h-5 text-foreground animate-pulse" />
        ) : (
          <Cloud className="w-5 h-5 text-muted-foreground" />
        )}
        
        {/* Indicator dot */}
        <AnimatePresence>
          {showIndicator && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                hasFailed ? 'bg-destructive' : 'bg-primary'
              }`}
            />
          )}
        </AnimatePresence>
      </button>

      <UploadCenterPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
