# Canonical heading Brief 18

## Status

Part 1 colour changes and real-component captures are complete. Test shards are recorded below as they finish. **Part 2 is a provisional extraction, not an exhaustive signed-off role/route inventory.** No Part 2 production changes were made.

## Part 1 — colour-only changes

33 local declaration changes across 23 production files. `SECTION_EYEBROW` remains colourless. Shared `T.mute`, `HIP.MUTE`, `W.mute`, `FUNNEL_MUTE`, `KICKER`, `RV2.eyebrow` and `ABOUT_KICKER` were not repointed. The BusinessEmptyState local `kicker`, BusinessWeekCard local `kickerStyle`, analytics local kickers and `S7_KICKER` have only eyebrow consumers, so their local colours changed. BusinessInvitePage opts its two row-group headings into ink; its Role form-field label retains the old shared muted style.

The Insights visits first-span colour override is necessary: the existing `:last-child` rule also matches a one-span eyebrow. It now receives ink without changing its tracking/alignment; trailing data remains dim. All existing fonts, typography, copy, layout and semantic colours were retained. DeleteAllDataConfirmSheet and DeleteAccountConfirmSheet remain danger red. Admin, photo/gate/celebration labels, and dead code were not changed.

| File:line | Old → new |
|---|---|
| `src/components/business/BusinessEmptyState.tsx:69` | `const kicker: React.CSSProperties = { ...SECTION_EYEBROW, color: MUTE };` → `const kicker: React.CSSProperties = { ...SECTION_EYEBROW, color: INK };` |
| `src/components/business/BusinessFollowersCard.tsx:81` | `<span style={{ ...SECTION_EYEBROW, color: T.mute }}>` → `<span style={{ ...SECTION_EYEBROW, color: T.ink }}>` |
| `src/components/business/BusinessNearbyCourses.tsx:128` | `<span style={{ ...SECTION_EYEBROW, color: T.mute }}>` → `<span style={{ ...SECTION_EYEBROW, color: T.ink }}>` |
| `src/components/business/ClubFromTheClub.tsx:55` | `<span style={{ ...SECTION_EYEBROW, color: 'rgba(248,250,252,0.62)', ...(title !== undefined ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 } : {}) }} data-club-feed-title={title !== undefined ? "" : undefined}>{heading}</span>` → `<span style={{ ...SECTION_EYEBROW, color: INK, ...(title !== undefined ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 } : {}) }} data-club-feed-title={title !== undefined ? "" : undefined}>{heading}</span>` |
| `src/components/business/ClubHowItPlays.tsx:150` | `<div style={{ ...SECTION_EYEBROW, color: T.mute }}>How it plays</div>` → `<div style={{ ...SECTION_EYEBROW, color: T.ink }}>How it plays</div>` |
| `src/components/business/ClubWhatGolfersSay.tsx:137, 162` | `<div style={{ ...SECTION_EYEBROW, color: T.mute, marginBottom: 10 }}>` → `<div style={{ ...SECTION_EYEBROW, color: T.ink, marginBottom: 10 }}>`<br>`<div style={{ ...SECTION_EYEBROW, color: T.mute }}>What golfers say</div>` → `<div style={{ ...SECTION_EYEBROW, color: T.ink }}>What golfers say</div>` |
| `src/components/business/home/BusinessDoNextCard.tsx:74` | `<div style={{ ...SECTION_EYEBROW, color: H.mute }}>` → `<div style={{ ...SECTION_EYEBROW, color: H.ink }}>` |
| `src/components/business/home/BusinessWeekCard.tsx:76` | `display: 'flex', justifyContent: 'space-between', ...SECTION_EYEBROW, color: W.mute,` → `display: 'flex', justifyContent: 'space-between', ...SECTION_EYEBROW, color: W.ink,` |
| `src/components/business/insights/InsightsFunnel.tsx:171` | `...SECTION_EYEBROW, color: FUNNEL_MUTE,` → `...SECTION_EYEBROW, color: FUNNEL_INK,` |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:341` | `<div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>` → `<div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>` |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:171` | `<div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>` → `<div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>` |
| `src/components/courses/course-detail/you/YourRoundsSheet.tsx:112` | `<div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>` → `<div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>` |
| `src/components/explore-tab-new/FindGolfersSheet.tsx:498` | `<div style={{ ...SECTION_EYEBROW, color: KICKER.color }}>{t('discover.findGolfers.kicker', 'The members')}</div>` → `<div style={{ ...SECTION_EYEBROW, color: A.INK }}>{t('discover.findGolfers.kicker', 'The members')}</div>` |
| `src/components/posts/ReviewBottomSheet.tsx:498` | `<span style={{ ...SECTION_EYEBROW, color: DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>` → `<span style={{ ...SECTION_EYEBROW, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>` |
| `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx:194` | `<div style={{ ...SECTION_EYEBROW, color: KICKER.color, fontFamily: REC.FONT }}>{t('invites.kicker')}</div>` → `<div style={{ ...SECTION_EYEBROW, color: REC.INK, fontFamily: REC.FONT }}>{t('invites.kicker')}</div>` |
| `src/features/business/clubAnalytics/sections.tsx:150, 213, 304, 433, 489, 677` | `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...SECTION_EYEBROW, color: HIP.MUTE }}>` → `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...SECTION_EYEBROW, color: HIP.INK }}>`<br>`<div style={{ ...SECTION_EYEBROW, color: HIP.MUTE }}>The sample</div>` → `<div style={{ ...SECTION_EYEBROW, color: HIP.INK }}>The sample</div>`<br>`const kicker: React.CSSProperties = { ...SECTION_EYEBROW, color: HIP.MUTE };` → `const kicker: React.CSSProperties = { ...SECTION_EYEBROW, color: HIP.INK };`<br>`<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...SECTION_EYEBROW, color: HIP.MUTE }}>` → `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...SECTION_EYEBROW, color: HIP.INK }}>`<br>`const S7_KICKER: React.CSSProperties = { ...SECTION_EYEBROW, color: HIP.MUTE };` → `const S7_KICKER: React.CSSProperties = { ...SECTION_EYEBROW, color: HIP.INK };`<br>`const kicker: React.CSSProperties = { ...SECTION_EYEBROW, color: HIP.MUTE };` → `const kicker: React.CSSProperties = { ...SECTION_EYEBROW, color: HIP.INK };` |
| `src/features/explore-magazine/Section.tsx:67` | `<div style={{ ...SECTION_EYEBROW, color: contest ? A.INK : A.DIM }}>{eyebrow}</div>` → `<div style={{ ...SECTION_EYEBROW, color: A.INK }}>{eyebrow}</div>` |
| `src/features/pro-verification/pro-status-controls.css:14` | `.pro-status-kicker{font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);line-height:var(--section-eyebrow-leading);text-transform:var(--section-eyebrow-transform);color:var(--pro-controls-muted)}` → `.pro-status-kicker{font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);line-height:var(--section-eyebrow-leading);text-transform:var(--section-eyebrow-transform);color:var(--pro-controls-ink)}` |
| `src/features/pro-verification/pro-verification.css:10` | `.pds-kicker{font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);line-height:var(--section-eyebrow-leading);text-transform:var(--section-eyebrow-transform);color:rgba(248,250,252,0.62)}` → `.pds-kicker{font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);line-height:var(--section-eyebrow-leading);text-transform:var(--section-eyebrow-transform);color:var(--pro-controls-ink)}` |
| `src/features/review-v2/components/ReviewHoleTags.tsx:111` | `{list && <><h2 className="mt-4 mb-2" style={{ ...SECTION_EYEBROW, color: RV2.eyebrow }}>Put them on a hole</h2>` → `{list && <><h2 className="mt-4 mb-2" style={{ ...SECTION_EYEBROW, color: RV2.ink }}>Put them on a hole</h2>` |
| `src/features/review-v2/components/reviewReceipt.css:20` | `.review-receipt h2{font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);line-height:var(--section-eyebrow-leading);text-transform:var(--section-eyebrow-transform);color:var(--receipt-dim);margin:0}` → `.review-receipt h2{font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);line-height:var(--section-eyebrow-leading);text-transform:var(--section-eyebrow-transform);color:var(--receipt-ink);margin:0}` |
| `src/index.css:540, 5520, 5522, 5642` | `.club-you-kicker { font-size: var(--section-eyebrow-size); font-weight: var(--section-eyebrow-weight); letter-spacing: var(--section-eyebrow-tracking); line-height: var(--section-eyebrow-leading); text-transform: var(--section-eyebrow-transform); color:var(--club-you-muted); margin:0 0 10px; overflow-wrap:anywhere; }` → `.club-you-kicker { font-size: var(--section-eyebrow-size); font-weight: var(--section-eyebrow-weight); letter-spacing: var(--section-eyebrow-tracking); line-height: var(--section-eyebrow-leading); text-transform: var(--section-eyebrow-transform); color:var(--club-you-ink); margin:0 0 10px; overflow-wrap:anywhere; }`<br>`.insights-visits-kicker { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: var(--section-eyebrow-size); font-weight: var(--section-eyebrow-weight); letter-spacing: var(--section-eyebrow-tracking); line-height: var(--section-eyebrow-leading); text-transform: var(--section-eyebrow-transform); color: var(--team-muted); }` → `.insights-visits-kicker { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: var(--section-eyebrow-size); font-weight: var(--section-eyebrow-weight); letter-spacing: var(--section-eyebrow-tracking); line-height: var(--section-eyebrow-leading); text-transform: var(--section-eyebrow-transform); color: var(--team-ink); }`<br>`.insights-course-kicker { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size: var(--section-eyebrow-size); font-weight: var(--section-eyebrow-weight); letter-spacing: var(--section-eyebrow-tracking); line-height: var(--section-eyebrow-leading); text-transform: var(--section-eyebrow-transform); color:var(--team-muted); }` → `.insights-visits-kicker > span:first-child { color: var(--team-ink); }`<br>Added first-span ink override. |
| `src/pages/BusinessInvitePage.tsx:327, 342` | `<h2 style={headingStyle}>` → `<h2 style={{ ...headingStyle, color: INK }}>`<br>`<h2 style={headingStyle}>` → `<h2 style={{ ...headingStyle, color: INK }}>` |

### Test edits

No test was deleted or renamed. Two authorised old-grey source assertions changed; their test names and typography assertions remain intact:

- `src/test/businessHeadingCanon.test.tsx:78`, “a remaining card eyebrow (followers) takes SECTION_EYEBROW at 11px / 0.16em”: `/...SECTION_EYEBROW, color: T\.mute/` → `/...SECTION_EYEBROW, color: T\.ink/`, because the changed follower eyebrow now uses ink.
- `src/test/businessHeadingCanon.test.tsx:92`, “the Insights funnel kicker takes SECTION_EYEBROW at 11px / 0.16em”: `/...SECTION_EYEBROW, color: FUNNEL_MUTE,/` → `/...SECTION_EYEBROW, color: FUNNEL_INK,/`, because the changed funnel eyebrow now uses ink.

Added **one** test in `src/test/brief18EyebrowInk.test.tsx`: “every Part 1 eyebrow declaration computes to rgb(248, 250, 252)”. Assertion: `expect(getComputedStyle(element).color, `${site.file}:${site.line}`).toBe("rgb(248, 250, 252)")`. It resolves actual local/imported declaration expressions and CSS variables into DOM colour probes for all 33 changed declarations. **These are declaration probes, not full-component test mounts.** Real consumers are independently checked in Chromium captures. The supporting JSON is not a test file.

### Shards

Baseline: **10,434 tests / 899 files**. Expected delta: **+1 test / +1 file**, solely `brief18EyebrowInk.test.tsx` and its single named case. Existing test counts are unchanged.

| Command | Passed / total | Files |
|---|---|---|
| `bun x vitest run --shard=1/4` | 2,500 / 2,500 | 225 |
| `bun x vitest run --shard=2/4` | Pending | Pending |
| `bun x vitest run --shard=3/4` | Pending | Pending |
| `bun x vitest run --shard=4/4` | Pending | Pending |

Raw output is retained in `/tmp/brief18-tests/`, outside the repository. No package test script exists; an initial `bun run test` invocation produced no output and ran no tests, and is not counted.

### Real-component captures

Accepted pre-change source is the current HEAD (`647a4c4d4a`). Each changed file was copied to a disposable sibling; Chromium routed only the before pass to those originals. Both passes used actual components, real MemoryRouter/QueryClient/navigation/invitation providers, and fixture-only hook/cache values. Hosted requests were blocked; no SQL, RPC, migration or hosted write ran. The temporary page and all 23 pre-change shadow files were removed before the shards.

**148 surface captures**: 37 real-component variants × before/after × 390/320, plus individual label/context crops. All 37 final variants rendered without fixture errors. Browser colour readings agree with ink for the changed labels; neighbouring counts/periods remain dim. No horizontal overflow was detected at 320 or 390 in the final captures. This is fixture visual verification, not hosted authenticated data-flow verification.

| Surface | Before 390 | After 390 | Before 320 | After 320 |
|---|---|---|---|---|
| HoleBySection | [Capture](captures/HoleBySection-before-390.png) | [Capture](captures/HoleBySection-after-390.png) | [Capture](captures/HoleBySection-before-320.png) | [Capture](captures/HoleBySection-after-320.png) |
| HowItPlaysSection | [Capture](captures/HowItPlaysSection-before-390.png) | [Capture](captures/HowItPlaysSection-after-390.png) | [Capture](captures/HowItPlaysSection-before-320.png) | [Capture](captures/HowItPlaysSection-after-320.png) |
| IndexDisagreesSection | [Capture](captures/IndexDisagreesSection-before-390.png) | [Capture](captures/IndexDisagreesSection-after-390.png) | [Capture](captures/IndexDisagreesSection-before-320.png) | [Capture](captures/IndexDisagreesSection-after-320.png) |
| InsightsAudienceSection | [Capture](captures/InsightsAudienceSection-before-390.png) | [Capture](captures/InsightsAudienceSection-after-390.png) | [Capture](captures/InsightsAudienceSection-before-320.png) | [Capture](captures/InsightsAudienceSection-after-320.png) |
| InsightsEngagementSection | [Capture](captures/InsightsEngagementSection-before-390.png) | [Capture](captures/InsightsEngagementSection-after-390.png) | [Capture](captures/InsightsEngagementSection-before-320.png) | [Capture](captures/InsightsEngagementSection-after-320.png) |
| InsightsFollowersSection | [Capture](captures/InsightsFollowersSection-before-390.png) | [Capture](captures/InsightsFollowersSection-after-390.png) | [Capture](captures/InsightsFollowersSection-before-320.png) | [Capture](captures/InsightsFollowersSection-after-320.png) |
| InsightsPostsSection | [Capture](captures/InsightsPostsSection-before-390.png) | [Capture](captures/InsightsPostsSection-after-390.png) | [Capture](captures/InsightsPostsSection-before-320.png) | [Capture](captures/InsightsPostsSection-after-320.png) |
| InsightsReviewsSection | [Capture](captures/InsightsReviewsSection-before-390.png) | [Capture](captures/InsightsReviewsSection-after-390.png) | [Capture](captures/InsightsReviewsSection-before-320.png) | [Capture](captures/InsightsReviewsSection-after-320.png) |
| RecordBookSection | [Capture](captures/RecordBookSection-before-390.png) | [Capture](captures/RecordBookSection-after-390.png) | [Capture](captures/RecordBookSection-before-320.png) | [Capture](captures/RecordBookSection-after-320.png) |
| SampleSection | [Capture](captures/SampleSection-before-390.png) | [Capture](captures/SampleSection-after-390.png) | [Capture](captures/SampleSection-before-320.png) | [Capture](captures/SampleSection-after-320.png) |
| TeesSection | [Capture](captures/TeesSection-before-390.png) | [Capture](captures/TeesSection-after-390.png) | [Capture](captures/TeesSection-before-320.png) | [Capture](captures/TeesSection-after-320.png) |
| WhoPlaysSection | [Capture](captures/WhoPlaysSection-before-390.png) | [Capture](captures/WhoPlaysSection-after-390.png) | [Capture](captures/WhoPlaysSection-before-320.png) | [Capture](captures/WhoPlaysSection-after-320.png) |
| allholes | [Capture](captures/allholes-before-390.png) | [Capture](captures/allholes-after-390.png) | [Capture](captures/allholes-before-320.png) | [Capture](captures/allholes-after-320.png) |
| empty | [Capture](captures/empty-before-390.png) | [Capture](captures/empty-after-390.png) | [Capture](captures/empty-before-320.png) | [Capture](captures/empty-after-320.png) |
| find | [Capture](captures/find-before-390.png) | [Capture](captures/find-after-390.png) | [Capture](captures/find-before-320.png) | [Capture](captures/find-after-320.png) |
| followers | [Capture](captures/followers-before-390.png) | [Capture](captures/followers-after-390.png) | [Capture](captures/followers-before-320.png) | [Capture](captures/followers-after-320.png) |
| from | [Capture](captures/from-before-390.png) | [Capture](captures/from-after-390.png) | [Capture](captures/from-before-320.png) | [Capture](captures/from-after-320.png) |
| funnel | [Capture](captures/funnel-before-390.png) | [Capture](captures/funnel-after-390.png) | [Capture](captures/funnel-before-320.png) | [Capture](captures/funnel-after-320.png) |
| holes | [Capture](captures/holes-before-390.png) | [Capture](captures/holes-after-390.png) | [Capture](captures/holes-before-320.png) | [Capture](captures/holes-after-320.png) |
| how | [Capture](captures/how-before-390.png) | [Capture](captures/how-after-390.png) | [Capture](captures/how-before-320.png) | [Capture](captures/how-after-320.png) |
| invite | [Capture](captures/invite-before-390.png) | [Capture](captures/invite-after-390.png) | [Capture](captures/invite-before-320.png) | [Capture](captures/invite-after-320.png) |
| nearby | [Capture](captures/nearby-before-390.png) | [Capture](captures/nearby-after-390.png) | [Capture](captures/nearby-before-320.png) | [Capture](captures/nearby-after-320.png) |
| next | [Capture](captures/next-before-390.png) | [Capture](captures/next-after-390.png) | [Capture](captures/next-before-320.png) | [Capture](captures/next-after-320.png) |
| pro | [Capture](captures/pro-before-390.png) | [Capture](captures/pro-after-390.png) | [Capture](captures/pro-before-320.png) | [Capture](captures/pro-after-320.png) |
| pulse | [Capture](captures/pulse-before-390.png) | [Capture](captures/pulse-after-390.png) | [Capture](captures/pulse-before-320.png) | [Capture](captures/pulse-after-320.png) |
| receipt | [Capture](captures/receipt-before-390.png) | [Capture](captures/receipt-after-390.png) | [Capture](captures/receipt-before-320.png) | [Capture](captures/receipt-after-320.png) |
| review | [Capture](captures/review-before-390.png) | [Capture](captures/review-after-390.png) | [Capture](captures/review-before-320.png) | [Capture](captures/review-after-320.png) |
| rounds | [Capture](captures/rounds-before-390.png) | [Capture](captures/rounds-after-390.png) | [Capture](captures/rounds-before-320.png) | [Capture](captures/rounds-after-320.png) |
| say | [Capture](captures/say-before-390.png) | [Capture](captures/say-after-390.png) | [Capture](captures/say-before-320.png) | [Capture](captures/say-after-320.png) |
| say-empty | [Capture](captures/say-empty-before-390.png) | [Capture](captures/say-empty-after-390.png) | [Capture](captures/say-empty-before-320.png) | [Capture](captures/say-empty-after-320.png) |
| section | [Capture](captures/section-before-390.png) | [Capture](captures/section-after-390.png) | [Capture](captures/section-before-320.png) | [Capture](captures/section-after-320.png) |
| sent | [Capture](captures/sent-before-390.png) | [Capture](captures/sent-after-390.png) | [Capture](captures/sent-before-320.png) | [Capture](captures/sent-after-320.png) |
| status | [Capture](captures/status-before-390.png) | [Capture](captures/status-after-390.png) | [Capture](captures/status-before-320.png) | [Capture](captures/status-after-320.png) |
| tags | [Capture](captures/tags-before-390.png) | [Capture](captures/tags-after-390.png) | [Capture](captures/tags-before-320.png) | [Capture](captures/tags-after-320.png) |
| visits | [Capture](captures/visits-before-390.png) | [Capture](captures/visits-after-390.png) | [Capture](captures/visits-before-320.png) | [Capture](captures/visits-after-320.png) |
| week | [Capture](captures/week-before-390.png) | [Capture](captures/week-after-390.png) | [Capture](captures/week-before-320.png) | [Capture](captures/week-after-320.png) |
| you | [Capture](captures/you-before-390.png) | [Capture](captures/you-after-390.png) | [Capture](captures/you-before-320.png) | [Capture](captures/you-after-320.png) |

Individual `*-label-*.png` crops retain the label and neighbouring context, including labels below the first viewport. Crops also include unchanged metadata for comparison; these are not role claims.

## Withdrawn Part 2

The provisional extraction is preserved in [part2-provisional-extraction.md](part2-provisional-extraction.md), superseded by surface batches. Ruled: BusinessEmptyState “Your golfers” is K3 (grey retained); StandoutRounds NET/GROSS is K1 (grey retained); LatestReviewsSheet is dead (unchanged). WatchFeed and other unresolved labels await their own batches.

## Batch A — Tour hub

Route-traced audit, colour changes and verification in progress. Fonts remain as they are, per the continuation ruling.
