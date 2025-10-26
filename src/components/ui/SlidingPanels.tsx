import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Key = string;

export default function SlidingPanels<T extends Key = string>({
  activeKey,
  children,
}: {
  activeKey: T;
  order?: readonly T[];
  children: (key: T) => React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', minHeight: '1px' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={String(activeKey)}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          style={{ position: 'relative' }}
        >
          {children(activeKey)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
