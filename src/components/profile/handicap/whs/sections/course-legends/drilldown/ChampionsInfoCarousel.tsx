import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import ConnectGhostPrompt from '@/components/handicap/ConnectGhostPrompt';
import ChampionsHonoursBoard, { type HonoursCrown, type HonoursFigures } from '@/components/handicap/ChampionsHonoursBoard';
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
  /** Course context for the honours board preview. */
  courseName?: string;
  /** The image the page already loaded for the course header. No new fetch here. */
  courseHeaderImage?: string | null;
  /** Every crown category on this club, in the board's own display order. */
  crowns?: HonoursCrown[];
  /** True once the crown query has settled. Unresolved is not absent: no card. */
  boardSettled?: boolean;
  figures?: HonoursFigures;
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

export const ChampionsInfoCarousel: React.FC<Props> = ({
  window,
  courseName,
  courseHeaderImage,
  crowns,
  boardSettled = false,
  figures,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { user } = useSupabaseSession();
  const { data: whsConnection } = useWhsConnection(user?.id);
  const isSynced = !!whsConnection;
  const [gone, setGone] = useState(() =>
    read(KEY_INFO_V2) || (read(KEY_EXPLAINER) && read(KEY_PROVENANCE))
  );

  const dismiss = () => { setGone(true); write(KEY_INFO_V2); };

  if (gone) return null;

  // Unsynced members get the honours board gate in place of the old sync CTA.
  if (!isSynced) {
    // UNRESOLVED IS NOT ABSENT: nothing renders until the crown data has settled,
    // so the headline can never claim a zero it has not measured.
    if (!boardSettled || !crowns || crowns.length === 0) return null;

    const total = crowns.length;
    const held = crowns.filter((c) => !!(c.holderName && c.holderName.trim())).length;
    const open = total - held;

    // Every edge case is its own string — never concatenation. Numerals, not words.
    const headline =
      total === 1
        ? open === 0
          ? t('connectGhost.champions.headlineOneTotalHeld')
          : t('connectGhost.champions.headlineOneTotalOpen')
        : open === 0
          ? t('connectGhost.champions.headlineAll', { total })
          : held === 0
            ? t('connectGhost.champions.headlineNone', { total })
            : open === 1
              ? t('connectGhost.champions.headlineSomeOne', { total })
              : t('connectGhost.champions.headlineSome', { total, open });

    // The counted line covers the unclaimed crowns not already shown as a row.
    const shownOpen = held >= 3 && open > 0 ? 1 : Math.min(open, Math.max(0, 4 - Math.min(held, 4)));
    const remaining = Math.max(0, open - shownOpen);

    return (
      <ConnectGhostPrompt
        surface="champions"
        headlineOverride={headline}
        preview={
          <ChampionsHonoursBoard
            courseName={courseName ?? ''}
            courseHeaderImage={courseHeaderImage}
            eyebrow={t('connectGhost.champions.boardEyebrow')}
            headline={headline}
            figures={figures}
            crowns={crowns}
            remainderLine={
              remaining > 0
                ? t('connectGhost.champions.remaining', { count: remaining })
                : null
            }
            neverWonLabel={t('connectGhost.champions.neverWon')}
            openLabel={t('connectGhost.champions.open')}
            figureLabels={{
              rounds: t('connectGhost.champions.figRounds'),
              avg: t('connectGhost.champions.figAvgToPar'),
              harder: t('connectGhost.champions.figHarderThan'),
            }}
          />
        }
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
