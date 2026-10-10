import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { playDateShort } from '@/components/explore-tab-new/courseled/discoverWhen';
import type { FeatBoardKey } from '@/components/explore-tab-new/courseled/boardFilters';

import type { FeatWindow, FeatYearRow } from './useFeatsWindow';
import { FEAT_I18N, RARE_AIR, RARE_AIR_TILE_HEIGHT, compareRates, rarityShare } from './rareAir';

const T = RARE_AIR.tile;
const L = T.latest;

/** Lede: "Out of {holes} holes and {rounds} rounds tracked on clbhouz[ this year]." No in-code default. */
export function RareAirLede({ totals, window }: { totals: FeatYearRow; window: FeatWindow }) {
  return (
    <span style={{ fontSize: RARE_AIR.lede.fontSize, lineHeight: RARE_AIR.lede.lineHeight }}>
      <Trans
        i18nKey={window === 'year' ? 'amateur.leaderboards.featsFromYear' : 'amateur.leaderboards.featsFrom'}
        values={{ rounds: totals.total_rounds.toLocaleString(), holes: totals.total_holes.toLocaleString() }}
        components={{ n: <span className="tabular-nums" style={{ fontWeight: 700, color: A.INK }} /> }}
      />
    </span>
  );
}

/** The you slab — same device as the lead board's. Not rendered signed out. */
export function RareAirYou({ rows, locale }: { rows: FeatYearRow[]; locale?: string }) {
  const { t } = useTranslation('courses');
  const Y = RARE_AIR.you;
  const had = rows.filter((r) => r.viewer_events > 0);
  const you = <span style={{ fontWeight: 700, color: A.INK }} />;
  let body: ReactNode;
  if (had.length === 0) {
    body = <Trans i18nKey="amateur.leaderboards.featsYou.none" components={{ b: you }} />;
  } else {
    const items = had.map((r) => t(`amateur.leaderboards.featsYou.item.${FEAT_I18N[r.feat_kind]}`, { count: r.viewer_events }));
    const list = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
    body = <Trans i18nKey="amateur.leaderboards.featsYou.has" values={{ list }} components={{ b: you }} />;
  }
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: Y.radius, background: Y.background,
        padding: Y.padding, marginBottom: Y.marginTop, fontSize: Y.fontSize, lineHeight: Y.lineHeight, color: A.MUTE,
      }}
    >
      <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Y.bar, background: A.AMBER }} />
      {body}
    </div>
  );
}

export function RareAirRail({
  rows,
  allRows,
  window,
  locale,
  onOpen,
}: {
  rows: FeatYearRow[];
  /** All-time rows: the rarity bar always reads these, and the comparison's baseline. */
  allRows: FeatYearRow[];
  window: FeatWindow;
  locale?: string;
  onOpen: (key: FeatBoardKey) => void;
}) {
  const { t } = useTranslation('courses');
  const R = RARE_AIR.rail;
  const allOf = (k: string) => allRows.find((r) => r.feat_kind === k);
  return (
    <>
      <div style={{
        marginInline: -R.side, padding: RARE_AIR.label.padding, fontSize: RARE_AIR.label.fontSize,
        fontWeight: RARE_AIR.label.fontWeight, letterSpacing: RARE_AIR.label.letterSpacing,
        lineHeight: `${RARE_AIR.label.lineHeight - 2}px`, textTransform: 'uppercase', color: A.DIM,
      }}>
        {t('amateur.leaderboards.rarestFirst')}
      </div>
      <div style={{ position: 'relative', marginInline: -R.side }}>
        <div
          style={{
            display: 'flex', gap: R.gap, overflowX: 'auto', scrollSnapType: 'x mandatory',
            paddingInline: R.side, scrollPaddingInline: R.side, paddingTop: R.top, paddingBottom: R.bottom,
            scrollbarWidth: 'none', willChange: 'transform',
          }}
        >
          {rows.map((f, i) => {
            const all = allOf(f.feat_kind);
            const share = rarityShare(all);
            const cmp = window === 'year' ? compareRates(f, all) : null;
            const name = t(`amateur.leaderboards.feat.${FEAT_I18N[f.feat_kind]}`, { count: f.events });
            const unit = t(`amateur.leaderboards.unit.${f.denominator_unit}`);
            const rate = f.events > 0
              ? t('amateur.leaderboards.featRarity', { n: Math.round(f.denominator / f.events).toLocaleString(), unit })
              : t('amateur.leaderboards.featNone', { n: f.denominator.toLocaleString(), unit });
            const has = !!f.latest_play_date;
            const lastAll = all?.latest_play_date ?? null;
            return (
              <button
                key={f.feat_kind}
                type="button"
                onClick={() => onOpen(f.feat_kind as FeatBoardKey)}
                style={{
                  width: T.width, height: RARE_AIR_TILE_HEIGHT, boxSizing: 'border-box', flex: 'none', scrollSnapAlign: 'start', background: A.PANEL,
                  border: `1px solid ${A.BORDER}`, borderRadius: T.radius, overflow: 'hidden',
                  padding: 0, paddingBottom: T.paddingBottom, textAlign: 'left', fontFamily: SANS, cursor: 'pointer',
                }}
              >
                <span aria-hidden style={{ display: 'block', height: T.accentHeight, background: A.BORDER, position: 'relative' }}>
                  {share > 0 ? (
                    <span style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: `${share * 100}%`,
                      background: `linear-gradient(to right, ${T.accentFrom}, ${T.accentTo})`,
                    }} />
                  ) : null}
                </span>
                <span style={{ display: 'block', padding: T.bodyPadding }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: T.nameRow, minWidth: 0 }}>
                    <span style={{
                      minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontSize: T.name.fontSize, fontWeight: T.name.fontWeight, letterSpacing: T.name.letterSpacing,
                      textTransform: 'uppercase', color: A.MUTE,
                    }}>
                      {name}
                    </span>
                    {i === 0 ? (
                      <span style={{
                        flexShrink: 0, fontSize: T.pill.fontSize, fontWeight: T.pill.fontWeight, letterSpacing: T.pill.letterSpacing,
                        textTransform: 'uppercase', color: A.AMBER, border: `1px solid ${T.pill.border}`, borderRadius: 999,
                        padding: T.pill.padding, lineHeight: 1,
                      }}>
                        {t('amateur.leaderboards.rarest')}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums" style={{
                    display: 'block', marginTop: T.count.marginTop, fontSize: T.count.fontSize, fontWeight: T.count.fontWeight,
                    letterSpacing: T.count.letterSpacing, lineHeight: 1, color: f.events > 0 ? A.INK : A.DIM,
                  }}>
                    {f.events.toLocaleString()}
                  </span>
                  <span className="tabular-nums" style={{ display: 'block', marginTop: T.rate.marginTop, fontSize: T.rate.fontSize, lineHeight: `${T.rate.lineHeight}px`, color: A.DIM }}>
                    <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, color: A.MUTE }}>{rate}</span>
                    <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t('amateur.leaderboards.nMembers', { count: f.members })}
                      {cmp?.kind === 'commoner' ? (
                        <span style={{ fontWeight: 700, color: A.GREEN }}> · {t('amateur.leaderboards.featCompare.commoner', { n: cmp.pct })}</span>
                      ) : cmp?.kind === 'rarer' ? (
                        <span style={{ fontWeight: 700, color: A.MUTE }}> · {t('amateur.leaderboards.featCompare.rarer', { n: cmp.pct })}</span>
                      ) : cmp?.kind === 'tooFew' ? (
                        <span style={{ fontWeight: 700, color: A.MUTE }}> · {t('amateur.leaderboards.featCompare.tooFew')}</span>
                      ) : null}
                    </span>
                  </span>
                </span>
                <span aria-hidden style={{ display: 'block', height: 1, background: A.SOFT, margin: T.hairlineMargin }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: L.gap, padding: L.padding }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block', fontSize: L.whoSize, lineHeight: `${L.whoLine}px`, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: has ? 600 : 400, color: has ? A.INK : A.DIM,
                    }}>
                      {has
                        ? (f.latest_display_name || t('discover.aMember'))
                        : t(window === 'year' ? 'amateur.leaderboards.featLatest.noneYear' : 'amateur.leaderboards.featLatest.noneAll')}
                    </span>
                    <span style={{
                      display: 'block', fontSize: L.whereSize, lineHeight: `${L.whereLine}px`, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis', color: A.DIM,
                    }}>
                      {has
                        ? [f.latest_course_name, playDateShort(f.latest_play_date, locale)].filter(Boolean).join(' · ')
                        : lastAll
                          ? t('amateur.leaderboards.featLatest.lastOne', { date: playDateShort(lastAll, locale) })
                          : '\u00A0'}
                    </span>
                  </span>
                  <span aria-hidden style={{ flexShrink: 0, display: 'flex', color: A.DIM }}>
                    <ChevronRight size={L.chevron} />
                  </span>
                </span>
              </button>
            );
          })}
          <span style={{ flex: `0 0 ${R.endSpacer}px` }} aria-hidden />
        </div>
        <span aria-hidden style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: R.fade, pointerEvents: 'none',
          background: `linear-gradient(to right, transparent, ${A.CANVAS})`,
        }} />
      </div>
    </>
  );
}
