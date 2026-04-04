// ViewfinderScreen — Dark immersive camera opening phase
// Rule-of-thirds grid, amber focus reticle, shutter, flip, library

import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';

const SCENE_GRADIENTS = [
  'linear-gradient(160deg,#1a3a1a 0%,#0d2010 60%,#060e08 100%)',
  'linear-gradient(160deg,#0d2030 0%,#071520 60%,#030810 100%)',
  'linear-gradient(160deg,#2a1a08 0%,#180e04 60%,#0a0602 100%)',
  'linear-gradient(160deg,#1a1030 0%,#0e0820 60%,#060310 100%)',
];

export function ViewfinderScreen({ onClose }: { onClose: () => void }) {
  const { setStep } = usePostStudioContext();
  const [sceneIndex, setSceneIndex] = useState(0);

  const scene = SCENE_GRADIENTS[sceneIndex % SCENE_GRADIENTS.length];
  const nextScene = SCENE_GRADIENTS[(sceneIndex + 2) % SCENE_GRADIENTS.length];

  const handleShutter = useCallback(() => {
    setSceneIndex(s => (s + 1) % SCENE_GRADIENTS.length);
    setStep('COMPOSE');
  }, [setStep]);

  const handleFlip = useCallback(() => {
    setSceneIndex(s => (s + 1) % SCENE_GRADIENTS.length);
  }, []);

  const handleLibrary = useCallback(() => {
    setStep('COMPOSE');
  }, [setStep]);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Live scene background */}
      <div style={{
        position: 'absolute', inset: 0, background: scene,
        transition: 'background 0.5s ease',
      }}>
        {/* Rule-of-thirds grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),'
            + ' linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '33.33% 33.33%',
        }} />
      </div>

      {/* Top bar */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(env(safe-area-inset-top, 16px), 16px) 20px 12px',
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.13)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X className="w-[16px] h-[16px]" style={{ color: '#fff' }} strokeWidth={2} />
        </motion.button>

        <div style={{ display: 'flex', gap: 10 }}>
          {['⚡', '🔆', '⏱'].map(icon => (
            <motion.button
              key={icon}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.13)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 16,
              }}
            >{icon}</motion.button>
          ))}
        </div>
      </div>

      {/* Amber focus reticle */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{
            width: 84, height: 84,
            border: '1.5px solid rgba(255,255,255,0.30)',
            borderRadius: 4, position: 'relative',
          }}
        >
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => {
            const v = pos.startsWith('top') ? 'top' : 'bottom';
            const h = pos.endsWith('left') ? 'left' : 'right';
            return (
              <div key={pos} style={{
                position: 'absolute', [v]: -2, [h]: -2, width: 14, height: 14,
                borderTop: v === 'top' ? '2.5px solid #F7931E' : 'none',
                borderBottom: v === 'bottom' ? '2.5px solid #F7931E' : 'none',
                borderLeft: h === 'left' ? '2.5px solid #F7931E' : 'none',
                borderRight: h === 'right' ? '2.5px solid #F7931E' : 'none',
              }} />
            );
          })}
        </motion.div>
      </div>

      {/* Bottom controls */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Mode strip */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
          {['VIDEO', 'PHOTO', 'MOMENT'].map((m, i) => (
            <button key={m} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: i === 1 ? 900 : 600, letterSpacing: '1.5px',
              color: i === 1 ? '#F7931E' : 'rgba(255,255,255,0.40)',
            }}>{m}</button>
          ))}
        </div>

        {/* Shutter row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `0 32px max(env(safe-area-inset-bottom, 24px), 24px)`,
        }}>
          {/* Library thumbnail */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleLibrary}
            style={{
              width: 52, height: 52, borderRadius: 14, overflow: 'hidden',
              background: nextScene, display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '2px solid rgba(255,255,255,0.30)',
              cursor: 'pointer', fontSize: 22,
            }}
          >🖼</motion.button>

          {/* Shutter button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShutter}
            style={{
              width: 78, height: 78, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              border: '4px solid rgba(255,255,255,0.30)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(255,255,255,0.08), 0 0 24px rgba(247,147,30,0.35)',
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', border: '2.5px solid rgba(0,0,0,0.10)' }} />
          </motion.button>

          {/* Flip camera */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleFlip}
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.13)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 22,
            }}
          >🔄</motion.button>
        </div>
      </div>
    </div>
  );
}
