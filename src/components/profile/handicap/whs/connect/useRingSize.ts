import { useEffect, useState } from 'react';

/**
 * Ring diameter for the display-scale par rings.
 *
 * The brief asks for 104. Three 104px rings plus their gutters need ~342px of
 * content width, which a 320px device does not have inside the stage's 24px
 * sides - so the narrow case steps down rather than overflowing or scrolling
 * sideways. Nothing else about the rings changes.
 */
const WIDE = '(min-width: 380px)';

export function useRingSize(wide = 104, narrow = 84): number {
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.(WIDE).matches ? wide : narrow,
  );

  useEffect(() => {
    const mq = window.matchMedia?.(WIDE);
    if (!mq) return;
    const apply = () => setSize(mq.matches ? wide : narrow);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [wide, narrow]);

  return size;
}

export default useRingSize;
