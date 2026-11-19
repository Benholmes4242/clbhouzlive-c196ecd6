# POST FLOW: switch, Played with, Choose a round

Commit af0269488b (build) plus closeout commit.

## Rulings applied
- wagrRankingTab.test.tsx:223 "A failed history read removes movement and chart but keeps figures": `getByText('312th')` -> `await screen.findByText('312th')`, value unchanged (authorised). File alone 32/32.
- Accepted as built: suggestions stay on empty search; caption-mention adds hide at 8; no touchstart block.
- Mock over brief: course variant kept in sheet ("Sundridge Park (East)"); whole "n played with you" bold; "Mentioned in your caption" above selected chips.

## Test changes
- composerTagging.test.tsx:96 `fireEvent.blur(input, { relatedTarget: null });` -> `fireEvent.pointerDown(document.body);` (brief removes blur-collapse); assertion `expect(screen.queryByRole('status')).toBeNull()` unchanged.
- Added postFlowPlayedWithRounds.test.tsx, 7 cases (a)-(g).

## Suite
Shards (sequential, logs /tmp/pf2-shard-{1..4}.log): 2,246 / 2,274 / 2,295 / 2,366 = 9,181, all passing.
Reconciliation: last full pass 9,169 + 5 WAGR best-rank cases (added in that brief, never in a full run) + 7 here = 9,181. The 9,176 expectation omitted the five WAGR cases.

## Outstanding
Ben iPhone checks; no browser check at 390/320.
