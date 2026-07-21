import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Swords } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FONT } from './gamingLightTokens';

interface RivalRow {
  rival_user_id: string;
  rival_name: string | null;
  rival_avatar: string | null;
  last_event_desc: string | null;
  last_event_at: string | null;
  my_takes: number | null;
  their_takes: number | null;
}

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';

function initials(name: string | null | undefined): string {
  return (
    (name ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

interface Props {
  userId: string | undefined;
}

export function RivalryCard({ userId }: Props) {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['discover', 'my-rival', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_my_rival', {
        p_user_id: userId,
      });
      if (error) throw error;
      return ((data ?? []) as RivalRow[])[0] ?? null;
    },
  });

  if (!userId || !data || !data.rival_user_id) return null;

  const name = data.rival_name ?? 'Rival';
  const theirs = data.their_takes ?? 0;
  const mine = data.my_takes ?? 0;

  return (
    <section style={{ marginTop: 32, padding: '0 16px', fontFamily: FONT }}>
      <button
        type="button"
        onClick={() => navigate(`/profile/${data.rival_user_id}`)}
        style={{
          width: '100%',
          background: CARD_BG,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 16,
          boxShadow: CARD_SHADOW,
          padding: 14,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: FONT,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Header eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: AMBER_DEEP,
          }}
        >
          <Swords size={12} strokeWidth={2.4} color={AMBER} />
          Your rival
        </div>

        {/* Avatar + name + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SquircleAvatar
            size={44}
            srcCandidates={data.rival_avatar ? [data.rival_avatar] : []}
            alt={name}
            fallback={initials(name)}
            userId={data.rival_user_id}
            hairlineRing
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </div>
            {data.last_event_desc ? (
              <div
                style={{
                  marginTop: 3,
                  fontSize: 13,
                  fontWeight: 500,
                  color: MUTE,
                  lineHeight: 1.3,
                }}
              >
                {data.last_event_desc}
              </div>
            ) : null}
          </div>
          <ChevronRight size={18} color={MUTE} style={{ flexShrink: 0 }} />
        </div>

        {/* Form line */}
        <div
          className="tabular-nums"
          style={{
            borderTop: `1px solid ${HAIRLINE}`,
            paddingTop: 10,
            fontSize: 12,
            fontWeight: 600,
            color: MUTE,
            letterSpacing: '-0.005em',
          }}
        >
          <span style={{ color: INK, fontWeight: 700 }}>{theirs}</span>{' '}
          taken from you
          <span style={{ margin: '0 8px', color: 'rgba(15,23,42,0.20)' }}>·</span>
          <span style={{ color: INK, fontWeight: 700 }}>{mine}</span> taken back
        </div>
      </button>
    </section>
  );
}

export default RivalryCard;
