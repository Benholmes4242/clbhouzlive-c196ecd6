import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeCompareHero } from '../components/college/CollegeCompareHero';
import { useCollegeCompare } from '../hooks/useCollegeCompare';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { formatCurrency } from '@/lib/utils/formatCurrency';

/**
 * College Compare Page - Side-by-side comparison of two colleges.
 * Route: /tourhub/college-golf/compare?c1=<slug>&c2=<slug>
 */
export function CollegeComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const c1 = searchParams.get('c1') || '';
  const c2 = searchParams.get('c2') || '';

  const { data, isLoading, error } = useCollegeCompare(c1, c2);

  const hasValidParams = c1 && c2;

  return (
    <TourHubShell immersive>
      <div className="relative min-h-screen bg-background">
        {/* ── SLATE EDITORIAL MASTHEAD ── */}
        <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }}>
          {/* Amber eyebrow */}
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
            ⚡ CLBHOUZ · COLLEGE HEAD-TO-HEAD
          </div>

          {/* Masthead double-rule band */}
          <div style={{ borderTop: '2px solid rgba(255,255,255,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '10px 0', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
                Head-to-Head
              </h1>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>
                Season 2025–26
              </span>
            </div>
          </div>

          {!hasValidParams ? (
            <div style={{ paddingBottom: '20px' }}>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                Select two colleges to compare
              </p>
            </div>
          ) : isLoading ? (
            <div className="animate-pulse" style={{ paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0', marginBottom: '0' }}>
                <div style={{ flex: 1, paddingBottom: '14px' }}>
                  <div style={{ height: '8px', width: '70px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ height: '14px', width: '80px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <div style={{ height: '20px', width: '100px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }} />
                </div>
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center', paddingBottom: '22px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: 'rgba(255,255,255,0.06)' }}>VS</span>
                </div>
                <div style={{ flex: 1, paddingBottom: '14px', display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end' }}>
                  <div style={{ height: '8px', width: '70px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ height: '14px', width: '80px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <div style={{ height: '20px', width: '100px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '36px', background: 'rgba(255,255,255,0.03)', margin: '4px' }} />)}
              </div>
            </div>
          ) : data ? (
            (() => {
              const name1 = data.college1.media?.short_name || data.college1.media?.college_name || 'College 1';
              const name2 = data.college2.media?.short_name || data.college2.media?.college_name || 'College 2';
              const logo1 = getCollegeLogoUrl(data.college1.media?.college_name || name1);
              const logo2 = getCollegeLogoUrl(data.college2.media?.college_name || name2);
              const s1 = data.college1.stats;
              const s2 = data.college2.stats;

              const c1Earnings = s1?.earnings_total || 0;
              const c2Earnings = s2?.earnings_total || 0;
              const c1WinsTotal = s1?.wins_total || 0;
              const c2WinsTotal = s2?.wins_total || 0;
              const c1Top10 = s1?.top10_total || 0;
              const c2Top10 = s2?.top10_total || 0;
              const c1Alumni = s1?.player_count || 0;
              const c2Alumni = s2?.player_count || 0;

              let led1 = 0, led2 = 0;
              const checks: [number, number][] = [
                [c1Earnings, c2Earnings],
                [c1WinsTotal, c2WinsTotal],
                [c1Top10, c2Top10],
                [c1Alumni, c2Alumni],
              ];
              checks.forEach(([v1, v2]) => {
                if (v1 > v2) led1++;
                else if (v2 > v1) led2++;
              });

              const c1Overall = led1 > led2;
              const c2Overall = led2 > led1;

              const formatEarnings = (n: number) =>
                n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${Math.round(n / 1_000)}K` : `$${n}`;

              return (
                <>
                  {/* VS band */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, marginBottom: 0 }}>
                    {/* College 1 left */}
                    <Link
                      to={`/tourhub/college-golf/${s1?.normalized_name}`}
                      style={{ flex: 1, paddingBottom: '14px', minWidth: 0, textDecoration: 'none' }}
                      className="active:opacity-80 transition-opacity"
                    >
                      <div style={{ fontSize: '8px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '5px' }}>
                        FRANCHISE 1
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {logo1 ? (
                            <img src={logo1} alt={name1} style={{ width: '28px', height: '28px', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <span style={{ fontSize: '16px', fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{name1.charAt(0)}</span>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {name1}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
                            {c1Alumni} alumni
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: c1Overall ? '#F7931E' : 'rgba(255,255,255,0.5)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {formatEarnings(c1Earnings)}
                      </div>
                      {c1Overall && (
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: '3px' }}>
                          LEADING
                        </div>
                      )}
                    </Link>

                    {/* VS slug */}
                    <div style={{ flexShrink: 0, width: '40px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', paddingBottom: '22px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}>VS</span>
                    </div>

                    {/* College 2 right */}
                    <Link
                      to={`/tourhub/college-golf/${s2?.normalized_name}`}
                      style={{ flex: 1, paddingBottom: '14px', minWidth: 0, textDecoration: 'none', textAlign: 'right' as const }}
                      className="active:opacity-80 transition-opacity"
                    >
                      <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '5px' }}>
                        FRANCHISE 2
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', justifyContent: 'flex-end' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {name2}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
                            {c2Alumni} alumni
                          </div>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {logo2 ? (
                            <img src={logo2} alt={name2} style={{ width: '28px', height: '28px', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <span style={{ fontSize: '16px', fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{name2.charAt(0)}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: c2Overall ? '#F7931E' : 'rgba(255,255,255,0.5)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {formatEarnings(c2Earnings)}
                      </div>
                      {c2Overall && (
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: '3px' }}>
                          LEADING
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* 4-col verdict strip on slate */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                    {([
                      { l: 'CATEGORIES', v: led1 === led2 ? 'Tied' : `${(led1 > led2 ? name1 : name2).split(' ')[0]} leads` },
                      { l: 'WINS', v: `${c1WinsTotal} – ${c2WinsTotal}` },
                      { l: 'TOP 10s', v: `${c1Top10} – ${c2Top10}` },
                      { l: 'PLAYERS', v: `${c1Alumni} – ${c2Alumni}` },
                    ] as const).map((s, i) => (
                      <div key={s.l} style={{ padding: '8px 0 10px', textAlign: 'center' as const, borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: '3px' }}>{s.l}</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: i === 0 ? '#F7931E' : '#ffffff', letterSpacing: '-0.02em' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()
          ) : null}
        </div>

        {/* ── STICKY HEADER ── */}
        <div
          className="sticky top-0 z-20"
          style={{
            background: 'rgba(248,250,252,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '0.5px solid rgba(15,23,42,0.08)',
            paddingTop: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 20px 9px', gap: '6px' }}>
            <button
              onClick={() => navigate('/tourhub/college-golf')}
              style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: 500, color: 'rgba(15,23,42,0.5)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              className="active:opacity-50 transition-opacity"
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
              College Golf
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '9.5px', color: '#CBD5E1', fontWeight: 600 }}>Season 2025–26</span>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
          {!hasValidParams ? (
            <div style={{ textAlign: 'center' as const, padding: '48px 20px' }}>
              <button
                onClick={() => navigate('/tourhub/college-golf')}
                style={{ fontSize: '15px', fontWeight: 600, color: '#F7931E', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Browse colleges
              </button>
            </div>
          ) : isLoading ? (
            <div style={{ marginTop: '8px' }}>
              <div style={{ background: '#fff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', height: '48px' }}>
                    <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
                    <div style={{ width: '80px', height: '3px', borderRadius: '2px', background: 'rgba(15,23,42,0.06)', margin: '0 8px' }} />
                    <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center' as const, padding: '48px 20px' }}>
              <p style={{ fontSize: '15px', color: '#94A3B8' }}>Failed to load comparison data</p>
            </div>
          ) : data ? (
            <CollegeCompareHero data={data} />
          ) : null}
        </div>
      </div>
    </TourHubShell>
  );
}
