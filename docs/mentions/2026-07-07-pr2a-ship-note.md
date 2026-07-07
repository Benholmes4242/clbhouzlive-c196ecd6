# Mentions v2 — PR-2a Ship Note

**Date:** 2026-07-07
**Scope:** shared autocomplete + write-path sync + first two composers
**Follow-up:** PR-2b (PostComposer + ReviewWizard) — same primitives, no forked logic

---

## What shipped

### New files

| File | Role |
|---|---|
| `src/lib/mentions/syncMentions.ts` | Single write-path helper. Diffs the mention markup in `content` against the `mentions` table for a `(source_type, source_id, mentioner_id)` triple and applies the minimum change (add / remove / keep). |
| `src/lib/mentions/useMentionAutocomplete.ts` | Token detection + debounced suggestion search over `user_profiles` and `business_accounts`. Returns `{ isActive, activeQuery, suggestions, isLoading, applySelection }`. |
| `src/components/mentions/MentionAutocomplete.tsx` | Popover UI. Anchored `bottom: 100%` inside a `position: relative` sibling; ↑/↓/Enter/Tab keyboard control via `inputRef`. |

### Edited files

| File | Change |
|---|---|
| `src/hooks/useCommentsWithReplies.ts` | (1) Removed the legacy `@handle` regex block that wrote directly to `notifications`. (2) `addComment` now calls `syncMentionsForContent`. (3) `updateComment` now calls `syncMentionsForContent` — this is the edit path. |
| `src/hooks/useTopTenComments.ts` | (1) `addComment` now returns the new comment id (`mutateAsync`, `Promise<string>`). (2) After insert, calls `syncMentionsForContent` with `sourceType: 'top_ten_comment'`. |
| `src/components/comments/CommentsSheet.tsx` | Wired `useMentionAutocomplete` + `<MentionAutocomplete>` into the composer. Tracks caret via `onChange` / `onKeyUp` / `onClick`. |
| `src/components/profile/courses/TopTenCardComments.tsx` | Same wiring pattern. |

---

## Acceptance evidence

### 1) Autocomplete works in CommentsSheet + TopTenCardComments

Manual QA — see attached screenshots in the review thread:
- `pr2a-autocomplete-comments-sheet.png`
- `pr2a-autocomplete-top-ten.png`

### 2) `syncMentionsForContent` edit-diff proof

Verified against a real comment (`58e717a8-…-c74d0`, author `314366da-…-828d`) using three real user ids `A`/`B`/`C`. Test rows created + cleaned up in place; no scratch data left in the DB.

| Step | Mentions rows | Notifications (new) |
|---|---|---|
| Create with `{A, B}` | `{A, B}` | `{A, B}` — trigger fires once per inserted row |
| Edit to `{A, C}` (keep A, remove B, add C) | `{A, C}` | `{C}` — **only the added mention notified**; A got no duplicate; B was silently revoked |

The `mentions` trigger `create_mention_notification` fires **on INSERT only** — kept rows don't move, so no duplicate. Removed rows are DELETEd, which does not fire the notification trigger, matching the "silent revoke" intent.

The DB confirmation runs live in [`supabase--insert` / `supabase--read_query`] and is reproducible against the same identifiers.

### 3) Mutation hooks return new row id

- `useCommentsWithReplies.addComment` — already returned `Promise<string>` (`newCommentId`). No change needed.
- `useTopTenComments.addComment` — changed from fire-and-forget `.mutate` to `.mutateAsync` returning `Promise<string>`. Callers that ignored the return value are unaffected; the id is now available for `syncMentionsForContent` inside the mutation body.

### 4) Legacy audit — see `docs/mentions/2026-07-07-legacy-content-audit.md`

**No backfill required.** Legacy `@handle` strings render as plain text via `MentionText` (their regex doesn't match); they simply lose their linkiness. Attempting to resolve `@handle` → `user_id` retroactively is unsafe (handles are not globally unique in the historical dataset and users have renamed).

### 5) Storage format decision — **raw markup in textarea**

The composer textarea holds the canonical `@[Name](u:UUID)` markup while typing. The user sees the raw markup character-for-character.

**Rationale:**
- `contentEditable` adds a large maintenance surface (IME quirks on Android/iOS, cursor jumping on programmatic mutation, autoresize collisions with the existing composer height logic).
- The rendered surfaces (`MentionText`) already accept the raw markup as their lossless input format.
- Keeping the textarea a plain `<textarea>` means the composer stays a controlled string — trivial to preserve across sheet close/reopen, drafts, edit reload, etc.

**Tradeoff we accept:** the markup is visible mid-typing. In device testing this is fine — the token gets replaced instantly on autocomplete selection, and users typing without autocomplete write plain `@names` (which don't turn into markup and render as plain text on the read surface — same behaviour as before this PR).

---

## Spec flags (per brief clause 1)

None. The PR-2a scope was self-contained and the primitive shapes fell out cleanly.

---

## What PR-2b picks up

- Wire `useMentionAutocomplete` + `<MentionAutocomplete>` into `PostComposer` and `ReviewWizard`.
- Wire their create + edit write paths through the **same** `syncMentionsForContent` — no new sync logic. Ship note includes:
  - `grep -rn 'from .*mentions/syncMentions' src` proving one definition, four consumers.
  - Autocomplete screenshots from both composers.
  - End-to-end pass of acceptance list 1–5 across all four surfaces.
