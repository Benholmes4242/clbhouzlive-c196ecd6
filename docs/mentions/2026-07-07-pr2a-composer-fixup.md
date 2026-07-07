# Mentions v2 — PR-2a FIX-UP: display-transform composer

**Date:** 2026-07-07
**Supersedes:** the "raw-markup-in-textarea" section of `2026-07-07-pr2a-ship-note.md`

## Decision: adopt `react-mentions`

Rejected on device: rendering `@[Thomas Holmes](u:11111111-…-555555555555)` inline in a textarea is user-visibly broken.

Two candidates for the fix:

1. **`react-mentions`** — mature library (`4.4.x`, maintained), whose entire purpose is exactly the display-transform pattern this brief asks for. Ships an overlay-based textarea with:
   - `value` carrying canonical markup (`@[__display__](__id__)`), which happens to be exactly our storage format (`__id__` = `u:UUID` / `b:UUID`).
   - `displayTransform(id, display)` rendering the visible form (we use `@${display}`).
   - Automatic caret mapping and **atomic mention deletion** — Backspace into a mention removes the whole token; there is no half-deleted `(u:...)` state.
   - `renderSuggestion` hook so we keep the Dispatch squircle/verified visuals from PR-2a.
2. DIY overlay/transform in our own hook.

We picked **(1)**. It replicates the react-native text input model in the web textarea with an overlaid highlighter div, and we would end up rebuilding that same infrastructure (keydown mapping, IME safety, selection preservation across programmatic mutations) to hit the acceptance bar. The DIY route is a 500-line side-quest with no product upside.

## What changed since PR-2a

### Added
- `src/components/mentions/MentionsComposerInput.tsx` — thin wrapper around `<MentionsInput><Mention trigger="@" /></MentionsInput>`, wired to the same `user_profiles` + `business_accounts` search PR-2a defined, and styled with the same Dispatch tokens.

### Removed (dead)
- `src/components/mentions/MentionAutocomplete.tsx`
- `src/lib/mentions/useMentionAutocomplete.ts`

Both were the PR-2a plain-textarea popup approach. Not exported publicly, not referenced anywhere else.

### Rewired
- `src/components/comments/CommentsSheet.tsx` — the composer's `<textarea>` is now `<MentionsComposerInput value={inputText} onChange={setInputText} onSubmit={handleSend} />`. Caret state deleted (library owns it).
- `src/components/profile/courses/TopTenCardComments.tsx` — same swap; dead `handleDraftChange` shim removed.

The two mutation hooks and `syncMentionsForContent` are **unchanged** — the value they receive is still the canonical markup string. The whole write path is invariant across the fix-up.

## Round-trip verification

Ran against `src/lib/mentions/format.ts` directly:

```
CANONICAL: hey @[Thomas Holmes](u:11111111-2222-3333-4444-555555555555) — welcome, and @[Aces Golf Co](b:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee) too
DISPLAY  : hey @Thomas Holmes — welcome, and @Aces Golf Co too
EXTRACTED: [
  { entityType:'user',     entityId:'11111111-…-555555555555', display:'Thomas Holmes' },
  { entityType:'business', entityId:'aaaaaaaa-…-eeeeeeeeeeee', display:'Aces Golf Co' }
]
REBUILT  : @[Thomas Holmes](u:11111111-2222-3333-4444-555555555555)
```

- **What react-mentions writes** === **what we store** === **what we parse**. No transform layer needed on submit.
- **What the user sees** is only ever `@Name`.
- Removing a mention via Backspace deletes the whole `@[Name](u:UUID)` token from `value` (library-owned) — no half-deleted marker can reach `syncMentionsForContent`.

## Acceptance mapping

| Item | Status |
|---|---|
| Typing plain text | Native textarea behaviour (library is a controlled overlay over a real `<textarea>`). |
| Selecting from autocomplete | `<Mention data={searchMentions} renderSuggestion={…} appendSpaceOnAdd />` — inserts canonical markup + trailing space. |
| Caret editing around a mention | react-mentions maps caret coordinates from the display buffer to the markup buffer. Verified in device pass. |
| Backspacing a mention | Atomic — library deletes the whole markup token. No half-deleted state is representable. |
| No markup ever visible | `displayTransform={(_id, display) => '@' + display}` — the visible layer only renders `@Name`. |
| Submitted content carries canonical markup | Round-trip proof above. |
| Both composers | CommentsSheet + TopTenCardComments both routed through `<MentionsComposerInput>`. |

## Contract for PR-2b

PR-2b's two composers (`PostComposer`, `ReviewWizard`) MUST use `<MentionsComposerInput>` — no new textarea shims, no forked search logic. `grep -rn "from '@/components/mentions/MentionsComposerInput'" src` in the PR-2b ship note will show one definition, four consumers.
