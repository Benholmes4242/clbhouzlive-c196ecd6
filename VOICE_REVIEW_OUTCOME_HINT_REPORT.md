# Voice review outcome + course hint — stopped verification

## Implemented
- VoiceDictateButton keeps the existing finished/failed events and retry toast, and now reports recording duration (`rec.duration * 1000`), not transcription latency. Existing MIME metadata retained; no audio/transcript content in events.
- Optional prompt is forwarded by transcribeAudio; the wizard supplies `A golf course review of ${course.name}.` using its displayed course name.
- voice-to-text validates optional prompt, trims/caps it at 200 characters and adds it to Whisper FormData only when nonblank. Existing recording format, authentication, other callers and layout remain unchanged.
- ReviewComposerV2 uses session-scoped clearing tracking: each nonempty-to-empty transition on the words step emits lengths and after_voice. Admin has all three labels.

## Verification STOP
Command: `npx vitest run src/test/voiceReviewHint.test.tsx src/test/voiceReviewOutcomes.test.tsx src/test/voiceReviewFormat.test.tsx src/test/reviewStepOne.test.tsx`
Focused total: 35 executed; 33 passed, 2 failed.

Both failing tests in `src/test/voiceReviewFormat.test.tsx`:
1. `voice recording format > MP4-only device records and exposes an MP4 blob`. Intended assertion: `expect(options).toEqual({ mimeType: 'audio/mp4' })`; not reached.
2. `voice recording format > no supported preference constructs the recorder without MIME options`. Intended assertion: `expect(count).toBe(1)`; not reached.

Tool error verbatim: `Error: createObjectURL does not exist`
Location: `src/test/voiceReviewFormat.test.tsx:28:8`
Failing setup: `vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:voice');`

No test repairs authorised or made. No existing test renamed, deleted, rewritten or assertion changed. No full shards run after the failure. voice-to-text NOT redeployed because the brief requires stopping on any failure. Real iPhone/native and authenticated end-to-end behavior remain unverified.

## Count reconciliation
Last verified full-suite baseline: 8,103 (four upload corrections).
Previous voice brief added 9 cases: voiceReviewFormat 5 + voiceReviewOutcomes 4; its full suite was not run, so inferred inventory 8,112, not a passing baseline.
This brief adds 5 cases in voiceReviewHint.test.tsx:
- clearing dictated text tracks review_text_cleared with after_voice true
- typed-only clearing reports after_voice false
- transcribeAudio forwards prompt, and omits it when absent
- edge function adds prompt only when present, trimmed to 200 chars
- eventLabels has the three labels
Expected inventory after: 8,117 (+14 from last verified 8,103). Full-suite total after is unverified; only the focused 35-case run above was executed.
No SQL, migrations, feed_config, round_pool_cap or native/Median changes.
