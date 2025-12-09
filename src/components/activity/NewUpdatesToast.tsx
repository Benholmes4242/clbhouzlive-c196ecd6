import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

interface NewUpdatesToastProps {
  count: number;
}

export const NewUpdatesToast: React.FC<NewUpdatesToastProps> = ({ count }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-[110px] left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-sq-pill bg-primary text-primary-foreground shadow-lg text-sm font-medium">
            <Bell className="h-4 w-4" />
            <span>You have {count} new update{count !== 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
