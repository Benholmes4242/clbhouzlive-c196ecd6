/**
 * CollegeMasthead — Dispatch editorial header for College Franchise Hub.
 * Replaces CollegeHeroBanner + AlumniFaceStrip.
 * Slate background. #1 college as cover story with alumni strip right.
 * 4-col stat grid on slate.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';

type ActiveMetric = 'earnings' | 'wins' | 'top10s';

const METRIC_LABEL: Record<ActiveMetric, string> = {
  earnings: '#1 BY EARNINGS',
  wins: '#1 BY WINS',
  top10s: '#1 BY TOP 10s',
};

interface CollegeMastheadProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  activeMetric: ActiveMetric;
  heroAlumni: AlumniFace[] | null;
}

export function CollegeMasthead({
  stats,
  college,
  activeMetric,
  heroAlumni,
}: CollegeMastheadProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(college?.college_name || stats.normalized_name);

  const primaryValue = activeMetric === 'wins'
    ? String(stats.wins_total)
    : activeMetric === 'top10s'
    ? String(stats.top10_total)
    : formatCurrency(stats.earnings_total);

  const primaryUnit = activeMetric === 'wins' ? 'wins this season'
    : activeMetric === 'top10s' ? 'top 10s this season'
    : 'season earnings';

  const visibleAlumni = (heroAlumni ?? []).slice(0, 4);
  const overflowCount = stats.player_count - visibleAlumni.length;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${stats.normalized_name}-${activeMetric}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: '#0F172A', padding: '0 16px 0' }}
      >
        {/* Amber eyebrow */}
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '10px', paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}>
          ⚡ CLBHOUZ · COLLEGE RANKINGS
        </div>

        {/* Masthead double-rule band */}
        <div style={{ borderTop: '2px solid rgba(255,255,255,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '10px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>
              College Rankings
            </h1>
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
              Season 2025–26
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Top franchise</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#F7931E' }}>{displayName}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{primaryValue} {primaryUnit}</span>
          </div>
        </div>

        {/* No.1 Cover Story */}
        <Link to={`/tourhub/college-golf/${slug}`} style={{ textDecoration: 'none', display: 'block' }} className="active:opacity-80 transition-opacity">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '14px 0 0' }}>
            {/* Left — faded rank + identity + value */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: 'rgba(247,147,30,0.15)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  1
                </span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em' }}>
                    {METRIC_LABEL[activeMetric]}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                    {stats.player_count} alumni on tour
                  </div>
                </div>
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 6px' }}>
                {displayName}
              </h2>

              <div style={{ fontSize: '18px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.02em' }}>
                {primaryValue}
              </div>
            </div>

            {/* Right — alumni headshot strip + college logo */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px', paddingBottom: '14px' }}>
              {visibleAlumni.length > 0 && (
                <div>
                  <div style={{ fontSize: '7px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '4px', textAlign: 'center' as const }}>
                    TOP ALUMNI
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {visibleAlumni.map((alum, i) => {
                      const photoUrl = getPlayerHeadshotUrl(alum.full_name, alum.tour_codes?.[0] ?? 'pga');
                      return (
                        <div
                          key={alum.id}
                          style={{
                            width: 26, height: 26, borderRadius: '34%', overflow: 'hidden',
                            border: '1.5px solid rgba(255,255,255,0.1)',
                            marginLeft: i === 0 ? 0 : -6,
                            zIndex: visibleAlumni.length - i,
                            position: 'relative',
                            background: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          <img
                            src={photoUrl}
                            alt={alum.full_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                          />
                        </div>
                      );
                    })}
                    {overflowCount > 0 && (
                      <div style={{
                        width: 26, height: 26, borderRadius: '34%',
                        border: '1.5px solid rgba(255,255,255,0.1)',
                        marginLeft: -6, position: 'relative',
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                          +{overflowCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* College logo */}
              <div style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: '24px', fontWeight: 900, color: 'rgba(255,255,255,0.15)' }}>
                    {displayName.charAt(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* 4-col stat grid on slate */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          {([
            { label: 'EARNINGS', value: formatCurrency(stats.earnings_total), accent: activeMetric === 'earnings' },
            { label: 'WINS', value: String(stats.wins_total), accent: activeMetric === 'wins' },
            { label: 'TOP 10s', value: String(stats.top10_total), accent: activeMetric === 'top10s' },
            { label: 'ALUMNI', value: String(stats.player_count), accent: false },
          ] as const).map((s, i) => (
            <div key={s.label} style={{ padding: '9px 0 11px', textAlign: 'center', borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: '9.5px', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: '3px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: s.accent ? '#F7931E' : '#ffffff', letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
