// SuccessScreen — Step 6: The celebration moment

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { UploadBanner } from '../components/UploadBanner';
import { BG_BASE, TEXT_PRIMARY } from '../tokens';

interface SuccessScreenProps {
  onDone: () => void;
}

const PARTICLE_COLORS = [
  'rgba(255,255,255,0.90)',
  'rgba(255,255,255,0.60)',
  'rgba(255,255,255,0.40)',
  'rgba(255,255,255,0.20)',
];

function Particle({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x, y, scale: 0, opacity: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="absolute w-2 h-2 rounded-full"
      style={{ background: color, top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
    />
  );
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  angle: i * 15 + Math.random() * 10 - 5,
  distance: 55 + Math.random() * 50,
  delay: 0.12 + Math.random() * 0.15,
}));

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 relative" style={{ background: BG_BASE }}>
      {/* Subtle radial white glow background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          {PARTICLES.map((p, i) => <Particle key={i} delay={p.delay} angle={p.angle} distance={p.distance} />)}
        </div>
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: [0, 0.5, 0] }} transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }} className="absolute w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-[116px] h-[116px] rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }} transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-[88px] h-[88px] rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.96)', boxShadow: '0 0 40px rgba(255,255,255,0.20)' }}>
            <motion.div initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}>
              <Check className="w-10 h-10 text-[#0D0D0D]" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-center space-y-2 relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[2.5px]"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          Moment posted
        </p>
        <h2 className="text-[30px] font-bold text-white"
          style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          On the board.
        </h2>
        <p className="text-[13px] leading-relaxed max-w-[240px] mx-auto"
          style={{ color: 'rgba(255,255,255,0.42)', letterSpacing: '-0.01em' }}>
          Uploading while you play. The feed awaits.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }} className="w-full max-w-sm relative z-10">
        <UploadBanner />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.4 }}
        whileTap={{ scale: 0.96 }}
        onClick={onDone}
        className="w-full max-w-sm flex items-center justify-center gap-2 rounded-[18px] font-bold text-[15px] min-h-[58px] relative z-10"
        style={{
          background: 'rgba(255,255,255,0.97)',
          color: '#0D0D0D',
          letterSpacing: '-0.015em',
          boxShadow: '0 6px 28px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        Back to clbhouz
        <ArrowRight className="w-4 h-4" strokeWidth={2.5} style={{ color: 'rgba(0,0,0,0.45)' }} />
      </motion.button>
    </div>
  );
}