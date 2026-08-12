import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import ConnectGhostPrompt from '@/components/handicap/ConnectGhostPrompt';
import { ChampionsGhost } from '@/components/handicap/ConnectGhostPreviews';
import { A, LABEL } from '@/features/courses/components/holes/analytical/tokens';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const KEY_EXPLAINER = 'champions_explainer_dismissed_v1';
const KEY_PROVENANCE = 'champions_provenance_dismissed_v1';
const KEY_INFO_V2 = 'champions_info_dismissed_v2';

const read = (k: string) => {
  try { return localStorage.getItem(k) === '1'; } catch { return false; }
};
const write = (k: string) => {
  try { localStorage.setItem(k, '1'); } catch { /* ignore */ }
};

interface Props {
  window: 'all_time' | '90d';
}

interface CardShellProps {
  onDismiss: () => void;
  background: string;
  border: string;
  children: React.ReactNode;
}

const CardShell: React.FC<CardShellProps> = ({ onDismiss, background, border, children }) => (
  <div
    style={{
      position: 'relative',
      padding: '16px 38px 16px 16px',
      background,
      border,
      borderRadius: 16,
      fontFamily: FONT,
      boxSizing: 'border-box',
    }}
  >
    <button
      type="button"
      aria-label="Dismiss"
      onClick={onDismiss}
      style={{
        position: 'absolute', top: 9, right: 9, width: 22, height: 22,
        borderRadius: 999, border: 'none', background: 'var(--hcp-tint-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}
    >
      <X size={11} color={A.DIM} strokeWidth={2.6} />
    </button>
    {children}
  </div>
);

export const ChampionsInfoCarousel: React.FC<Props> = ({ window }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: whsConnection } = useWhsConnection(user?.id);
  const isSynced = !!whsConnection;
  const [gone, setGone] = useState(() =>
    read(KEY_INFO_V2) || (read(KEY_EXPLAINER) && read(KEY_PROVENANCE))
  );

  const dismiss = () => { setGone(true); write(KEY_INFO_V2); };

  if (gone) return null;

  // Unsynced users get the ghost prompt in place of the old sync CTA. It
  // supersedes the info card entirely for this state - one prompt, one place.
  if (!isSynced) {
    return (
      <ConnectGhostPrompt
        surface="champions"
        ghost={<ChampionsGhost />}
        onConnect={() => navigate('/handicap')}
      />
    );
  }

  return (
    <div style={{ margin: '12px 16px 0' }}>
      <CardShell
        onDismiss={dismiss}
        background={A.PANEL}
        border={`1px solid ${A.BORDER}`}
      >
        <div style={{ ...LABEL, marginBottom: 8 }}>CHAMPIONS &middot; OFFICIAL WHS SCORES</div>
        <p style={{ fontSize: 12, fontWeight: 500, color: A.MUTE, lineHeight: 1.55, margin: 0 }}>
          The clubhouse records board, digitalised - lowest gross, best stableford,
          most birdies and more, ranked from{' '}
          <b style={{ color: A.INK, fontWeight: 700 }}>official WHS scores</b>{' '}
          at this course, {window === 'all_time' ? 'all time' : 'over the last 90 days'}.
          Only rounds logged on your{' '}
          <b style={{ color: A.INK, fontWeight: 700 }}>official handicap record</b>{' '}
          count: no logged rounds, no crowns.
        </p>
      </CardShell>
    </div>
  );
};

export default ChampionsInfoCarousel;
