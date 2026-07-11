/**
 * CommentsV2Test — dev-only parallel test surface for CommentsSheetV2.
 * Opens against a real post via ?post=<postId>. C4 will swap the real openers.
 */
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';

export default function CommentsV2Test() {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const postId = search.get('post') ?? '';
  const initialCommentId = search.get('comment');
  const [open, setOpen] = useState(true);

  const canRender = useMemo(() => /^[0-9a-f-]{8,}$/i.test(postId), [postId]);

  return (
    <div style={{ minHeight: '100dvh', background: '#F8FAFC', padding: 24 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'left' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', color: '#F7931E', textTransform: 'uppercase' }}>
          COMMENTS V2 · TEST
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1F2428', marginTop: 6 }}>
          Conversation cards preview
        </h1>
        <p style={{ fontSize: 14, color: '#8A9099', marginTop: 6, lineHeight: 1.5 }}>
          Pass <code>?post=&lt;postId&gt;</code> to render the sheet against a real post.
          Optionally add <code>&comment=&lt;id&gt;</code> to deep-link a comment.
        </p>

        <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!canRender}
            style={{
              padding: '10px 16px', borderRadius: 999, border: 0, cursor: canRender ? 'pointer' : 'not-allowed',
              background: canRender ? '#F7931E' : 'rgba(15,23,42,0.08)',
              color: canRender ? '#FFFFFF' : '#AEB4BC', fontSize: 14, fontWeight: 700,
            }}
          >
            Open sheet
          </button>
          {!canRender && (
            <span style={{ fontSize: 12, color: '#8A9099' }}>Waiting for a valid ?post= id…</span>
          )}
        </div>

        {canRender && (
          <div style={{ marginTop: 16, fontSize: 12, color: '#8A9099' }}>
            target_type: <b style={{ color: '#1F2428' }}>post</b> · target_id: <code>{postId}</code>
            {initialCommentId && (<> · deep_link: <code>{initialCommentId}</code></>)}
          </div>
        )}
      </div>

      {canRender && (
        <CommentsSheetV2
          isOpen={open}
          onClose={() => setOpen(false)}
          targetType="post"
          targetId={postId}
          initialCommentId={initialCommentId}
        />
      )}
    </div>
  );
}
