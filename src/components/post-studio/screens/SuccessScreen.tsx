// SuccessScreen — Step 6: Dark celebration moment with staggered entrance + live upload progress

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { usePostStudioContext } from '../usePostStudio';
import { format } from 'date-fns';

interface SuccessScreenProps {
  onDone: () => void;
}

const PARTICLE_COUNT = 28;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (i / PARTICLE_COUNT) * 360,
  distance: 55 + (i % 3) * 20,
  delay: 0.12 + (i % 5) * 0.03,
  opacity: [0.90, 0.65, 0.40, 0.20][i % 4],
}));

function Particle({ delay, angle, distance, opacity }: { delay: number; angle: number; distance: number; opacity: number }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;
  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 1, opacity }}
      animate={{ x, y, scale: 0, opacity: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="absolute w-2 h-2 rounded-full"
      style={{ background: '#F7931E', top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
    />
  );
}

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  const { state } = usePostStudioContext();
  const { isUploading, uploadedCount, totalCount } = useUploadProgress();
  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;
  const isComplete = uploadedCount >= totalCount && totalCount > 0;
  const isScheduled = state.scheduledAt !== null;

  console.log('[DEBUG] SuccessScreen RENDER, isScheduled:', isScheduled, 'step:', state.step);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 relative" style={{ background: '#0D0D0D' }}>
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 34%, rgba(247,147,30,0.05) 0%, transparent 60%)' }} />

      {/* Phase 1 — Check circle + particles (50ms) */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          {PARTICLES.map((p, i) => <Particle key={i} delay={p.delay} angle={p.angle} distance={p.distance} opacity={p.opacity} />)}
        </div>

        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center"
          style={{
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(247,147,30,0.04)',
            border: '1px solid rgba(247,147,30,0.08)',
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 96, height: 96, borderRadius: '50%',
              background: '#F7931E',
              boxShadow: '0 4px 32px rgba(247,147,30,0.30)',
            }}
          >
            <motion.svg
              width="40" height="40" viewBox="0 0 40 40" fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.1 }}
            >
              <motion.polyline
                points="8,21 16,29 32,13"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="50"
                initial={{ strokeDashoffset: 50 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
              />
            </motion.svg>
          </div>
        </motion.div>
      </div>

      {/* Phase 2 — Copy (400ms) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-2 relative z-10"
      >
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'rgba(247,147,30,0.60)',
        }}>
          {isScheduled ? 'Post scheduled' : 'Moment shared'}
        </p>
        <h2 style={{
          fontSize: 34, fontWeight: 800,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '-0.04em', lineHeight: 1.1,
        }}>
          {isScheduled ? 'Locked in.' : 'On the board.'}
        </h2>
        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.50)',
          maxWidth: 230, margin: '0 auto', lineHeight: 1.5,
        }}>
          {isScheduled
            ? `Your post will go live ${format(state.scheduledAt!, "EEE d MMM 'at' h:mm a")}.`
            : 'Uploading in the background while you get back out there.'}
        </p>
      </motion.div>

      {/* Phase 3 — Upload progress card (only for non-scheduled) */}
      {!isScheduled && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="w-full max-w-sm relative z-10"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '14px 16px',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
              {isComplete ? 'Upload complete' : 'Uploading…'}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
              color: isComplete ? 'rgba(34,197,94,0.80)' : '#F7931E',
            }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{
            width: '100%', height: 4, borderRadius: 999,
            background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 999,
              transition: 'width 500ms, background 300ms',
              width: `${progress}%`,
              background: isComplete
                ? 'rgba(34,197,94,0.70)'
                : 'linear-gradient(90deg, #F7931E, #F59E0B)',
            }} />
          </div>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.35)',
            marginTop: 8,
          }}>
            {isComplete ? 'Your post is live on the feed' : "You can close the app — it'll keep going"}
          </p>
        </motion.div>
      )}

      {/* Phase 4 — CTA button */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isScheduled ? 0.75 : 1.0, duration: 0.4 }}
        whileTap={{ scale: 0.96 }}
        onClick={onDone}
        className="w-full max-w-sm flex items-center justify-center gap-2 font-bold relative z-10"
        style={{
          background: '#F7931E',
          color: '#FFFFFF',
          borderRadius: 18,
          minHeight: 56,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.015em',
          boxShadow: '0 6px 28px rgba(247,147,30,0.22), 0 2px 8px rgba(247,147,30,0.12)',
        }}
      >
        Back to clbhouz
        <ArrowRight className="w-4 h-4" strokeWidth={2.5} style={{ color: 'rgba(255,255,255,0.55)' }} />
      </motion.button>
    </div>
  );
}
