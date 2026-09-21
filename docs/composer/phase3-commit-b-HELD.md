# PHASE 3 COMMIT B — HELD. DO NOT APPLY UNTIL create_post_v2 HAS BEEN REPLACED.

Commit A is in the branch. This file is the whole of commit B, written out and
deliberately NOT applied.

## Why it is held

`create_post_v2` still carries a guard rejecting a call that declares no media.
A text-only post against the live function raises a bare exception and the member
sees a failure with no explanation. Flipping the client gate before the server is
replaced turns a wall into a broken button, which is worse.

Ben replaces the function. Not this side.

## The change — one clause, one file

`src/features/post-v2/lib/postGate.ts`

```ts
export function postContentGate({ isEditMode, mediaCount, caption }: PostContentGateInput): boolean {
  return isEditMode || mediaCount > 0 || caption.trim().length > 0;
}
```

Delete the commit-A comment above the return and replace it with:

```ts
  // A post needs ONE of the two, not both: 11% of posts carry no caption, and
  // requiring a photograph in front of a member who wants to write two
  // sentences is the wall this phase removes.
```

Nothing else in `canSubmit` changes. `!!activeActor` stays.

## The test change that goes with it

`src/features/post-v2/__tests__/postPhase3.test.ts` — in the gate table, the
`words only` row flips from `false` to `true`. `neither` stays `false` (§3.4: the
button stays disabled and names what is missing). Everything else is unchanged.

## After applying

Watch the status a text-only post lands in. Once the server guard goes, text-only
posts take a different status branch from media posts. If one lands somewhere
unexpected, report it — do not work around it here.
