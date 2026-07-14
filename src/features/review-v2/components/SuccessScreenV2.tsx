/**
 * SuccessScreenV2 - immersive amber-tinted overlay confirming a posted review.
 * Uses ImmersiveSuccessShell (shared with PostSuccessV2) so tap-anywhere
 * closes; review-specific actions live inside the stop-guarded island.
 */

import React from 'react';
import { Check, Share2, Eye, Home } from 'lucide-react';
import { ImmersiveSuccessShell } from '@/features/post-v2/components/ImmersiveSuccessShell';
import { LivePreviewCard } from './LivePreviewCard';
import type { CategoryKey, MediaItem, ReviewV2Course } from '../types';
import type { VerdictSlug } from '../tokens';

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

  return (
    <ImmersiveSuccessShell onClose={onDone}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={30} color="#F5F6F7" strokeWidth={2.75} />
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'rgba(255,255,255,0.96)',
        }}
      >
        Review posted
      </h1>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.45,
          maxWidth: 300,
        }}
      >
        {subtitle}
      </p>

      <div style={{ width: '100%', marginTop: 4 }}>
        <LivePreviewCard
          course={course}
          author={author}
          overall={overall}
          verdict={verdict}
          reviewText={reviewText}
          scores={scores}
          media={media}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
        <button
          type="button"
          onClick={onViewReview}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: 12,
            borderRadius: 12,
            border: 'none',
            background: '#F7931E',
            color: '#FFFFFF',
            fontSize: 14.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(247,147,30,0.28)',
          }}
        >
          <Eye size={16} />
          View review
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onShare}
            style={ghostBtn}
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            type="button"
            onClick={onDone}
            style={ghostBtn}
          >
            <Home size={14} />
            Done
          </button>
        </div>
      </div>
    </ImmersiveSuccessShell>
  );
}

const ghostBtn: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: 12,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.9)',
  cursor: 'pointer',
};
