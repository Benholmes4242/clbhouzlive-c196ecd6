import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

type EchoButtonProps = {
  count: number;
  active?: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
};

export function EchoButton({ count, active = false, onToggle, size = 'md' }: EchoButtonProps) {
  const iconSize = size === 'sm' ? 16 : 20;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const formatCount = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      whileTap={{ scale: 0.9 }}
      className="flex items-center gap-1.5 group"
      aria-label={`${count} Echoes`}
    >
      <motion.div
        animate={active ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart
          size={iconSize}
          className={`transition-colors ${
            active
              ? 'fill-[#6e9277] text-[#6e9277]'
              : 'text-gray-400 group-hover:text-[#6e9277]'
          }`}
        />
      </motion.div>
      <span className={`${textSize} text-gray-400 group-hover:text-gray-300`}>
        {count > 0 ? formatCount(count) : ''}
      </span>
    </motion.button>
  );
}
