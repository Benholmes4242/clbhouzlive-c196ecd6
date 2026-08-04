/**
 * ProfileSheetV2 · HcpStrip — "Your game" stat panel.
 *
 * Three figures from data already fetched (no new query):
 *   HANDICAP  current index + 90d delta
 *   ROUNDS    rounds in the last 90 days
 *   COURSES   distinct courses in the member's official record
 *
 * The courses count is derived client-side from useAllScores by counting
 * distinct course_id. Those are WHS-side course ids, not golf_courses ids —
 * that is deliberate and honest: it is the number of courses in the member's
 * own official record, and bridging through whs_to_golf_course_map would add
 * a dependency for an identical number.
 *
 * Hidden entirely for business actors and for members with no WHS connection.
 * Taps through to /handicap.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWhsConnection, useHandicapTrend, useHandicapHistory, useAllScores } from '@/lib/whs/hooks';
import { A, Panel, StatRow, KICKER, Action } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  actorType: 'personal' | 'business';
  actorId: string;
  onNavigate: (route: string) => void;
}

export default function HcpStrip({ actorType, actorId, onNavigate }: Props) {
  const { t } = useTranslation('common');
  const isBusiness = actorType === 'business';

  const { data: connection, isLoading: connectionLoading } = useWhsConnection(isBusiness ? undefined : actorId);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection?.id);
  const { data: history90, isLoading: historyLoading } = useHandicapHistory(connection?.id, 90);
  const { data: scores, isLoading: scoresLoading } = useAllScores(connection?.id);

  // 90-day delta: replicate HeroHandicapCardDark exactly —
  //   history90[last].handicap_index - history90[0].handicap_index
  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return history90[history90.length - 1].handicap_index - history90[0].handicap_index;
  }, [history90]);

  const rounds90d = useMemo<number | null>(() => {
    if (!scores) return null;
    const cutoff = Date.now() - 90 * 86_400_000;
    return scores.filter(
      (s: any) => s.play_date && new Date(s.play_date).getTime() >= cutoff,
    ).length;
  }, [scores]);

  const coursesPlayed = useMemo<number | null>(() => {
    if (!scores) return null;
    const ids = new Set<string>();
    for (const s of scores) {
      if (s.course_id) ids.add(s.course_id);
    }
    return ids.size;
  }, [scores]);

  if (isBusiness) return null;

  const wrap: React.CSSProperties = { margin: '12px 20px 0' };

  // A skeleton while any of the four queries is in flight — never a partial
  // stat row and never a zero.
  const pending =
    connectionLoading ||
    (!!connection && (trendLoading || historyLoading || scoresLoading));

  if (pending) {
    return (
      <div style={wrap} aria-hidden>
        <Panel>
          <div
            className="clb-shimmer-light"
            style={{ height: 64, borderRadius: 8, background: A.TRACK }}
          />
        </Panel>
      </div>
    );
  }

  // No official record at all — the panel is absent, not a row of dashes.
  if (!connection) return null;

  const current = trend?.current;
  const indexText = typeof current === 'number'
    ? (current < 0 ? `+${Math.abs(current).toFixed(1)}` : current.toFixed(1))
    : null;
  if (indexText == null) return null;

  // Delta tone. A handicap going UP means playing WORSE, so the tone follows
  // the MEANING, not the sign: rising -> OVER (red), falling -> UNDER (green).
  // This is the opposite reasoning to every other figure in the system (where
  // "+" is red because over par is worse) and arrives at the same colours for
  // different causes. Do NOT "fix" this to the generic rule — that inverts the
  // meaning.
  const rounded = delta90 == null ? null : Math.round(delta90 * 10) / 10;
  let deltaSub: string;
  let deltaTone: string;
  if (rounded == null || rounded === 0) {
    deltaSub = t('profileSheet.levelNinety');
    deltaTone = A.DIM;
  } else if (rounded > 0) {
    deltaSub = t('profileSheet.deltaNinety', { delta: `+${rounded.toFixed(1)}` });
    deltaTone = A.OVER;
  } else {
    deltaSub = t('profileSheet.deltaNinety', { delta: `\u2212${Math.abs(rounded).toFixed(1)}` });
    deltaTone = A.UNDER;
  }

  const go = () => onNavigate('/handicap');

  return (
    <div style={wrap}>
      <Panel>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span style={KICKER}>{t('profileSheet.yourGame')}</span>
          <Action label={t('profileSheet.handicap')} onClick={go} />
        </header>
        <div
          onClick={go}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              go();
            }
          }}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
        >
          <StatRow
            size={24}
            items={[
              {
                label: t('profileSheet.handicap'),
                value: indexText,
                sub: deltaSub,
                subTone: deltaTone,
              },
              ...(rounds90d != null
                ? [{
                    label: t('profileSheet.rounds'),
                    value: rounds90d,
                    sub: t('profileSheet.ninetyDays'),
                  }]
                : []),
              ...(coursesPlayed != null
                ? [{
                    label: t('profileSheet.courses'),
                    value: coursesPlayed,
                    sub: t('profileSheet.played'),
                  }]
                : []),
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}
