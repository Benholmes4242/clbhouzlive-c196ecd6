# FEED: no AM/PRO badge in review text lead

- ReviewPostCard.tsx:113 — `[data-review-body-lead]` now renders `{post.displayName}` directly (600, A.INK); trailing space and REVIEW_BODY_CLAMP unchanged. Header name (line 164) and FeedCard header untouched. FeedCard caption lead unchanged. InlineProMemberName, ProLabel and text-flow CSS untouched.

## Tests
- Rewritten (src/test/reviewExcerptTextFlow.test.tsx), "media-first review body opts every nested member name into text flow" → "media-first review body lead is plain text with no badge; the header keeps the AM badge". Removed assertions: `expect(body?.querySelector('[data-flow="text"]')).not.toBeNull()`, `expect(body?.querySelector('.pro-inline-name:not([data-flow])')).toBeNull()`, `expect(body?.querySelector('.pro-label')).toHaveAttribute('data-kind', 'am')` — they encoded the badge inside the body. Now asserts no `.pro-label` in the body, lead text = display name, and AM `.pro-label` in `[data-review-who]` (a, b). Header flow and CSS-rule assertions kept.
- Added "feed caption lead stays plain text with no badge" (c): source check that the `[data-caption-lead]` span contains no InlineProMemberName/ProLabel.

## Totals
Before 9,075; after 9,076 (+1 added). Shards 2,235 / 2,255 / 2,272 / 2,314, all passing, run sequentially.
