// AudiencePanel — Visibility picker bottom sheet
import React from 'react';
import { Globe, Users, Lock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { StudioVisibility } from '../types';

const OPTIONS: { value: StudioVisibility; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'anyone', label: 'Public', description: 'Visible to everyone', icon: Globe },
  { value: 'followers', label: 'Friends', description: 'Only your followers can see this', icon: Users },
  { value: 'private', label: 'Private', description: 'Only you can see this', icon: Lock },
];

export function AudiencePanel() {
  const { state, setVisibility, closePanel } = usePostStudioContext();
  const handleSelect = (value: StudioVisibility) => { setVisibility(value); closePanel(); };

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', ...SPRING.panel }}
      className="absolute inset-x-0 bottom-0 z-40 bg-background rounded-t-[20px] border-t border-border/50 backdrop-blur-xl">
      <div className="flex justify-center pt-2.5 pb-1"><div className="w-10 h-1 rounded-full bg-primary/30" /></div>
      <div className="flex items-center justify-between px-4 pb-1">
        <div><p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1.5px]">AUDIENCE</p>
        <h3 className="text-sm font-semibold text-foreground">Who can see this?</h3></div>
        <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center"><X className="w-5 h-5 text-muted-foreground" /></button>
      </div>
      <div className="px-4 pb-6 space-y-1">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = state.visibility === opt.value;
          return (
            <button key={opt.value} onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center gap-3 py-3.5 px-3 rounded-xl min-h-[52px] transition-colors ${isActive ? 'bg-primary/5 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              {isActive && (<div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary-foreground" /></div>)}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
