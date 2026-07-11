import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHubMixedGrid, type MixedGridRow } from '../hooks/useHubMixedGrid';
import { formatCount } from '../utils/formatCount';
import { formatDuration } from '../utils/formatDuration';
import { FormatBadge } from './FormatBadge';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const spinKeyframes = `@keyframes hub-mixed-spin { to { transform: rotate(360deg); } }`;

function Tile({ row }: { row: MixedGridRow }) {
  const navigate = useNavigate();
  const isClip = row.derived_format === 'clip';
  const aspect = isClip ? '9 / 14' : '16 / 9';
  const title =
    row.post_content?.trim() ||
    row.course_name?.trim() ||
    (isClip ? 'Clip' : 'Video');
  const duration = formatDuration(row.duration_seconds);

  return (
    <button
      type="button"
      onClick={() => navigate(`/post/${row.post_id}`)}
      style={{
        display: 'block',
        width: '100%',
        marginBottom: 14,
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 12,
          background: '#e5e9ef',
          overflow: 'hidden',
        }}
      >
        {row.poster_url ? (
          <img
            src={row.poster_url}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
        <FormatBadge format={row.derived_format} />
        {duration ? (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              background: 'rgba(0,0,0,0.72)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 9.5,
              padding: '2px 6px',
              borderRadius: 5,
              fontFamily: FONT_FAMILY,
            }}
          >
            {duration}
          </div>
        ) : null}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 12.5,
          lineHeight: 1.28,
          color: '#0F172A',
          marginTop: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: 11,
          color: '#64748B',
          marginTop: 2,
        }}
      >
        {row.creator_username ? `@${row.creator_username}` : ''}
        {row.like_count > 0
          ? ` \u00B7 ${formatCount(row.like_count)} ${row.like_count === 1 ? 'like' : 'likes'}`
          : ''}
      </div>
    </button>
  );
}

function SkeletonTile({ aspect }: { aspect: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 12,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
    </div>
  );
}

export function HubMixedGrid() {
  const { user } = useSupabaseSession();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useHubMixedGrid(user?.id, 'all');

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const rows: MixedGridRow[] = (data?.pages ?? []).flat() as MixedGridRow[];
  const left: MixedGridRow[] = [];
  const right: MixedGridRow[] = [];
  rows.forEach((r, i) => (i % 2 === 0 ? left : right).push(r));

  return (
    <section style={{ fontFamily: FONT_FAMILY }}>
      <style>{spinKeyframes}</style>
      <div style={{ padding: '0 16px 12px' }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 10.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#c97a10',
          }}
        >
          EVERYTHING
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
          Keep browsing
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 12,
            color: '#64748B',
            marginTop: 3,
          }}
        >
          Clips and videos, mixed
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', gap: 12, padding: '0 16px' }}>
          <div style={{ flex: 1 }}>
            <SkeletonTile aspect="9 / 14" />
            <SkeletonTile aspect="16 / 9" />
          </div>
          <div style={{ flex: 1 }}>
            <SkeletonTile aspect="16 / 9" />
            <SkeletonTile aspect="9 / 14" />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            padding: '40px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
            No clips yet
          </div>
          <div
            style={{
              fontWeight: 500,
              fontSize: 12,
              color: '#64748B',
              marginTop: 4,
            }}
          >
            Check back soon
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, padding: '0 16px' }}>
          <div style={{ flex: 1 }}>
            {left.map((r) => (
              <Tile key={r.post_id} row={r} />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            {right.map((r) => (
              <Tile key={r.post_id} row={r} />
            ))}
          </div>
        </div>
      )}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px 0',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: '3px solid rgba(0,0,0,0.08)',
              borderTopColor: '#F7931E',
              animation: 'hub-mixed-spin 0.9s linear infinite',
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

export default HubMixedGrid;
