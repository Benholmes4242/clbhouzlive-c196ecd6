// MediaEditor — focused, charcoal editor for a single media item (with optional
// per-item navigation via thumbnail strip). Entered by tapping a media tile in
// the Composer. Done returns updated items; Cancel discards session edits.

import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MediaStage, CHARCOAL } from './MediaStage';
import { FrameChooser, type FrameId } from './FrameChooser';
import type { ComposerMediaItem } from './composerMedia';

const HEADER_BG = '#0F1117';

interface MediaEditorProps {
  open: boolean;
  items: ComposerMediaItem[];
  startIndex: number;
  onCancel: () => void;
  onDone: (updated: ComposerMediaItem[]) => void;
}

export function MediaEditor({ open, items, startIndex, onCancel, onDone }: MediaEditorProps) {
  // Local draft so Cancel can discard.
  const [draft, setDraft] = useState<ComposerMediaItem[]>(items);
  const [activeIndex, setActiveIndex] = useState(startIndex);

  // Reset draft whenever editor opens with new inputs
  React.useEffect(() => {
    if (open) {
      setDraft(items);
      setActiveIndex(Math.min(startIndex, items.length - 1));
    }
  }, [open, items, startIndex]);

  const active = draft[Math.min(activeIndex, draft.length - 1)];

  const updateActive = useCallback(
    (patch: Partial<ComposerMediaItem>) => {
      setDraft((prev) => prev.map((it, i) => (i === activeIndex ? { ...it, ...patch } : it)));
    },
    [activeIndex]
  );

  const setFrame = useCallback((f: FrameId) => updateActive({ frame: f }), [updateActive]);
  const setPos = useCallback(
    (pos: { x: number; y: number }) => updateActive({ pos }),
    [updateActive]
  );

  const stageHeight = useMemo(() => {
    if (typeof window === 'undefined') return 560;
    // Big near-full stage; reserve room for header (~64) + frame chooser (~70) + thumbs (~80) + bottom inset
    return Math.max(360, window.innerHeight - 260);
  }, []);

  if (!open || !active) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="editor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: CHARCOAL,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: HEADER_BG,
            paddingTop: 'max(env(safe-area-inset-top, 0px), 14px)',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 4px',
            }}
          >
            Cancel
          </button>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Edit{draft.length > 1 ? ` · ${activeIndex + 1}/${draft.length}` : ''}
          </span>
          <button
            onClick={() => onDone(draft)}
            style={{
              background: '#fff',
              color: '#0F172A',
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              padding: '8px 16px',
              borderRadius: 20,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>

        {/* Stage */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <MediaStage
            item={active}
            frame={active.frame}
            height={stageHeight}
            interactive
            onPos={setPos}
            showMuteToggle
          />

          {/* Frame chooser — only for photos */}
          {active.type === 'image' && (
            <FrameChooser frame={active.frame} onChange={setFrame} />
          )}
        </div>

        {/* Thumbnail strip */}
        {draft.length > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 12px calc(env(safe-area-inset-bottom, 0px) + 12px)',
              background: HEADER_BG,
            }}
          >
            {draft.map((m, i) => {
              const selected = i === activeIndex;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: selected ? '2px solid #FFFFFF' : '2px solid transparent',
                    boxShadow: selected ? '0 0 0 1px rgba(0,0,0,0.4)' : 'none',
                    opacity: selected ? 1 : 0.6,
                    padding: 0,
                    cursor: 'pointer',
                    background: CHARCOAL,
                  }}
                >
                  <img
                    src={m.type === 'video' ? (m.posterUrl ?? m.previewUrl) : m.previewUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default MediaEditor;
