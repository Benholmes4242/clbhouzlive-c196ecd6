import React from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { DarkCard, DarkSectionHeader } from '../_shared/darkAtoms';
import { MiniRing, sharedMax, LABEL_STYLE, type ChartTone } from '../../charts';
import {
  useScoringBreakdownAllCourses,
  type ParSplit,
  type ScoringBreakdownAllCourses,
} from '@/lib/whs/hooks';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const MIN_HOLES_PAR_TYPE = 50;
const MIN_ROUNDS = 10;
const MIN_COURSES = 3;

interface Props {
  readOnly?: boolean;
}

type ParTypeKey = 'par3' | 'par4' | 'par5';
interface RingRow {
  key: ParTypeKey;
  parN: 3 | 4 | 5;
  data: ParSplit;
}


const GameEverywhereBody: React.FC<{ d: ScoringBreakdownAllCourses }> = ({ d }) => {
  const { t } = useTranslation(['courses', 'common']);

  const rings: RingRow[] = ([
    { key: 'par3', parN: 3, data: d.par3 },
    { key: 'par4', parN: 4, data: d.par4 },
    { key: 'par5', parN: 5, data: d.par5 },
  ] as Array<{ key: ParTypeKey; parN: 3 | 4 | 5; data: ParSplit | null }>)
    .filter((r): r is RingRow => !!r.data && r.data.holes_played >= MIN_HOLES_PAR_TYPE);

  const showS1 = rings.length >= 2;

  // Rank rings by avg_over: worst = up (red), best = down (green), middle = amber.
  const ranked = [...rings].sort((a, b) => a.data.avg_over - b.data.avg_over);
  const toneFor = (row: RingRow): ChartTone => {
    if (ranked.length <= 1) return 'amber';
    if (row === ranked[ranked.length - 1]) return 'up';
    if (row === ranked[0]) return 'down';
    return 'amber';
  };

  /** ONE ceiling for the group - per-ring maxima would render all three full. */
  const ringMax = sharedMax(rings.map((r) => r.data.avg_over), 0.7);

  // Stratum 1 sentence
  const worst = ranked[ranked.length - 1];
  const best = ranked[0];
  const totalHoles = rings.reduce((s, r) => s + r.data.holes_played, 0);
  const share =
    worst && totalHoles > 0 ? Math.round((worst.data.holes_played / totalHoles) * 100) : 0;


  return (
    <>
      {/* Headline */}
      <div
        style={{
          padding: '18px 0',
          margin: '0 18px',
          borderBottom: '1px solid var(--hcp-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '-0.022em',
            lineHeight: 1,
            color: 'var(--hcp-t-100)',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          +{(d.avg_over_par ?? 0).toFixed(1)}
        </span>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--hcp-t-80)',
            lineHeight: 1.3,
            whiteSpace: 'pre-line',
          }}
        >
          {t('holes.gameEverywhere.headlineUnit')}
        </span>
      </div>
      <div
        style={{
          padding: '10px 18px 0',
          fontSize: 12.5,
          fontWeight: 500,
          color: 'var(--hcp-t-40)',
        }}
      >
        {t('holes.gameEverywhere.builtFrom', {
          count: d.rounds,
          rounds: d.rounds,
          courses: d.courses_played,
        })}
      </div>

      {/* Stratum 1 — rings */}
      {showS1 && (
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid var(--hcp-line)' }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
              letterSpacing: '-0.01em',
            }}
          >
            {t('holes.gameEverywhere.s1Title')}
          </div>
          <div style={{ marginTop: 3, fontSize: 12, color: 'var(--hcp-t-60)' }}>
            {t('holes.gameEverywhere.s1Sub')}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
            {rings.map((row) => (
              <div key={row.key} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <MiniRing
                  value={row.data.avg_over}
                  max={ringMax}
                  label={t('holes.gameEverywhere.parNs', { n: row.parN })}
                  sub={t('holes.gameEverywhere.nHoles', { count: row.data.holes_played })}
                  tone={toneFor(row)}
                />
              </div>
            ))}
          </div>

          {worst && best && worst !== best && (
            <div
              style={{
                marginTop: 13,
                fontSize: 13.5,
                fontWeight: 500,
                color: 'var(--hcp-t-80)',
                lineHeight: 1.5,
              }}
            >
              {t('holes.gameEverywhere.s1Sentence', {
                worst: worst.parN,
                worstAvg: worst.data.avg_over.toFixed(2),
                best: best.parN,
                bestAvg: best.data.avg_over.toFixed(2),
                share,
              })}
            </div>
          )}
        </div>
      )}
      {/* "How your rounds unfold" now lives in RoundShapePanel, using ThirdsChart. */}

    </>
  );
};

export const GameEverywhereCard: React.FC<Props> = ({ readOnly = false }) => {
  const { t } = useTranslation(['courses', 'common']);
  const enabled = !readOnly;
  const { data, isLoading, isError } = useScoringBreakdownAllCourses(enabled);

  if (readOnly) return null;

  if (isLoading) {
    return (
      <section style={{ marginTop: 24 }}>
        <DarkSectionHeader
          eyebrow={t('holes.gameEverywhere.eyebrow')}
          title={t('holes.gameEverywhere.title')}
        />
        <DarkCard>
          <div style={{ padding: 18 }}>
            <Skeleton className="h-12 w-40 mb-3" />
            <Skeleton className="h-4 w-64 mb-6" />
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <Skeleton className="h-24 flex-1 rounded-full" />
              <Skeleton className="h-24 flex-1 rounded-full" />
              <Skeleton className="h-24 flex-1 rounded-full" />
            </div>
            <div style={{ display: 'flex', gap: 12, height: 120 }}>
              <Skeleton className="flex-1 h-full" />
              <Skeleton className="flex-1 h-full" />
              <Skeleton className="flex-1 h-full" />
            </div>
          </div>
        </DarkCard>
      </section>
    );
  }

  if (isError || !data) return null;
  if (data.rounds < MIN_ROUNDS) return null;
  if (data.courses_played < MIN_COURSES) return null;
  if (data.avg_over_par == null) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <DarkSectionHeader
        eyebrow={t('holes.gameEverywhere.eyebrow')}
        title={t('holes.gameEverywhere.title')}
        right={
          <span style={{ ...LABEL_STYLE }}>
            {t('common:handicap.form.nRoundsSample', { count: data.rounds })}
          </span>
        }
      />
      <DarkCard>
        <GameEverywhereBody d={data} />
      </DarkCard>
    </section>
  );
};

export default GameEverywhereCard;
