import React from 'react';
import { ChevronRight, Heart, MessageSquare } from 'lucide-react';
import { Eyebrow } from './_shared/Eyebrow';
import { BG_1, T100, T60, T40, LINE, FONT, TAB } from './_shared/tokens';

interface Props {
  post: {
    id: string;
    content: string | null;
    created_at: string;
    like_count: number;
    comment_count: number;
  };
  onTap: () => void;
}

const EXCERPT_LEN = 80;

export const LatestPostCard: React.FC<Props> = ({ post, onTap }) => {
  if (!post.content) return null;
  const trimmed = post.content.trim();
  const excerpt =
    trimmed.length > EXCERPT_LEN ? trimmed.slice(0, EXCERPT_LEN) + '…' : trimmed;

  return (
    <div style={{ padding: '4px 20px 16px', fontFamily: FONT }}>
      <Eyebrow label="LATEST POST" />
      <button
        type="button"
        onClick={onTap}
        style={{
          marginTop: 10,
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          background: BG_1,
          border: `1px solid ${LINE}`,
          borderRadius: 14,
          cursor: 'pointer',
          color: T100,
          fontFamily: FONT,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: T100,
              lineHeight: 1.4,
              fontStyle: 'italic',
            }}
          >
            "{excerpt}"
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 6,
              fontSize: 11,
              color: T60,
              ...TAB,
            }}
          >
            <span>{fmtRelative(post.created_at)}</span>
            {post.like_count > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Heart size={11} strokeWidth={2} /> {post.like_count}
              </span>
            )}
            {post.comment_count > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <MessageSquare size={11} strokeWidth={2} /> {post.comment_count}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={18} color={T40 as unknown as string} />
      </button>
    </div>
  );
};

function fmtRelative(iso: string): string {
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 86_400_000,
  );
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    month: 'short',
    day: '2-digit',
  });
}
