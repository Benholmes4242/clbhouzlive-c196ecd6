/**
 * ComingUp — date-block rows with MAJOR/PLAYOFFS chips and right-side
 * thin days-away column. Fetches up to 15 events; displays 5 per page
 * with horizontal snap paging and page dots.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SectionShell, V4Card } from './SectionShell';
import { V4, NUMERAL_THIN } from '../tokens';
import { useComingUp, type ComingUpRow } from '../data/useComingUp';
import type { TourId } from '../../hooks/useOverviewData';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import { formatMonthShort } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 5;

export function ComingUp({ tour }: { tour: TourId | null }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data, isLoading } = useComingUp(tour, 15);
  const rows = data ?? [];
  const showTourTag = tour === null;

  const pages = useMemo(() => {
    const out: ComingUpRow[][] = [];
    for (let i = 0; i < rows.length; i += PAGE_SIZE) out.push(rows.slice(i, i + PAGE_SIZE));
    return out;
  }, [rows]);

  const trackRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const idx = Math.round(el.scrollLeft / w);
      setActivePage((prev) => (prev === idx ? prev : idx));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [pages.length]);

  if (isLoading && rows.length === 0) {
    return (
      <SectionShell eyebrow={t('overview.comingUp.eyebrow')} linkLabel={t('overview.comingUp.linkLabel')} onLinkClick={() => navigate(tour ? `/tourhub?tab=schedule&tour=${tour}` : '/tourhub?tab=schedule')}>
      <div style={{ padding: '0 16px 10px', fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
        {t('overview.comingUp.subline')}
      </div>

        <div style={{ margin: '0 16px' }}>
          <V4Card style={{ overflow: 'hidden' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '11px 14px',
                  borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                }}
              >
                <Skeleton className="h-8 w-12 rounded" />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton className="h-3.5 w-3/5 rounded" />
                  <Skeleton className="h-3 w-2/5 rounded" />
                </div>
                <Skeleton className="h-6 w-8 rounded" />
              </div>
            ))}
          </V4Card>
        </div>
      </SectionShell>
    );
  }
  if (rows.length === 0) return null;

  return (
    <SectionShell eyebrow={t('overview.comingUp.eyebrow')} linkLabel={t('overview.comingUp.linkLabel')} onLinkClick={() => navigate(tour ? `/tourhub?tab=schedule&tour=${tour}` : '/tourhub?tab=schedule')}>
      <div style={{ padding: '0 16px 10px', fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
        {t('overview.comingUp.subline')}
      </div>
      <div style={{ margin: '0 16px' }}>
        <V4Card style={{ overflow: 'hidden' }}>
          <div
            ref={trackRef}
            className="coming-up-track"
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {pages.map((page, pi) => (
              <div
                key={pi}
                style={{
                  flex: '0 0 100%',
                  width: '100%',
                  scrollSnapAlign: 'start',
                }}
              >
                {page.map((r, i) => {
                  const soon = r.days_away <= 7;
                  const d = new Date(r.start_date);
                  const day = d.getDate();
                  const mon = formatMonthShort(d).toUpperCase();
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/tourhub/tournament/${r.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        padding: '11px 14px',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 21, color: r.isMajor ? V4.amberDeep : V4.ink, lineHeight: 1, ...NUMERAL_THIN }}>{day}</div>
                        <div style={{ marginTop: 4, fontSize: 8.5, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.12em' }}>{mon}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          {showTourTag ? <Chip label={TOUR_LABEL[r.tour_slug] ?? r.tour_slug} fg={V4.inkMute} gradient={V4.hairline} /> : null}
                          {r.isMajor ? <Chip label={t('pill.majorEyebrow')} fg={V4.goldDeep} gradient={`linear-gradient(90deg, ${V4.goldSoftA}, ${V4.goldSoftB})`} /> : null}
                          {r.isPlayoff ? <Chip label={t('overview.comingUp.chipPlayoffs')} fg={V4.violet} gradient={V4.violetSoft} /> : null}
                        </div>
                       <div style={{ fontSize: 13, fontWeight: 600, color: V4.ink, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {r.name}
                       </div>
                       <div style={{ marginTop: 2, fontSize: 11, fontWeight: 500, color: V4.inkMute }}>

                          {r.venue ?? '—'}
                          {r.defending_champion ? <span style={{ color: V4.inkFaint }}>{t('overview.comingUp.venueDefendsSep', { name: r.defending_champion })}</span> : null}
                        </div>
                      </div>
                      <div style={{ width: 44, textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, color: r.isMajor && soon ? V4.amberDeep : r.isMajor ? V4.ink : V4.inkMute, lineHeight: 1, ...NUMERAL_THIN }}>{r.days_away}</div>
                        <div style={{ marginTop: 4, fontSize: 7.5, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.12em' }}>{t('overview.comingUp.daysLabel')}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <style>{`.coming-up-track::-webkit-scrollbar{display:none}`}</style>
        </V4Card>
        {pages.length > 1 ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            {pages.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === activePage ? '#0F172A' : 'rgba(15,23,42,0.2)',
                  transition: 'background 160ms ease',
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

function Chip({ label, fg, gradient }: { label: string; fg: string; gradient: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: 4,
        background: gradient,
        color: fg,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}
