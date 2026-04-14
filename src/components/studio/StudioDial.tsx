import { useRef, useState } from 'react';
import { Music, Type, SlidersHorizontal, Scissors, Crop, Sun } from 'lucide-react';
import { StudioTool } from '@/types/studio';

const TOOLS: { id: NonNullable<StudioTool>; label: string; Icon: any }[] = [
  { id: 'filter', label: 'FILTER', Icon: SlidersHorizontal },
  { id: 'light',  label: 'LIGHT',  Icon: Sun },
  { id: 'trim',   label: 'TRIM',   Icon: Scissors },
  { id: 'text',   label: 'TEXT',   Icon: Type },
  { id: 'edit',   label: 'CROP',   Icon: Crop },
  { id: 'music',  label: 'MUSIC',  Icon: Music },
];

const ITEM_W = 72;

export default function StudioDial({
  activeTool,
  setActiveTool,
  activeMediaType,
}: {
  activeTool: StudioTool;
  setActiveTool: (t: StudioTool) => void;
  activeMediaType: 'image' | 'video';
}) {
  const visibleTools = TOOLS.filter(t => t.id !== 'trim' || activeMediaType === 'video');
  const activeIdx = visibleTools.findIndex(t => t.id === activeTool);
  const dragStart = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX;
    isDragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = e.clientX - dragStart.current;
    if (Math.abs(delta) > 4) isDragging.current = true;
    setDragOffset(delta);
  };

  const handlePointerUp = () => {
    if (dragStart.current === null) return;
    if (isDragging.current && Math.abs(dragOffset) > 30) {
      const dir = dragOffset < 0 ? 1 : -1;
      const next = Math.max(0, Math.min(visibleTools.length - 1, activeIdx + dir));
      setActiveTool(visibleTools[next].id);
    }
    dragStart.current = null;
    setDragOffset(0);
    isDragging.current = false;
  };

  const containerWidth = visibleTools.length * ITEM_W;
  const baseTranslate = -(activeIdx * ITEM_W) + (containerWidth / 2) - (ITEM_W / 2);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: 68,
        flexShrink: 0,
        touchAction: 'pan-y',
        cursor: 'grab',
        borderTop: '0.5px solid rgba(15,23,42,0.08)',
        borderBottom: '0.5px solid rgba(15,23,42,0.08)',
        background: '#ffffff',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to right, #ffffff, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to left, #ffffff, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-0.5px)', width: 1, height: '100%', background: 'rgba(15,23,42,0.08)', zIndex: 1, pointerEvents: 'none' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          transform: `translateX(${baseTranslate + dragOffset}px)`,
          transition: dragStart.current !== null ? 'none' : 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {visibleTools.map((t, i) => {
          const dist = Math.abs(i - activeIdx - dragOffset / ITEM_W);
          const isActive = t.id === activeTool && Math.abs(dragOffset) < 20;
          const scale = isActive ? 1 : Math.max(0.6, 1 - dist * 0.18);
          const opacity = isActive ? 1 : Math.max(0.20, 1 - dist * 0.28);
          return (
            <div
              key={t.id}
              onClick={() => { if (!isDragging.current) setActiveTool(t.id); }}
              style={{
                width: ITEM_W,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                transform: `scale(${scale})`,
                opacity,
                transition: 'transform 0.2s ease, opacity 0.2s ease',
                cursor: 'pointer',
                color: isActive ? '#0F172A' : 'rgba(15,23,42,0.35)',
              }}
            >
              <t.Icon className="w-5 h-5" />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
