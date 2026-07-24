import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useMyNemesisHoles } from '@/hooks/gam/useMyNemesisHoles';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp } from '@/lib/formatHcp';

import { useCrownsHeld } from './YourStandingStrip';
import { useSeasonRace } from './SeasonRaceCard';
import { matchesRegionScope } from './regionScope';
import { FONT } from './gamingLightTokens';

/**
 * YourGameBlock — "Where you stand".
 *
 * The single personal block at the top of Discover. Dark surface via the
 * existing `.hcp-dark` scope (`--hcp-*` tokens from src/styles/handicap-dark.css)
 * so no new colour constants are introduced.
 *
 * Data comes from the hooks the page already mounts:
 *  - crowns  : useCrownsHeld (YourStandingStrip)
 *  - hcp     : useUserProfile + useWhsConnection (YourStandingStrip)
 *  - season  : useSeasonRace (SeasonRaceCard, same query key)
 *  - nemesis : useMyNemesisHoles (moved here from NemesisHolesStrip)
 */

const PAD = 14;

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const numFmt = (n: number | null | undefined, d = 1) =>
  n == null || Number.isNaN(Number(n)) ? '\u2013' : Number(n).toFixed(d);

interface Props {
  userId: string | undefined;
  region?: string | null;
}

export function YourGameBlock({ userId, region = null }: Props) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();

  const { data: crowns } = useCrownsHeld(userId);
  const { data: profile } = useUserProfile(userId);
  const { data: connection } = useWhsConnection(userId);
  const { data: seasonRows } = useSeasonRace(userId);
  const { data: nemesisData } = useMyNemesisHoles(connection ? userId : undefined, 24);

  const profileWithHcp = profile as
    | (typeof profile & {
        eg_handicap_index?: number | null;
        manual_handicap_index?: number | null;
      })
    | null
    | undefined;
  const resolvedHcp = resolveDisplayHandicap({
    egHandicapIndex: profileWithHcp?.eg_handicap_index ?? null,
    manualHandicapIndex: profileWithHcp?.manual_handicap_index ?? null,
    hasWhsConnection: !!connection,
  });
  const hcpValue = resolvedHcp.value;
  const hasHcp = hcpValue != null;

  const crownCount = crowns?.length ?? 0;
  const viewerRank = (seasonRows ?? []).find((r) => r.is_viewer)?.rank ?? null;

  const nemesis = (nemesisData ?? [])
    .filter((h) =>
      matchesRegionScope(
        region,
        (h as unknown as { course_country?: string | null }).course_country,
        (h as unknown as { course_region?: string | null }).course_region,
      ),
    )
    .slice(0, 3);

  if (!userId) return null;
  if (crownCount === 0 && !hasHcp && nemesis.length === 0) return null;

  return (
    <section
      className="hcp-dark"
      style={{
        margin: '8px 16px 0',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--hcp-line-2)',
        background: 'var(--hcp-bg-1)',
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ padding: `14px ${PAD}px 10px` }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-50)',
            lineHeight: 1,
          }}
        >
          {t('discover.yourGame.overline', 'Your game')}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--hcp-t-100)',
            lineHeight: 1.15,
          }}
        >
          {t('discover.yourGame.title', 'Where you stand')}
        </div>
      </div>

      {/* Three-tile stat strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderTop: '1px solid var(--hcp-line)',
          borderBottom: nemesis.length > 0 ? '1px solid var(--hcp-line)' : 'none',
        }}
      >
        <Tile
          value={String(crownCount)}
          label={t('discover.yourGame.crowns', 'Crowns held')}
          accent={crownCount > 0}
        />
        <Tile
          divider
          value={hasHcp ? formatHcp(hcpValue) : '\u2013'}
          label={t('discover.yourGame.hcp', 'Handicap index')}
        />
        <Tile
          divider
          value={viewerRank != null ? `#${viewerRank}` : '\u2013'}
          label={t('discover.yourGame.season', 'Season position')}
        />
      </div>

      {/* Nemesis holes */}
      {nemesis.length > 0 && (
        <div style={{ padding: `12px ${PAD}px 14px` }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--hcp-t-50)',
              lineHeight: 1,
              paddingBottom: 8,
            }}
          >
            {t('discover.yourGame.nemesis', 'Your nemesis holes')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nemesis.map((h) => {
              const worse = h.my_avg_over > h.field_avg_over;
              return (
                <button
                  key={`${h.course_id}-${h.hole_no}`}
                  type="button"
                  onClick={() =>
                    navigate(`/courses/${h.course_id}`, { state: { activeTab: 'holes' } })
                  }
                  className="text-left active:scale-[0.995] transition-transform"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'var(--hcp-bg-2)',
                    border: `1px solid ${worse ? 'var(--hcp-bad-tint)' : 'var(--hcp-line)'}`,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--hcp-t-100)',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ordinal(h.hole_no)} {'\u00B7'} {h.course_name}
                    </div>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--hcp-t-60)',
                        letterSpacing: '0.01em',
                        lineHeight: 1.2,
                      }}
                    >
                      You: +{numFmt(h.my_avg_over, 1)} {'\u00B7'} Field: +
                      {numFmt(h.field_avg_over, 1)}
                    </div>
                  </div>
                  <div
                    className="tabular-nums"
                    style={{
                      flexShrink: 0,
                      fontSize: 15,
                      fontWeight: 800,
                      color: worse ? 'var(--hcp-bad)' : 'var(--hcp-t-100)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    +{numFmt(h.my_avg_over, 1)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Tile({
  value,
  label,
  divider = false,
  accent = false,
}: {
  value: string;
  label: string;
  divider?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: '12px 10px',
        textAlign: 'center',
        borderLeft: divider ? '1px solid var(--hcp-line)' : 'none',
      }}
    >
      <div
        className="tabular-nums"
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: accent ? 'var(--hcp-amber)' : 'var(--hcp-t-100)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--hcp-t-50)',
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default YourGameBlock;
