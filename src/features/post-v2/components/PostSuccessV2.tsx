// PostSuccessV2 - three variants:
//  - 'uploading' (media in flight): small progress ring + fire-and-free copy
//  - 'scheduled' (text-only or media): calendar-style confirmation
//  - 'published' (text-only): tick confirmation
// Media posts land here IMMEDIATELY after tapping Post - the controller
// runs the upload in the background and the feed pending card carries the
// live progress from here on.

import { useEffect, useState } from 'react';
import { Check, Clock } from 'lucide-react';
import type { SubmitResult } from '../hooks/usePostSubmit';
import { formatSchedule } from '../lib/formatSchedule';
import { subscribeToJob, getJobSnapshot } from '../lib/postUploadController';

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
    <div style={{ flex: 1, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: '#15171F', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isScheduled
            ? <Clock size={28} color="#F5F6F7" strokeWidth={2.5} />
            : <Check size={30} color="#F5F6F7" strokeWidth={2.5} />}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2428' }}>{label}</div>
        <button onClick={onDone} style={doneBtn}>Done</button>
      </div>
    </div>
  );
}

function UploadingState({ result, onDone }: Props) {
  const jobId = result.jobId ?? null;
  const [progress, setProgress] = useState<number>(() => {
    const snap = jobId ? getJobSnapshot(jobId) : null;
    return snap?.overallProgress ?? 0;
  });

  useEffect(() => {
    if (!jobId) return;
    return subscribeToJob(jobId, (s) => setProgress(s.overallProgress));
  }, [jobId]);

  const isScheduled = !!result.isScheduled;
  const scheduledCopy = isScheduled && result.scheduledAt
    ? `Uploading - it'll go out ${formatSchedule(new Date(result.scheduledAt))}.`
    : "Uploading - we'll take it from here. You can keep using the app.";

  return (
    <div style={{ flex: 1, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '0 28px', textAlign: 'center', maxWidth: 340 }}>
        <ProgressRing size={64} progress={progress} />
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2428' }}>
          {isScheduled ? 'Scheduled' : 'Posting...'}
        </div>
        <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.45 }}>
          {scheduledCopy}
        </div>
        <button onClick={onDone} style={doneBtn}>Done</button>
      </div>
    </div>
  );
}

function ProgressRing({ size, progress }: { size: number; progress: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, progress));
  // Show a small indeterminate arc when progress hasn't started yet.
  const dashOffset = clamped === 0 ? c * 0.75 : c - (c * clamped) / 100;
  return (
    <div style={{ width: size, height: size, background: '#15171F', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <svg width={size - 12} height={size - 12} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F7931E"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 300ms ease',
            animation: clamped === 0 ? 'pv2-ring-spin 1.2s linear infinite' : undefined,
            transformOrigin: `${size / 2}px ${size / 2}px`,
          }}
        />
      </svg>
      <style>{`
        @keyframes pv2-ring-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const doneBtn: React.CSSProperties = {
  background: '#15171F',
  color: '#F5F6F7',
  border: 0,
  borderRadius: 999,
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
};



