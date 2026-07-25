import { useNavigate } from 'react-router-dom';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useMyNemesisHoles } from '@/hooks/gam/useMyNemesisHoles';
import { SectionHead } from './SectionHead';
import { FONT } from './gamingLightTokens';
import { matchesRegionScope, regionScopePhrase } from './regionScope';
import { EmptyScopeCard } from './EmptyScopeCard';

const RED = '#D2222D';
const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const RED_TINT = 'rgba(210,34,45,0.04)';
const RED_HAIRLINE = 'rgba(210,34,45,0.22)';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const numFmt = (n: number | null | undefined, d = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(d);

interface Props {
  userId: string | undefined;
  region?: string | null;
  /** Rendered inside the canonical Discover containment card. */
  inCard?: boolean;
}

export function NemesisHolesStrip({ userId, region = null, inCard = false }: Props) {
  const sectionMarginTop = inCard ? 0 : 32;
  const headerPaddingX = inCard ? 14 : 16;
  const rowsPaddingX = inCard ? 14 : 16;
  const navigate = useNavigate();
  const { data: connection } = useWhsConnection(userId);
  const hasWhs = !!connection;
  // Pull a wider pool so client-side region filter still yields three rows.
  const { data } = useMyNemesisHoles(hasWhs ? userId : undefined, 24);
  const all = data ?? [];
  const filtered = all.filter((h) =>
    matchesRegionScope(
      region,
      // Types not yet regenerated — course_country / course_region live on the payload.
      (h as unknown as { course_country?: string | null }).course_country,
      (h as unknown as { course_region?: string | null }).course_region,
    ),
  );
  const rows = filtered.slice(0, 3);

  // Personal section: hide entirely when signed-out / no WHS.
  if (!userId || !hasWhs) return null;

  // Under a scoped toggle, render the unconquered empty state instead of hiding.
  if (rows.length === 0) {
    if (region == null) return null;
    return (
      <section style={{ marginTop: sectionMarginTop }}>
        <SectionHead
          overline="Personal statistics"
          title="Your nemesis holes"
          paddingX={headerPaddingX}
          paddingTop={inCard ? 12 : 0}
        />
        <EmptyScopeCard
          title={`No history ${regionScopePhrase(region)} yet — your nemesis awaits.`}
        />
      </section>
    );
  }

  return (
    <section style={{ marginTop: sectionMarginTop }}>
      <SectionHead
        overline="Personal statistics"
        title="Your nemesis holes"
        paddingX={headerPaddingX}
        paddingTop={inCard ? 12 : 0}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: `0 ${rowsPaddingX}px ${inCard ? 12 : 0}px`,
          fontFamily: FONT,
        }}
      >
        {rows.map((h) => {
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
                background: worse ? RED_TINT : '#FFFFFF',
                border: `0.5px solid ${worse ? RED_HAIRLINE : HAIRLINE}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ordinal(h.hole_no)} · {h.course_name}
                </div>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: MUTE,
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  You: +{numFmt(h.my_avg_over, 1)} · Field: +{numFmt(h.field_avg_over, 1)}
                </div>
              </div>
              <div
                className="tabular-nums"
                style={{
                  flexShrink: 0,
                  fontSize: 15,
                  fontWeight: 800,
                  color: worse ? RED : INK,
                  letterSpacing: '-0.02em',
                }}
              >
                +{numFmt(h.my_avg_over, 1)}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default NemesisHolesStrip;
