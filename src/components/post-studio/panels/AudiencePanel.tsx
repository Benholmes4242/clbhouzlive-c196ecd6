// AudiencePanel — Visibility picker, dark glass bottom sheet
import React from 'react';
import { Globe, Users, Lock, Check } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import { AMBER, AMBER_DIM, AMBER_GHOST, AMBER_GRADIENT, TEXT_PRIMARY, TEXT_TERTIARY } from '../tokens';
import type { StudioVisibility } from '../types';

const OPTIONS: { value: StudioVisibility; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'anyone',    label: 'Public',  description: 'Visible to everyone on clbhouz', icon: Globe },
  { value: 'followers', label: 'Friends', description: 'Only people who follow you',      icon: Users },
  { value: 'private',   label: 'Private', description: 'Only visible to you',             icon: Lock  },
];

export function AudiencePanel() {
  const { state, setVisibility, closePanel } = usePostStudioContext();
  const dragControls = useDragControls();

  const handleSelect = (value: StudioVisibility) => {
    setVisibility(value);
    closePanel();
  };

  return (
    <>
      {/* Tap-outside backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closePanel}
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.45)' }}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', ...SPRING.panel }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 400) closePanel();
        }}
        className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px]"
        style={{
          background: 'rgba(13,13,13,0.99)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} />
        </div>

        {/* Header — no X */}
        <div className="px-5 pb-4 pt-1">
          <p
            className="text-[11px] font-semibold uppercase tracking-[1.5px]"
            style={{ color: AMBER_DIM }}
          >
            Audience
          </p>
          <h3 className="text-base font-semibold mt-0.5" style={{ color: TEXT_PRIMARY }}>
            Who can see this?
          </h3>
        </div>

        {/* Options */}
        <div className="px-5 pb-8 space-y-2">
          {OPTIONS.map((opt, i) => {
            const isActive = state.visibility === opt.value;
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(opt.value)}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl min-h-[64px]"
                style={{
                  background: isActive ? AMBER_GHOST : 'rgba(255,255,255,0.04)',
                  border: isActive ? '1px solid rgba(232,152,10,0.30)' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: isActive ? 'rgba(232,152,10,0.15)' : 'rgba(255,255,255,0.07)' }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? AMBER : 'rgba(255,255,255,0.50)' }}
                    strokeWidth={1.75}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: isActive ? AMBER : 'rgba(255,255,255,0.80)' }}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {opt.description}
                  </p>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: AMBER_GRADIENT }}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: '#0D0D0D' }} strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
