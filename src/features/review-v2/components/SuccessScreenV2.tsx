/**
 * SuccessScreenV2 — dark squircle tick + "Review posted" + the real card.
 * No confetti.
 */

import React from 'react';
import { Check, Share2, Eye, Home } from 'lucide-react';
import { RV2 } from '../tokens';
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: RV2.canvas,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)' }} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 16px 12px',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: RV2.dark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 22px -8px rgba(21,23,31,0.45)',
          }}
        >
          <Check size={26} color="#F5F6F7" strokeWidth={3} />
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: RV2.ink,
            letterSpacing: '-0.02em',
          }}
        >
          Review posted
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: RV2.secondary,
            textAlign: 'center',
            lineHeight: 1.4,
            maxWidth: 300,
          }}
        >
          {subtitle}
        </p>
      </div>

      <div style={{ padding: '4px 16px 16px' }}>
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

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
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
            background: RV2.amber,
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
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 12,
              borderRadius: 12,
              background: '#FFFFFF',
              border: `1px solid ${RV2.hairline}`,
              fontSize: 13,
              fontWeight: 600,
              color: RV2.ink,
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            type="button"
            onClick={onDone}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 12,
              borderRadius: 12,
              background: '#FFFFFF',
              border: `1px solid ${RV2.hairline}`,
              fontSize: 13,
              fontWeight: 600,
              color: RV2.secondary,
              cursor: 'pointer',
            }}
          >
            <Home size={14} />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
