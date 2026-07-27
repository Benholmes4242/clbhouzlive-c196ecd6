import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useNotableDifficultCourses,
  type CourseIndexMode,
  type DifficultCourse,
} from '@/hooks/gam/useNotableDifficultCourses';
import { SectionHead } from './SectionHead';
import { regionScopePhrase, matchesRegionScope } from './regionScope';
import { FONT } from './gamingLightTokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AMBER, INK, INK_MUTE, SLATE_50 } from '@/features/tourhub/_shared/tokens';
import { REGION_TABS } from './AlmanacSections';

const RED = '#D2222D';
const GREEN = '#0F8F4A';
const INK_COLOR = '#0F172A';
const MUTE = 'rgba(15,23,42,0.45)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const MAX = 10;

const numFmt = (n: number | null | undefined, digits = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(digits);

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function regionLabel(slug: string | null | undefined): string {
  return REGION_TABS.find((t) => t.slug === slug)?.label ?? 'Worldwide';
}

function CourseCard({
  rank,
  courseId,
  courseName,
  avgOverPar,
  totalRounds,
  mode,
}: {
  rank: number;
  courseId: string;
  courseName: string;
  avgOverPar: number;
  totalRounds: number;
  mode: CourseIndexMode;
}) {
  const navigate = useNavigate();
  const isTop = rank === 1;
  const accent = mode === 'friendliest' ? GREEN : RED;
  const topLabel = mode === 'friendliest' ? '#1 FRIENDLIEST' : '#1 TOUGHEST';
  const label = isTop ? topLabel : `#${rank}`;
  const value = mode === 'friendliest'
    ? `${avgOverPar >= 0 ? '+' : ''}${numFmt(avgOverPar, 1)}`
    : `+${numFmt(avgOverPar, 1)}`;
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } })}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 148,
        minHeight: 130,
        borderRadius: 12,
        background: CARD_BG,
        border: `0.5px solid ${HAIRLINE}`,
        boxShadow: CARD_SHADOW,
        padding: '11px 12px 10px',
        cursor: 'pointer',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: isTop ? accent : MUTE,
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 12.5,
          fontWeight: 600,
          color: INK_COLOR,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          minHeight: 30,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {courseName}
      </div>
      <div
        className="tabular-nums"
        style={{
          marginTop: 'auto',
          fontSize: 20,
          fontWeight: 700,
          color: accent,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 5,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: MUTE,
          lineHeight: 1.2,
        }}
      >
        AVG · {totalRounds} ROUNDS
      </div>
    </button>
  );
}

export function ToughestIndex({ region }: { region?: string | null } = {}) {
  const [mode, setMode] = useState<CourseIndexMode>('toughest');
  const { data } = useNotableDifficultCourses(mode);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(
    () => (data ?? []).filter((c) => matchesRegionScope(region, c.course_country, c.course_region)),
    [data, region],
  );
  const rows = filtered.slice(0, MAX);
  const scope = regionScopePhrase(region);
  const title = mode === 'friendliest' ? `Friendliest courses ${scope}` : `Toughest courses ${scope}`;

  if (rows.length === 0) return null;

  const lead = rows[0];
  const leadImage = lead?.thumbnail_image ?? null;
  const cinematic = !!leadImage;
  const restRows = cinematic ? rows.slice(1) : rows;
  const accent = mode === 'friendliest' ? GREEN : RED;
  const maxAvg = Math.max(...rows.map((c) => Math.abs(c.avg_over_par)), 1);

  return (
    <DiscoverBand marginTop={32}>
      <div style={{ padding: '12px 16px 0' }}>
        <SectionHead
          overline="Official WHS"
          title={title}
          meta="View all"
          onMeta={() => setSheetOpen(true)}
          paddingX={0}
          paddingBottom={10}
        />
        <div
          role="tablist"
          aria-label="Course index mode"
          style={{
            display: 'inline-flex',
            gap: 2,
            padding: 2,
            background: '#FFFFFF',
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: 999,
            marginTop: 2,
            marginBottom: 12,
          }}
        >
          {([
            { v: 'toughest', label: 'Toughest' },
            { v: 'friendliest', label: 'Scoreable' },
          ] as const).map((o) => {
            const active = mode === o.v;
            return (
              <button
                key={o.v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(o.v)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  background: active ? '#15171F' : 'transparent',
                  color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
                  border: 'none',
                  fontFamily: FONT,
                  fontSize: 10.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {cinematic ? (
        <CinematicLeadCard
          imageUrl={leadImage!}
          alt={lead.course_name}
          chips={[{
            label: mode === 'friendliest' ? 'No.1 scoreable' : 'No.1 toughest',
            tone: mode === 'friendliest' ? 'good' : 'danger',
          }]}
          title={lead.course_name}
          subtitle={`${lead.total_rounds} rounds`}
          figure={`${mode === 'friendliest' && lead.avg_over_par < 0 ? '' : '+'}${numFmt(lead.avg_over_par, 1)}`}
          figureLabel={mode === 'friendliest' ? 'Avg to par' : 'Avg over par'}
          onTap={() => navigate(`/courses/${lead.course_id}`, { state: { activeTab: 'holes' } })}
        />
      ) : null}

      <div>
        {restRows.map((c, i) => (
          <CourseIndexRow
            key={c.course_id}
            rank={cinematic ? i + 2 : i + 1}
            course={c}
            mode={mode}
            accent={accent}
            widthPct={Math.max(6, Math.round((Math.abs(c.avg_over_par) / maxAvg) * 100))}
            isLast={i === restRows.length - 1}
            onTap={() => navigate(`/courses/${c.course_id}`, { state: { activeTab: 'holes' } })}
          />
        ))}
      </div>


      <CourseIndexSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        rows={filtered}
        mode={mode}
        region={region ?? null}
        title={title}
      />
    </section>
  );
}

function CourseIndexSheet({
  open,
  onClose,
  rows,
  mode,
  region,
  title,
}: {
  open: boolean;
  onClose: () => void;
  rows: DifficultCourse[];
  mode: CourseIndexMode;
  region: string | null;
  title: string;
}) {
  const navigate = useNavigate();
  const accent = mode === 'friendliest' ? GREEN : RED;
  const total = rows.length;
  const sigLabel = mode === 'friendliest' ? 'Birdie hole' : 'Signature test';

  const handleRowTap = (courseId: string) => {
    onClose();
    setTimeout(() => {
      navigate(`/courses/${courseId}`);
    }, 60);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="course-index-sheet-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: SLATE_50,
      }}
    >
      <div style={{ padding: '10px 16px 12px', background: SLATE_50 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {regionLabel(region)} {'\u00B7'} WHS {'\u00B7'} {total} {total === 1 ? 'COURSE' : 'COURSES'}
        </div>
        <div
          id="course-index-sheet-title"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SLATE_50,
          padding: '4px 0 24px',
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            None yet.
          </div>
        ) : (
          rows.map((c, i) => {
            const sig = c.hardest_hole_no != null
              ? (mode === 'friendliest'
                  ? `${sigLabel}: ${ordinal(c.hardest_hole_no)}`
                  : `${sigLabel}: ${ordinal(c.hardest_hole_no)} · plays to ${numFmt(c.hardest_avg_to_par != null && c.hardest_hole_par != null ? c.hardest_hole_par + c.hardest_avg_to_par : null, 1)}`)
              : null;
            const avg = `${c.avg_over_par >= 0 ? '+' : ''}${numFmt(c.avg_over_par, 1)}`;
            return (
              <button
                key={c.course_id}
                type="button"
                onClick={() => handleRowTap(c.course_id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i === rows.length - 1 ? 'none' : `0.5px solid ${HAIRLINE}`,
                  fontFamily: FONT,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  className="tabular-nums"
                  style={{
                    flexShrink: 0,
                    width: 24,
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK_MUTE,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: INK,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.course_name}
                  </div>
                  {sig ? (
                    <div
                      className="tabular-nums"
                      style={{
                        marginTop: 3,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: INK_MUTE,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {sig}
                    </div>
                  ) : null}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div
                    className="tabular-nums"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: '-0.01em',
                      lineHeight: 1,
                    }}
                  >
                    {avg}
                  </div>
                  <div
                    className="tabular-nums"
                    style={{
                      marginTop: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      color: MUTE,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.total_rounds} rds
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
}

export default ToughestIndex;
