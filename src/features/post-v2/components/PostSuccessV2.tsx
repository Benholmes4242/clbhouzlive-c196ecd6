// PostSuccessV2 - lightweight confirmation. Dark squircle + white tick.

import { Check } from 'lucide-react';
import type { SubmitResult } from '../hooks/usePostSubmit';

interface Props {
  result: SubmitResult;
  onDone: () => void;
}

export default function PostSuccessV2({ result, onDone }: Props) {
  const label = result.kind === 'scheduled'
    ? `Scheduled${result.scheduledAt ? ' for ' + new Date(result.scheduledAt).toLocaleString() : ''}`
    : 'Posted';
  return (
    <div style={{ flex: 1, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 64, height: 64, background: '#15171F', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={30} color="#F5F6F7" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2428' }}>{label}</div>
        <button onClick={onDone} style={{ background: '#15171F', color: '#F5F6F7', border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );
}
