/**
 * G7 (REVISED) §c — WHAT CAN BE PROVEN WITHOUT INVENTING DATA.
 *
 * The RPC, the notification, the count and the activity link are proven by the
 * member commenting on HIS OWN round and HIS OWN review, signed in, from the
 * card. Writing rows attributed to another member to make a test go green is
 * forbidden, so nothing here touches the database.
 *
 * What is left is exactly the part that is ours: the glyph exists on EVERY
 * round and EVERY review, the target handed to the comments sheet is the SCORE
 * ID and the REVIEW ID rather than a post id, and the preview read uses the
 * target type it was given instead of a hardcoded 'post'.
 */
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RoundEngagementActions } from '@/components/explore-tab-new/courseled/RoundEngagementActions';

const src = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

describe('the comment glyph is on every card', () => {
  const pair = (count: number) => (
    <RoundEngagementActions
      comment={{ count, label: 'Comment on this round', onOpen: () => {} }}
      like={{ count: 0, reacted: false, label: 'Like this round', onToggle: () => {} }}
    />
  );

  it('renders at zero, with no figure beside it', () => {
    const { container } = render(pair(0));
    expect(screen.getByLabelText('Comment on this round')).toBeTruthy();
    expect(container.textContent).toBe('');
  });

  it('renders the tally once there is one', () => {
    render(pair(3));
    expect(screen.getByLabelText('Comment on this round').textContent).toBe('3');
  });
});

describe('the target is the round and the review, never a post', () => {
  it('the scorecard sheet hands the comments sheet the score id', () => {
    const file = src('src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx');
    expect(file).toContain('targetType="round"');
    expect(file).toContain('targetId={scoreId}');
    expect(file).not.toContain('targetId={postInfo.postId}');
  });

  it('the review sheet hands the comments sheet the review id', () => {
    const file = src('src/components/posts/ReviewBottomSheet.tsx');
    expect(file).toContain('targetType="review"');
    expect(file).toContain('targetId={reviewId}');
  });

  it('the round card asks the round for its engagement, not a post', () => {
    const file = src('src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx');
    expect(file).toContain("useStoryEngagement('round'");
    expect(file).not.toContain('useRoundPostComments');
  });

  it('the review card asks the review for its engagement', () => {
    const file = src('src/components/posts/ReviewBottomSheetPortal.tsx');
    expect(file).toContain("useStoryEngagement('review'");
  });
});

describe('the preview read honours the target type it is handed', () => {
  it('filters on the parameter, not a literal post', () => {
    const file = src('src/hooks/feed/useFeedCommentPreview.ts');
    expect(file).toContain(".eq('target_type', targetType)");
    expect(file).not.toContain(".eq('target_type', 'post')");
  });

  it('keys the cache on the target type, so round and review never share a batch', () => {
    const file = src('src/hooks/feed/useFeedCommentPreview.ts');
    expect(file).toContain('${scope}:${targetType}');
  });

  it('keeps the top-level-only rule', () => {
    expect(src('src/hooks/feed/useFeedCommentPreview.ts')).toContain('parent_id');
  });
});
