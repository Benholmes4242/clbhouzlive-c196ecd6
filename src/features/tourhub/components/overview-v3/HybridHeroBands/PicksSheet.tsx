/**
 * PicksSheet — the destination behind every OUR PICKS card on the hero.
 *
 * One document, same order whichever card was tapped: header, one section per
 * pick (rank order), the method, footer. Opens at the top; no segments, no
 * pager. Nothing truncates. Absent figures omit their element — never a zero,
 * a dash or a placeholder.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PlayerAvatar } from '../../PlayerAvatar';
import { useTourSelection } from '../../../context/TourSelectionContext';
import type { AIPredictionData, AITopContender } from '../../../hooks/useAIPredictions';
import {
  AMBER,
  FONT,
  INK,
  LIVE_INK,
  LIVE_INK_BORDER_35,
  READING_INK_84,
  WHITE_ALPHA_06,
  WHITE_ALPHA_08,
  WHITE_ALPHA_45,
  WHITE_ALPHA_65,
} from '../../../_shared/tokens';

export interface PicksSheetProps {
  open: boolean;
  onClose: () => void;
  picks: AITopContender[];
  predictions: AIPredictionData | null;
  eventName: string;
  venueName: string | null;
}

const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1' };
const LABEL: React.CSSProperties = { fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: WHITE_ALPHA_45 };
const HAIRLINE: React.CSSProperties = { height: 1, background: WHITE_ALPHA_08, border: 'none', margin: 0 };

function ordinal(n: number, lang: string): string {
  if (!lang.startsWith('en')) return String(n);
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  const suffix = { one: 'st', two: 'nd', few: 'rd', other: 'th' }[rule as 'one' | 'two' | 'few' | 'other'] ?? 'th';
  return `${n}${suffix}`;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

export function PicksSheet({ open, onClose, picks, predictions, eventName, venueName }: PicksSheetProps) {
  const { t, i18n } = useTranslation('tourhub');
  const { viewingTourSlug } = useTourSelection();
  const tourCode = viewingTourSlug ?? 'pga';
  const total = picks.length;

  const consensus = predictions?.consensus ?? null;
  const modelsCount = consensus ? consensus.models.filter((m) => m.success).length : null;
  const agreement = consensus && isNum(consensus.agreementScore) ? Math.round(consensus.agreementScore) : null;
  const generated = predictions?.generatedAt ? new Date(predictions.generatedAt) : null;
  const updated = generated && !Number.isNaN(generated.getTime())
    ? new Intl.DateTimeFormat(i18n.language || 'en', { day: 'numeric', month: 'short' }).format(generated)
    : null;
  const figures = [
    modelsCount != null && modelsCount > 0 ? { label: t('overview.picksSheet.figModels'), value: String(modelsCount) } : null,
    agreement != null ? { label: t('overview.picksSheet.figAgreement'), value: `${agreement}%` } : null,
    updated ? { label: t('overview.picksSheet.figUpdated'), value: updated } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const confidence = isNum(predictions?.confidence) ? Math.round((predictions!.confidence) * 100) : null;

  const ca = predictions?.courseAnalysis;
  const winnerProfile = nonEmpty(ca?.winnerProfile) ? ca!.winnerProfile : null;
  const insight = nonEmpty(ca?.insight) ? ca!.insight : null;
  const difficulty = nonEmpty(ca?.difficulty) ? ca!.difficulty : null;
  const hasCourse = !!(winnerProfile || insight || difficulty);

  const steps = [1, 2, 3, 4] as const;

  return (
    <BottomSheet open={open} onClose={onClose} scrollBody ariaLabelledBy="overview-picks-sheet-title">
      <div data-overview-picks-sheet style={{ fontFamily: FONT, color: INK, padding: '4px 20px 24px' }}>
        {/* 1 — HEADER */}
        <div style={{ paddingBottom: 14 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: AMBER }}>
            {t('overview.picksSheet.eyebrow')}
          </div>
          <h2 id="overview-picks-sheet-title" style={{ margin: '4px 0 0', fontSize: 19, fontWeight: 800, letterSpacing: '-0.025em', color: INK }}>
            {t('overview.picksSheet.title')}
          </h2>
          {eventName ? (
            <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 600, color: WHITE_ALPHA_65 }}>
              {venueName ? `${eventName} · ${venueName}` : eventName}
            </div>
          ) : null}
        </div>
        <hr style={HAIRLINE} />

        {/* 2 — ONE SECTION PER PICK */}
        {picks.map((p, idx) => {
          const reasons = (p.reasons ?? []).filter(nonEmpty);
          const votes = p.modelVotes ?? [];
          const metaParts = [
            isNum(p.worldRanking) && p.worldRanking > 0 ? t('overview.picksSheet.worldNo', { rank: p.worldRanking }) : null,
            t('overview.picksSheet.pickOf', { rank: p.rank, total }),
          ].filter(Boolean);
          return (
            <section key={p.playerId || idx} data-overview-picks-sheet-pick style={{ padding: '16px 0' , borderBottom: idx < picks.length - 1 ? `1px solid ${WHITE_ALPHA_08}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PlayerAvatar playerId={String(p.playerId ?? '')} playerName={p.playerName} tourCode={tourCode} photoUrl={p.photoUrl ?? null} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.018em', color: INK }}>{p.playerName}</div>
                  <div style={{ marginTop: 2, fontSize: 11, fontWeight: 600, color: WHITE_ALPHA_65, ...FIGS }}>{metaParts.join(' · ')}</div>
                </div>
                {isNum(p.winProbability) ? (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={LABEL}>{t('overview.picksSheet.winProb')}</div>
                    <div style={{ marginTop: 2, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: INK, ...FIGS }}>
                      {`${Math.round(p.winProbability)}%`}
                    </div>
                  </div>
                ) : null}
              </div>

              {reasons.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <div style={LABEL}>{t('overview.picksSheet.whyLabel')}</div>
                  <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {reasons.map((reason, ri) => (
                      <li key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <span aria-hidden style={{ flexShrink: 0, width: 5, height: 5, borderRadius: 999, background: AMBER, marginTop: 7 }} />
                        <span style={{ fontSize: 12.5, lineHeight: 1.45, color: READING_INK_84 }}>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {isNum(p.courseFitScore) ? (
                <div data-overview-picks-sheet-fit style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={LABEL}>{t('overview.picksSheet.courseFit')}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: INK, ...FIGS }}>{`${Math.round(p.courseFitScore)} / 100`}</span>
                  </div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 999, background: WHITE_ALPHA_08, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, p.courseFitScore))}%`, height: '100%', background: AMBER, borderRadius: 999 }} />
                  </div>
                </div>
              ) : null}

              {votes.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <div style={LABEL}>{t('overview.picksSheet.namedBy')}</div>
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {votes.map((v, vi) => {
                      const ranked = isNum(v.rank);
                      return (
                        <span key={`${v.model}-${vi}`} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999, padding: '4px 9px', border: `1px solid ${ranked ? LIVE_INK_BORDER_35 : WHITE_ALPHA_08}`, color: ranked ? LIVE_INK : WHITE_ALPHA_65, ...FIGS }}>
                          {ranked
                            ? `${v.model} · ${ordinal(v.rank as number, i18n.language || 'en')}`
                            : `${v.model} · ${t('overview.picksSheet.notRanked')}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}

        {/* 3 — METHOD, LAST */}
        <hr style={HAIRLINE} />
        <section data-overview-picks-sheet-method style={{ paddingTop: 16 }}>
          <div style={LABEL}>{t('overview.picksSheet.howLabel')}</div>
          <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: READING_INK_84 }}>{t('overview.picksSheet.howIntro')}</p>
          <ol style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((n) => (
              <li key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span aria-hidden style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: WHITE_ALPHA_08, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: INK, ...FIGS }}>{n}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, color: READING_INK_84 }}>
                  <strong style={{ fontWeight: 800, color: INK }}>{t(`overview.picksSheet.step${n}Lead`)}</strong>{' '}
                  {t(`overview.picksSheet.step${n}Body`)}
                </span>
              </li>
            ))}
          </ol>

          {figures.length > 0 ? (
            <div data-overview-picks-sheet-figures style={{ marginTop: 14, display: 'grid', gridTemplateColumns: `repeat(${figures.length}, 1fr)`, border: `1px solid ${WHITE_ALPHA_08}`, borderRadius: 8, overflow: 'hidden' }}>
              {figures.map((f, fi) => (
                <div key={f.label} style={{ padding: '10px 12px', borderLeft: fi > 0 ? `1px solid ${WHITE_ALPHA_08}` : 'none' }}>
                  <div style={LABEL}>{f.label}</div>
                  <div style={{ marginTop: 3, fontSize: 15, fontWeight: 800, color: INK, ...FIGS }}>{f.value}</div>
                </div>
              ))}
            </div>
          ) : null}

          <p style={{ margin: '12px 0 0', fontSize: 11.5, lineHeight: 1.45, color: WHITE_ALPHA_65 }}>
            {t('overview.picksSheet.agreementLead')}
            {confidence != null ? ` ${t('overview.picksSheet.confidenceClause', { confidence })}` : ''}
          </p>

          {hasCourse ? (
            <div style={{ marginTop: 18 }}>
              <div style={LABEL}>{t('overview.picksSheet.whatWinsLabel')}</div>
              {winnerProfile ? <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: READING_INK_84 }}>{winnerProfile}</p> : null}
              {insight ? <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: READING_INK_84 }}>{insight}</p> : null}
              {difficulty ? (
                <div style={{ marginTop: 10, display: 'inline-block', border: `1px solid ${WHITE_ALPHA_08}`, borderRadius: 8, padding: '8px 12px', background: WHITE_ALPHA_06 }}>
                  <div style={LABEL}>{t('overview.picksSheet.figDifficulty')}</div>
                  <div style={{ marginTop: 3, fontSize: 15, fontWeight: 800, color: INK }}>{difficulty}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* 4 — FOOTER */}
        <p style={{ margin: '20px 0 0', fontSize: 11, lineHeight: 1.45, color: WHITE_ALPHA_45 }}>{t('overview.picksSheet.footer')}</p>
      </div>
    </BottomSheet>
  );
}

export default PicksSheet;
