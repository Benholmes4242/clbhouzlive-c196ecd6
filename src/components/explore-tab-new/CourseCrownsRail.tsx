import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useRegionFeats, type FeatRow } from './hooks/useRegionFeats';
import {
  SCOREBOARD_BG,
  GOLD,
  LAUREL,
  FONT,
  INNER_RADIUS,
  CARD_RADIUS,
} from './gamingLightTokens';

interface Regular {
  course_id: string;
  holder_name: string | null;
  holder_avatar: string | null;
  rounds_90d: number;
}

function useCourseRegulars(courseIds: string[]) {
  const key = courseIds.slice().sort().join(',');
  return useQuery<Record<string, Regular>>({
    queryKey: ['discover', 'course-regulars', key],
    enabled: courseIds.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_course_regulars', {
          p_course_ids: courseIds,
        });
        if (error) return {};
        const map: Record<string, Regular> = {};
        for (const row of (data ?? []) as Regular[]) {
          if (!map[row.course_id]) map[row.course_id] = row;
        }
        return map;
      } catch {
        return {};
      }
    },
  });
}

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function initials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function CrownTile({
  label,
  labelColor,
  value,
  sub,
  holderName,
  holderAvatar,
  awaiting,
}: {
  label: string;
  labelColor: string;
  value: string;
  sub?: string;
  holderName?: string;
  holderAvatar?: string | null;
  awaiting?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: INNER_RADIUS,
        padding: '10px 11px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: labelColor,
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 21,
          fontWeight: 900,
          color: awaiting ? 'rgba(255,255,255,0.45)' : '#fff',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
      {awaiting ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 9.5,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.25,
          }}
        >
          {sub ?? 'No regular yet · 3 rounds in 90 days claims it'}
        </div>
      ) : (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
          }}
        >
          <SquircleAvatar
            size={16}
            src={holderAvatar ?? null}
            alt={holderName ?? ''}
            fallback={initials(holderName ?? '?')}
            hairlineRing
            ringColor="rgba(255,255,255,0.25)"
          />
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {holderName ?? '—'}
          </div>
        </div>
      )}
    </div>
  );
}

function CrownCard({ row, regular }: { row: FeatRow; regular?: Regular }) {
  const navigate = useNavigate();
  const holder = formatHolderName(row.holder_name);
  const regularHolder = formatHolderName(regular?.holder_name);
  const recordValue = (row.feat_value ?? (row.value != null ? String(row.value) : '—')).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => {
        if (row.course_id) navigate(`/courses/${row.course_id}`);
      }}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 300,
        borderRadius: CARD_RADIUS,
        background: SCOREBOARD_BG,
        padding: 14,
        border: 'none',
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {row.course_name}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {row.holder_name ? `Held by ${holder}` : 'Course crowns'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <CrownTile
          label="👑 Record"
          labelColor={GOLD}
          value={recordValue}
          holderName={holder}
          holderAvatar={row.holder_avatar}
        />
        <CrownTile
          label="🌿 Regular 90d"
          labelColor={LAUREL}
          value={regular ? String(regular.rounds_90d) : '—'}
          awaiting={!regular}
          holderName={regularHolder}
          holderAvatar={regular?.holder_avatar}
        />
      </div>
    </button>
  );
}

interface Props {
  region: string | null;
}

export function CourseCrownsRail({ region }: Props) {
  const { data } = useRegionFeats(region, 'records');
  const rows = useMemo(() => (data ?? []).slice(0, 8), [data]);
  const courseIds = useMemo(
    () => rows.map((r) => r.course_id).filter((v): v is string => !!v),
    [rows],
  );
  const { data: regulars } = useCourseRegulars(courseIds);

  if (rows.length === 0) return null;

  return (
    <div
      className="flex overflow-x-auto scrollbar-hide"
      style={{ padding: '0 16px', gap: 9 }}
    >
      {rows.map((row, i) => (
        <CrownCard
          key={`${row.course_id ?? i}-${i}`}
          row={row}
          regular={row.course_id ? regulars?.[row.course_id] : undefined}
        />
      ))}
    </div>
  );
}

export default CourseCrownsRail;
