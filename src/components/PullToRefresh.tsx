import * as React from 'react';

type Props = {
  onRefresh: () => Promise<any> | void;
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLElement>;
  Indicator?: React.FC<{ state: 'idle' | 'pulling' | 'ready' | 'refreshing'; y: number }>;
};

const THRESHOLD = 64;

export function PullToRefresh({ onRefresh, children, scrollRef, Indicator }: Props) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const scroller = scrollRef as React.RefObject<HTMLElement> | undefined;

  const [state, setState] = React.useState<'idle'|'pulling'|'ready'|'refreshing'>('idle');
  const [y, setY] = React.useState(0);
  const startY = React.useRef<number | null>(null);
  const dragging = React.useRef(false);

  const getScrollTop = () => (scroller?.current ?? wrapRef.current)?.scrollTop ?? 0;

  const onTouchStart = (e: React.TouchEvent | React.PointerEvent) => {
    if (state === 'refreshing') return;
    startY.current = ('touches' in e) ? e.touches[0].clientY : (e as React.PointerEvent).clientY;
    dragging.current = getScrollTop() <= 0;
  };

  const onTouchMove = (e: React.TouchEvent | React.PointerEvent) => {
    if (!dragging.current || startY.current == null) return;
    const currentY = ('touches' in e) ? e.touches[0].clientY : (e as React.PointerEvent).clientY;
    const dy = Math.max(0, currentY - startY.current);

    if (dy > 0) {
      e.preventDefault();
      setY(dy * 0.6);
      setState(dy * 0.6 >= THRESHOLD ? 'ready' : 'pulling');
    }
  };

  const reset = () => {
    setY(0);
    setState('idle');
  };

  const onTouchEnd = async () => {
    if (!dragging.current) return reset();
    dragging.current = false;

    if (state === 'ready') {
      setState('refreshing');
      try {
        if ('vibrate' in navigator) (navigator as any).vibrate?.(10);
        await onRefresh();
      } finally {
        setTimeout(reset, 250);
      }
    } else {
      reset();
    }
  };

  const handlers = {
    onTouchStart, onTouchMove, onTouchEnd,
    onPointerDown: onTouchStart as any,
    onPointerMove: onTouchMove as any,
    onPointerUp: onTouchEnd as any,
    onPointerCancel: onTouchEnd as any,
  };

  return (
    <div ref={wrapRef} {...handlers} style={{ position: 'relative' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: THRESHOLD,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${Math.min(y, THRESHOLD)}px)`,
          transition: state === 'refreshing' ? 'transform 180ms ease' : undefined,
          pointerEvents: 'none',
        }}
      >
        {Indicator
          ? <Indicator state={state} y={y}/>
          : <DefaultIndicator state={state} y={y} />}
      </div>

      <div
        style={{
          transform: `translateY(${y}px)`,
          transition: state === 'refreshing' ? 'transform 180ms ease' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function DefaultIndicator({ state, y }: { state: 'idle' | 'pulling' | 'ready' | 'refreshing'; y: number }) {
  const label = state === 'refreshing' ? 'Refreshing…'
    : state === 'ready' ? 'Release to refresh'
    : 'Pull to refresh';
  return (
    <div
      style={{
        fontSize: 12,
        opacity: Math.min(1, y / THRESHOLD),
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        color: 'rgba(255,255,255,0.7)',
      }}
    >
      {label}
    </div>
  );
}
