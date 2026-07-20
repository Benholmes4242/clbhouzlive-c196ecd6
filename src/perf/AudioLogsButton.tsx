// Floating bottom-right entry point for the AudioDebugHud panel. Sits next
// to the LogHud "LOG" button so the audio ring buffer is always reachable
// even when the top-left AUDIO pill is hidden or missed. Both pill and
// button remain valid entry points.
import React, { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Z } from '@/config/zIndex';
import { audioDebugEnabled, subscribeAudioDebugEnabled } from '@/perf/audioDebug';
import { AUDIO_HUD_OPEN_EVENT } from '@/perf/AudioDebugHud';

export const AudioLogsButton = memo(function AudioLogsButton() {
  const [, force] = useState(0);
  useEffect(() => subscribeAudioDebugEnabled(() => force((n) => n + 1)), []);
  if (!audioDebugEnabled()) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <button
      onClick={() => {
        try { window.dispatchEvent(new CustomEvent(AUDIO_HUD_OPEN_EVENT)); } catch { /* noop */ }
      }}
      aria-label="Open audio logs"
      style={{
        position: 'fixed',
        bottom: 80,
        right: 68,
        zIndex: Z.logHud,
        padding: '6px 10px',
        fontSize: 12,
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.78)',
        color: '#fbbf24',
        border: '1px solid rgba(251,191,36,0.35)',
        borderRadius: 6,
      }}
    >
      AUD LOG
    </button>,
    document.body,
  );
});

export default AudioLogsButton;
