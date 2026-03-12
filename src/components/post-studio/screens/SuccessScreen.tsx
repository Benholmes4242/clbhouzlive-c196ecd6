// SuccessScreen — Step 6: The celebration moment

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { UploadBanner } from '../components/UploadBanner';

interface SuccessScreenProps {
  onDone: () => void;
}

function Particle({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;
  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x, y, scale: 0, opacity: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="absolute w-2 h-2 rounded-full"
      style={{ background: Math.random() > 0.5 ? '#f59e0b' : '#d97706', top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
    />
  );
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: i * 30 + Math.random() * 20 - 10,
  distance: 60 + Math.random() * 40,
  delay: 0.15 + Math.random() * 0.1,
}));

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8" style={{ background: '#0D0D0D' }}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          {PARTICLES.map((p, i) => <Particle key={i} delay={p.delay} angle={p.angle} distance={p.distance} />)}
        </div>
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: [0, 0.5, 0] }} transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }} className="absolute w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 70%)' }} />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-[116px] h-[116px] rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }} transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-[88px] h-[88px] rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 0 40px rgba(245,158,11,0.50)' }}>
            <motion.div initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}>
              <Check className="w-10 h-10 text-black" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-center space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: 'rgba(245,158,11,0.70)' }}>Post queued</p>
        <h2 className="text-2xl font-bold tracking-tight text-white">You're live on the fairway</h2>
        <p className="text-sm leading-relaxed max-w-[260px] mx-auto" style={{ color: 'rgba(255,255,255,0.40)' }}>Uploading in the background. Keep playing — clbhouz has it from here.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }} className="w-full max-w-sm">
        <UploadBanner />
      </motion.div>

      <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.4 }} whileTap={{ scale: 0.96 }} onClick={onDone} className="w-full max-w-sm flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm min-h-[52px]" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}>
        Back to clbhouz
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </motion.button>
    </div>
  );
}
