import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHubQuickClips } from '../hooks/useHubQuickClips';
import { formatDuration } from '../utils/formatDuration';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function Tile({ row, onOpen }: { row: any; onOpen: () => void }) {
  const title = row.review_course_name || 'Clip';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      style={{ width: 110, flexShrink: 0, cursor: 'pointer', fontFamily: FONT_FAMILY }}
    >
      <div
        style={{
          aspectRatio: '9 / 14',
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
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
        {row.duration_seconds ? (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 9.5,
              padding: '2px 5px',
              borderRadius: 5,
            }}
          >
            {formatDuration(row.duration_seconds)}
          </div>
        ) : null}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 11.5,
          color: '#0F172A',
          marginTop: 6,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
      {row.creator_username ? (
        <div
          style={{
            fontWeight: 500,
            fontSize: 10.5,
            color: '#64748B',
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          @{row.creator_username}
        </div>
      ) : null}
    </div>
  );
}

function SkeletonTile() {
  return (
    <div style={{ width: 110, flexShrink: 0 }}>
      <div
        style={{
          aspectRatio: '9 / 14',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
    </div>
  );
}

export function HubClipsRow() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data, isLoading } = useHubQuickClips(user?.id);

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
            UNDER 90 SECONDS
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
            Quick clips
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/watch/clips')}
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
          gap: 10,
          overflowX: 'auto',
          padding: '0 16px 4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {isLoading && rows.length === 0 ? (
          <>
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile />
          </>
        ) : (
          <>
            {rows.map((r) => (
              <Tile
                key={r.post_id}
                row={r}
                onOpen={() => navigate('/post/' + r.post_id)}
              />
            ))}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/watch/clips')}
              style={{
                width: 110,
                flexShrink: 0,
                aspectRatio: '9 / 14',
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
                All clips
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HubClipsRow;
