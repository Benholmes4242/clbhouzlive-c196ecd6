import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';


const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = 'var(--hcp-t-100)';
const MUTE = 'var(--hcp-t-60)';
const HAIRLINE = 'var(--hcp-line)';

interface RivalRow {
  rival_user_id: string;
  rival_name: string | null;
  rival_avatar: string | null;
  last_event_desc: string | null;
  my_takes: number | null;
  their_takes: number | null;
}

interface Props {
  userId: string | undefined;
  courseId: string;
  theme?: 'light' | 'dark';
  /** Render as a footer row inside the combined "you" card. */
  bare?: boolean;
}


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

/**
 * Local form of the last exchange: the board only, scoped to this course.
 * The RPC returns "Most Eagles at Course Name - they took it"; the course is
 * already the page, and who took it is not the point of the line.
 */
function localReason(desc: string | null | undefined): string | null {
  if (!desc) return null;
  const board = desc.split(' at ')[0].split(' - ')[0].trim();
  if (!board) return null;
  const sentence = board.charAt(0).toUpperCase() + board.slice(1).toLowerCase();
  return `${sentence} here`;
}

export const CourseRivalryLine: React.FC<Props> = ({ userId, courseId, bare = false }) => {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['course-legends', 'my-rival-here', userId ?? 'anon', courseId],
    enabled: !!userId && !!courseId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_my_rival', {
        p_user_id: userId,
        p_course_id: courseId,
      });
      if (error) throw error;
      return ((data ?? []) as RivalRow[])[0] ?? null;
    },
  });

  if (!userId || !data || !data.rival_user_id) return null;

  const name = data.rival_name ?? 'Rival';
  const reason = localReason(data.last_event_desc);

  return (
    <button
      type="button"
      onClick={() => navigate(`/profile/${data.rival_user_id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: bare ? '100%' : 'calc(100% - 32px)',
        margin: bare ? 0 : '8px 16px 4px',
        padding: bare ? '10px 16px' : '8px 12px',
        background: bare ? 'var(--hcp-tint-1)' : 'transparent',
        border: bare ? 'none' : `0.5px solid ${HAIRLINE}`,
        borderTop: bare ? `0.5px solid ${HAIRLINE}` : undefined,
        borderRadius: bare ? '0 0 16px 16px' : 12,
        textAlign: 'left',
        fontFamily: FONT,
        cursor: 'pointer',
      }}
    >
      <SquircleAvatar
        size={26}
        srcCandidates={data.rival_avatar ? [data.rival_avatar] : []}
        alt={name}
        fallback={initials(name)}
        userId={data.rival_user_id}
        hairlineRing
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        {reason ? (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: MUTE,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {reason}
          </span>
        ) : null}
      </div>
      <ChevronRight size={14} color="var(--hcp-t-40)" style={{ flexShrink: 0 }} />
    </button>
  );
};

export default CourseRivalryLine;
