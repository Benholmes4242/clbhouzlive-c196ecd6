/**
 * AnimatedNumber - Smooth fade/slide animation for numbers
 * Prevents layout shift with tabular-nums and min-width
 */
import { motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number | null | undefined;
  isLoading: boolean;
  minCh?: number;
  className?: string;
  placeholder?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  isLoading,
  minCh = 3,
  className = '',
  placeholder = '—',
}) => {
  const display = isLoading ? placeholder : String(value ?? 0);

  return (
    <motion.span
      className={`tabular-nums inline-block min-w-[${minCh}ch] ${className}`}
      style={{ minWidth: `${minCh}ch` }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      key={display}
    >
      {display}
    </motion.span>
  );
};

export default AnimatedNumber;
