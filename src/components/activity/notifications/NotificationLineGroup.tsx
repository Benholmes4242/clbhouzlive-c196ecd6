import React from 'react';
import { motion } from 'framer-motion';
import { BORDER, HAIRLINE, REVEAL, SURFACE, CARD_RADIUS } from './tokens';

interface Props {
  children: React.ReactNode;
}

/**
 * Rounded hairline container holding consecutive NotificationLineRows.
 * 0.5px separators sit between rows only — not above the first or below the last.
 */
export const NotificationLineGroup: React.FC<Props> = ({ children }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <motion.div
      {...REVEAL}
      className="overflow-hidden"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: CARD_RADIUS,
      }}
    >
      {items.map((child, i) => (
        <div key={i} style={i > 0 ? { borderTop: `0.5px solid ${HAIRLINE}` } : undefined}>
          {child}
        </div>
      ))}
    </motion.div>
  );
};
