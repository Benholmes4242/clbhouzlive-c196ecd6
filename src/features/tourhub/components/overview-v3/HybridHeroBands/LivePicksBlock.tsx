/** Tour overview LIVE STATES picks — rows, as the upcoming picks are, per the
 * signed-off tour-live-states mock. Overview live phase only; the shared
 * PicksBlock (upcoming rows, completed and tournament-page cards) is
 * untouched. Rows: avatar | name + status line | tee time or total.
 *  - not started this round / between rounds: "T35 · −2" (or the start tee
 *    before the first tee) and the tee time on the right;
 *  - started: "T17 · Thru 12" / "T17 · Finished" and the total on the right;
 *  - missed the cut: "Missed the cut" and MC.
 * Reuses the season-record door, the picks intro and the PicksSheet opener. */
import { Trans, useTranslation } from 'react-i18next';
import { AMBER } from '../../../_shared/tokens';
import { PlayerAvatar } from '../../PlayerAvatar';
import type { AITopContender } from '../../../hooks/useAIPredictions';
import { useOurPickRecord } from '../../../hooks/usePickInsights';
import { getScoreColor } from '../../../_shared/scoreColor';
import { fmtScore } from '../../../utils/fmtScore';
import { Button } from '@/components/ui/button';
import { overviewQueryReady, OverviewReadinessBand } from '../overviewShells';
import { pickGapNumber, type PickSentence } from './livePickSentences';
import './liveStates.css';
import { pickStatusToken, pickTeeText } from './PicksBlock';
import { venueTee } from '../upcomingOverviewRules';
import { livePicksHeading, teeStartKey, type LiveStage, type OverviewRoundStateResult } from '../liveStateRules';

const FIGS = { fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"kern" 1, "liga" 1' };
type Line = { position: number | null; tied: boolean; score: number | null; status?: string | null; thru?: number | null; started?: boolean };

export interface LivePickRow { sub: string | null; subScore: number | null; right: string | null; rightKind: 'tee' | 'score' | 'mc' | null; rightScore: number | null }

export function livePickRow(stage: LiveStage, line: Line | undefined, teeIso: string | null, startHole: number | null, zone: string | null, t: (k: string, o?: Record<string, unknown>) => string): LivePickRow {
  const tee = teeIso ? (venueTee(teeIso, zone)?.time ?? pickTeeText(teeIso)) : null;
  const token = pickStatusToken(line?.status);
  if (token === 'MC') return { sub: t('overview.live.picks.missedCut'), subScore: null, right: t('overview.live.picks.mc'), rightKind: 'mc', rightScore: null };
  if (token) return { sub: null, subScore: null, right: token, rightKind: 'mc', rightScore: null };
  if (stage === 'beforeTee') return { sub: startHole != null ? t(`overview.live.tees.${teeStartKey(startHole)}`) : null, subScore: null, right: tee, rightKind: tee ? 'tee' : null, rightScore: null };
  const pos = line?.position != null ? `${line.tied ? 'T' : ''}${line.position}` : null;
  if (stage !== 'between' && line?.started) {
    const thru = line.thru ?? 0;
    const sub = pos ? (thru >= 18 ? t('overview.live.picks.finished', { pos }) : t('overview.live.picks.thru', { pos, thru })) : null;
    return { sub, subScore: null, right: line.score == null ? null : fmtScore(line.score), rightKind: line.score == null ? null : 'score', rightScore: line.score };
  }
  return { sub: pos, subScore: pos && line?.score != null ? line.score : null, right: tee, rightKind: tee ? 'tee' : null, rightScore: null };
}

function boldIntro(text: string, figures: string[]) {
  const tokens = [...new Set(figures.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!tokens.length) return text;
  const pattern = new RegExp(`(${tokens.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return text.split(pattern).map((part, i) => tokens.includes(part) ? <strong key={i}>{part}</strong> : part);
}

export function LivePicksBlock({ picks, tourCode, seasonYear, stage, round, roundState, boardByPlayer, teeByPlayer, startHoleByPlayer, zone, intro, sentences = [], introFigures = [], onOpenPick, onOpenRecord }: {
  picks: AITopContender[]; tourCode: string; seasonYear: number | null; stage: LiveStage; round: number;
  roundState?: Pick<OverviewRoundStateResult, 'afterRound' | 'delayedRound' | 'notStarted'>;
  boardByPlayer: Map<string, Line>; teeByPlayer: Map<string, string> | null; startHoleByPlayer?: Map<string, number> | null; zone: string | null;
  intro: string | null; sentences?: PickSentence[]; introFigures?: string[]; onOpenPick: (id: string) => void; onOpenRecord: () => void;
}) {
  const { t } = useTranslation('tourhub');
  const recordQuery = useOurPickRecord(tourCode, seasonYear);
  const record = recordQuery.isError ? null : recordQuery.data;
  const heading = livePicksHeading(stage, round, t as never, roundState);
  const recordCopy = (key: string, o: Record<string, unknown> = {}) => t(`overview.pickRecord.${key}`, o);
  return (
    <OverviewReadinessBand id="picks" base={overviewQueryReady(recordQuery, !!tourCode && !!seasonYear)} expect={[]}>
      <div data-overview-picks data-picks-layout="live-rows" data-live-picks style={{ padding: 'var(--hero-section-gap) 20px 10px' }}>
        <div data-overview-picks-heading style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: AMBER, whiteSpace: 'nowrap', flex: 'none' }}>{t('overview.hero.ourPicks')}</span>
          <span data-live-picks-heading style={{ minWidth: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span className="live-picks-full">{heading.full}</span><span className="live-picks-short">{heading.short}</span>
          </span>
        </div>
        {record && record.picks > 0 ? <Button variant={null} size={null} data-our-record-door onClick={onOpenRecord}
          style={{ display: 'flex', alignItems: 'baseline', width: '100%', padding: 0, margin: '8px 0 0', border: 0, borderRadius: 0, background: 'transparent', textAlign: 'left', lineHeight: 1.35, fontFamily: 'inherit', fontSize: 12.5, height: 'auto', whiteSpace: 'normal', ...FIGS }}>
          <span style={{ minWidth: 0 }}><span data-pick-record-figures style={{ fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap' }}>{recordCopy('wins', { count: record.won })} · {recordCopy('topTens', { count: record.top10 })}</span>
            {record.event_count != null ? <span data-pick-record-events style={{ marginLeft: '0.28em', fontWeight: 400, color: 'rgba(248,250,252,.78)', whiteSpace: 'nowrap' }}>{recordCopy('fromEvents', { count: record.event_count })}</span> : null}</span>
          <span aria-hidden style={{ marginLeft: 'auto', paddingLeft: 8, fontSize: 15, color: 'rgba(248,250,252,.42)' }}>›</span>
        </Button> : null}
        {intro || sentences.length ? <p data-overview-picks-intro style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.45, color: 'var(--live-prose)' }}>
          {!sentences.some(s => s.replace) && intro ? <>{boldIntro(intro, introFigures)}{sentences.length ? ' ' : ''}</> : null}
          {sentences.map((s, i) => <span key={s.key}>{i ? ' ' : ''}<Trans t={t} i18nKey={s.key === 'overview.live.picks.clubhouseBehind' ? `${s.key}_${s.values.gap === 1 ? 'one' : 'other'}` : s.key}
            values={{ ...s.values, gap: typeof s.values.gap === 'number' ? pickGapNumber(s.values.gap, t) : s.values.gap }} components={{ b: <strong /> }} /></span>)}
        </p> : null}
        <div data-overview-picks-rows style={{ marginTop: 6 }}>
          {picks.slice(0, 3).map(p => {
            const id = String(p.playerId ?? '');
            const row = livePickRow(roundState?.delayedRound != null ? 'between' : stage, boardByPlayer.get(id), teeByPlayer?.get(id) ?? null, startHoleByPlayer?.get(id) ?? null, zone, t as never);
            return (
              <button type="button" key={id} data-overview-pick-card data-overview-pick-row onClick={() => onOpenPick(p.playerId)}
                aria-label={t('overview.picksSheet.cardAria', { name: p.playerName, defaultValue: `Why we picked ${p.playerName}` })}
                className="active:opacity-70 transition-opacity"
                style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr) auto', gap: 12, alignItems: 'center', height: 48, width: '100%', margin: 0, padding: 0, border: 0, background: 'transparent', color: 'inherit', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                <div data-overview-pick-avatar style={{ display: 'flex' }}><PlayerAvatar playerId={id} playerName={p.playerName} tourCode={tourCode} photoUrl={p.photoUrl ?? null} headshotOverride={p.headshotOverride ?? null} size={26} /></div>
                <span style={{ minWidth: 0 }}>
                  <span data-overview-pick-name style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.playerName}</span>
                  {row.sub ? <span data-live-pick-sub style={{ display: 'block', marginTop: 2, fontSize: 11.5, fontWeight: 400, color: 'rgba(248,250,252,.42)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...FIGS }}>
                    {row.sub}{row.subScore != null ? <> · <span style={{ color: getScoreColor(row.subScore, 'dark') }}>{fmtScore(row.subScore)}</span></> : null}
                  </span> : null}
                </span>
                {row.right ? <span data-live-pick-right={row.rightKind ?? undefined} style={{ fontSize: row.rightKind === 'score' ? 15 : 12.5, fontWeight: row.rightKind === 'score' ? 700 : 600, textAlign: 'right', whiteSpace: 'nowrap', color: row.rightKind === 'score' ? getScoreColor(row.rightScore, 'dark') : row.rightKind === 'mc' ? 'rgba(248,250,252,.42)' : '#F8FAFC', ...FIGS }}>{row.right}</span> : <span />}
              </button>
            );
          })}
        </div>
      </div>
    </OverviewReadinessBand>
  );
}
