/**
 * EditorialUpcomingHero — expanded-state Tour Hero "Upcoming" surface.
 *
 * C2 Editorial · Elastic redesign:
 * - Light theme on #F8FAFC, 70dvh hard cap, no internal scroll
 * - ElasticZone: eyebrow + status + title + venue (above TEES OFF IN block)
 * - Below: countdown + course facts + defending champion + (optional) favourites + CTA
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trophy } from 'lucide-react';
import { tournamentRoute } from '../../routes';
import { ElasticZone } from '../shared/ElasticZone';
import {
  TournamentTitleBlock,
  TourBadge,
  StatusBadge,
} from '../shared/TournamentTitleBlock';
import { HeroCTA } from '../shared/HeroCTA';
import { useCountdown } from '@/hooks/useCountdown';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import {
  ink, amber, gold, blue,
  lightBg, slate100, slate200, slate300, slate400, slate500,
} from '../../utils/heroAtmosphere';

const COUNTRY_TO_FLAG: Record<string, string> = {
  'UNITED STATES': '🇺🇸', 'USA': '🇺🇸',
  'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'NORTHERN IRELAND': '🇮🇪',
  'SCOTLAND': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'WALES': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'IRELAND': '🇮🇪',
  'AUSTRALIA': '🇦🇺', 'CANADA': '🇨🇦', 'JAPAN': '🇯🇵', 'SOUTH AFRICA': '🇿🇦',
  'SPAIN': '🇪🇸', 'GERMANY': '🇩🇪', 'FRANCE': '🇫🇷', 'SWEDEN': '🇸🇪',
  'NORWAY': '🇳🇴', 'DENMARK': '🇩🇰', 'SOUTH KOREA': '🇰🇷', 'CHINA': '🇨🇳',
};
function flagFor(country: string | null | undefined): string {
  if (!country) return '';
  return COUNTRY_TO_FLAG[country.toUpperCase()] ?? '';
}
function getTourCode(slug: string): string {
  const map: Record<string, string> = {
    pga: 'PGA', euro: 'DPW', lpga: 'LPGA', liv: 'LIV',
    champ: 'CHAMP', pgad: 'KFT',
  };
  return map[slug] ?? slug.toUpperCase();
}
function getStartLabel(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  const days = differenceInDays(d, new Date());
  if (days <= 7) return `In ${days} days`;
  return format(d, 'MMM d').toUpperCase();
}
function formatPurseShort(purse: number | null | undefined): string | null {
  if (!purse || purse <= 0) return null;
  if (purse >= 1_000_000) return `$${(purse / 1_000_000).toFixed(purse % 1_000_000 === 0 ? 0 : 1)}M`;
  if (purse >= 1_000) return `$${(purse / 1_000).toFixed(0)}K`;
  return `$${purse}`;
}

// ---------- Countdown + course facts block ---------------------------------

function CountdownBlock({
  startDate, purse, par, yardage,
}: {
  startDate: string;
  purse: number | null;
  par: number | null;
  yardage: number | null;
}) {
  const cd = useCountdown(startDate);
  const days = cd?.days ?? 0;
  const hours = cd?.hours ?? 0;
  const mins = cd?.minutes ?? 0;

  const facts: Array<[string, string]> = [];
  const purseLabel = formatPurseShort(purse);
  if (purseLabel) facts.push([purseLabel, 'purse']);
  if (par) facts.push([`Par ${par}`, '']);
  if (yardage) facts.push([`${yardage.toLocaleString()}y`, '']);

  const cells = [
    { v: days, label: 'DAYS' },
    { v: hours, label: 'HOURS' },
    { v: mins, label: 'MINS' },
  ];

  return (
    <div style={{
      flexShrink: 0,
      borderTop: `1px solid ${slate200}`,
      borderBottom: `1px solid ${slate200}`,
      padding: '14px 0',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
      }}>
        <Calendar size={11} color={amber} strokeWidth={2.5} />
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: amber,
        }}>
          TEES OFF IN
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        height: 28, alignItems: 'center',
      }}>
        {cells.map((c, i) => (
          <div
            key={c.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6,
              borderLeft: i > 0 ? `1px solid ${slate200}` : 'none',
            }}
          >
            <span style={{
              fontSize: 32, fontWeight: 900, color: ink, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em',
            }}>
              {c.v}
            </span>
            <span style={{
              fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em',
              color: slate400,
            }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {facts.length > 0 && (
        <>
          <div style={{
            marginTop: 10, marginBottom: 8,
            borderTop: `1px dashed ${slate200}`,
          }} />
          <div style={{
            fontSize: 10.5, fontWeight: 600, color: slate500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, flexWrap: 'wrap',
          }}>
            {facts.map(([v, label], i) => (
              <React.Fragment key={`${v}-${i}`}>
                {i > 0 && <span style={{ color: slate300 }}>·</span>}
                <span>
                  <span style={{ color: ink, fontWeight: 700 }}>{v}</span>
                  {label && <> {label}</>}
                </span>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Defending champion strip --------------------------------------

function DefendingStrip({ name, country }: { name: string; country?: string | null }) {
  const flag = flagFor(country);
  return (
    <div style={{
      flexShrink: 0,
      marginTop: 10,
      padding: 10,
      borderRadius: 10,
      background: 'rgba(255,184,0,0.06)',
      border: '1px solid rgba(255,184,0,0.30)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <Trophy size={13} color={gold} strokeWidth={2.5} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em',
          color: gold, marginBottom: 2,
        }}>
          DEFENDING
        </div>
        <div style={{
          fontSize: 13, fontWeight: 800, color: ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
      </div>
      {flag && <span aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>{flag}</span>}
    </div>
  );
}

// ---------- Main ----------------------------------------------------------

export interface EditorialUpcomingHeroProps {
  tournament: {
    id: string;
    name: string;
    tourSlug: string;
    venueName: string | null;
    venueCity: string | null;
    startDate: string;
    purse: number | null;
    venuePar: number | null;
    venueYardage: number | null;
    defendingChampion: string | null;
    defendingChampionCountry?: string | null;
  };
  onCta?: () => void;
}

export function EditorialUpcomingHero({
  tournament, onCta,
}: EditorialUpcomingHeroProps) {
  const navigate = useNavigate();

  const handleCta = () => {
    if (onCta) {
      onCta();
    } else {
      const t = tournamentRoute(tournament.id, { kind: 'overview' });
      navigate(t.to, { state: t.state });
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: lightBg,
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)',
      paddingInline: 20,
      paddingBottom: 16,
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <ElasticZone minH={120} maxH={260}>
        {(t) => (
          <TournamentTitleBlock
            t={t}
            eyebrowLabel="COMING UP"
            eyebrowRight={getStartLabel(tournament.startDate)}
            statusRow={
              <>
                <TourBadge code={getTourCode(tournament.tourSlug)} />
                <StatusBadge
                  label="UPCOMING"
                  color={blue}
                  bg="rgba(59,130,246,0.094)"
                />
              </>
            }
            title={tournament.name}
            venueName={tournament.venueName}
            venueCity={tournament.venueCity}
          />
        )}
      </ElasticZone>

      <CountdownBlock
        startDate={tournament.startDate}
        purse={tournament.purse}
        par={tournament.venuePar}
        yardage={tournament.venueYardage}
      />

      {tournament.defendingChampion && (
        <DefendingStrip
          name={tournament.defendingChampion}
          country={tournament.defendingChampionCountry}
        />
      )}

      <HeroCTA
        label="View Tournament"
        onClick={handleCta}
        style={{ marginTop: 12 }}
      />
    </div>
  );
}
