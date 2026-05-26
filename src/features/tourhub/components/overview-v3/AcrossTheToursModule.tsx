/**
 * Pass 6: Across the Tours · This week's leaders.
 * Type-driven dense list of every *other* tour with leader + score + status.
 * Active tour (already shown in the hero) is excluded.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAllToursTickerData,
  type TickerCellData,
} from '../../hooks/useOverviewModules';
import { getFlagCode } from '@/utils/countryFlags';

const AMBER = '#F7931E';
const INK = '#0F172A';

const TOUR_PILL_BG: Record<string, { bg: string; fg: string; abbr: string }> = {
  pga: { bg: '#0066CC', fg: '#FFFFFF', abbr: 'PGA' },
  euro: { bg: '#006747', fg: '#FFFFFF', abbr: 'DPWT' },
  liv: { bg: '#1A1A1A', fg: '#FFFFFF', abbr: 'LIV' },
  lpga: { bg: '#B91C5C', fg: '#FFFFFF', abbr: 'LPGA' },
  pgad: { bg: '#14532D', fg: '#FFFFFF', abbr: 'KF' },
  champ: { bg: '#7C2D12', fg: '#FFFFFF', abbr: 'CHAMP' },
};

interface AcrossRow {
  id: string;
  tourSlug: string;
  tourPill: { bg: string; fg: string; abbr: string };
  tournamentName: string;
  leaderLine: string;
  score: string | null;
  state: 'LIVE' | 'FINAL' | 'UPCOMING';
}

function countryToFlagEmoji(country: string | null): string {
  const code = getFlagCode(country ?? undefined);
  if (!code || code.length !== 2) return '';
  const A = 0x1f1e6;
  const base = 'A'.charCodeAt(0);
  return String.fromCodePoint(
    A + (code.charCodeAt(0) - base),
    A + (code.charCodeAt(1) - base)
  );
}

function composeLeaderLine(cell: TickerCellData): string {
  if (!cell.personName) {
    return cell.status === 'upcoming' ? 'Field announces this week' : '—';
  }

  // Tied case — already formatted as "3 tied" by useAllToursTickerData.
  if (cell.personName.includes('tied')) {
    return cell.status === 'live' ? `${cell.personName} lead` : cell.personName;
  }

  // Abbreviate first name: "Rory McIlroy" → "R. McIlroy"
  const parts = cell.personName.trim().split(/\s+/);
  const abbrName =
    parts.length >= 2
      ? `${parts[0][0]}. ${parts.slice(1).join(' ')}`
      : cell.personName;

  const flag = countryToFlagEmoji(cell.country);
  const flagSuffix = flag ? ` ${flag}` : '';

  if (cell.status === 'live') return `${abbrName}${flagSuffix} leads`;
  if (cell.status === 'completed') return `${abbrName}${flagSuffix} — winner`;
  return `${abbrName}${flagSuffix}`;
}

interface AcrossTheToursModuleProps {
  activeTourSlug: string | null;
}

export function AcrossTheToursModule({ activeTourSlug }: AcrossTheToursModuleProps) {
  const { data } = useAllToursTickerData();
  const navigate = useNavigate();

  const rows = useMemo<AcrossRow[]>(() => {
    if (!data) return [];
    const all = [...data.live, ...data.completed, ...data.upcoming];

    // De-dupe by tour, priority live > completed > upcoming.
    const byTour: Record<string, TickerCellData> = {};
    const rank = (s: string) => (s === 'live' ? 3 : s === 'completed' ? 2 : 1);
    for (const cell of all) {
      const k = cell.tourSlug;
      if (!byTour[k] || rank(cell.status) > rank(byTour[k].status)) {
        byTour[k] = cell;
      }
    }

    return Object.values(byTour)
      .filter((cell) => !activeTourSlug || cell.tourSlug !== activeTourSlug)
      .map<AcrossRow>((cell) => {
        const pill =
          TOUR_PILL_BG[cell.tourSlug.toLowerCase()] || TOUR_PILL_BG.pga;
        const state: AcrossRow['state'] =
          cell.status === 'live'
            ? 'LIVE'
            : cell.status === 'completed'
            ? 'FINAL'
            : 'UPCOMING';
        return {
          id: cell.id,
          tourSlug: cell.tourSlug,
          tourPill: pill,
          tournamentName: cell.name,
          leaderLine: composeLeaderLine(cell),
          score: cell.scoreDisplay,
          state,
        };
      });
  }, [data, activeTourSlug]);

  if (rows.length === 0) return null;

  return (
    <div style={{ background: '#F8FAFC', padding: '26px 16px 14px' }}>
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            color: AMBER,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            fontFamily: "'Geist', sans-serif",
          }}
        >
          ↔ ACROSS THE TOURS
        </div>
        <div
          style={{
            color: INK,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginTop: 2,
            fontFamily: "'Geist', sans-serif",
          }}
        >
          This week's leaders
        </div>
      </div>
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          border: '0.5px solid rgba(15,23,42,0.08)',
          overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => (
          <button
            key={row.id}
            onClick={() => navigate(`/tour/tournament/${row.id}`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr auto 16px',
              gap: 10,
              padding: '12px 14px',
              alignItems: 'center',
              borderBottom:
                i === rows.length - 1
                  ? 'none'
                  : '0.5px solid rgba(15,23,42,0.06)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontFamily: "'Geist', sans-serif",
            }}
            aria-label={`Open ${row.tournamentName}`}
          >
            <div
              style={{
                background: row.tourPill.bg,
                color: row.tourPill.fg,
                fontSize: row.tourPill.abbr.length > 4 ? 8 : 9,
                fontWeight: 800,
                padding: '3px 5px',
                borderRadius: 3,
                textAlign: 'center',
                letterSpacing: '0.04em',
              }}
            >
              {row.tourPill.abbr}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: INK,
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {row.tournamentName}
              </div>
              <div
                style={{
                  color: 'rgba(15,23,42,0.55)',
                  fontSize: 11,
                  fontWeight: 500,
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {row.leaderLine}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {row.score && (
                <div
                  style={{
                    color: INK,
                    fontSize: 14,
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    fontFeatureSettings: '"zero" 0',
                  }}
                >
                  {row.score}
                </div>
              )}
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  marginTop: 1,
                  color:
                    row.state === 'LIVE'
                      ? '#10B981'
                      : row.state === 'FINAL'
                      ? 'rgba(15,23,42,0.45)'
                      : AMBER,
                }}
              >
                {row.state}
              </div>
            </div>
            <div style={{ color: 'rgba(15,23,42,0.30)', fontSize: 14 }}>›</div>
          </button>
        ))}
      </div>
    </div>
  );
}
