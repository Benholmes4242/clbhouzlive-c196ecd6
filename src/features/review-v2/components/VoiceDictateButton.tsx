/**
 * VoiceDictateButton — mic for the Words section.
 * Ports the proven trio from the legacy wizard:
 *   useVoiceRecorder (src/hooks) -> transcribeAudio (src/lib)
 *   -> voice-to-text edge fn. Three states: idle / listening / processing.
 * Transcript APPENDS to current text; caller writes back via onAppend.
 */

import React, { useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/transcribeAudio';
import { RV2 } from '../tokens';

interface Props {
  onAppend: (text: string) => void;
}

export function VoiceDictateButton({ onAppend }: Props) {
  const rec = useVoiceRecorder();
  const [processing, setProcessing] = React.useState(false);

  // When a blob lands, transcribe and append.
  useEffect(() => {
    if (!rec.audioBlob) return;
    let cancelled = false;
    setProcessing(true);
    transcribeAudio(rec.audioBlob)
      .then((text) => {
        if (cancelled) return;
        const trimmed = text.trim();
        if (trimmed) onAppend(trimmed);
      })
      .catch(() => { /* silent — inline button; keep composer usable */ })
      .finally(() => {
        if (!cancelled) {
          setProcessing(false);
          rec.resetRecording();
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.audioBlob]);

  const listening = rec.isRecording;
  const active = listening || processing;

  const onClick = () => {
    if (processing) return;
    if (listening) rec.stopRecording();
    else rec.startRecording();
  };

  const label = processing
    ? 'Transcribing...'
    : listening
      ? 'Stop dictation'
      : 'Dictate';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 28,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${active ? RV2.amber : 'rgba(15,23,42,0.10)'}`,
        background: active ? 'rgba(247,147,30,0.10)' : '#FFFFFF',
        color: active ? RV2.amber : '#0F172A',
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: '-0.005em',
        cursor: processing ? 'wait' : 'pointer',
      }}
    >
      {processing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : listening ? (
        <Square size={16} fill="currentColor" />
      ) : (
        <Mic size={16} />
      )}
      <span>{processing ? 'Transcribing' : listening ? 'Stop' : 'Dictate'}</span>
    </button>
  );
}
