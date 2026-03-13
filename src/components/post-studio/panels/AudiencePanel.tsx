// AudiencePanel — Visibility picker, dark glass bottom sheet

import React from 'react';
import { Globe, Users, Lock, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { StudioVisibility } from '../types';

const PANEL_STYLE: React.CSSProperties = {
  background: 'rgba(18,18,18,0.98)',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

const OPTIONS: { value: StudioVisibility; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'anyone',    label: 'Public',  description: 'Visible to everyone on clbhouz', icon: Globe },
  { value: 'followers', label: 'Friends', description: 'Only people who follow you',      icon: Users },
  { value: 'private',   label: 'Private', description: 'Only visible to you',             icon: Lock  },
];

export function AudiencePanel() {
  const { state, setVisibility, closePanel } = usePostStudioContext();

  const handleSelect = (value: StudioVisibility) => {
    setVisibility(value);
    closePanel();
  };

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', ...SPRING.panel }} className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px]" style={PANEL_STYLE}>
      <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} /></div>

      <div className="flex items-center justify-between px-5 pb-4 pt-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'rgba(245,158,11,0.70)' }}>Audience</p>
          <h3 className="text-base font-semibold text-white mt-0.5">Who can see this?</h3>
        </div>
        <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.60)' }} />
        </button>
      </div>

      <div className="px-5 pb-8 space-y-2">
        {OPTIONS.map((opt, i) => {
          const isActive = state.visibility === opt.value;
          const Icon = opt.icon;
          return (
            <motion.button key={opt.value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(opt.value)} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl min-h-[64px] transition-all"
              style={{ background: isActive ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.04)', border: isActive ? '1px solid rgba(245,158,11,0.30)' : '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.07)' }}>
                <Icon className="w-5 h-5" style={{ color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.50)' }} strokeWidth={1.75} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.80)' }}>{opt.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{opt.description}</p>
              </div>
              {isActive && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
