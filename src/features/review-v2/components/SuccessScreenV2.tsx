/**
 * SuccessScreenV2 - immersive amber-tinted destination confirming a posted review.
 *
 * NOT tap-anywhere-to-close (has real actions). Uses ImmersiveSuccessShell
 * without onTapClose, adds a quiet glass Share button top-right, and hosts
 * the dark-variant LivePreviewCard plus three actions.
 */

import React from 'react';
import { Check, Share2, Eye, Home } from 'lucide-react';
import { ImmersiveSuccessShell } from '@/features/post-v2/components/ImmersiveSuccessShell';
import { LivePreviewCard } from './LivePreviewCard';
import type { CategoryKey, MediaItem, ReviewV2Course } from '../types';
import type { VerdictSlug } from '../tokens';

const GREEN = '#22C55E';

interface Props {
  course: ReviewV2Course | null;
  author: { displayName: string; avatarUrl?: string | null };
  overall: number | null;
  verdict: VerdictSlug | null;
  reviewText: string;
  scores: Record<CategoryKey, number | null>;
  media: MediaItem[];
  shareToFeed: boolean;
  onViewReview: () => void;
  onShare: () => void;
  onDone: () => void;
}

export function SuccessScreenV2({
  course,
  author,
  overall,
  verdict,
  reviewText,
  scores,
  media,
  shareToFeed,
  onViewReview,
  onShare,
  onDone,
}: Props) {
  const subtitle = shareToFeed
    ? "Live on the course page and in your friends' feeds."
    : 'Live on the course page.';

  const uploading = media.filter((m) => m.status === 'pending' || m.status === 'uploading').length;
  const failed = media.filter((m) => m.status === 'failed').length;

  return (
    <ImmersiveSuccessShell padded={false}>
      {/* Top-right Share affordance (glass) */}
      <button
        type="button"
        aria-label="Share"
        onClick={onShare}
        style={{
          position: 'absolute',
          top: 'max(env(safe-area-inset-top, 0px), 20px)',
          right: 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          zIndex: 2,
        }}
      >
        <Share2 size={16} />
      </button>

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          padding: 'max(env(safe-area-inset-top, 0px), 56px) 16px calc(env(safe-area-inset-bottom, 0px) + 20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {/* Glass tile with glowing green check */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: `drop-shadow(0 0 24px ${GREEN}55) drop-shadow(0 0 8px ${GREEN}66)`,
          }}
        >
          <Check size={32} color={GREEN} strokeWidth={2.75} />
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.96)',
            textAlign: 'center',
          }}
        >
          Review posted
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            color: 'rgba(255,255,255,0.62)',
            lineHeight: 1.45,
            maxWidth: 300,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </p>

        {/* Dark-variant live card */}
        <div style={{ width: '100%', marginTop: 6 }}>
          <LivePreviewCard
            surface="dark"
            course={course}
            author={author}
            overall={overall}
            verdict={verdict}
            reviewText={reviewText}
            scores={scores}
            media={media}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 6 }}>
          {uploading > 0 && (
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.62)',
                textAlign: 'center',
                padding: '0 4px 2px',
              }}
            >
              Uploading your {uploading === 1 ? 'photo' : 'media'} — keep the app open
            </div>
          )}
          {uploading === 0 && failed > 0 && (
            <div
              style={{
                fontSize: 12,
                color: '#F87171',
                textAlign: 'center',
                padding: '0 4px 2px',
              }}
            >
              {failed} {failed === 1 ? 'item' : 'items'} didn't upload
            </div>
          )}
          <button
            type="button"
            onClick={onViewReview}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: 13,
              borderRadius: 12,
              border: 'none',
              background: '#F7931E',
              color: '#FFFFFF',
              fontSize: 14.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(247,147,30,0.32)',
            }}
          >
            <Eye size={16} />
            View review
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onShare} style={{ ...glassBtn, color: 'rgba(255,255,255,0.96)' }}>
              <Share2 size={14} />
              Share
            </button>
            <button type="button" onClick={onDone} style={{ ...glassBtn, color: 'rgba(255,255,255,0.62)' }}>
              <Home size={14} />
              Done
            </button>
          </div>
        </div>
      </div>
    </ImmersiveSuccessShell>
  );
}

const glassBtn: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: 12,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
