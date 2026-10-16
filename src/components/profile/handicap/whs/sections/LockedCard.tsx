/**
 * LockedCard — "Locked for your next round" (BRIEF_HANDICAP_TAB_REBUILD 2.6/2.7).
 *
 * COMPUTED EVERY RENDER, NEVER CACHED. Renders only when the index genuinely
 * cannot rise from the next round, whatever is shot:
 *   - the window is a FULL twenty with a differential on every round, and
 *   - the projected index with the worst conceivable candidate (drop the
 *     oldest, add an arbitrarily bad round) is no higher than the index the
 *     twenty produce today, and
 *   - the federation's own is_counter agrees: the twentieth (oldest) round is
 *     non-counting.
 * If any of that fails, nothing renders and nothing takes its place.
 *
 * The projection ranks differentials for a HYPOTHETICAL state only; which real
 * rounds count is read from is_counter (countsTowardIndex), never restated.
 */
import React from 'react';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAllScores } from '@/lib/whs/hooks';
import { counterWindow, countsTowardIndex } from '@/lib/whs/counting';
import { indexFromDifferentials, indexWithCandidate } from '@/lib/whs/coursePlay';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';
import { CHART } from '../charts/tokens';

/** Worse than any real differential (the WHS cap is far below this). */
const WORST_CANDIDATE = 1e6;

type Scored = { handicap_differential?: number | null; is_counter?: boolean | null };

export interface LockFacts {
  worstCounting: number;
}

/** Pure lock test. `recentFirst` is the member's scores, newest first. */
export function lockFacts(recentFirst: readonly Scored[]): LockFacts | null {
  const window = counterWindow(recentFirst);
  if (window.length < 20) return null;
  const diffs = window.map((r) => r.handicap_differential);
  if (diffs.some((d) => typeof d !== 'number' || !Number.isFinite(d))) return null;
  const oldestFirst = (diffs as number[]).slice().reverse();
  const now = indexFromDifferentials(oldestFirst);
  const worst = indexWithCandidate(oldestFirst, WORST_CANDIDATE);
  if (now == null || worst == null || worst > now + 1e-9) return null;
  const oldest = window[window.length - 1];
  if (countsTowardIndex(oldest)) return null;
  const counting = window.filter(countsTowardIndex).map((r) => r.handicap_differential as number);
  if (counting.length === 0) return null;
  return { worstCounting: Math.max(...counting) };
}

const fmt = (d: number) => (d < 0 ? `\u2212${Math.abs(d).toFixed(1)}` : d.toFixed(1));

const LockedCard: React.FC<{ connectionId: string }> = ({ connectionId }) => {
  const { t } = useTranslation(['common']);
  const { data: scores } = useAllScores(connectionId);
  const facts = scores ? lockFacts(scores) : null;
  if (!facts) return null;
  const tone = CHART.DOWN;
  return (
    <div
      data-hcp-lock
      style={{ marginTop: 14, background: MEMBER_PANEL, border: `1px solid ${tone}`, borderRadius: 12, padding: '11px 13px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: tone }}>
        <Lock size={13} strokeWidth={2.4} aria-hidden />
        {t('common:handicap.lock.title')}
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: CHART.MUTE }}>
        {t('common:handicap.lock.body', { worst: fmt(facts.worstCounting),
        })}
      </p>
    </div>
  );
};

export default LockedCard;
