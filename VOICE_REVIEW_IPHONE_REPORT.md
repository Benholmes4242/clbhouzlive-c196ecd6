# iPhone voice review — stopped verification

Implemented supported MIME negotiation and actual recorder MIME on blobs, MIME transport and Whisper filename mapping, outcome analytics/admin labels, and the requested retry toast. Removed transcript-content logging from the function. Function also validates authentication/input and includes SDK CORS headers.

## Stop
Command: `bunx vitest run src/test/voiceReviewFormat.test.tsx src/test/voiceReviewOutcomes.test.tsx --maxWorkers=2`

7 passed, 2 failed, 9 executed.

Both failures at `src/test/voiceReviewFormat.test.tsx:28:8`:

- `voice recording format > MP4-only device records and exposes an MP4 blob`
- `voice recording format > no supported preference constructs the recorder without MIME options`

Tool output: `Error: createObjectURL does not exist`

Failing setup: `vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:voice');`
The assertions were not reached. This test environment does not supply that browser API. No test repair was made because the brief says any failure must stop, with no repairs authorised.

## Counts and deployment
Last full-suite baseline: 8,103. Nine new guards added (five in voiceReviewFormat, four in voiceReviewOutcomes); expected registered total 8,112, not verified by full shards. No existing test deleted, renamed, rewritten or repaired.

**voice-to-text was not redeployed.** Stopped before deployment/full shards on the failures above. Latest preview build log: build OK at 2026-11-10T18:46:44Z. Real iPhone/native dictation remains unverified.

No SQL, migrations, feed_config, round_pool_cap, native/Median configuration or unrelated edge functions changed.