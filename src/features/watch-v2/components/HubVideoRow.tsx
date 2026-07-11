import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHubLongFormVideos } from '../hooks/useHubLongFormVideos';
import { formatDuration } from '../utils/formatDuration';
import { FormatBadge } from './FormatBadge';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function Card({ row, onOpen }: { row: any; onOpen: () => void }) {
  const title =
    (row.post_content && String(row.post_content).trim()) ||
    row.course_name ||
    'Untitled video';
  const initial =
    (row.creator_display_name || row.creator_username || '?')
      .toString()
      .trim()
      .charAt(0)
      .toUpperCase() || '?';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      style={{ width: 288, flexShrink: 0, cursor: 'pointer', fontFamily: FONT_FAMILY }}
    >
      <div
        style={{
          aspectRatio: '16 / 9',
          borderRadius: 12,
          background: '#e5e9ef',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {row.poster_url ? (
          <img
            src={row.poster_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : null}
        <FormatBadge format="video" />
        {row.duration_seconds ? (
          <div
            style={{
              position: 'absolute',
              bottom: 7,
              right: 7,
              background: 'rgba(0,0,0,0.72)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 5,
            }}
          >
            {formatDuration(row.duration_seconds)}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 9, marginTop: 8 }}>
        {row.creator_avatar_url ? (
          <img
            src={row.creator_avatar_url}
            alt=""
            style={{
              width: 30,
              height: 30,
              borderRadius: '34%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '34%',
              background: 'linear-gradient(135deg,#F7931E,#d97a10)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13.5,
              lineHeight: 1.28,
              color: '#0F172A',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          {row.creator_username ? (
            <div
              style={{
                fontWeight: 500,
                fontSize: 11.5,
                color: '#64748B',
                marginTop: 3,
              }}
            >
              @{row.creator_username}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ width: 288, flexShrink: 0 }}>
      <div
        style={{
          aspectRatio: '16 / 9',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
    </div>
  );
}

export function HubVideoRow() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data, isLoading } = useHubLongFormVideos(user?.id);

  const rows = (data ?? []) as any[];
  if (!isLoading && rows.length === 0) return null;

  return (
    <section style={{ fontFamily: FONT_FAMILY }}>
      <div
        style={{
          padding: '0 16px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 10.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#c97a10',
            }}
          >
            LONG FORM
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 17,
              color: '#0F172A',
              marginTop: 3,
              letterSpacing: '-0.01em',
            }}
          >
            New videos
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/watch/videos?sort=latest')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            fontWeight: 600,
            fontSize: 12,
            color: '#c97a10',
            cursor: 'pointer',
            fontFamily: FONT_FAMILY,
          }}
        >
          See all {'\u203A'}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '0 16px 4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {isLoading && rows.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {rows.map((r) => (
              <Card
                key={r.post_id}
                row={r}
                onOpen={() => navigate('/post/' + r.post_id)}
              />
            ))}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/watch/videos')}
              style={{
                width: 120,
                flexShrink: 0,
                aspectRatio: '16 / 11',
                borderRadius: 12,
                border: '1.5px dashed rgba(0,0,0,0.14)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: FONT_FAMILY,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16, color: '#c97a10' }}>
                {'\u203A'}
              </div>
              <div style={{ fontWeight: 600, fontSize: 11, color: '#64748B' }}>
                All videos
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HubVideoRow;
