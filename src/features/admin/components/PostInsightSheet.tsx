import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSheet from './AdminSheet';
import { adminTheme as t } from '../theme';
import { usePostInsight } from '../hooks/usePostInsight';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

function relTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface Props {
  postId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function PostInsightSheet({ postId, open, onClose }: Props) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePostInsight(open ? postId : null);

  const Stat: React.FC<{ label: string; value: React.ReactNode; note?: string }> = ({ label, value, note }) => (
    <div style={{
      flex: 1,
      background: t.canvas,
      border: `1px solid ${t.line}`,
      borderRadius: t.radius.md,
      padding: '10px 12px',
    }}>
      <div style={{ color: t.inkMuted, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ color: t.ink, fontWeight: 700, fontSize: 16, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {note && <div style={{ color: t.inkFaint, fontSize: 10, marginTop: 2 }}>{note}</div>}
    </div>
  );

  const maxDaily = data ? Math.max(1, ...data.daily14d.map(d => d.likes + d.shares)) : 1;

  return (
    <AdminSheet
      open={open}
      onClose={onClose}
      title={data?.authorName ?? 'Post insight'}
      subtitle={data?.createdAt ? relTime(data.createdAt) : undefined}
      maxWidth={560}
      footer={
        data?.authorId ? (
          <button
            onClick={() => { navigate(`/admin-v2/users?member=${data.authorId}`); onClose(); }}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            View author
          </button>
        ) : undefined
      }
    >
      {isError ? (
        <div style={{ color: t.dangerText, fontSize: 13 }}>Could not load post insights.</div>
      ) : isLoading || !data ? (
        <div style={{
          background: t.canvas, borderRadius: t.radius.md, height: 220,
          animation: 'admin-pulse 1.4s ease-in-out infinite',
        }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Author + preview */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <SquircleAvatar size={40} src={data.authorAvatarUrl ?? undefined} alt={data.authorName ?? ''} userId={data.authorId ?? undefined} hairlineRing />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: t.ink, fontWeight: 700, fontSize: 13 }}>{data.authorName ?? 'A member'}</div>
              <div style={{
                marginTop: 4, color: t.inkMuted, fontSize: 13, lineHeight: 1.4,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {data.contentPreview ?? data.mediaLabel ?? '(no text)'}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Stat label="Likes" value={data.likes} />
            <Stat label="Comments" value={data.comments} />
            <Stat label="Shares" value={data.shares} note="14d" />
          </div>

          {/* Sparkline */}
          <div style={{
            background: t.surface, border: `1px solid ${t.line}`,
            borderRadius: t.radius.md, padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: t.inkMuted, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>
                Engagement - last 14 days
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: t.inkFaint }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: t.brand, verticalAlign: 'middle', marginRight: 3 }} />likes</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: t.ink, verticalAlign: 'middle', marginRight: 3 }} />shares</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
              {data.daily14d.map((d, i) => {
                const total = d.likes + d.shares;
                const hL = Math.round((d.likes / maxDaily) * 56);
                const hS = Math.round((d.shares / maxDaily) * 56);
                return (
                  <div key={i} title={`${d.date} - ${d.likes} likes, ${d.shares} shares`} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 1,
                  }}>
                    {hS > 0 && <div style={{ height: Math.max(2, hS), background: t.ink, borderRadius: 2 }} />}
                    <div style={{ height: Math.max(total > 0 ? 2 : 2, hL), background: total > 0 ? t.brand : t.line, borderRadius: 2 }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </AdminSheet>
  );
}
