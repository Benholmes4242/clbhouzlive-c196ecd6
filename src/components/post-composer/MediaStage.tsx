// MediaStage — renders the active media item (image or video) inside a fixed dark stage.
// Images obey the chosen frame (original/4:5/1:1) with drag-to-reposition when cropped.
// Videos always render at natural aspect (object-fit: contain), letterboxed by the dark stage.

import React, { useLayoutEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { FrameId } from './FrameChooser';
import { FRAMES } from './FrameChooser';
import type { StageMediaItem } from './CanvasComposer';

const STAGE_H = 520;

interface MediaStageProps {
  item: StageMediaItem;
  frame: FrameId;
  onPos: (pos: { x: number; y: number }) => void;
}

export function MediaStage({ item, frame, onPos }: MediaStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [stageW, setStageW] = useState(390);
  const [muted, setMuted] = useState(true);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const measure = () => setStageW(el.clientWidth || 390);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isVideo = item.type === 'video';
  const natRatio = item.width && item.height ? item.width / item.height : 1;
  const frameDef = FRAMES.find((f) => f.id === frame)!;
  const useNatural = isVideo || frame === 'original';

  let boxW = stageW;
  let boxH = STAGE_H;
  if (!useNatural && frameDef.ratio) {
    boxW = stageW;
    boxH = stageW / frameDef.ratio;
    if (boxH > STAGE_H) {
      boxH = STAGE_H;
      boxW = STAGE_H * frameDef.ratio;
    }
  } else {
    if (natRatio >= stageW / STAGE_H) {
      boxW = stageW;
      boxH = stageW / natRatio;
    } else {
      boxH = STAGE_H;
      boxW = STAGE_H * natRatio;
    }
  }

  const pos = item.pos || { x: 50, y: 50 };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (useNatural) return;
    const pt = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    dragRef.current = { x: pt.clientX, y: pt.clientY, px: pos.x, py: pos.y };
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current) return;
    const pt = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    const dx = ((pt.clientX - dragRef.current.x) / boxW) * 100;
    const dy = ((pt.clientY - dragRef.current.y) / boxH) * 100;
    onPos({
      x: Math.max(0, Math.min(100, dragRef.current.px - dx)),
      y: Math.max(0, Math.min(100, dragRef.current.py - dy)),
    });
  };
  const onUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: STAGE_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        style={{
          width: boxW,
          height: boxH,
          overflow: 'hidden',
          position: 'relative',
          cursor: useNatural ? 'default' : 'grab',
          borderRadius: 2,
          touchAction: useNatural ? 'auto' : 'none',
        }}
      >
        {isVideo ? (
          <video
            src={item.previewUrl}
            poster={(item as { posterUrl?: string }).posterUrl}
            autoPlay
            loop
            playsInline
            preload="metadata"
            muted={muted}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              background: '#000',
            }}
          />
        ) : (
          <img
            src={item.previewUrl}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: useNatural ? 'contain' : 'cover',
              objectPosition: `${pos.x}% ${pos.y}%`,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {isVideo && (
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute' : 'Mute'}
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.24)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
}

export default MediaStage;
