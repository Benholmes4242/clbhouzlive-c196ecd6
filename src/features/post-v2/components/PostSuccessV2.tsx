// PostSuccessV2 - immersive success overlay with three variants:
//  - 'uploading' (media in flight): ProgressRing tracks controller.
//    Renders phase-driven states: running/complete/failed.
//  - 'scheduled' (text-only or media): calendar-style confirmation.
//  - 'published' (text-only): tick confirmation.
// Uses ImmersiveSuccessShell for tap-anywhere-to-close overlay UX.

import { useEffect, useState } from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import type { SubmitResult } from '../hooks/usePostSubmit';
import { formatSchedule } from '../lib/formatSchedule';
import { subscribeToJob, getJobSnapshot } from '../lib/postUploadController';
import { ImmersiveSuccessShell } from './ImmersiveSuccessShell';

interface Props {
  result: SubmitResult;
  onDone: () => void;
}

export default function PostSuccessV2({ result, onDone }: Props) {
  if (result.kind === 'uploading') {
    return <UploadingState result={result} onDone={onDone} />;
  }

  const isScheduled = result.kind === 'scheduled';
  const label = isScheduled
    ? `Scheduled${result.scheduledAt ? ' for ' + formatSchedule(new Date(result.scheduledAt)) : ''}`
    : 'Posted';

  return (
    <ImmersiveSuccessShell onClose={onDone}>
      <GlyphTile>
        {isScheduled
          ? <Clock size={30} color="#F5F6F7" strokeWidth={2.5} />
          : <Check size={32} color="#F5F6F7" strokeWidth={2.5} />}
      </GlyphTile>
      <div style={labelStyle}>{label}</div>
      <button onClick={onDone} style={doneBtn}>Done</button>
    </ImmersiveSuccessShell>
  );
}

type Phase = 'running' | 'complete' | 'failed';

function UploadingState({ result, onDone }: Props) {
  if (result.kind !== 'uploading') return null;
  const jobId = result.jobId ?? null;
  const initial = jobId ? getJobSnapshot(jobId) : null;
  const [progress, setProgress] = useState<number>(initial?.overallProgress ?? 0);
  const [phase, setPhase] = useState<Phase>((initial?.phase as Phase) ?? 'running');
  const [errorText, setErrorText] = useState<string | null>(initial?.error ?? null);

  useEffect(() => {
    if (!jobId) return;
    return subscribeToJob(jobId, (s) => {
      setProgress(s.overallProgress);
      setPhase(s.phase as Phase);
      if (s.error) setErrorText(s.error);
    });
  }, [jobId]);

  // Auto-dismiss shortly after completion so the user does not need to tap.
  useEffect(() => {
    if (phase !== 'complete') return;
    const t = window.setTimeout(() => onDone(), 1200);
    return () => window.clearTimeout(t);
  }, [phase, onDone]);

  const isScheduled = !!result.isScheduled;

  if (phase === 'complete') {
    const label = isScheduled ? 'Scheduled' : 'Posted';
    return (
      <ImmersiveSuccessShell onClose={onDone}>
        <GlyphTile>
          <Check size={32} color="#F5F6F7" strokeWidth={2.5} />
        </GlyphTile>
        <div style={labelStyle}>{label}</div>
        <button onClick={onDone} style={doneBtn}>Done</button>
      </ImmersiveSuccessShell>
    );
  }

  if (phase === 'failed') {
    // Draft-saved copy is NOT accurate here: postUploadController does not
    // persist a draft on failure - it only emits upload:failed and retains
    // the snapshot for 30s. Show the neutral "Upload failed" copy.
    return (
      <ImmersiveSuccessShell tint="#EF4444" onClose={onDone}>
        <GlyphTile>
          <AlertTriangle size={30} color="#F5F6F7" strokeWidth={2.5} />
        </GlyphTile>
        <div style={labelStyle}>Upload failed</div>
        {errorText && (
          <div style={copyStyle}>{errorText}</div>
        )}
        <button onClick={onDone} style={doneBtn}>Done</button>
      </ImmersiveSuccessShell>
    );
  }

  const scheduledCopy = isScheduled && result.scheduledAt
    ? `Uploading - it'll go out ${formatSchedule(new Date(result.scheduledAt))}.`
    : "Uploading - we'll take it from here. You can keep using the app.";

  return (
    <ImmersiveSuccessShell onClose={onDone}>
      <ProgressRing size={72} progress={progress} />
      <div style={labelStyle}>{isScheduled ? 'Scheduled' : 'Posting...'}</div>
      <div style={copyStyle}>{scheduledCopy}</div>
      <button onClick={onDone} style={doneBtn}>Done</button>
    </ImmersiveSuccessShell>
  );
}

function GlyphTile({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 72, height: 72, background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}

function ProgressRing({ size, progress }: { size: number; progress: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, progress));
  const dashOffset = clamped === 0 ? c * 0.75 : c - (c * clamped) / 100;
  return (
    <div style={{
      width: size, height: size,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <svg width={size - 12} height={size - 12} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#F7931E" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 300ms ease',
            animation: clamped === 0 ? 'pv2-ring-spin 1.2s linear infinite' : undefined,
            transformOrigin: `${size / 2}px ${size / 2}px`,
          }}
        />
      </svg>
      <style>{`@keyframes pv2-ring-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: '-0.01em',
  color: 'rgba(255,255,255,0.96)',
};

const copyStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.55)',
  lineHeight: 1.45,
  maxWidth: 300,
};

const doneBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 999,
  padding: '10px 22px',
  fontSize: 13.5,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
};
