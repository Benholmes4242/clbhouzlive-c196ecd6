/**
 * EndOfFeed — "You're all caught up" overlay on the last feed item.
 * Fades in after 2 seconds of being on the last item.
 */
import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface EndOfFeedProps {
  visible: boolean;
  onRefresh?: () => void;
}

export function EndOfFeed({ visible }: EndOfFeedProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-15 pointer-events-none flex flex-col items-center justify-end pb-28"
      style={{
        opacity: show ? 1 : 0,
        transition: 'opacity 500ms ease',
        background: show
          ? 'linear-gradient(transparent 60%, rgba(0,0,0,0.3) 100%)'
          : 'transparent',
      }}
    >
      <CheckCircle className="w-8 h-8 text-white/70 mb-3" strokeWidth={1.5} />
      <p className="text-[16px] font-semibold text-white/80">You're all caught up</p>
      <p className="text-[13px] text-white/50 mt-1">Pull down to refresh</p>
    </div>
  );
}
