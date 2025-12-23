import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineToastProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  show: boolean;
  onDismiss?: () => void;
}

/**
 * Inline toast for auth feedback
 * Appears below forms with smooth animation
 */
const InlineToast: React.FC<InlineToastProps> = ({
  type,
  message,
  show,
  onDismiss,
}) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl border",
            bgColors[type]
          )}
        >
          {icons[type]}
          <p className="flex-1 text-sm text-white/80">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InlineToast;
