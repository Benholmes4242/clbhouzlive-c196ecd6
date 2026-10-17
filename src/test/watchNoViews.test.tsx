/**
 * BRIEF_WATCH_NO_VIEWS W.5 — no Watch surface shows a view count, and the
 * page no longer reads post_views. Views are still RECORDED elsewhere; they
 * are just not shown.
 */
import fs from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VideoCard } from '@/features/explore-magazine/watch/videoUnit';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';

const source = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

function row(overrides: Partial<HubRpcRow> = {}): HubRpcRow {
  return {
    post_id: 'post-1',
    post_content: 'A round worth watching',
    creator_display_name: 'Classic Golf',
    creator_username: 'classicgolf',
    creator_avatar_url: null,
    post_created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    duration_seconds: 240,
    poster_url: null,
    stream_id: null,
    hls_url: null,
    course_name: null,
    ...overrides,
  } as HubRpcRow;
}

describe('Watch shows no view counts (BRIEF_WATCH_NO_VIEWS)', () => {
  it('VideoCard line one is "{creator} · {age}" with no view count', () => {
    const { container } = render(<VideoCard row={row()} onPress={vi.fn()} autoplay={false} />);
    const lineOne = container.querySelector('[data-watch-by]');
    expect(lineOne?.textContent).toBe('Classic Golf · 10d ago');
    expect(container.textContent).not.toMatch(/\bviews?\b/i);
  });

  it('no Watch source file reads post_views or renders a views line', () => {
    const dir = path.resolve(process.cwd(), 'src/features/explore-magazine/watch');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
    for (const file of files) {
      const text = fs.readFileSync(path.join(dir, file), 'utf8');
      expect(text, file).not.toContain('useWatchViews');
      expect(text, file).not.toContain('viewsLabel');
      expect(text, file).not.toContain('data-watch-sub="views"');
      /* The header comment in useWatchSignals.ts names post_views to say it is
         NOT read; the guard is on the read itself. */
      expect(text, file).not.toMatch(/from\('post_views'\)/);
    }
  });
});
