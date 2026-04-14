/**
 * LeadersMasthead — Dispatch editorial header for Performance Rankings.
 * Replaces LeadersHero + LeadersRunnersStrip + LeadersStatContext.
 * Slate background, category name as headline, No.1 cover story,
 * #2–#3 as flat runner grid on slate.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderCategory } from './constants';

interface LeadersMastheadProps {
  leader: {
    player: {
      id: string;
      full_name: string;
      country: string | null;
      country_code: string | null;
      photo_url: string | null;
      pga_tour_id: string | null;
      tour_codes?: string[] | null;
    };
    playerId: string;
    value: number;
    rank: number;
  } | null;
  runners: Array<{
    player: {
      id: string;
      full_name: string;
      country: string | null;
      country_code: string | null;
      photo_url: string | null;
      pga_tour_id: string | null;
      tour_codes?: string[] | null;
    };
    playerId: string;
    value: number;
    rank: number;
  }>;
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
  leaderValue?: string;
  onChangeCategoryTap: () => void;
}

export function LeadersMasthead({
  leader,
  runners,
  category,
  formatOverride,
  unitOverride,
  leaderValue,
  onChangeCategoryTap,
}: LeadersMastheadProps) {
  if (!leader) return null;

  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;
  const formattedValue = `${fmt(leader.value)}${unit ? ` ${unit}` : ''}`;
  const countryName = titleCaseCountry(leader.player.country);
  const photoUrl = getPlayerHeadshotUrl(
    leader.player.full_name,
    leader.player.tour_codes?.[0] ?? 'pga'
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${category.key}-${leader.playerId}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }}
      >
        {/* Amber eyebrow */}
        <div style={{ fontSize: '15px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
          ⚡ CLBHOUZ · PERFORMANCE RANKINGS
        </div>

        {/* Masthead double-rule band */}
        <div style={{ borderTop: '2px solid rgba(255,255,255,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '10px 0', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Category name as headline */}
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
              {category.label}
            </h1>

            {/* Change category pill */}
            <button
              onClick={onChangeCategoryTap}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
              }}
              className="active:scale-[0.97] transition-transform"
            >
              <span style={{ fontSize: '15px' }}>{(category as any).emoji}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                Change
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>▾</span>
            </button>
          </div>

          {/* Stat context inline — tour avg + leader value */}
          {(category.tourAverage || leaderValue) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              {category.tourAverage && category.tourAverage !== '—' && (
                <>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Tour avg</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
                    {category.tourAverage}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>·</span>
                </>
              )}
              {leaderValue && (
                <>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Leader</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#F7931E', fontVariantNumeric: 'tabular-nums' }}>
                    {leaderValue}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* No.1 Cover Story */}
        <Link
          to={`/tourhub/player/${leader.player.id}`}
          style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', textDecoration: 'none', marginBottom: 0 }}
          className="active:opacity-80 transition-opacity"
        >
          {/* Left — faded rank + identity + value */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: '14px' }}>
            {/* Rank eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: 'rgba(247,147,30,0.2)', lineHeight: 1, letterSpacing: '-0.04em' }}>
                1
              </span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em' }}>SEASON LEADER</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <CountryFlag country={leader.player.country_code || leader.player.country} size="sm" />
                  {countryName && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{countryName}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Player name */}
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '8px' }}>
              {leader.player.full_name}
            </div>

            {/* Stat value in amber */}
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.02em' }}>
              {formattedValue}
            </span>
          </div>

          {/* Right — contained headshot, bottom-anchored */}
          <div style={{ flexShrink: 0, width: '100px', alignSelf: 'flex-end' }}>
            <div style={{ width: '100px', height: '120px', borderRadius: '12px 12px 0 0', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
              <img
                src={photoUrl}
                alt={leader.player.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
                onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
              />
            </div>
          </div>
        </Link>

        {/* #2–#3 runner strip — flat 2-col grid on slate */}
        {runners.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
            {runners.slice(0, 2).map((runner, i) => {
              const fmtRunner = formatOverride ?? category.format;
              const unitRunner = unitOverride ?? category.unit;
              const runnersLastName = runner.player.full_name.split(' ').slice(-1)[0];
              const runnerPhoto = getPlayerHeadshotUrl(runner.player.full_name, runner.player.tour_codes?.[0] ?? 'pga');
              return (
                <Link
                  key={runner.playerId}
                  to={`/tourhub/player/${runner.player.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRight: i === 0 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                    textDecoration: 'none',
                  }}
                  className="active:opacity-70 transition-opacity"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,0.15)', width: '16px', flexShrink: 0 }}>
                      {runner.rank}
                    </span>
                    {/* 22px squircle avatar */}
                    <div style={{ width: '22px', height: '22px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}>
                      <img
                        src={runnerPhoto}
                        alt={runner.player.full_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%' }}
                        onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                      />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {runnersLastName}
                    </span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: '6px' }}>
                    {fmtRunner(runner.value)}{unitRunner ? ` ${unitRunner}` : ''}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
