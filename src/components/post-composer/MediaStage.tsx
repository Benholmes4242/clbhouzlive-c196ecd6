// MediaStage — renders a single media item with a blur-fill background extension
// when the sharp media doesn't fully fill the frame box. Used by both the embedded
// Composer card and the focused MediaEditor stage. Charcoal #0F172A surface.

import React, { useLayoutEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import type { FrameId } from './FrameChooser';
import { FRAMES } from './FrameChooser';

export const CHARCOAL = '#0F172A';

export interface MediaStageItem {
  id: string;
  type: 'image' | 'video';
  previewUrl: string;
  posterUrl?: string;
  width: number;
  height: number;
  pos: { x: number; y: number };
  /**
   * Set when this video was rehydrated from an existing Cloudflare Stream asset
   * (e.g. resumed-from-draft). The previewUrl is HLS, which most desktop browsers
   * can't play natively — we render the poster + a play glyph instead. The asset
   * is re-attached to the post on submit by stream_id (no re-upload).
   */
  restoredFromStream?: boolean;
}

interface MediaStageProps {
  item: MediaStageItem;
  frame: FrameId;
  height: number;
  borderRadius?: number;
  interactive?: boolean;            // drag-to-reposition when cropped
  onPos?: (pos: { x: number; y: number }) => void;
  showMuteToggle?: boolean;
  showPlayGlyph?: boolean;
}

export function MediaStage({
  item,
  frame,
  height,
  borderRadius = 0,
  interactive = false,
  onPos,
  showMuteToggle = false,
  showPlayGlyph = false,
}: MediaStageProps) {
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
  // videos always render natural ratio (no crop); images obey the chosen frame
  const useNatural = isVideo || frame === 'original';

  // Compute the visible media box inside the stage
  let boxW = stageW;
  let boxH = height;
  if (!useNatural && frameDef.ratio) {
    boxW = stageW;
    boxH = stageW / frameDef.ratio;
    if (boxH > height) {
      boxH = height;
      boxW = height * frameDef.ratio;
    }
  } else {
    // contain
    if (natRatio >= stageW / height) {
      boxW = stageW;
      boxH = stageW / natRatio;
    } else {
      boxH = height;
      boxW = height * natRatio;
    }
  }

  // Blur-fill is needed whenever the sharp layer doesn't fully fill the stage
  const fillsStage = Math.round(boxW) >= Math.round(stageW) && Math.round(boxH) >= Math.round(height);
  const showBlurFill = !fillsStage;

  const pos = item.pos || { x: 50, y: 50 };
  const canDrag = interactive && !useNatural;

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDrag) return;
    const pt = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    dragRef.current = { x: pt.clientX, y: pt.clientY, px: pos.x, py: pos.y };
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current || !onPos) return;
    const pt = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    const dx = ((pt.clientX - dragRef.current.x) / boxW) * 100;
    const dy = ((pt.clientY - dragRef.current.y) / boxH) * 100;
    onPos({
      x: Math.max(0, Math.min(100, dragRef.current.px - dx)),
      y: Math.max(0, Math.min(100, dragRef.current.py - dy)),
    });
  };
  const onUp = () => { dragRef.current = null; };

  const blurSrc = isVideo ? (item.posterUrl ?? '') : item.previewUrl;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: CHARCOAL,
        overflow: 'hidden',
        position: 'relative',
        borderRadius,
      }}
    >
      {showBlurFill && blurSrc && (
        <img
          src={blurSrc}
          aria-hidden
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(28px) brightness(0.6)',
            transform: 'scale(1.15)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        style={{
          position: 'relative',
          zIndex: 1,
          width: boxW,
          height: boxH,
          overflow: 'hidden',
          cursor: canDrag ? 'grab' : 'default',
          touchAction: canDrag ? 'none' : 'auto',
        }}
      >
        {isVideo ? (
          item.restoredFromStream ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: CHARCOAL,
              }}
            >
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt=""
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              ) : null}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={22} color="#fff" fill="#fff" />
                </div>
              </div>
            </div>
          ) : (
            <video
              src={item.previewUrl}
              poster={item.posterUrl}
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
                background: CHARCOAL,
              }}
            />
          )
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

      {isVideo && showPlayGlyph && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Play size={18} strokeWidth={2.5} />
          </div>
        </div>
      )}

      {isVideo && showMuteToggle && (
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
            zIndex: 3,
          }}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
}

export default MediaStage;
