import React from 'react';
import type { EchoMessageMeta } from '../hooks/useEchoChatMessages';

const AMBER = '#F7931E';
const MUTED = '#AEB4BC';

interface Props {
  meta: EchoMessageMeta | null | undefined;
}

export const EchoConsensusLine: React.FC<Props> = ({ meta }) => {
  if (!meta || Object.keys(meta).length === 0) return null;

  let label = 'Echo Intelligence';
  const engines = typeof meta.engines === 'number' ? meta.engines : 0;
  if (engines > 1) label += ` \u2022 weighted consensus \u2022 ${engines} engines`;
  if (meta.live) label += ' \u2022 live data';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, paddingLeft: 2 }}>
      <span
        aria-hidden="true"
        style={{ width: 5, height: 5, borderRadius: 999, background: AMBER, display: 'inline-block' }}
      />
      <span style={{ fontSize: 10.5, color: MUTED, letterSpacing: 0.1 }}>{label}</span>
    </div>
  );
};

export default EchoConsensusLine;
