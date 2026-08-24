import { Quote } from 'lucide-react';
import type { PostHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { S } from '../lib/tokens';

interface Props { post: PostHit; query: string; onSelect: () => void }

function relTime(iso?: string | null) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

export function PostRow({ post, query, onSelect }: Props) {
  const excerpt = (post.excerpt ?? '').trim() || 'Post';
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-start gap-3 px-4 py-3 active:bg-white/[0.04] text-left"
    >
      <div
        className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: S.TILE }}
      >
        <Quote size={18} color={S.QUIET} strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[15px]"
          style={{
            color: S.INK,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          <Highlight text={excerpt} query={query} />
        </p>
        <p className="text-[13px] mt-1" style={{ color: S.QUIET }}>
          {relTime(post.created_at)}
        </p>
      </div>
    </button>
  );
}
