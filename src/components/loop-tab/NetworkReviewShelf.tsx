import { useNavigate } from 'react-router-dom';
import { useNetworkActivity, type NetworkCourseHighlight } from '@/hooks/useNetworkActivity';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

interface NetworkReviewShelfProps {
  userId: string | undefined;
}

export function NetworkReviewShelf({ userId }: NetworkReviewShelfProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useNetworkActivity(userId);

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        style={{
          background: 'rgba(247,147,30,0.05)',
          borderTop: '0.5px solid rgba(247,147,30,0.15)',
          borderBottom: '0.5px solid rgba(247,147,30,0.15)',
          padding: '14px 0 6px',
          margin: '14px 0 4px',
        }}
      >
        <div
          style={{
            padding: '0 16px 10px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#c97a10',
          }}
        >
          Courses your network reviewed this week
        </div>
        <div
          className="flex overflow-x-auto"
          style={{ padding: '0 16px', gap: 12, scrollbarWidth: 'none' }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted animate-pulse shrink-0"
              style={{ width: 155, height: 120, borderRadius: 12 }}
            />
          ))}
        </div>
      </div>
    );
  }

  const highlights = (data?.highlights ?? []).slice(0, 3);
  if (highlights.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(247,147,30,0.05)',
        borderTop: '0.5px solid rgba(247,147,30,0.15)',
        borderBottom: '0.5px solid rgba(247,147,30,0.15)',
        padding: '14px 0 6px',
        margin: '14px 0 4px',
      }}
    >
      <div
        style={{
          padding: '0 16px 10px',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: '#c97a10',
        }}
      >
        Courses your network reviewed this week
      </div>
      <div
        className="flex overflow-x-auto"
        style={{
          padding: '0 16px',
          gap: 12,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {highlights.map((h) => (
          <HighlightCard key={h.course_id} highlight={h} onTap={() => navigate(`/courses/${h.course_id}`)} />
        ))}
      </div>
    </div>
  );
}

function HighlightCard({
  highlight,
  onTap,
}: {
  highlight: NetworkCourseHighlight;
  onTap: () => void;
}) {
  const location = highlight.region || highlight.city || '';

  return (
    <button
      onClick={onTap}
      className="shrink-0 text-left active:scale-[0.97] transition-transform"
      style={{ width: 155 }}
    >
      {/* Image */}
      <div
        className="overflow-hidden relative"
        style={{ width: 155, height: 95, borderRadius: 12 }}
      >
        {highlight.image_url ? (
          <img
            src={highlight.image_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a2a0d] to-[#0d1508]" />
        )}
        {/* Rating badge on image */}
        {highlight.avg_network_rating != null && highlight.avg_network_rating > 0 && (
          <div
            className="absolute flex items-center gap-1 liquid-glass"
            style={{ top: 7, right: 7, borderRadius: 20, padding: '3px 8px' }}
          >
            <ClubhouseLogo size="xs" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>
              {highlight.avg_network_rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '7px 6px 0' }}>
        <p
          className="truncate"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'hsl(var(--foreground))',
            lineHeight: 1.3,
          }}
        >
          {highlight.course_name}
        </p>
        {location && (
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--muted-foreground))',
              marginTop: 2,
            }}
          >
            {location}
          </p>
        )}
      </div>
    </button>
  );
}
