# Canonical heading Brief 18

## Status

Part 1 complete. Part 2 withdrawn (provisional extraction archived). Batch A (Tour hub) complete.

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
| `bun x vitest run --shard=2/4` | 2,493 / 2,493 | 225 |
| `bun x vitest run --shard=3/4` | 2,607 / 2,607 | 225 |
| `bun x vitest run --shard=4/4` | 2,835 / 2,835 | 225 |

**Total 10,435 / 900. Delta vs 10,434 / 899: +1 test / +1 file**, solely `src/test/brief18EyebrowInk.test.tsx` › “every Part 1 eyebrow declaration computes to rgb(248, 250, 252)”. Raw output was retained in `/tmp/brief18-tests/` and `/tmp/brief18-part1-close/`, outside the repository. No package test script exists; an initial `bun run test` invocation produced no output and ran no tests, and is not counted.

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

Scope: every uppercase label with tracking ≥ 0.08em and a grey colour, reachable at runtime from `/tourhub`, `/tourhub/tournament/:tournamentId` and `/tourhub/player/:playerId` (`src/App.tsx:823–826`) and their sheets. Only E1/E2 changed; fonts, sizes, tracking, copy and layout unchanged.

### Role table — changed

| File:line | Text or key | Route | Role | Old → new |
|---|---|---|---|---|
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` `.tv-subtitle` | YOUR GROUPS, MARQUEE GROUP, THE LAST THREE GROUPS, HARDEST AND EASIEST | tournament | E2 (×4) | `var(--tv-dim)` → `var(--tv-ink)` |
| `src/features/tourhub/tournament-v2/sections/CourseSection.tsx:294` `SectionKicker` | holes-sheet distribution / hole-row heads | tournament (holes sheet) | E2 | `LABEL` grey → `A.INK` (CJK tracking kept) |
| `src/features/tourhub/tournament-v2/sections/HeroBoardRows.tsx:368` | LEADERBOARD (`rebuilt.*` kicker) | overview, tournament | E1 | inherited muted → `INK`; R1–R4/TOT columns kept |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:6` `.pick-panel-label` | AGREEMENT, THE CASE, THE CATCH, WHAT WINS HERE, HOW HE/SHE FITS WHAT WINS HERE, FURTHER DOWN OUR LIST, OUR READ; EVENT BY EVENT | overview/tournament/player (PicksSheet, OurRecordSheet) | E2 | `var(--pick-mute)` → `var(--pick-ink)` |
| `src/features/tourhub/player-v2/playerPage.css:75` `.pv-duo small` | BEST AT, THE CATCH | player | E2 | `var(--pick-mute)` → `var(--pick-ink)` |
| `src/features/tourhub/player-v2/playerPage.css:104` `.pv-best > small` | BEST ROUNDS | player | E2 | `var(--pick-mute)` → `var(--pick-ink)` |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:361` + `CardScorecardSheet.tsx:970, 1028` | `courses:scorecard.tile.roundsKicker`, `courses:scorecard.theCard` | all three (Tour scorecard sheet) | E2 | `TILE_KICKER` grey → `TILE_INK` when `ink={isTour}` |
| `src/features/tourhub/overview/sections/WorldRankings.tsx:119` | Biggest climber label | overview | E2 | `INK_FAINT` → `INK` |
| `src/features/tourhub/players-v2/picks/LinePicksCard.tsx:109` | WHO CALLED IT | players tab | E2 | `P.DIM` → `P.INK` |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx:658` | `schedule.nextMajor.label` | schedule tab | E1 | `INK_FAINT` → `INK`; countdown kept dim |
| `src/features/tourhub/news/NewsTab.tsx:384` | `news.page.searchResults` | news tab (islands only) | E2 | `.tour-news-grp` grey → `var(--news-ink)` when `islands` |
| `src/index.css:5844` | TOP STORIES, BY EVENT (`.tour-news-sec` first span) | news tab (islands only) | E1 | grey → `var(--news-ink)`; YOUR PLAYERS amber and counts kept |
| `src/features/tourhub/overview/sections/comingUp.css:32` `.coming-month` | Coming up month-year group heads | overview | E2 | `var(--tour-board-dim)` → `var(--tour-board-ink)` — **found by the final audit after 5ed874d and added** |

### Role table — kept (named)

| File:line | Text | Role | Colour |
|---|---|---|---|
| `src/features/tourhub/tournament-v2/sections/HeroBoardRows.tsx:368` neighbours | R1–R4, TOT column heads | K1 | kept |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx` next-major countdown | countdown metadata | K3 | kept |
| `src/index.css` `.tour-news-sec` counts / `.you` | counts; YOUR PLAYERS | K3 / viewer amber | kept |
| `src/features/chrome-v2/TourGlance.tsx` | THIS WEEK | K3 | kept |
| `src/features/tourhub/player-v2/playerPage.css` other tracked metadata | metadata under player heads | K3 | kept |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx` feat `TileSection` | feat kicker | D (unreachable on Tour: `scorecardFeat.ts:53` returns null unless `surface === 'member'`) | kept |
| `src/features/tourhub/overview/sections/OnTheCourse.tsx` | — | D (not imported by `OverviewPageV3`) | kept |
| `.player-v3 *` labels with `letter-spacing:0` | — | out of scope (tracking reset) | kept |

### Count per role

Changed: E1 3 sites (LEADERBOARD, NEXT MAJOR, news section heads); E2 10 sites (`.tv-subtitle`, SectionKicker, pick-panel-label, `.pv-duo small`, `.pv-best > small`, scorecard TileSection, Biggest climber, WHO CALLED IT, news search, `.coming-month`). 13 Batch A declaration sites; 46 total in the computed-colour fixture with Part 1's 33.

Kept: accepted without re-audit. Ben's re-scan of the 74 grey letter-spaced labels left in src/features/tourhub found all but two correctly kept (column headers, stat labels, meta/state labels, gold champion label, on-photo labels, tour picker status pills, dead OnTheCourse/SectionShell).

### Batch A addendum — two missed E1s

| file:line | text/key | route | role | old → new |
|---|---|---|---|---|
| `src/features/tourhub/news/StoryBody.tsx:351` | `news.player` "PLAYER" | /tourhub (News story) | E1 | `INK_FAINT` → `INK` |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:142` | `race.phase_label` | /tourhub (Players front) | E1 | `P.DIM` → `P.INK`; "N to go" stays `P.MUTE` (meta) |

Test edits: `brief18EyebrowInk.test.tsx:88` `toHaveLength(46)` → `toHaveLength(48)`; two rows appended to `brief18EyebrowSites.json`. Focused test 1/1 passed. Captures at 390 verified: `batch-a-addendum-captures/player-{before,after}-390.png` and `race-{before,after}-390.png`. PLAYER and THE FINAL STRETCH change from rgba(248,250,252,0.42) to rgb(248,250,252); N to go stays rgba(248,250,252,0.62). Both before/after variants show no horizontal overflow or runtime error. Real StoryBody and FrontPage components, seeded player-embed cache, fixed race data; no production change at this capture step. Temporary page and shadow components removed.

### Shards — after batch A

| Command | Passed / total | Files |
|---|---|---|
| `bun x vitest run --shard=1/4` | 2,500 / 2,500 | 225 |
| `bun x vitest run --shard=2/4` | 2,493 / 2,493 | 225 |
| `bun x vitest run --shard=3/4` | 2,607 / 2,607 | 225 |
| `bun x vitest run --shard=4/4` | 2,835 / 2,835 | 225 |

**Total 10,435 / 900. Delta vs Part 1 (10,435 / 900): 0 tests / 0 files.** Batch A extended the single existing case and added no `it`. Shards 1 and 2 were re-run in this pass because their earlier logs were lost with `/tmp`. Raw logs: `/tmp/brief18-batchA/`, outside the repo.

### Test edits

- `src/test/brief18EyebrowInk.test.tsx:88`: `expect(sites).toHaveLength(33);` → `expect(sites).toHaveLength(46);`
- `src/test/brief18EyebrowInk.test.tsx:94`: selector regex `'(?:^|\\n)' + escaped` → `'(?:^|[}\\n])' + escaped`, so it matches the minified one-line CSS rules.
- `src/test/brief18EyebrowInk.test.tsx:106`: added `if (typeof colour === 'string') colour = cssColour(colour, css);` (resolves imported inline `var()` colours).
- `src/test/brief18EyebrowInk.test.tsx:115–135`: added a real `TileSection` render (`ink=true` → `rgb(248, 250, 252)`, `ink=false` → `rgba(248, 250, 252, 0.42)`) and an AST check that `CardScorecardSheet` passes `ink={isTour}` to `rounds` and `card`.
- `src/test/fixtures/brief18EyebrowSites.json`: added 13 Tour sites (33 → 46).

No test was deleted or renamed.

### Captures

`batch-a-captures/`, before (`e472bb4`) and after, at 390 and 320, with label crops. Taken from a disposable fixture page with seeded cache data (since removed): board, callers, course, holes-sheet, month (Coming up, plus context), news, news-search, picks, player-game, player-rounds, rankings, record, schedule, scorecard, tees-live, tees-upcoming.

### Notes

- Coming up month groups (`comingUp.css:32`) were missed in 5ed874d, found by the final audit, and added.
- `CardScorecardSheet`'s `TileSection` now takes an `ink` prop that only Tour callers set (`ink={isTour}`), so member scorecards are unchanged.


## Batch B — Courses

### Audit, before source changes

Scope: `/courses`, `/courses/:courseId` (About, You, Legends, Reviews, Media), `/courses/:courseId/holes`, `/courses/:courseId/rounds`, `/courses/:courseId/rate`, and reachable sheets. Census records text/key sites, not the number of instances. Dynamic values and numeric axes are included explicitly to avoid confusing tracked data with eyebrows. Rows marked D are branch-unreachable, not assertions that the entire module is globally dead.

The complete per-label source census is also retained in `batch-b-census.tsv`. Local/shared declarations were traced to their JSX consumers. No production Courses source or tests changed before this audit commit.

Routes `/holes` and `/rounds` redirect to the canonical detail tabs/sheets: public holes → `?sheet=holes`; personal holes → `?sheet=your-holes&tab=you`; rounds → `?tab=you&sheet=rounds`. These mount AllHolesSheet, YourHolesSheet and YourRoundsSheet. CourseAnalyticsPanels, CourseCardPanel and CourseHolePanel belong to Discover; their helper/data imports do not mount those presentations on Courses. Analytical KICKER is already ink. LABEL and all shared grey tokens remain unchanged.

TheArgumentSection's two group labels are E2, planned A.INK, as ruled. StandoutRounds NET/GROSS remains K1, keep, including its below-threshold local tile override. Additional source-traced E headings missing from the partial notes: Claim's main kicker, gains, steps and standalone hole-strip head; list scope's block-introducing caption; year-group heads in YourRoundsSheet; RoundResults awards, holes and own-rounds heads; scorecard field head. Claim hole-strip head is not a paired stat label. The list's Courses/Rounds/Holes labels are paired stats and stay grey.

**Provisional D rows frozen:** ReviewRailSlot.tsx:51 and ReviewComposerV2.tsx:106 are unchanged as instructed. STEP1_HEADING has live consumers at :1168 and :1246, so its provisional D designation is not a claim of proven deadness. No recolouring or deletion of that declaration is planned in this continuation.

### Full role table

| File:line (pre-change) | Text/key | Route/surface | Role | Old → new or keep |
|---|---|---|---|---|
| `src/components/courses/CourseDirectorySheet.tsx:240` | `directorySheet.recentHeading` | /courses — directory | E2 | MUTE → INK |
| `src/components/courses/CourseDirectorySheet.tsx:285` | `directorySheet.ratedHeading` | /courses — directory | E2 | MUTE → INK |
| `src/components/courses/browse/ListScopeHeader.tsx:84` | `Every course in {region}` | /courses — list | E1 | A.DIM → A.INK; introduces the course-list block, not a figure caption |
| `src/components/courses/browse/ListScopeHeader.tsx:84` | `Every course in {country}` | /courses — list | E1 | A.DIM → A.INK |
| `src/components/courses/browse/ListScopeHeader.tsx:84` | `Every course played` | /courses — list | E1 | A.DIM → A.INK |
| `src/components/courses/course-detail/about/RecordBook.tsx:50` | `legendCategoryLabel.lowest_gross_all_time` | /courses/:courseId — About | E2 | tone ?? A.DIM → tone ?? A.INK; explicit gold preserved |
| `src/components/courses/course-detail/about/RecordBook.tsx:50` | `legendCategoryLabel.most_rounds_all_time` | /courses/:courseId — About | E2 | tone ?? A.DIM → tone ?? A.INK |
| `src/components/courses/course-detail/about/RecordBook.tsx:50` | `legendCategoryLabel.best_stableford_all_time` | /courses/:courseId — About | E2 | tone ?? A.DIM → tone ?? A.INK |
| `src/components/courses/course-detail/about/RecordBook.tsx:50` | `legendCategoryLabel.most_birdies_all_time` | /courses/:courseId — About | E2 | tone ?? A.DIM → tone ?? A.INK |
| `src/components/courses/course-detail/about/RecordBook.tsx:50` | `legendCategoryLabel.best_score_diff_all_time` | /courses/:courseId — About | E2 | tone ?? A.DIM → tone ?? A.INK |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:297` | `courseDetail.claim.sheet.panelKicker` | /courses/:courseId — claim | E2 | DIM → INKC at render only |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:347` | `courseDetail.claim.sheet.holeByHole` | /courses/:courseId — claim | E2 | DIM → INKC; standalone head over hole strip |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:443` | `courseDetail.claim.sheet.gainsTitle` | /courses/:courseId — claim | E2 | DIM → INKC |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:474` | `courseDetail.claim.sheet.stepsTitle` | /courses/:courseId — claim | E2 | DIM → INKC |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:699` | `courseDetail.claim.sheet.kicker` | /courses/:courseId — claim | E1 | DIM → INKC |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:401` | `courseDetail.websiteSheet.officialWebsite` | /courses/:courseId — website | E1 | DIM → INK |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:472` | `courseDetail.websiteSheet.beforeYouGo` | /courses/:courseId — website | E2 | DIM → INK |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:211` | `courseDetail.yourHolesSheet.distribution` | /courses/:courseId — You holes | E2 | A.DIM → A.INK; local override, ABOUT_KICKER unchanged |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:227` | `courseDetail.yourHolesSheet.holes` | /courses/:courseId — You holes | E2 | A.DIM → A.INK |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:256` | `courseDetail.yourHolesSheet.pars` | /courses/:courseId — You holes | E2 | A.DIM → A.INK; adjacent parsMeta kept |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:274` | `courseDetail.yourHolesSheet.thirds` | /courses/:courseId — You holes | E2 | A.DIM → A.INK; adjacent thirdsMeta kept |
| `src/components/likes/LikesSheet.tsx:196,235` | `People you follow` | Courses-origin likes sheet | E2 | A.DIM → A.INK only with propagated Courses opt-in |
| `src/components/likes/LikesSheet.tsx:196,241` | `Everyone else` | Courses-origin likes sheet | E2 | A.DIM → A.INK only with propagated Courses opt-in |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:921` | `courses:scorecard.tile.featKicker` | Courses-origin round sheet | E2 | TILE_KICKER grey → TILE_INK with Courses opt-in |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:970` | `courses:scorecard.tile.roundsKicker` | Courses-origin round sheet | E2 | ink={isTour} → ink={isTour &#124;&#124; coursesHeadingInk} |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1028` | `courses:scorecard.theCard` | Courses-origin round sheet | E2 | ink={isTour} → ink={isTour &#124;&#124; coursesHeadingInk} |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:233` | `roundResults.sections.awards` | Courses-origin round sheet | E2 | TILE_KICKER grey → TILE_INK with Courses opt-in |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:240` | `roundResults.sections.holes` | Courses-origin round sheet | E2 | TILE_KICKER grey → TILE_INK with Courses opt-in |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:251` | `roundResults.scope.ownHeading` | Courses-origin round sheet | E2 | TILE_KICKER grey → TILE_INK with Courses opt-in |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1052` | `roundResults.scope.fieldHeading` | Courses-origin round sheet | E2 | TILE_KICKER grey → TILE_INK with Courses opt-in |
| `src/components/courses/top100/TheArgumentSection.tsx:34` | `Golfers rate higher` | /courses — Top 100 | E2 | A.MUTE → A.INK (Ben's ruling) |
| `src/components/courses/top100/TheArgumentSection.tsx:34` | `Golfers rate lower` | /courses — Top 100 | E2 | A.MUTE → A.INK (Ben's ruling) |
| `src/components/courses/Top100CoursesHubPanel.tsx:397` | `FEWER THAN TWO RATINGS` | /courses — Top 100 golfers order | E2 | --t100b-mute → A.INK locally; shared .t100b-label unchanged |
| `src/components/course-media-tab/ShotTagChoices.tsx:16` | `media.v3.holes` | /courses/:courseId — Media tagger | E2 | --media-v2-dim → --media-v2-ink with explicit Courses opt-in; admin/post defaults kept |
| `src/components/course-media-tab/ShotTagChoices.tsx:21` | `media.v3.around` | /courses/:courseId — Media tagger | E2 | --media-v2-dim → --media-v2-ink with explicit Courses opt-in |
| `src/features/review-v2/components/ReviewScoreHeadings.tsx:23` | `review.wizard.step3.breakdownLabel` | /courses/:courseId/rate | E2 | --score-muted → --score-ink |
| `src/features/composer-flow/ReviewCourseSearchSheet.tsx:67` | `reviewSearch.recent` | /courses/:courseId/rate — receipt search | E2 | --rcs-dim → --rcs-ink with receipt-only opt-in; ComposerFlowSheet default unchanged |
| `src/features/composer-flow/ReviewCourseSearchSheet.tsx:68` | `reviewSearch.threshold` | /courses/:courseId/rate — receipt search | E2 | --rcs-dim → --rcs-ink with receipt-only opt-in |
| `src/features/composer-flow/ReviewCourseSearchSheet.tsx:69` | `reviewSearch.popular` | /courses/:courseId/rate — receipt search | E2 | --rcs-dim → --rcs-ink with receipt-only opt-in |
| `src/components/courses/browse/StandoutRoundsSection.tsx:79 → src/features/explore-magazine/watch/RoundCard.tsx` | `NET` | /courses — Standout rounds | K1 | keep (Ben's ruling) |
| `src/components/courses/browse/StandoutRoundsSection.tsx:79 → src/features/explore-magazine/watch/RoundCard.tsx` | `GROSS` | /courses — Standout rounds | K1 | keep (Ben's ruling) |
| `src/components/courses/CourseListRow.tsx:12` | `#` | /courses — list | K1 | keep --course-list-dim |
| `src/components/courses/CourseListRow.tsx:12` | `COURSE` | /courses — list | K1 | keep --course-list-dim |
| `src/components/courses/CourseListRow.tsx:12` | `ROUNDS` | /courses — official list | K1 | keep --course-list-dim |
| `src/components/courses/CourseListRow.tsx:12` | `RATING` | /courses — golfers list | K1 | keep --course-list-dim |
| `src/components/courses/StatBrowse.tsx:661` | `statBrowse.colRegion` | /courses — list | K1 | keep A.DIM |
| `src/components/courses/BrowseCourseCard.tsx:79,90` | `GROSS` | /courses — course card | K2 | keep --course-list-dim |
| `src/components/courses/CoursesPageHero.tsx:310` | `GROSS` | /courses — hero | K2 | keep grey |
| `src/components/courses/StatBrowse.tsx:613` | `g.country` | /courses — list | K3 | keep A.DIM country metadata |
| `src/components/courses/StatBrowse.tsx:708` | `reason` | /courses — list | K3 | keep A.DIM explanatory metadata |
| `src/components/courses/browse/ListScopeHeader.tsx:97` | `Courses` | /courses — list | K2 | keep A.DIM |
| `src/components/courses/browse/ListScopeHeader.tsx:97` | `Rounds` | /courses — list | K2 | keep A.DIM |
| `src/components/courses/browse/ListScopeHeader.tsx:97` | `Holes` | /courses — list | K2 | keep A.DIM |
| `src/components/courses/UnifiedCourseCard.tsx:291` | `card.rated` | /courses — photo cards | K6 | keep rgba(255,255,255,0.82) |
| `src/components/courses/UnifiedCourseCard.tsx:291` | `card.played` | /courses — photo cards | K6 | keep rgba(255,255,255,0.82) |
| `src/components/courses/UnifiedCourseCard.tsx:334` | `statChip.unit` | /courses — photo cards | K6 | keep rgba(255,255,255,0.75) |
| `src/components/courses/browse/HardestSection.tsx:65` | `Avg over par` | /courses — photo card | K6 | keep rgba(255,255,255,0.78) |
| `src/components/courses/browse/LatestCoursesSection.tsx:153` | `Member shot` | /courses — photo card | K6 | keep rgba(255,255,255,0.82) |
| `src/components/courses/browse/LatestCoursesSection.tsx:153` | `Member shots` | /courses — photo card | K6 | keep rgba(255,255,255,0.82) |
| `src/components/courses/browse/LatestHolesSection.tsx:86` | `PAR {row.par}` | /courses — latest holes | K6 | keep rgba(255,255,255,0.88) |
| `src/components/courses/browse/LatestHolesSection.tsx:86` | `{row.yards} YDS` | /courses — latest holes | K6 | keep rgba(255,255,255,0.88) |
| `src/components/courses/course-detail/AboutMediaStrip.tsx:120` | `photo/video counts` | /courses/:courseId — About | K3 | keep A.DIM |
| `src/components/courses/course-detail/CategoryScores.tsx:94,146` | `Design` | /courses/:courseId — scores | K2 | keep A.DIM |
| `src/components/courses/course-detail/CategoryScores.tsx:94,146` | `Condition` | /courses/:courseId — scores | K2 | keep A.DIM |
| `src/components/courses/course-detail/CategoryScores.tsx:94,146` | `Clubhouse` | /courses/:courseId — scores | K2 | keep A.DIM |
| `src/components/courses/course-detail/CategoryScores.tsx:94,146` | `Facilities` | /courses/:courseId — scores | K2 | keep A.DIM |
| `src/components/courses/course-detail/CategoryScores.tsx:179` | `courseDetail.communityScore.overall` | /courses/:courseId — scores | K2 | keep A.DIM |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:299` | `courseDetail.claim.sheet.earlyData` | /courses/:courseId — claim | K3 | keep DIM |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:299` | `courseDetail.claim.sheet.live` | /courses/:courseId — claim | K3 | keep DIM |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:313` | `courseDetail.claim.sheet.roundsMeasured` | /courses/:courseId — claim | K2 | keep DIM |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:323` | `courseDetail.claim.sheet.rated` | /courses/:courseId — claim | K2 | keep DIM |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:336` | `courseDetail.claim.sheet.photos` | /courses/:courseId — claim | K2 | keep DIM |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:553` | `courseDetail.claim.sheet.claimAsLabel` | /courses/:courseId — claim | K5 | keep DIM (actor selection field) |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:476` | `courseDetail.websiteSheet.earlyData` | /courses/:courseId — website | K3 | keep DIM |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:476` | `courseDetail.websiteSheet.roundsMeasured` | /courses/:courseId — website | K3 | keep DIM |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:498` | `courseDetail.websiteSheet.avgOverPar` | /courses/:courseId — website | K2 | keep DIM |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:513` | `courseDetail.websiteSheet.hardestHole` | /courses/:courseId — website | K2 | keep DIM |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:531` | `courseDetail.websiteSheet.ratedOutOfTen` | /courses/:courseId — website | K2 | keep DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:352` | `courseDetail.plays.fieldAvg` | /courses/:courseId — all holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:353` | `courseDetail.plays.yourAvg` | /courses/:courseId — all holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:354` | `courseDetail.plays.youBeat` | /courses/:courseId — all holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:133` | `courseDetail.holes.colPar` | /courses/:courseId — all holes | K1 | keep A.DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:137` | `courseDetail.holes.colSi` | /courses/:courseId — all holes | K1 | keep A.DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:143` | `courseDetail.plays.legendField` | /courses/:courseId — all holes | K1 | keep A.DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:148` | `courseDetail.plays.legendYou` | /courses/:courseId — all holes | K1 | keep A.DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:214` | `courseDetail.allHolesSheet.si` | /courses/:courseId — all holes | K1 | keep A.DIM |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:216` | `courseDetail.allHolesSheet.plays` | /courses/:courseId — all holes | K1 | keep A.DIM |
| `src/components/courses/course-detail/about/HowItPlays.tsx:222,397` | `courseDetail.plays.fieldAvg` | /courses/:courseId — About | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/HowItPlays.tsx:222,403` | `courseDetail.plays.yourAvg` | /courses/:courseId — About | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/HowItPlays.tsx:222,409` | `courseDetail.plays.easiestHole` | /courses/:courseId — About | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/HowItPlays.tsx:420` | `courseDetail.plays.hardestHole` | /courses/:courseId — About | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/CourseHonoursSection.tsx:65` | `category label` | /courses/:courseId — About | K3 | keep A.MUTE award metadata |
| `src/components/courses/course-detail/about/CourseHonoursSection.tsx:65` | `rows.length` | /courses/:courseId — About | K3 | keep A.MUTE count |
| `src/components/courses/course-detail/about/DefendsPar.tsx:183` | `courseDetail.defends.front` | /courses/:courseId — About | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/DefendsPar.tsx:183` | `courseDetail.defends.back` | /courses/:courseId — About | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/DefendsPar.tsx:183` | `courseDetail.defends.worst` | /courses/:courseId — About | K2 | keep A.DIM |
| `src/components/courses/course-detail/about/DefendsPar.tsx:189` | `courseDetail.defends.parScaleLabel` | /courses/:courseId — About | K3 | keep A.DIM (metric/scale description) |
| `src/components/courses/course-detail/about/TheVerdict.tsx:90` | `courseDetail.verdict.easierThan` | /courses/:courseId — About | K3 | keep A.MUTE |
| `src/components/courses/course-detail/about/TheVerdict.tsx:92` | `courseDetail.verdict.easiest` | /courses/:courseId — About | K3 | keep A.DIM |
| `src/components/courses/course-detail/about/TheVerdict.tsx:95` | `courseDetail.verdict.harderThan` | /courses/:courseId — About | K3 | keep A.MUTE |
| `src/components/courses/course-detail/about/TheVerdict.tsx:97` | `courseDetail.verdict.hardest` | /courses/:courseId — About | K3 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:183` | `courseDetail.plays.yourAvg` | /courses/:courseId — You holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:184` | `courseDetail.yourHolesSheet.field` | /courses/:courseId — You holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:185` | `courseDetail.plays.youBeat` | /courses/:courseId — You holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:239` | `PAR` | /courses/:courseId — You holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:240` | `BEST` | /courses/:courseId — You holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:246` | `YOU` | /courses/:courseId — You holes | K1 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:247` | `FIELD` | /courses/:courseId — You holes | K1 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:256` | `courseDetail.yourHolesSheet.parsMeta` | /courses/:courseId — You holes | K3 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:270` | `TOTAL` | /courses/:courseId — You holes | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:274` | `courseDetail.yourHolesSheet.thirdsMeta` | /courses/:courseId — You holes | K3 | keep A.DIM |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:278` | `1–6` | /courses/:courseId — You holes | K3 | keep A.DIM axis |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:278` | `7–12` | /courses/:courseId — You holes | K3 | keep A.DIM axis |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:278` | `13–18` | /courses/:courseId — You holes | K3 | keep A.DIM axis |
| `src/components/courses/course-detail/you/YourRoundsSheet.tsx:125` | `courseDetail.yourRoundsSheet.best` | /courses/:courseId — You rounds | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourRoundsSheet.tsx:126` | `courseDetail.yourRoundsSheet.average` | /courses/:courseId — You rounds | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourRoundsSheet.tsx:127` | `courseDetail.yourRoundsSheet.field` | /courses/:courseId — You rounds | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/YourRoundsSheet.tsx:163` | `year` | /courses/:courseId — You rounds | E2 | A.DIM → A.INK; introduces a year-group, matching the month-group ruling |
| `src/components/courses/course-detail/you/BoardList.tsx:59` | `courseDetail.youTab.grabs.heldTag` | /courses/:courseId — You | K3 | keep grey held-state branch |
| `src/components/courses/course-detail/you/ProjectionSection.tsx:63` | `rightLabel` | /courses/:courseId — You | K3 | keep A.DIM annotation |
| `src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:61` | `courseDetail.youTab.unclaimed.tile` | /courses/:courseId — You | K3 | keep A.DIM state/count |
| `src/components/courses/course-detail/you/WhereYouStandHere.tsx:124` | `90 days` | legacy You section | D | keep A.DIM; no mounted caller found |
| `src/components/courses/course-detail/you/WhereYouStandHere.tsx:125` | `All time` | legacy You section | D | keep A.DIM; no mounted caller found |
| `src/components/courses/course-detail/you/YourFormHere.tsx:206` | `formatDate(sel.playDate)` | /courses/:courseId — You | K3 | keep A.DIM date annotation |
| `src/components/courses/course-detail/you/YourFormHere.tsx:209` | `courseDetail.youTab.clear` | /courses/:courseId — You | K4 | keep A.MUTE |
| `src/components/courses/course-detail/you/YourFormHere.tsx:234` | `courseDetail.youTab.form.best` | /courses/:courseId — You | K3 | keep A.DIM chart annotation |
| `src/components/courses/course-detail/you/YourFormHere.tsx:237` | `courseDetail.youTab.form.worst` | /courses/:courseId — You | K3 | keep A.DIM chart annotation |
| `src/components/courses/course-detail/you/many/FormLast20Section.tsx:48` | `Best {best}` | /courses/:courseId — You | K3 | keep rgba(248,250,252,0.30) |
| `src/components/courses/course-detail/you/many/FormLast20Section.tsx:49` | `Worst {worst}` | /courses/:courseId — You | K3 | keep rgba(248,250,252,0.30) |
| `src/components/courses/course-detail/you/many/ManySections.tsx:310` | `of {total} holes birdied here` | /courses/:courseId — You | K3 | keep A.MUTE |
| `src/components/courses/course-detail/you/many/ManySections.tsx:327` | `The {ordinal(one.hole_no)}` | /courses/:courseId — You | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/many/ManySections.tsx:327` | `Field loses` | /courses/:courseId — You | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/many/ManySections.tsx:327` | `Field gains` | /courses/:courseId — You | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/many/ManySections.tsx:327` | `You lose` | /courses/:courseId — You | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/many/ManySections.tsx:327` | `You gain` | /courses/:courseId — You | K2 | keep A.DIM |
| `src/components/courses/course-detail/you/many/ManySections.tsx:327` | `Your rounds` | /courses/:courseId — You | K2 | keep A.DIM |
| `src/components/courses/course-detail/reviews/TheScore.tsx:98` | `Community` | /courses/:courseId — Reviews | K2 | keep A.DIM |
| `src/components/likes/LikesSheet.tsx:165` | `businessTypeLabel(l.businessType)` | Courses-origin likes | K3 | keep A.DIM business category metadata |
| `src/components/likes/LikesSheet.tsx:171` | `HCP` | Courses-origin likes | K2 | keep A.DIM |
| `src/components/likes/LikesSheet.tsx:214` | `1 person` | Courses-origin likes | K3 | keep A.DIM count |
| `src/components/likes/LikesSheet.tsx:214` | `{count} people` | Courses-origin likes | K3 | keep A.DIM count |
| `src/features/comments-v2/CommentsSheetV2.tsx:439` | `comments.count` | Courses-origin comments | K3 | keep DIM; no Courses colour prop needed |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:200` | `roundResults.columns.round` | Courses-origin round sheet | K1 | keep TILE_DIM |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:201` | `roundResults.columns.score` | Courses-origin round sheet | K1 | keep TILE_DIM |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:203` | `roundResults.columns.best` | Courses-origin round sheet | K1 | keep TILE_DIM |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:201` | `courses:scorecard.legendNotPlayed` | Courses-origin round sheet | K3 | keep TILE_MUTE state/legend |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:328` | `Math.abs(delta).toFixed(1)` | Courses-origin round sheet | K2 | keep TILE_MUTE |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:329` | `arrow` | Courses-origin round sheet | K3 | keep TILE_MUTE direction |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:527` | `courseLocation` | Courses-origin round sheet | K3 | keep TILE_DIM |
| `src/features/courses/_shared/scorecard/GlassCardFootAction.tsx:37` | `engagement.comment.label` | Courses-origin round sheet | K4 | keep TILE_MUTE |
| `src/features/courses/_shared/scorecard/TrajectoryLine.tsx:620` | `subParts.join(' · ')` | Courses-origin round sheet | K3 | keep T.readDim chart metadata |
| `src/features/courses/_shared/scorecard/TrajectoryLine.tsx:625` | `rightText` | Courses-origin round sheet | K3 | keep T.readInk chart annotation |
| `src/features/courses/_shared/scorecard/TrajectoryLine.tsx:678` | `holes[i].holeNo` | Courses-origin round sheet | K3 | keep tick colours |
| `src/features/courses/_shared/SiLadder.tsx:121` | `Hole` | /courses/:courseId — hole analysis | K1 | keep MUTE/DIM |
| `src/features/courses/_shared/SiLadder.tsx:125` | `SI` | /courses/:courseId — hole analysis | K1 | keep MUTE/DIM |
| `src/features/courses/_shared/SiLadder.tsx:129` | `Plays` | /courses/:courseId — hole analysis | K1 | keep DIM |
| `src/components/courses/top100/Top100CompareChart.tsx:47` | `SEE ALL {n}` | /courses — comparison | K4 | keep --t100b-mute |
| `src/components/courses/top100/Top100CompareChart.tsx:47` | `1st` | /courses — comparison | K3 | keep --t100b-dim axis |
| `src/components/courses/top100/Top100CompareChart.tsx:47` | `ordinal(n)` | /courses — comparison | K3 | keep --t100b-dim axis |
| `src/components/courses/top100/Top100Leaderboard.tsx:99` | `0` | /courses — leaderboard | K3 | keep --t100b-dim |
| `src/components/courses/top100/Top100Leaderboard.tsx:101` | `LEADER {leader.value}, left` | /courses — leaderboard | K3 | keep --t100b-dim |
| `src/components/courses/top100/Top100Leaderboard.tsx:103` | `LEADER {leader.value}, right` | /courses — leaderboard | K3 | keep --t100b-dim |
| `src/components/courses/top100/Top100Leaderboard.tsx:104` | `LEADER {leader.value}, middle` | /courses — leaderboard | K3 | keep --t100b-dim |
| `src/components/courses/top100/Top100Leaderboard.tsx:105` | `shown.size` | /courses — leaderboard | K3 | keep --t100b-dim axis |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx:150` | `Top 100 {RANK_SCOPE_LABEL[slug]}` | /courses — member progress | K3 | keep A.DIM context |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx:208` | `GB&I` | /courses — member progress | K4 | keep A.DIM inactive / amber active |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx:208` | `Global` | /courses — member progress | K4 | keep A.DIM inactive / amber active |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx:208` | `Europe` | /courses — member progress | K4 | keep A.DIM inactive / amber active |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx:208` | `USA` | /courses — member progress | K4 | keep A.DIM inactive / amber active |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx:254` | `played.length` | /courses — member progress | K3 | keep A.DIM adjacent count |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx:254` | `toPlay.length` | /courses — member progress | K3 | keep A.DIM adjacent count |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx:256` | `Rating` | /courses — member progress | K1 | keep A.DIM column |
| `src/components/profile/handicap/whs/sections/course-legends/flat/FlatBoardSheet.tsx:120–125` | `courseName` | /courses/:courseId — Legends full board | K3 | keep A.DIM context; active.label title separately ink |
| `src/components/course-media-tab/ShotTagCard.tsx:56` | `media.v3.position` | /courses/:courseId — Media tagger | K3 | keep --media-v2-dim sequence |
| `src/components/course-media-tab/HoleWalk.tsx:36` | `media.v2.coverage` | /courses/:courseId — Media | K2 | keep --media-v2-dim coverage |
| `src/components/course-media-tab/CoursePlaceTiles.tsx:32` | `media.v2.shots` | /courses/:courseId — Media | K2 | keep --media-v2-dim adjacent count |
| `src/components/course-media-tab/CoursePlaceTiles.tsx:40` | `media.v2.age.*` | /courses/:courseId — Media conditions tile | K6 | keep --media-v2-photo-ink; later .media-v2-condition wins cascade |
| `src/components/course-media-tab/ReadyShotCover.tsx:27` | `media.v2.processing` | /courses/:courseId — Media | K3 | keep --media-v2-dim state |
| `src/features/composer-flow/ReviewCourseSearchSheet.tsx:100` | `YOURS · EDIT` | /courses/:courseId/rate — nested search/receipt rows | K3 | keep --rcs-dim ownership/edit state |
| `src/features/review-v2/ReviewComposerV2.tsx:1187–1188` | `review.wizard.stepOne.orTypeIt` | /courses/:courseId/rate | K5 | keep rgba(248,250,252,0.42) input-method cue |
| `src/features/review-v2/ReviewComposerV2.tsx:267–277` | `Go back` | /courses/:courseId/rate | K4 | keep RV2.ink control |
| `src/features/review-v2/ReviewComposerV2.tsx:287–296` | `Retry` | /courses/:courseId/rate | K4 | keep RV2.canvas on ink fill |
| `src/features/review-v2/ReviewComposerV2.tsx:1072–1079` | `review.wizard.draftRestored.discard` | /courses/:courseId/rate | K4 | keep RV2.danger control |
| `src/features/review-v2/ReviewComposerV2.tsx:1113–1120` | `review.wizard.draftRestored.mediaDismiss` | /courses/:courseId/rate | K4 | keep RV2.secondary control |
| `src/features/review-v2/components/MediaTray.tsx:155` | `Media-tray empty-state action` | /courses/:courseId/rate | K4 | keep inherited control ink |
| `src/features/review-v2/components/VoiceDictateButton.tsx:350–366` | `sayMore` | /courses/:courseId/rate | K4 | keep RV2.ink control |
| `src/features/review-v2/components/SubmitBar.tsx:125–143` | `Submit/save action` | /courses/:courseId/rate | K4 | keep enabled RV2.canvas / disabled RV2.secondary |
| `src/features/review-v2/components/EditLossSheet.tsx:41,55` | `Remove and save` | /courses/:courseId/rate — edit loss | K4 | keep RV2.ink |
| `src/features/review-v2/components/EditLossSheet.tsx:41,56` | `Keep them` | /courses/:courseId/rate — edit loss | K4 | keep RV2.canvas on ink fill |
| `src/features/review-v2/components/RemoveReviewSheetV2.tsx:115–130` | `Keep it` | /courses/:courseId/rate — remove review | K4 | keep RV2.ink |
| `src/features/review-v2/components/RemoveReviewSheetV2.tsx:132–153` | `Remove / Removing…` | /courses/:courseId/rate — remove review | K4 | keep RV2.dark on danger fill |
| `src/components/courses/ReviewRailSlot.tsx:51` | `RAIL_LABEL_STYLE / optional label` | /courses | D | provisional D; unchanged as instructed; current LatestReviewsSection supplies no label |
| `src/features/review-v2/ReviewComposerV2.tsx:106` | `STEP1_HEADING` | /courses/:courseId/rate | D | provisional D; unchanged as instructed, not a claim of proven deadness (consumers :1168,:1246) |
| `src/components/course-media-tab/hole-walk.css:27` | `.hole-walk-stats span` | legacy Media panel | D | keep; no live JSX consumer |
| `src/components/course-media-tab/hole-walk.css:42` | `.hole-walk-months span` | legacy Media panel | D | keep --hole-walk-body; no live JSX consumer |
| `src/components/course-media-tab/hole-walk.css:61` | `.hole-walk-owner-label` | legacy Media panel | D | keep --hole-walk-dim; no live JSX consumer |
| `src/components/course-media-tab/shot-tag-choices.css:8` | `.shot-tag-position` | retired tagger stylesheet | D | keep; stylesheet not imported |
| `src/components/courses/top100/Top100YourHundred.tsx:9` | `YOUR HUNDRED (.t100b-label.t100b-ylabel)` | legacy Top 100 | D | keep --t100b-mute; no active caller |
| `src/components/courses/top100/HundredRaceParts.tsx:42–45` | `0` | legacy race | D | keep --t100-dim |
| `src/components/courses/top100/HundredRaceParts.tsx:42–45` | `hundredSlab.nobodyPast` | legacy race | D | keep --t100-dim |
| `src/components/courses/top100/HundredRaceParts.tsx:42–45` | `list-length endpoint` | legacy race | D | keep --t100-dim |
| `src/components/courses/top100/Top100RaceSection.tsx:36` | `amateur.leaderboards.seeAllMembers` | legacy race | D | keep --t100-mute; no active caller |
| `src/components/profile/handicap/whs/sections/course-legends/drilldown/DrilldownHeader.tsx:105–111` | `CR {cr}` | /courses/:courseId — Legends | D | keep on-photo rgba(255,255,255,0.65); hideHeader suppresses it |
| `src/components/profile/handicap/whs/sections/course-legends/drilldown/DrilldownHeader.tsx:105–111` | `SLOPE {slope}` | /courses/:courseId — Legends | D | keep on-photo rgba(255,255,255,0.65); hideHeader suppresses it |
| `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:207–250` | `BoardHeaderRow labels` | legacy Legends board | D | keep; no current consumer |
| `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:266–276` | `HeldGauge nearestLabel` | legacy Legends board | D | keep A.DIM; no current consumer |
| `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:459` | `legacy row value label` | legacy Legends board | D | keep; current flat board does not mount ChampionsRow |
| `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:486–507` | `ChampionsColumnHeader labels` | legacy Legends board | D | keep; no current consumer |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:68` | `holes.preview.legendBirdie` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:68` | `holes.preview.legendPar` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:68` | `holes.preview.legendBogey` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx:68` | `holes.preview.legendDouble` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/HowItPlays.tsx:207` | `holes.preview.legendBirdie` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/HowItPlays.tsx:207` | `holes.preview.legendPar` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/HowItPlays.tsx:207` | `holes.preview.legendBogey` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/HowItPlays.tsx:207` | `holes.preview.legendDouble` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/DefendsPar.tsx:288` | `holes.preview.legendBirdie` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/DefendsPar.tsx:288` | `holes.preview.legendPar` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/DefendsPar.tsx:288` | `holes.preview.legendBogey` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/DefendsPar.tsx:288` | `holes.preview.legendDouble` | /courses/:courseId — About | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:217` | `courseDetail.yourHolesSheet.birdie` | /courses/:courseId — You holes | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:217` | `courseDetail.yourHolesSheet.par` | /courses/:courseId — You holes | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:217` | `courseDetail.yourHolesSheet.bogey` | /courses/:courseId — You holes | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:217` | `courseDetail.yourHolesSheet.double` | /courses/:courseId — You holes | K3 | keep A.DIM distribution legend |
| `src/components/courses/course-detail/about/RecordBook.tsx:66` | `courseDetail.records.units.gross` | /courses/:courseId — About | K2 | keep A.DIM unit under figure |
| `src/components/courses/course-detail/about/RecordBook.tsx:66` | `courseDetail.records.units.rounds` | /courses/:courseId — About | K2 | keep A.DIM unit under figure |
| `src/components/courses/course-detail/about/RecordBook.tsx:66` | `courseDetail.records.units.points` | /courses/:courseId — About | K2 | keep A.DIM unit under figure |
| `src/components/courses/course-detail/about/RecordBook.tsx:66` | `courseDetail.records.units.birdies` | /courses/:courseId — About | K2 | keep A.DIM unit under figure |
| `src/components/courses/course-detail/about/RecordBook.tsx:66` | `courseDetail.records.units.diff` | /courses/:courseId — About | K2 | keep A.DIM unit under figure |
| `src/components/courses/course-detail/about/verdictBits.tsx:26` | `courseDetail.verdict.hardestHole` | /courses/:courseId — About | K2 | keep A.DIM paired figure label |
| `src/components/courses/course-detail/about/verdictBits.tsx:26` | `courseDetail.verdict.letOff` | /courses/:courseId — About | K2 | keep A.DIM paired figure label |
| `src/components/courses/course-detail/about/verdictBits.tsx:26` | `courseDetail.verdict.defends` | /courses/:courseId — About | K2 | keep A.DIM paired figure label |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `Rounds here` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `Your best, this year` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `Seasons here` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `Your edge, front` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `Your edge, back` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `Level with the field` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `courseDetail.youTab.holeFacts.hardest` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `courseDetail.youTab.holeFacts.letOff` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `courseDetail.youTab.holeFacts.costs` | /courses/:courseId — You | K2 | keep A.DIM stat caption |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:396` | `courses:scorecard.tile.net` | Courses-origin round sheet | K2 | keep TILE_MUTE paired figure label |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:396` | `courses:scorecard.tile.points` | Courses-origin round sheet | K2 | keep TILE_MUTE paired figure label |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:396` | `courses:scorecard.tile.diff` | Courses-origin round sheet | K2 | keep TILE_MUTE paired figure label |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:396` | `courses:scorecard.tile.playedOffLabel` | Courses-origin round sheet | K2 | keep TILE_MUTE paired figure label |
| `src/components/courses/course-detail/you/youBits.tsx:129` | `courseDetail.youTab.wonAndLost.allHoles` | /courses/:courseId — You | K4 | keep A.MUTE action; rating.rateIt already ink |
| `src/components/courses/course-detail/you/youBits.tsx:129` | `courseDetail.youTab.grabs.allBoards` | /courses/:courseId — You | K4 | keep A.MUTE action; rating.rateIt already ink |
| `src/components/courses/course-detail/you/youBits.tsx:129` | `courseDetail.youTab.allRounds` | /courses/:courseId — You | K4 | keep A.MUTE action; rating.rateIt already ink |
| `src/components/courses/course-detail/you/youBits.tsx:129` | `courseDetail.youTab.rating.edit` | /courses/:courseId — You | K4 | keep A.MUTE action; rating.rateIt already ink |

### Counts by role

| Role | Text/key rows |
|---|---:|
| E1 | 5 |
| E2 | 35 |
| K1 | 22 |
| K2 | 67 |
| K3 | 68 |
| K4 | 22 |
| K5 | 2 |
| K6 | 9 |
| D | 19 |
| Total | 249 |

These totals supersede the incomplete 2/16/12/2 K counts. Already-ink or non-grey semantic headings are recorded below, outside this grey-source census.

### Uncertainty and exclusions

Remaining `?` list: none after source/cascade/route tracing; no unresolved-label crops required. No visual or data figure is changed. The two provisional D rows are preserved separately above, not silently resolved.

Already ink: AboutSection headings; CourseDirectory title; AllHolesSheet/YourHolesSheet/YourRoundsSheet course-name eyebrows; AllHolesSheet holes/pars/ladder sections; Top100 THE LIST, GOLFERS VERSUS THE OFFICIAL LIST (page/sheet), ONE RATING AWAY, TOP 100 LEADERBOARD; progress PLAYED/STILL TO PLAY lead text (counts stay grey); review receipt YOUR SCORE/WHAT YOUR REVIEW DID/REVIEW ANOTHER; restored-draft notice.

Other exclusions: Top100 inactive YourHundred/race and legacy BoardHeaderRow/HeldGauge/ChampionsColumnHeader remain unchanged. Course Legends hideHeader suppresses CR/SLOPE photo lines; cabinet names, OPEN/IN REACH/NOT STARTED, legends and controls lack qualifying tracking; YOURS is gold, HELD/ALL actions amber. Hole-walk .06/.07em legend/prompts/counts and HolePhotoTagButton's .06em control fall below the threshold. Media main titles, tag title, EditLoss/Remove titles and score-step title are not tracked uppercase. ShotTagChoices' group headings inherit media-v2-label; sequence/coverage/counts must not be recoloured by changing that class. Conditions age uses the later photo-ink cascade.

### Shared callers and opt-in proof

Every direct shared-sheet JSX call site is preserved in `batch-b-shared-caller-sites.txt`. All source caller sites are named, including legacy callers; an inactive route does not require changing its source.

**Courses member scorecard callers:** StandoutRoundsSection:92; CourseLatelySection:161; CourseHonoursSection:47; CourseYouTab:713; YourRoundsSheet:202. Only these pass `coursesHeadingInk`. RoundDetailSheet forwards it to CardScorecardSheet → TileSection/RoundResults/LikedByRow → both LikesSheet mounts. Feat defaults remain member-only; Tour keeps `ink={isTour}` behavior through an OR, never the new flag. RoundPagePreview is used by ExploreMagazine:1029 only and is unchanged.

**Every located non-Courses RoundDetailSheet caller**, with its existing chain to TileSection, RoundResults, LikesSheet and Comments unchanged: messaging-v2/SharedGroundStrip:187; messaging-v2/ShareCards:134; RoundsPage:84 (legacy redirect); RoundPage:218; ProfilePageV2:1604; HandicapPage:542; AmateurPage:119; Clubhouse:754; FullscreenFeedOverlay:1340,1342; ExploreTabContent:182; WireTicker:107; HomeRail:110; ProfileRoundsTab:298; PostsTabContent:425; trends/RecentRoundsCard:341; PersonalBestsSection:380; RecentlyPlayedFeed:124; WeeklyClubShelf:115; PersonalBestsShelf:110; ExploreMagazine:1513; CircleShelf:366. No flag is added to any of these.

**Other scorecard paths:** Tour leaderboard/ScorecardSheet:112,165 → CardScorecardSheet. Its callers are LinkedProSections:38, LeaderboardTab:556, MiniBoard:213,326, HeroBoardRows:402, FullBoardSheet:185, LiveHeroBoard:165 and LeadersGroup:131. Tour suppresses RoundResults with !isTour. ExploreMagazine → RoundPagePreview → TileSection remains default-grey.

**LikesSheet direct callers:** LikedByRow:193,408 and FeedOverlayLayer:338. All non-Courses LikedByRow callers: clubhouse-tour/TourSlot:176; FeedCard:794; ExploreCard:632,1463; ReviewBottomSheet:796; the non-Courses scorecards listed above. ReviewBottomSheet is hosted once by ReviewBottomSheetPortal:127 (App:1197). For Courses review entrypoints only, an optional default-false presentation flag is handed through the review payload/portal, not inferred from a subject course or a member/source flag. Courses originators: useOpenLatestReview (CoursesBrowsePage and PlayedTile), CourseReviewsTab. Other store originators remain unchanged: Clubhouse, FullscreenFeedOverlay, FeedCard, PostsTabContent, ExploreMagazine and ReviewBottomSheet's own navigation.

**Every direct CommentsSheetV2 caller:** NewsTabPage:178; ReviewBottomSheet:809; PostsTabContent:435; Clubhouse:779; LoopCard:624; FullscreenFeedOverlay:1329; ProfileTopTenRail:417; HomeRail:118; RoundDetailSheet:558; WireFeedSlide:173; ExploreMagazine:1575; StoryEngagementBlock:150. Its sole eligible grey count is K3; no colour change or opt-in is needed. AmateurStoryPage:80 and Tour StoryPage:240 use StoryEngagementBlock; CardFeed:1060 uses HomeRail; comment deep links redirect to the fullscreen post viewer rather than directly mounting Comments. All retain their existing treatment.

**Other shared colour paths:** ReviewCourseSearchSheet is opened by ComposerFlowSheet and ReviewReceipt; only the latter opts into Courses group ink. Its CourseRow receipt suggestion/state metadata stays grey. ShotTagChoices is shared with GolfPostSections (post composer) and admin batch mode. ShotTagCard's default remains unchanged; Courses media single/add/gallery and member batch adapters opt in; admin batch and GolfPostSections do not. CSS overrides target only opted-in group heads, never media-v2-label globally.

No test edit at the audit step; baseline stays **10,435 tests / 900 files**. The partial audit document has been transferred into this census, corrections recorded, and removed. Source/test change, shard and capture tables follow in the staged continuation.

### Batch B source and test changes

Implemented the census's E1/E2 changes across **32 production files**. Exactly **25 additional declaration probes** (48 → 73), plus the scoped TileSection call-site flags. All changes are colour-only or optional/default-false presentation forwarding. No font, size, weight, tracking, spacing, copy, data read/write or semantic colour changed. Shared LABEL, ABOUT_KICKER, TILE_KICKER and media-v2-label defaults remain unchanged. The two provisional D rows remain untouched.

`coursesHeadingInk` is handed only by the five Courses round-sheet callers and two Courses review originators. CardScorecardSheet preserves Tour's OR behavior; RoundResults and both LikesSheet mounts forward the flag. Review receipt alone opts its nested search into ink. Courses Media adapters opt into tag-group ink; adminMode and GolfPostSections retain grey. No global shared CSS repoint was used.

The preview's intermediate missing TILE_INK import was corrected before verification; this was not a test failure. The changed contract passed **1/1** with `bun x vitest run src/test/brief18EyebrowInk.test.tsx`. Full output retained at `/tmp/brief18-batchB/focused.log`, outside the repository.

#### Every test edit

No test deleted, renamed, added or rewritten. The existing case remains “every Part 1 eyebrow declaration computes to rgb(248, 250, 252)”.

- `src/test/brief18EyebrowInk.test.tsx:90`: `expect(sites).toHaveLength(48)` → `expect(sites).toHaveLength(73)`, because 25 audited Courses declarations were added.
- `src/test/brief18EyebrowInk.test.tsx:130`: `expect(ink && ts.isJsxExpression(ink) ? ink.expression?.getText(card) : undefined).toBe('isTour')` → the same assertion `.toBe('isTour || coursesHeadingInk')`, preserving Tour and permitting only explicit Courses presentation.
- `src/test/brief18EyebrowInk.test.tsx:56`: declaration evaluator now resolves the right-hand fallback in `tone ?? A.INK`; it does not alter runtime tone selection or the existing computed-colour assertion.
- `src/test/fixtures/brief18EyebrowSites.json`: existing ReviewBottomSheet probe line **498 → 500** after the optional presentation prop; no change to its accepted colour. 25 rows added, enumerated below and retained in `batch-b-new-sites.json`. All other existing probes unchanged.

| Added declaration probe | Old → new |
|---|---|
| `src/components/courses/CourseDirectorySheet.tsx:240` | `color: INK_MUTE,` → `color: INK,` |
| `src/components/courses/CourseDirectorySheet.tsx:285` | `color: INK_MUTE,` → `color: INK,` |
| `src/components/courses/browse/ListScopeHeader.tsx:25` | `color: A.DIM,` → `color: A.INK,` |
| `src/components/courses/course-detail/about/RecordBook.tsx:50` | `<div style={{ ...ABOUT_KICKER, display: 'flex', alignItems: 'center', gap: 4, color: tone ?? A.DIM }}>` → `<div style={{ ...ABOUT_KICKER, display: 'flex', alignItems: 'center', gap: 4, color: tone ?? A.INK }}>` |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:297` | `<div style={LABEL}>{t('courseDetail.claim.sheet.panelKicker')}</div>` → `<div style={{ ...LABEL, color: INKC }}>{t('courseDetail.claim.sheet.panelKicker')}</div>` |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:347` | `<div style={{ ...LABEL, fontSize: 8.5, marginBottom: 12 }}>` → `<div style={{ ...LABEL, fontSize: 8.5, marginBottom: 12, color: INKC }}>` |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:443` | `<div style={{ ...LABEL, margin: '24px 0 4px' }}>{t('courseDetail.claim.sheet.gainsTitle')}</div>` → `<div style={{ ...LABEL, margin: '24px 0 4px', color: INKC }}>{t('courseDetail.claim.sheet.gainsTitle')}</div>` |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:474` | `<div style={{ ...LABEL, marginBottom: 14 }}>{t('courseDetail.claim.sheet.stepsTitle')}</div>` → `<div style={{ ...LABEL, marginBottom: 14, color: INKC }}>{t('courseDetail.claim.sheet.stepsTitle')}</div>` |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:699` | `<div style={{ ...LABEL, ...SECTION_EYEBROW }}>{t('courseDetail.claim.sheet.kicker')}</div>` → `<div style={{ ...LABEL, ...SECTION_EYEBROW, color: INKC }}>{t('courseDetail.claim.sheet.kicker')}</div>` |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:401` | `<div style={LABEL}>` → `<div style={{ ...LABEL, color: INK }}>` |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:472` | `<div style={LABEL}>` → `<div style={{ ...LABEL, color: INK }}>` |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:211` | `<div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.distribution')}</div>` → `<div style={{ ...ABOUT_KICKER, color: A.INK }}>{t('courseDetail.yourHolesSheet.distribution')}</div>` |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:227` | `<div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.holes')}</div>` → `<div style={{ ...ABOUT_KICKER, color: A.INK }}>{t('courseDetail.yourHolesSheet.holes')}</div>` |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:256` | `<div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.pars')}</div><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.parsMeta')}</div></div>` → `<div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div style={{ ...ABOUT_KICKER, color: A.INK }}>{t('courseDetail.yourHolesSheet.pars')}</div><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.parsMeta')}</div></div>` |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx:274` | `<div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.thirds')}</div><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.thirdsMeta')}</div></div>` → `<div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div style={{ ...ABOUT_KICKER, color: A.INK }}>{t('courseDetail.yourHolesSheet.thirds')}</div><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.thirdsMeta')}</div></div>` |
| `src/components/courses/course-detail/you/YourRoundsSheet.tsx:163` | `<div style={{ ...ABOUT_KICKER, paddingTop: index === 0 ? 18 : 26, paddingBottom: 10 }}>{year}</div>` → `<div style={{ ...ABOUT_KICKER, color: A.INK, paddingTop: index === 0 ? 18 : 26, paddingBottom: 10 }}>{year}</div>` |
| `src/components/courses/top100/TheArgumentSection.tsx:34` | `<div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1, color: A.MUTE }}>` → `<div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1, color: A.INK }}>` |
| `src/components/courses/Top100CoursesHubPanel.tsx:398` | `<div className="t100b-label">FEWER THAN TWO RATINGS</div>` → `<div className="t100b-label" style={{ color: A.INK }}>FEWER THAN TWO RATINGS</div>` |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1055` | `<h3 style={{ ...TILE_KICKER, margin: 0 }}>` → `<h3 style={{ ...TILE_KICKER, margin: 0, ...(coursesHeadingInk ? { color: TILE_INK } : {}) }}>` |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:252` | `<h3 style={{ ...TILE_KICKER, margin: 0 }}>` → `<h3 style={{ ...TILE_KICKER, margin: 0, ...(coursesHeadingInk ? { color: TILE_INK } : {}) }}>` |
| `src/components/likes/LikesSheet.tsx:198` | `<div style={{ padding: '14px 16px 7px', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM }}>` → `<div style={{ padding: '14px 16px 7px', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM, ...(coursesHeadingInk ? { color: A.INK } : {}) }}>` |
| `src/components/course-media-tab/ShotTagChoices.tsx:19` | `<h3 className="media-v2-label media-v3-tag-label">{t('media.v3.holes', { defaultValue: 'A hole on the course' })}</h3>` → `<h3 className="media-v2-label media-v3-tag-label" style={coursesHeadingInk ? { color: A.INK } : undefined}>{t('media.v3.holes', { defaultValue: 'A hole on the course' })}</h3>` |
| `src/components/course-media-tab/ShotTagChoices.tsx:24` | `<section><h3 className="media-v2-label media-v3-tag-label">{t('media.v3.around', { defaultValue: 'Around the club' })}</h3>` → `<section><h3 className="media-v2-label media-v3-tag-label" style={coursesHeadingInk ? { color: A.INK } : undefined}>{t('media.v3.around', { defaultValue: 'Around the club' })}</h3>` |
| `src/features/composer-flow/ReviewCourseSearchSheet.tsx:82` | `<h2>{title}</h2>` → `<h2 style={coursesHeadingInk ? { color: A.INK } : undefined}>{title}</h2>` |
| `src/index.css:5711` | `.review-score-kicker { font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--score-muted); }` → `.review-score-kicker { font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--score-ink); }` |

Suite baseline: **10,435 tests / 900 files; delta 0 / 0**. After Ben's two exact rulings, all four requested sequential shards passed on 24 November 2026.

#### Batch B finish — final shard results

Each command ran separately, sequentially, with full stdout/stderr retained outside the repository in `/tmp/brief18-batch-b-rerun/shard-{1,2,3,4}.log`. The infrastructure timeout did not recur; no extra shard retry was needed. This final table replaces the stopped table, whose diagnostics remain below for traceability.

| Command | Passed / total tests | Files | Result |
|---|---:|---:|---|
| `bun x vitest run --shard=1/4` | 2,500 / 2,500 | 225 passed | Pass |
| `bun x vitest run --shard=2/4` | 2,493 / 2,493 | 225 passed | Pass |
| `bun x vitest run --shard=3/4` | 2,607 / 2,607 | 225 passed | Pass |
| `bun x vitest run --shard=4/4` | 2,835 / 2,835 | 225 passed | Pass |
| **Total** | **10,435 / 10,435** | **900 passed / 900** | **Pass** |

Before/after suite population: **10,435 / 900 → 10,435 / 900**, delta **0 tests / 0 files**. No tests were added, deleted, renamed or rewritten. This continuation changes only the explicitly authorised expected colour at `TheArgumentSection.test.tsx:70` (assertion at 65), documented below. The earlier implementation's edits to `brief18EyebrowInk.test.tsx:56,90,130` and its declaration fixture are enumerated above; they added 25 probes within the existing test, not 25 tests. `likedByCollapse.test.tsx` remains unchanged and now passes after the source-only prop reorder.

Historical stop diagnostics (resolved by Ben's rulings and final rerun), preserving Vitest's file/line and words:

1. `src/test/likedByCollapse.test.tsx:119:17` — “the fixed-layout sheets keep the reserve at zero > CardScorecardSheet holds its one-row footer height and draws likers as a stack”.
   - `AssertionError: expected 'import { BirdieCountIcon } from \'@/f…' to match /<LikedByRow[\s\S]{0,60}?variant="stac…/`
   - Failing assertion: `expect(src).toMatch(/<LikedByRow[\s\S]{0,60}?variant="stack"/);`
2. `src/components/courses/top100/__tests__/TheArgumentSection.test.tsx:65:18` — “TheArgumentSection > group labels are eyebrows with no coloured dot”.
   - `Error: expect(element).toHaveStyle()`
   - Vitest diff: expected `color: rgba(248, 250, 252, 0.62);`, received `color: rgb(248, 250, 252);`. The diff also lists expected `fontSize: 11px;`, `fontWeight: 700;`, `letterSpacing: 0.16em;`, and `textTransform: uppercase;`.
3. Unhandled worker error: `Error: [vitest-worker]: Timeout calling "onTaskUpdate"`.
   - `Object.onTimeoutError node_modules/vitest/dist/chunks/rpc.-pEldfrD.js:53:10`
   - `Timeout._onTimeout node_modules/vitest/dist/chunks/index.B521nVV-.js:59:62`
   - Vitest warns: “This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.”

**Previous stop closed:** the two assertion failures now pass and the worker timeout did not recur. Only the exact source reorder and colour expectation were changed. Captures can proceed; no new visual or overflow claim is made at this test step. No SQL, migrations, feed_config or round_pool_cap changes.

### Batch B capture status

#### Authorised shard-4 continuation rulings

- `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1121–1123`: moved `variant="stack"` to the first LikedByRow prop, followed by `coursesHeadingInk={coursesHeadingInk}`; all remaining props and behaviour unchanged. `src/test/likedByCollapse.test.tsx` is untouched. Source ruling committed in `97d91f88d6`.
- `src/components/courses/top100/__tests__/TheArgumentSection.test.tsx:70` (assertion starts at `65`), case “group labels are eyebrows with no coloured dot”: `color: A.MUTE` (rgba(248, 250, 252, 0.62)) → `color: 'rgb(248, 250, 252)'`. Only expected colour changed under Ben's explicit E2 authorisation; `fontSize: '11px'`, `fontWeight: '700'`, `letterSpacing: '0.16em'`, and `textTransform: 'uppercase'` remain exactly unchanged. No test deleted, renamed, added or rewritten; suite population remains 10,435 tests / 900 files, delta 0 / 0.
- Worker `onTaskUpdate` timeout is ruled infrastructure; all four shards will run separately in sequence, with one further retry only if a rerun shard repeats that timeout. Any assertion failure still stops work.
- Scope remains the two named rulings and verification of the previously audited Courses surfaces. No new app-wide colour changes or changes to permissions, settings, stored records or fixtures are authorised.

**Courses captures complete in groups A–E below:** all requested real surfaces rendered with a seeded query cache, before/after at 390 and 320. Pre-change Courses source is a88dbf1912 (identical in Courses to 68c9720e46); e472bb4 is the separately recorded Tour Batch A baseline. No session-limited component or label-only fallback was needed. The temporary fixture and all shadow files are removed in the cleanup commit.

#### Capture group A — Courses page

Real components with real MemoryRouter/QueryClient providers and seeded, fixture-only read adapters; before baseline **a88dbf1912** (Courses source identical to 68c9720e46, verified by source diff), after accepted Batch B source. No production/test changes. Every label/context row has before and after at both widths. Audit measurements are retained in `batch-b-group-A-measurements.json`; raw browser output remains outside the repository.

| Surface / group | Before 390 | After 390 | Before 320 | After 320 | Label lines 390 / 320 (before → after) |
|---|---|---|---|---|---|
| directory / recent | [Capture](batch-b-captures/directory-before-390-recent.png) | [Capture](batch-b-captures/directory-after-390-recent.png) | [Capture](batch-b-captures/directory-before-320-recent.png) | [Capture](batch-b-captures/directory-after-320-recent.png) | 390: 1 → 1; 320: 1 → 1 |
| directory / rated | [Capture](batch-b-captures/directory-before-390-rated.png) | [Capture](batch-b-captures/directory-after-390-rated.png) | [Capture](batch-b-captures/directory-before-320-rated.png) | [Capture](batch-b-captures/directory-after-320-rated.png) | 390: 1 → 1; 320: 1 → 1 |
| scope / scope | [Capture](batch-b-captures/scope-before-390-scope.png) | [Capture](batch-b-captures/scope-after-390-scope.png) | [Capture](batch-b-captures/scope-before-320-scope.png) | [Capture](batch-b-captures/scope-after-320-scope.png) | 390: 1 → 1; 320: 1 → 1 |
| argument / higher | [Capture](batch-b-captures/argument-before-390-higher.png) | [Capture](batch-b-captures/argument-after-390-higher.png) | [Capture](batch-b-captures/argument-before-320-higher.png) | [Capture](batch-b-captures/argument-after-320-higher.png) | 390: 1 → 1; 320: 1 → 1 |
| argument / lower | [Capture](batch-b-captures/argument-before-390-lower.png) | [Capture](batch-b-captures/argument-after-390-lower.png) | [Capture](batch-b-captures/argument-before-320-lower.png) | [Capture](batch-b-captures/argument-after-320-lower.png) | 390: 1 → 1; 320: 1 → 1 |
| golfers-order / fewer-than-two | [Capture](batch-b-captures/golfers-order-before-390-fewer-than-two.png) | [Capture](batch-b-captures/golfers-order-after-390-fewer-than-two.png) | [Capture](batch-b-captures/golfers-order-before-320-fewer-than-two.png) | [Capture](batch-b-captures/golfers-order-after-320-fewer-than-two.png) | 390: 1 → 1; 320: 1 → 1 |

Context captures: `directory-{before,after}-{390,320}.png`; `scope-{before,after}-{390,320}.png`; `argument-{before,after}-{390,320}.png`; `golfers-order-{before,after}-{390,320}.png`.

**40 captures** in this group. No fixture/runtime errors or missing target groups. No page/root or target-label viewport overflow at 320 or 390. All six changed labels remain one line at both widths. The frozen Top 100 argument title is three lines at 320 with Royal County Down (Championship), already present before; it is not changed by this colour-only brief. The repaired directory seed now supplies its actual `avg_overall_score` field, not the unrelated `community_rating` field.


#### Capture group B — Course detail About

Real components with real MemoryRouter/QueryClient providers and seeded, fixture-only read adapters; before baseline **a88dbf1912** (Courses source identical to 68c9720e46, verified by source diff), after accepted Batch B source. No production/test changes. Every label/context row has before and after at both widths. Audit measurements are retained in `batch-b-group-B-measurements.json`; raw browser output remains outside the repository.

| Surface / group | Before 390 | After 390 | Before 320 | After 320 | Label lines 390 / 320 (before → after) |
|---|---|---|---|---|---|
| record / board-1 | [Capture](batch-b-captures/record-before-390-board-1.png) | [Capture](batch-b-captures/record-after-390-board-1.png) | [Capture](batch-b-captures/record-before-320-board-1.png) | [Capture](batch-b-captures/record-after-320-board-1.png) | 390: 1 → 1; 320: 1 → 1 |
| record / board-2 | [Capture](batch-b-captures/record-before-390-board-2.png) | [Capture](batch-b-captures/record-after-390-board-2.png) | [Capture](batch-b-captures/record-before-320-board-2.png) | [Capture](batch-b-captures/record-after-320-board-2.png) | 390: 1 → 1; 320: 1 → 1 |
| record / board-3 | [Capture](batch-b-captures/record-before-390-board-3.png) | [Capture](batch-b-captures/record-after-390-board-3.png) | [Capture](batch-b-captures/record-before-320-board-3.png) | [Capture](batch-b-captures/record-after-320-board-3.png) | 390: 1 → 1; 320: 1 → 1 |
| record / board-4 | [Capture](batch-b-captures/record-before-390-board-4.png) | [Capture](batch-b-captures/record-after-390-board-4.png) | [Capture](batch-b-captures/record-before-320-board-4.png) | [Capture](batch-b-captures/record-after-320-board-4.png) | 390: 1 → 1; 320: 1 → 1 |
| record / board-5 | [Capture](batch-b-captures/record-before-390-board-5.png) | [Capture](batch-b-captures/record-after-390-board-5.png) | [Capture](batch-b-captures/record-before-320-board-5.png) | [Capture](batch-b-captures/record-after-320-board-5.png) | 390: 1 → 1; 320: 1 → 1 |
| website / official | [Capture](batch-b-captures/website-before-390-official.png) | [Capture](batch-b-captures/website-after-390-official.png) | [Capture](batch-b-captures/website-before-320-official.png) | [Capture](batch-b-captures/website-after-320-official.png) | 390: 1 → 1; 320: 1 → 1 |
| website / before-you-go | [Capture](batch-b-captures/website-before-390-before-you-go.png) | [Capture](batch-b-captures/website-after-390-before-you-go.png) | [Capture](batch-b-captures/website-before-320-before-you-go.png) | [Capture](batch-b-captures/website-after-320-before-you-go.png) | 390: 1 → 1; 320: 1 → 1 |
| claim / header | [Capture](batch-b-captures/claim-before-390-header.png) | [Capture](batch-b-captures/claim-after-390-header.png) | [Capture](batch-b-captures/claim-before-320-header.png) | [Capture](batch-b-captures/claim-after-320-header.png) | 390: 1 → 1; 320: 1 → 1 |
| claim / panel | [Capture](batch-b-captures/claim-before-390-panel.png) | [Capture](batch-b-captures/claim-after-390-panel.png) | [Capture](batch-b-captures/claim-before-320-panel.png) | [Capture](batch-b-captures/claim-after-320-panel.png) | 390: 1 → 1; 320: 1 → 1 |
| claim / hole-strip | [Capture](batch-b-captures/claim-before-390-hole-strip.png) | [Capture](batch-b-captures/claim-after-390-hole-strip.png) | [Capture](batch-b-captures/claim-before-320-hole-strip.png) | [Capture](batch-b-captures/claim-after-320-hole-strip.png) | 390: 1 → 1; 320: 1 → 1 |
| claim / gains | [Capture](batch-b-captures/claim-before-390-gains.png) | [Capture](batch-b-captures/claim-after-390-gains.png) | [Capture](batch-b-captures/claim-before-320-gains.png) | [Capture](batch-b-captures/claim-after-320-gains.png) | 390: 1 → 1; 320: 1 → 1 |
| claim / steps | [Capture](batch-b-captures/claim-before-390-steps.png) | [Capture](batch-b-captures/claim-after-390-steps.png) | [Capture](batch-b-captures/claim-before-320-steps.png) | [Capture](batch-b-captures/claim-after-320-steps.png) | 390: 1 → 1; 320: 1 → 1 |

Context captures: `record-{before,after}-{390,320}.png`; `website-{before,after}-{390,320}.png`; `claim-{before,after}-{390,320}.png`.

**60 captures** in this group. No fixture/runtime errors or missing target groups. No page/root or target-label viewport overflow at 320 or 390. 

#### Capture group C — Course detail You

Real components with real MemoryRouter/QueryClient providers and seeded, fixture-only read adapters; before baseline **a88dbf1912** (Courses source identical to 68c9720e46, verified by source diff), after accepted Batch B source. No production/test changes. Every label/context row has before and after at both widths. Audit measurements are retained in `batch-b-group-C-measurements.json`; raw browser output remains outside the repository.

| Surface / group | Before 390 | After 390 | Before 320 | After 320 | Label lines 390 / 320 (before → after) |
|---|---|---|---|---|---|
| you-holes / distribution | [Capture](batch-b-captures/you-holes-before-390-distribution.png) | [Capture](batch-b-captures/you-holes-after-390-distribution.png) | [Capture](batch-b-captures/you-holes-before-320-distribution.png) | [Capture](batch-b-captures/you-holes-after-320-distribution.png) | 390: 1 → 1; 320: 1 → 1 |
| you-holes / holes | [Capture](batch-b-captures/you-holes-before-390-holes.png) | [Capture](batch-b-captures/you-holes-after-390-holes.png) | [Capture](batch-b-captures/you-holes-before-320-holes.png) | [Capture](batch-b-captures/you-holes-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 |
| you-holes / pars | [Capture](batch-b-captures/you-holes-before-390-pars.png) | [Capture](batch-b-captures/you-holes-after-390-pars.png) | [Capture](batch-b-captures/you-holes-before-320-pars.png) | [Capture](batch-b-captures/you-holes-after-320-pars.png) | 390: 2 → 2; 320: 2 → 2 |
| you-holes / thirds | [Capture](batch-b-captures/you-holes-before-390-thirds.png) | [Capture](batch-b-captures/you-holes-after-390-thirds.png) | [Capture](batch-b-captures/you-holes-before-320-thirds.png) | [Capture](batch-b-captures/you-holes-after-320-thirds.png) | 390: 1 → 1; 320: 2 → 2 |
| you-rounds / year-2026 | [Capture](batch-b-captures/you-rounds-before-390-year-2026.png) | [Capture](batch-b-captures/you-rounds-after-390-year-2026.png) | [Capture](batch-b-captures/you-rounds-before-320-year-2026.png) | [Capture](batch-b-captures/you-rounds-after-320-year-2026.png) | 390: 1 → 1; 320: 1 → 1 |
| you-rounds / year-2025 | [Capture](batch-b-captures/you-rounds-before-390-year-2025.png) | [Capture](batch-b-captures/you-rounds-after-390-year-2025.png) | [Capture](batch-b-captures/you-rounds-before-320-year-2025.png) | [Capture](batch-b-captures/you-rounds-after-320-year-2025.png) | 390: 1 → 1; 320: 1 → 1 |

Context captures: `you-holes-{before,after}-{390,320}.png`; `you-rounds-{before,after}-{390,320}.png`.

**36 captures** in this group. No fixture/runtime errors or missing target groups. No page/root or target-label viewport overflow at 320 or 390. 
Group C wrapping is unchanged: “How each par plays for you” is two lines at 390 and 320; “How your round unfolds” is one at 390 and two at 320, before and after. Both year groups remain one line. `you-holes-{before,after}-{390,320}-scrolled.png` supplies the lower-thirds context after real sheet scrolling; all four group crops use their mounted component text and style, not a label-only substitute.

#### Capture group D — Shared sheets opened from Courses

Real components with real MemoryRouter/QueryClient providers and seeded, fixture-only read adapters; before baseline **a88dbf1912** (Courses source identical to 68c9720e46, verified by source diff), after accepted Batch B source. No production/test changes. Every label/context row has before and after at both widths. Audit measurements are retained in `batch-b-group-D-measurements.json`; raw browser output remains outside the repository.

| Surface / group | Before 390 | After 390 | Before 320 | After 320 | Label lines 390 / 320 (before → after) |
|---|---|---|---|---|---|
| nested-likes / following | [Capture](batch-b-captures/nested-likes-before-390-following.png) | [Capture](batch-b-captures/nested-likes-after-390-following.png) | [Capture](batch-b-captures/nested-likes-before-320-following.png) | [Capture](batch-b-captures/nested-likes-after-320-following.png) | 390: 1 → 1; 320: 1 → 1 |
| nested-likes / everyone | [Capture](batch-b-captures/nested-likes-before-390-everyone.png) | [Capture](batch-b-captures/nested-likes-after-390-everyone.png) | [Capture](batch-b-captures/nested-likes-before-320-everyone.png) | [Capture](batch-b-captures/nested-likes-after-320-everyone.png) | 390: 1 → 1; 320: 1 → 1 |
| scorecard / feat | [Capture](batch-b-captures/scorecard-before-390-feat.png) | [Capture](batch-b-captures/scorecard-after-390-feat.png) | [Capture](batch-b-captures/scorecard-before-320-feat.png) | [Capture](batch-b-captures/scorecard-after-320-feat.png) | 390: 1 → 1; 320: 1 → 1 |
| scorecard / rounds | [Capture](batch-b-captures/scorecard-before-390-rounds.png) | [Capture](batch-b-captures/scorecard-after-390-rounds.png) | [Capture](batch-b-captures/scorecard-before-320-rounds.png) | [Capture](batch-b-captures/scorecard-after-320-rounds.png) | 390: 1 → 1; 320: 1 → 1 |
| scorecard / card | [Capture](batch-b-captures/scorecard-before-390-card.png) | [Capture](batch-b-captures/scorecard-after-390-card.png) | [Capture](batch-b-captures/scorecard-before-320-card.png) | [Capture](batch-b-captures/scorecard-after-320-card.png) | 390: 1 → 1; 320: 1 → 1 |
| scorecard / awards | [Capture](batch-b-captures/scorecard-before-390-awards.png) | [Capture](batch-b-captures/scorecard-after-390-awards.png) | [Capture](batch-b-captures/scorecard-before-320-awards.png) | [Capture](batch-b-captures/scorecard-after-320-awards.png) | 390: 1 → 1; 320: 1 → 1 |
| scorecard / holes | [Capture](batch-b-captures/scorecard-before-390-holes.png) | [Capture](batch-b-captures/scorecard-after-390-holes.png) | [Capture](batch-b-captures/scorecard-before-320-holes.png) | [Capture](batch-b-captures/scorecard-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 |
| scorecard / own | [Capture](batch-b-captures/scorecard-before-390-own.png) | [Capture](batch-b-captures/scorecard-after-390-own.png) | [Capture](batch-b-captures/scorecard-before-320-own.png) | [Capture](batch-b-captures/scorecard-after-320-own.png) | 390: 1 → 1; 320: 1 → 1 |
| scorecard / field | [Capture](batch-b-captures/scorecard-before-390-field.png) | [Capture](batch-b-captures/scorecard-after-390-field.png) | [Capture](batch-b-captures/scorecard-before-320-field.png) | [Capture](batch-b-captures/scorecard-after-320-field.png) | 390: 1 → 1; 320: 1 → 1 |

Context captures: `nested-likes-{before,after}-{390,320}.png`; `scorecard-{before,after}-{390,320}.png`.

**48 captures** in this group. No fixture/runtime errors or missing target groups. No page/root or target-label viewport overflow at 320 or 390. 
Group D mounts the real Courses-opted-in CardScorecardSheet with an ace, four available rounds, populated hole card, coarse and hole awards, own-round efforts and measured field data. Its actual `data-liked-by-stack` button opens the nested LikesSheet; viewer, following and everyone-else rows are present. All seven scorecard heads and both Likes group heads are one line before/after at both widths. No standalone replacement Likes sheet or label-only fallback was used. `scorecard-{before,after}-{390,320}-scrolled.png` retains body/field context; nested Likes crops are separate rows above. Existing table-header clipping stays frozen and is not an eyebrow change; no target-label or viewport overflow was detected.

#### Capture group E — Media and rate

Real components with real MemoryRouter/QueryClient providers and seeded, fixture-only read adapters; before baseline **a88dbf1912** (Courses source identical to 68c9720e46, verified by source diff), after accepted Batch B source. No production/test changes. Every label/context row has before and after at both widths. Audit measurements are retained in `batch-b-group-E-measurements.json`; raw browser output remains outside the repository.

| Surface / group | Before 390 | After 390 | Before 320 | After 320 | Label lines 390 / 320 (before → after) |
|---|---|---|---|---|---|
| media-single / holes | [Capture](batch-b-captures/media-single-before-390-holes.png) | [Capture](batch-b-captures/media-single-after-390-holes.png) | [Capture](batch-b-captures/media-single-before-320-holes.png) | [Capture](batch-b-captures/media-single-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 |
| media-single / around | [Capture](batch-b-captures/media-single-before-390-around.png) | [Capture](batch-b-captures/media-single-after-390-around.png) | [Capture](batch-b-captures/media-single-before-320-around.png) | [Capture](batch-b-captures/media-single-after-320-around.png) | 390: 1 → 1; 320: 1 → 1 |
| media-add / holes | [Capture](batch-b-captures/media-add-before-390-holes.png) | [Capture](batch-b-captures/media-add-after-390-holes.png) | [Capture](batch-b-captures/media-add-before-320-holes.png) | [Capture](batch-b-captures/media-add-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 |
| media-add / around | [Capture](batch-b-captures/media-add-before-390-around.png) | [Capture](batch-b-captures/media-add-after-390-around.png) | [Capture](batch-b-captures/media-add-before-320-around.png) | [Capture](batch-b-captures/media-add-after-320-around.png) | 390: 1 → 1; 320: 1 → 1 |
| media-batch / holes | [Capture](batch-b-captures/media-batch-before-390-holes.png) | [Capture](batch-b-captures/media-batch-after-390-holes.png) | [Capture](batch-b-captures/media-batch-before-320-holes.png) | [Capture](batch-b-captures/media-batch-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 |
| media-batch / around | [Capture](batch-b-captures/media-batch-before-390-around.png) | [Capture](batch-b-captures/media-batch-after-390-around.png) | [Capture](batch-b-captures/media-batch-before-320-around.png) | [Capture](batch-b-captures/media-batch-after-320-around.png) | 390: 1 → 1; 320: 1 → 1 |
| media-gallery / holes | [Capture](batch-b-captures/media-gallery-before-390-holes.png) | [Capture](batch-b-captures/media-gallery-after-390-holes.png) | [Capture](batch-b-captures/media-gallery-before-320-holes.png) | [Capture](batch-b-captures/media-gallery-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 |
| media-gallery / around | [Capture](batch-b-captures/media-gallery-before-390-around.png) | [Capture](batch-b-captures/media-gallery-after-390-around.png) | [Capture](batch-b-captures/media-gallery-before-320-around.png) | [Capture](batch-b-captures/media-gallery-after-320-around.png) | 390: 1 → 1; 320: 1 → 1 |
| breakdown / breakdown | [Capture](batch-b-captures/breakdown-before-390-breakdown.png) | [Capture](batch-b-captures/breakdown-after-390-breakdown.png) | [Capture](batch-b-captures/breakdown-before-320-breakdown.png) | [Capture](batch-b-captures/breakdown-after-320-breakdown.png) | 390: 1 → 1; 320: 1 → 1 |
| receipt-search / recent | [Capture](batch-b-captures/receipt-search-before-390-recent.png) | [Capture](batch-b-captures/receipt-search-after-390-recent.png) | [Capture](batch-b-captures/receipt-search-before-320-recent.png) | [Capture](batch-b-captures/receipt-search-after-320-recent.png) | 390: 1 → 1; 320: 1 → 1 |
| receipt-search / threshold | [Capture](batch-b-captures/receipt-search-before-390-threshold.png) | [Capture](batch-b-captures/receipt-search-after-390-threshold.png) | [Capture](batch-b-captures/receipt-search-before-320-threshold.png) | [Capture](batch-b-captures/receipt-search-after-320-threshold.png) | 390: 1 → 1; 320: 1 → 1 |
| receipt-search / popular | [Capture](batch-b-captures/receipt-search-before-390-popular.png) | [Capture](batch-b-captures/receipt-search-after-390-popular.png) | [Capture](batch-b-captures/receipt-search-before-320-popular.png) | [Capture](batch-b-captures/receipt-search-after-320-popular.png) | 390: 1 → 1; 320: 1 → 1 |

Context captures: `media-single-{before,after}-{390,320}.png`; `media-add-{before,after}-{390,320}.png`; `media-batch-{before,after}-{390,320}.png`; `media-gallery-{before,after}-{390,320}.png`; `breakdown-{before,after}-{390,320}.png`; `receipt-search-{before,after}-{390,320}.png`.

**76 captures** in this group. No fixture/runtime errors or missing target groups. No page/root or target-label viewport overflow at 320 or 390. 
Group E covers the real shared Media tagger in single/add, member-batch and gallery-single presentations, both group heads; the actual review score headings/rulers/category controls inside their production `review-score-theme`; and ReviewReceipt's own Find another course button opening its nested ReviewCourseSearchSheet with all three seeded idle groups. All changed heads are one line at both widths. No session-limited component or label-only fallback was needed.

**Receipt cascade finding:** its nested search group heads already compute to ink before the change, because `.review-receipt h2` (reviewReceipt.css:20) overrides `.rcs-section h2`'s dim colour. The before DOM was verified to come from `__brief18before_ReviewCourseSearchSheet.tsx` and had no inline colour; after explicitly opts into ink. Thus these three before/after crops legitimately look unchanged. No CSS, component or test was changed to manufacture a grey before state. The score fixture's earlier missing theme wrapper was corrected in the apparatus only; its final breakdown probe shows muted → ink correctly.

#### Capture close-out and cleanup

- **260 captures**: A 40, B 60, C 36, D 48, E 76; every referenced file exists. **45 group-label rows × four states = 180 label measurements**, plus context/receipt/scrolled captures.
- Before: a88dbf1912, using the preserved 68c9720e46 copies after verifying no Courses source difference between those commits. After: accepted Batch B implementation plus the source prop-order ruling; no presentation changes in this capture-only request.
- All five groups have no page/root or target-label viewport overflow at 320 or 390. The pre-existing argument title wrap, You group wraps, scorecard table-header clipping and receipt search cascade are explicitly recorded above, not silently altered.
- Every requested component rendered; **not capturable list: none**. Fixture problems were corrected only in its cache/exports/theme wrapper. No production component or test was changed.
- Removed the two fixture entry/cache files, 32 before copies and 27 read-adapter export-forwarding copies (**61 temporary project files**), plus the disposable browser apparatus and rejected captures outside the repository.
- No test run was required for captures only; retained accepted command results are `bun x vitest run --shard=1/4`, `--shard=2/4`, `--shard=3/4`, `--shard=4/4`: **10,435/10,435 across 900 files**, before/after population **10,435/900 → 10,435/900**, delta **0/0**; no tests added, edited, renamed, rewritten or deleted here.
- Group commits: A 6fbfd2760f; B f9f4ac730b; C 5b51cd46df; D e60b7a712a; E d4c5a2e35c. All audit notes/measurements remain in this report directory; raw test logs are outside the repository. Final shared-default ink consolidation remains the later roadmap instruction, not part of this capture-only work.

## Batch C — Explore

### Step 1 — complete reachable-label audit (before changes)

Baseline **c5723a96d0**; accepted suite **10,435 tests / 900 files**. App.tsx:677–686 supplies the six requested routes. Current `/amateur` exposes **Watch only** (`EXPLORE_ALL_TAB_ENABLED=false`, exploreViewMemory.ts:24–30); URL/memory cannot restore All and AmateurPage:100–106 redirects Scores. Do not recolour dormant old cards/leaderboards by pattern. Watch supports For you/Shorts/Long form/Community and in-place/docked search. Grid pages open the same viewer with `amateur-watch`; WatchFeed opens with `amateur-clips`, `amateur-watch`, or `amateur-moments`. News mounts standalone NewsTabPage and the A-owned StoryArticle.

Closure follows visible surfaces and panels actually opened (including global search/account, PRO/AM popover, connected invitation, comments report, video About, Played-with panel, round and nested Likes); navigation to profiles/businesses/course pages/post studio is a scope exit, not permission to audit the whole application. Owner Edit navigates to composer; it is not an uninspected inline sheet. Shared scorecard/Likes/comments/Tour rows retain **see batch A/B**, not a fresh role audit. Detailed read-only findings and corrections are preserved in batch-c-explore-audit.md, batch-c-news-audit.md and batch-c-audit-notes.md.

| File:line | Rendered text / key | Route / state | Role | Old → planned colour / keep |
|---|---|---|---|---|
| src/features/video-details/VideoAboutSheet.tsx:40; video-viewer.css:15 | Chapters | /amateur Watch and all three /watch grids → fullscreen → About | E2 | --video-about-dim (.42) → --video-about-ink; Explore-only exploreHeadingInk; default/feed About unchanged |
| src/features/video-details/VideoAboutSheet.tsx:41; video-viewer.css:15 | Filmed at | /amateur Watch and all three /watch grids → fullscreen → About | E2 | --video-about-dim (.42) → --video-about-ink; Explore-only exploreHeadingInk; default/feed About unchanged |
| src/features/video-details/VideoAboutSheet.tsx:42; video-viewer.css:15 | In this video | /amateur Watch and all three /watch grids → fullscreen → About | E2 | --video-about-dim (.42) → --video-about-ink; Explore-only exploreHeadingInk; default/feed About unchanged |
| src/features/video-details/VideoAboutSheet.tsx:43; video-viewer.css:15 | Links | /amateur Watch and all three /watch grids → fullscreen → About | E2 | --video-about-dim (.42) → --video-about-ink; Explore-only exploreHeadingInk; default/feed About unchanged |
| src/features/video-details/VideoAboutSheet.tsx:44; video-viewer.css:15 | Thanks to | /amateur Watch and all three /watch grids → fullscreen → About | E2 | --video-about-dim (.42) → --video-about-ink; Explore-only exploreHeadingInk; default/feed About unchanged |
| src/features/video-details/VideoAboutSheet.tsx:45; video-viewer.css:15 | Gear in this video | /amateur Watch and all three /watch grids → fullscreen → About | E2 | --video-about-dim (.42) → --video-about-ink; Explore-only exploreHeadingInk; default/feed About unchanged |
| src/features/video-details/RoundVideoScore.tsx:15; video-viewer.css:15 | SCORECARD | /amateur Watch and all three /watch grids → fullscreen → About with round | E2 | --video-about-dim → --video-about-ink; same scoped About-root override; no figure/chapter change |
| src/components/feed/PostGolfTags.tsx:105 | PLAYED WITH | /amateur Watch and all three /watch grids → fullscreen → Played-with panel | E2 | WITH_COLOUR (.62) → INK; Explore-only exploreHeadingInk; inline and non-Explore viewer defaults kept |
| src/components/invite/ConnectedInviteState.tsx:52,54–56; inviteConnected.css:19 | From {homeClub} | Explore/News account → connected Invite friends | E2 | --invite-dim (.42) → --invite-ink; Explore-only exploreHeadingInk; first text span only; neighbouring count kept |
| src/components/invite/ConnectedInviteState.tsx:52,54–56; inviteConnected.css:19 | Playing most | Explore/News account → connected Invite friends | E2 | --invite-dim (.42) → --invite-ink; Explore-only exploreHeadingInk; first text span only; neighbouring count kept |
| src/components/invite/ConnectedInviteState.tsx:52,54–56; inviteConnected.css:19 | Invited (list group) | Explore/News account → connected Invite friends | E2 | --invite-dim (.42) → --invite-ink; Explore-only exploreHeadingInk; first text span only; neighbouring count kept |
| src/features/explore-magazine/watch/WatchFeed.tsx:499–500 | amateur.watch.rail.quickKicker — Under 3 min | /amateur → Shorts, ready/loading | K3 | keep A.DIM; duration beside title, NOT part of shelf head |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:80; fullscreen-stack.css:12 | fullscreen.following — FOLLOWING | /amateur Watch and all three /watch grids → fullscreen | K3 | keep .62; follow state |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.hole — HOLE | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.par — PAR | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.yards — YARDS | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.strokeIndex — STROKE INDEX | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.field — FIELD LOSES | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.overall — OVERALL | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.design — DESIGN | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.condition — CONDITION | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.clubhouse — CLUBHOUSE | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.facilities — FACILITIES | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/components/fullscreen-feed/FullscreenBottomStack.tsx:42; fullscreen-stack.css:19 | fullscreen.stats.members — MEMBERS | /amateur Watch and all three /watch grids → fullscreen | K2 | keep .62; .1em at 390; .04em at ≤339.98px, hence below selection threshold at 320 |
| src/features/video-details/RoundVideoScore.tsx:10; round-video.css:2 | ROUND · {roundHoles} HOLES | /amateur Watch and all three /watch grids → fullscreen | K3 | keep --video-about-mute; round summary metadata |
| src/features/video-details/RoundVideoScore.tsx:10; round-video.css:2 | {holeOrdinal} · PAR {par} | /amateur Watch and all three /watch grids → fullscreen | K2 | keep --video-about-mute; current-hole/stat caption |
| src/components/feed/PostGolfContext.tsx:77 | PAR {par} | /amateur Watch and all three /watch grids → fullscreen → hole chip | K2 | keep .62; chip facts, not grouping |
| src/components/feed/PostGolfContext.tsx:77 | {yards} YDS | /amateur Watch and all three /watch grids → fullscreen → hole chip | K2 | keep .62; chip facts, not grouping |
| src/features/member-badge/MemberBadgeCard.tsx:29; member-badge.css:7 | Verified by clbhouz | Watch/grid creator → PRO/AM card | K3 | keep .42; verification provenance; source brand remains lowercase, CSS uppercase unchanged |
| src/features/member-badge/MemberBadgeCard.tsx:33; memberBadgeRules.ts:32–49; member-badge.css:12 | WORLD RANKING | Watch/grid creator → PRO/AM card | K2 | keep .42; conditional statistic caption; absent facts stay absent |
| src/features/member-badge/MemberBadgeCard.tsx:33; memberBadgeRules.ts:32–49; member-badge.css:12 | EVENTS THIS YEAR | Watch/grid creator → PRO/AM card | K2 | keep .42; conditional statistic caption; absent facts stay absent |
| src/features/member-badge/MemberBadgeCard.tsx:33; memberBadgeRules.ts:32–49; member-badge.css:12 | WORLD AMATEUR RANK | Watch/grid creator → PRO/AM card | K2 | keep .42; conditional statistic caption; absent facts stay absent |
| src/features/member-badge/MemberBadgeCard.tsx:33; memberBadgeRules.ts:32–49; member-badge.css:12 | THIS YEAR | Watch/grid creator → PRO/AM card | K2 | keep .42; conditional statistic caption; absent facts stay absent |
| src/features/profile-sheet-v2/components/YourCourseAnalyticsSheet.tsx:707–710,728–738 | yourCourses.tileBest — Where you score best | Explore/News search or account → Your courses | K2 | keep A.DIM; caption of course-stat summary tile, not a section/group |
| src/features/profile-sheet-v2/components/YourCourseAnalyticsSheet.tsx:707–710,728–738 | yourCourses.tileBites — Where it bites | Explore/News search or account → Your courses | K2 | keep A.DIM; caption of course-stat summary tile, not a section/group |
| src/components/invite/ConnectedInviteState.tsx:34,52; inviteConnected.css:10 | To invite | Explore/News account → connected Invite friends | K2 | keep --invite-dim; statistic caption |
| src/components/invite/ConnectedInviteState.tsx:34,52; inviteConnected.css:10 | Invited (statistic) | Explore/News account → connected Invite friends | K2 | keep --invite-dim; statistic caption |
| src/components/invite/ConnectedInviteState.tsx:34,52; inviteConnected.css:10 | Joined | Explore/News account → connected Invite friends | K2 | keep --invite-dim; statistic caption |
| src/components/invite/ConnectedInviteState.tsx:56; inviteConnected.css:19 | {club rows.length} | Explore/News account → connected Invite friends | K3 | keep --invite-dim; count is distinct from neighbouring E2 group text |
| src/components/invite/ConnectedInviteState.tsx:56; inviteConnected.css:19 | {playing rows.length} | Explore/News account → connected Invite friends | K3 | keep --invite-dim; count is distinct from neighbouring E2 group text |
| src/components/invite/ConnectedInviteState.tsx:56; inviteConnected.css:19 | {invited rows.length} | Explore/News account → connected Invite friends | K3 | keep --invite-dim; count is distinct from neighbouring E2 group text |
| src/features/chrome-v2/AccountGlance.tsx:90; account-glance.css:44 | ADMIN | Explore/News account, admin viewer | K3 | keep --account-dim; role badge; no permission logic changes |
| src/features/chrome-v2/AccountGlance.tsx:92; account-glance.css:46 | SIGN OUT | Explore/News account | K4 | keep --account-dim; command; subsequent sentence-case confirmation excluded |
| src/features/comments-v2/components/ReportCommentSheetV2.tsx:119–133 | Next (disabled) | Explore/News comments → Report | K4 | keep .40; disabled command, .10em |
| src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:923 | courses:scorecard.tile.featKicker | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:972 | courses:scorecard.tile.roundsKicker | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1030 | courses:scorecard.theCard | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/features/courses/_shared/scorecard/RoundResults.tsx:235 | roundResults.sections.awards | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/features/courses/_shared/scorecard/RoundResults.tsx:242 | roundResults.sections.holes | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/features/courses/_shared/scorecard/RoundResults.tsx:253 | roundResults.scope.ownHeading | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1055 | roundResults.scope.fieldHeading | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/components/likes/LikesSheet.tsx:198,236 | People you follow | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/components/likes/LikesSheet.tsx:198,242 | Everyone else | /amateur Watch and all three /watch grids → fullscreen → round sheet / nested Likes | E2 | see batch A/B; existing TILE_KICKER/A.DIM → ink; reuse recorded role and existing declaration probes; Explore-only exploreHeadingInk at RoundDetailSheet forwards into existing scoped colour channel |
| src/features/tourhub/news/StoryShapes.tsx:155 | Hero tagFor(story) | /discover/news and /discover/news/:slug | K6 | see batch A; keep .82 photo; recorded role retained, not re-audited |
| src/features/tourhub/news/StoryShapes.tsx:189 | Feature-image tagFor(story) | /discover/news and /discover/news/:slug | K6 | see batch A; keep .82 photo; recorded role retained, not re-audited |
| src/features/tourhub/news/StoryShapes.tsx:208 | Workhorse tag + date | /discover/news and /discover/news/:slug | K3 | see batch A; keep A.DIM; recorded role retained, not re-audited |
| src/features/tourhub/news/StoryShapes.tsx:230 | Wire tag | /discover/news and /discover/news/:slug | K3 | see batch A; keep A.DIM; recorded role retained, not re-audited |
| src/features/tourhub/news/StoryPage.tsx:142–143 | No-image story.kicker | /discover/news and /discover/news/:slug | K3 | see batch A; keep INK_FAINT; recorded role retained, not re-audited |
| src/features/tourhub/news/StoryPage.tsx:149 | Published relative time | /discover/news and /discover/news/:slug | K3 | see batch A; keep INK_FAINT; recorded role retained, not re-audited |
| src/features/tourhub/news/StoryPage.tsx:150–153 | Amateur category/event tag | /discover/news and /discover/news/:slug | K3 | see batch A; keep INK_FAINT; recorded role retained, not re-audited |
| src/features/tourhub/news/StoryPage.tsx:157 | {readingMinutes} min read | /discover/news and /discover/news/:slug | K3 | see batch A; keep INK_FAINT; recorded role retained, not re-audited |
| src/features/tourhub/news/StoryBody.tsx:113–124 | Quote attribution | /discover/news and /discover/news/:slug | K3 | see batch A; keep INK_FAINT; recorded role retained, not re-audited |
| src/features/comments-v2/CommentsSheetV2.tsx:432–441 | comments.count | /amateur Watch and all three /watch grids → fullscreen / /discover/news and /discover/news/:slug → comments | K3 | see batch B; keep A.DIM; count, not group heading |
| src/features/explore-magazine/watch/WatchFeed.tsx:137–141 | {kicker} optional private Section qualifier | /amateur Watch | D | keep A.DIM; both actual Section calls (:424–432,:552) omit kicker; no rendered text |
| src/features/search-v2/SearchOverlayV2.tsx:637–645 | Previews | Explore/News global search | D | keep S.QUIET; only commit-mode branch; all current production mounts default; Watch uses inline search |
| src/components/invite/InviteFriendsSheet.tsx:134 | InviteHeader optional sub | Explore/News Invite friends | D | keep A.DIM; only call passes no sub |
| src/features/profile-sheet-v2/components/YourCourseAnalyticsSheet.tsx:46 | unused local LABEL | Explore/News Your courses | D | keep; declaration has no rendered consumer |

**Table counts (one row per label/variant, including A/B references):** E1 0, E2 20, K1 0, K2 23, K3 16, K4 2, K5 0, K6 2, D 4; **67 rows**. E2 contains **11 newly audited text variants plus nine A/B-owned group variants**; only three new declaration probes are needed (About scoped rule, Played-with ink override, invite text-only scoped rule). Repeated states/loading branches are not duplicate source sites.

**“?” list: none.** No uncertain role requires a 390 crop. Withdrawn Part 2 qualifier resolved: “Under 3 min” is a K3 duration beside the shelf head; private Section.kicker has no caller; genuine shelf-head eyebrows already use ink. WatchFeed quick counts lack uppercase/tracking and remain outside the selected census.

### Reachable exclusions and dormant paths

- All canonical ShelfHeading eyebrows (Shorts, Long form, More shorts, Filmed at your courses, By region, Creators, Top 100 on film), Watch featured eyebrow and Section.tsx eyebrows already use ink; no global token repoint.
- Featured photo labels, PRO/AM foil, round scorecard feat artwork/gold, guest EXPLORE gate already ink or excluded material/celebration tokens. Guest/download gates and chrome titles are not new grey group heads.
- PageTitle names, chip labels, video duration/rank badges, course/creator names, ordinary search/empty states and action labels without ≥.08em uppercase fail selection. SearchSectionHeader is already ink.
- Dead All-only ExploreCard/shelves/StandingShelf/PersonalBests/WeeklyClub branches, old AmateurHero/AmateurFilterRail/AmateurLeaderboardBlock/BoardFilterPanel and old AmateurNewsBlock retain their typography; they cannot be restored by a current URL. NewsTabPage is live only on standalone News in this scope; old ExploreTabContent News mount is not a valid current-route proof.
- Amateur data admits paragraph/heading/image/quote and nulls tournament_id (useAmateurStories.ts:31–49), so Tour leaderboard/result/season body branches cannot render here: see batch A, unchanged.

### Shared caller boundary and implementation plan

1. **About + SCORECARD:** default-false `exploreHeadingInk` on VideoAboutSheet, through ImmersiveFullscreenChrome, enabled only from the three exact existing Watch origins in FullscreenFeedOverlay. Scoped `.video-about[data-explore-heading-ink] .video-about-kicker` changes colour only. FeedCard.tsx:1005 and non-Watch fullscreen opens keep defaults. Nested RoundVideoScorecard inherits that same root rule.
2. **PLAYED WITH:** default-false `exploreHeadingInk` through FullscreenBottomStack → PlayedWithViewerChip → PlayedWithPanel; only heading span gets INK. Inline PlayedWithMediaOverlay/PostGolfTags.tsx:157 stays default. CourseGalleryChrome, FeedCard/CardFeed and non-Watch viewers keep defaults. WITH_COLOUR is not changed.
3. **Connected invite text:** default-false `exploreHeadingInk` carried through PostingAsMenu → InviteSheetProvider presentation options → InviteFriendsSheet → ConnectedInviteState. ChromeIsland opts in only for /amateur and the three /watch routes; NewsChromeBridge only when label is Amateur News. `.if1[data-explore-heading-ink] .if1-group-title > span:first-child` changes ink, not the adjacent K3 counts/stat labels. Source tracking stays profile_sheet; no invite read/write/permission change. Non-Explore callers preserved: FriendsEmptyState.tsx:398, SnapFeed.tsx:885, FindPeoplePage.tsx:951, SettingsTabContent.tsx:210, SocialListPage.tsx:275, and other PostingAsMenu hosts.
4. **A/B shared round/Likes group roles:** optional Explore-only flag on RoundDetailSheet forwards into the already-scoped Cards/Results/LikedByRow/LikesSheet colour channel. FullscreenFeedOverlay opts in only for the three Watch origins. Parent/magazine mounted round entrypoints opt in explicitly; dormant card branches remain dormant. CardScorecardSheet/RoundResults/LikesSheet defaults and existing asserted first props stay untouched; existing A/B fixture rows cover the reused declarations.

No font/copy/weight/geometry fixes are authorised. Existing feature fontFamily declarations are left as they are under this colour-only brief, rather than treating the general memory-drift alert as permission to change fonts.

### Step 2 — colour-only implementation

Implemented the table’s **20 E2 variants** across **16 production files**, with **three additional declaration probes (73 → 76)**. All new `exploreHeadingInk` flags default false. About root and invite first-text spans receive colour-only scoped overrides; Played-with changes only the heading span, leaving WITH_COLOUR and row text/arrows untouched. Existing A/B round/Results/Likes declarations are reused without changing their defaults. Existing fullscreen origins and route labels decide opt-in, not user/profile data. No new reads/writes, fonts, weights, copy, geometry or semantic colours. Invite source remains profile_sheet and each new opening resets the optional presentation, preventing an Explore flag carrying into a non-Explore open.

**Exact declaration additions:** `src/features/video-details/video-viewer.css:22` scoped About ink; `src/components/feed/PostGolfTags.tsx:105` conditional heading-only INK; `src/components/invite/inviteConnected.css:31` scoped first text span ink. These are the three appended JSON fixture entries; all nine A/B text variants are already covered by the existing probes and the unchanged TileSection contract.

**Every test edit:** `src/test/brief18EyebrowInk.test.tsx:91`, assertion `expect(sites).toHaveLength(73)` → `expect(sites).toHaveLength(76)` to reconcile the brief’s expressly requested three fixture additions. The case itself, all computed-colour expectations, the dim-default assertion and exact TileSection prop-expression assertion remain untouched. `src/test/fixtures/brief18EyebrowSites.json`: three records appended, no previous record removed/renamed/changed. No old-grey assertion was disturbed; no source-regex test changed. **Before/after cases 10,435 → 10,435; files 900 → 900; delta 0/0.** No test added, deleted, renamed or rewritten; this one contract-size assertion is the only edited assertion.

Preserved asserted first props: LikedByRow’s variant remains first; VideoAboutSheet’s open remains first; FullscreenBottomStack’s dots remains first; round sheets keep open first. No code change to CardScorecardSheet/RoundResults/LikesSheet or their local shared constants.

Capture plan (groups ≤6 surfaces): **C1** About general sections + About round SCORECARD + Played-with panel; **C2** connected Invite friends (all three group headings) + Explore-origin scorecard + actual nested Likes. Each group uses real components/cache and all four before/after × width states. Temporary before sources are outside the repository until disposable collocated fixture copies are needed; none will be staged.

### Step 3 — stopped on shard 2 assertion (no retry)

Audit committed **3afd2ca7cf**; implementation committed **273d2ce258**. Ran the first two shards as separate commands, strictly sequentially, retaining full output outside the repository in `/tmp/brief18-c-tests/`. No worker timeout occurred. No source/test correction or rerun after the assertion failure; shards 3/4 and captures did not start.

| Command | Files | Tests | Result / duration |
|---|---:|---:|---|
| `bun x vitest run --shard=1/4` | 225 passed | 2,500 passed | Passed; 201.90s |
| `bun x vitest run --shard=2/4` | 224 passed / 1 failed (225) | 2,492 passed / 1 failed (2,493) | STOP; 199.60s |
| `bun x vitest run --shard=3/4` | Not run | Not run | Blocked by assertion ruling |
| `bun x vitest run --shard=4/4` | Not run | Not run | Blocked by assertion ruling |

**Executed subtotal:** 4,993 cases in 450 files: **4,992 passed, 1 failed**. Full-suite population remains **10,435 / 900**, baseline→after **10,435 / 900 → 10,435 / 900**, delta **0 / 0**; this is not a claim that all 10,435 passed. One existing contract-length assertion changed as named in Step 2; no test added, deleted, renamed or rewritten. The declaration probe's shard was not yet run, so its 76-site extension is not reported as passing.

**Every failing file:line and the tool's exact words:**

```text
FAIL  src/test/accountGlanceWiring.test.tsx > avatar account wiring > closes before opening the existing invite sheet
AssertionError: expected "spy" to be called with arguments: [ 'profile_sheet' ]

Received:

  1st spy call:

  [
    "profile_sheet",
+   {
+     "exploreHeadingInk": false,
+   },
  ]

Number of calls: 1

❯ src/test/accountGlanceWiring.test.tsx:62:160
```

**Cause/impact:** PostingAsMenu now sends a second presentation argument even when Explore ink is false; the existing test pins the default invocation to one argument. It does not pin the old grey colour, so the brief does not authorise editing it. A source-only continuation can preserve `openInviteSheet('profile_sheet')` when the flag is false and supply the optional presentation only for Explore. That correction is **proposed, not applied**; Ben's ruling is required after this stop. `accountGlanceWiring.test.tsx` remains untouched.

Latest available preview build signal: **build OK, 2026-11-24T20:11:00Z**. No surviving compile error reported. No capture page or collocated before copy was created or committed; temporary baseline copies outside the repository are removed, while recoverable before source remains in audit commit 3afd2ca7cf. No visual/overflow claim for Batch C is made before captures. Raw runner logs stay outside the repository. Final shared-default ink consolidation remains deferred on the roadmap.


### Opt-ins collapsed — batch C ruling (24 November 2026)

Steps 1–2: all Brief 18 surface-only heading flags and plumbing are withdrawn, including Tour TileSection ink and the Courses/Explore channels. Shared E2 roles belong to the component, not its opening page. Defaults use local ink declarations; TILE_KICKER, TILE_DIM, WITH_COLOUR and other K-label tokens remain unchanged. No sizes, weights, tracking, spacing, copy, data reads or behaviour are changed. `openInviteSheet(source)` is restored. CardScorecardSheet keeps `variant="stack"` as LikedByRow's first prop. Implementation: **55577da7d4**. The preview's latest post-edit signal is **build OK**.

#### Shared components whose defaults changed

| Component / group declaration | Default change | Direct callers and expanded reach |
|---|---|---|
| TileSection (scorecardParts) | local h3 TILE_DIM → TILE_INK; no ink prop | CardScorecardSheet (feat/rounds/card), RoundResults (awards/holes), RoundPagePreview (card). Member Clubhouse, Profile, round detail, messages and all inherited scorecards now ink, not just Tour/Courses. |
| CardScorecardSheet | field group local TILE_KICKER → TILE_INK | RoundDetailSheet and Tour leaderboard ScorecardSheet (both populated/empty branches); routes listed below. |
| RoundResults | own-round scope h3 → TILE_INK | CardScorecardSheet; all member scorecard callers inherit the change. Shared TILE_KICKER remains dim for excluded stat roles. |
| LikesSheet | actor-list group heading A.DIM → A.INK | Both LikedByRow branches and FeedOverlayLayer. Includes Clubhouse, Profile posts, reviews and TourSlot/ExploreCard, not just Courses-origin nested Likes. |
| VideoAboutSheet / nested RoundVideoScorecard | video-about-kicker → video-about-ink at original CSS declaration | FeedCard (Clubhouse/profile/business feeds) and ImmersiveFullscreenChrome (all fullscreen origins, not just Watch). Both general and round group headings now ink. |
| PlayedWithPanel | PLAYED WITH span WITH_COLOUR → INK | PlayedWithMediaOverlay (inline feeds) and PlayedWithViewerChip (FullscreenBottomStack, used by both ImmersiveFullscreenChrome and CourseGalleryChrome). Inline Clubhouse/profile/business and non-Watch viewers inherit ink. WITH_COLOUR stays grey for other roles. |
| ConnectedInviteState / InviteGroup | first group-title span → invite-ink | InviteFriendsSheet via global InviteSheetProvider. Account menu, Settings, Find people, Find golfers, social lists, feed-end and Friends empty-state now ink; action/count text retains its grey roles. |
| ShotTagChoices | hole/place group h3 → A.INK | ShotTagCard and GolfPostSections (post composer). ShotTagCard's admin and member callers now inherit ink; no Courses-only prop remains. |
| ReviewCourseSearchSheet / Section | all list h2 declarations → A.INK | ReviewReceipt (course review receipt) and ComposerFlowSheet (global post/review entry from every navigation surface). Existing ink cascade may mean no visible pixel difference outside the receipt; capture records it rather than inventing grey. |

#### Complete direct caller census and routes

The table names every production JSX caller of the changed shared declarations and every invite opening command. Internal adapters are included to prove transitive reach; dormant modules are listed without claiming a current live route. Line numbers refer to the post-collapse source at this step.

| Caller file:line | Shared component / command | Route or transitive reach |
|---|---|---|
| `src/pages/AmateurPage.tsx:119` | RoundDetailSheet | /amateur (Watch) |
| `src/pages/Clubhouse.tsx:754` | RoundDetailSheet | / (Clubhouse) |
| `src/pages/RoundsPage.tsx:84` | RoundDetailSheet | Dormant RoundsPage; /rounds redirects to /amateur |
| `src/pages/RoundPage.tsx:218` | RoundDetailSheet | /round/:whsScoreId |
| `src/pages/ProfilePageV2.tsx:1604` | RoundDetailSheet | /profile; /profile/:username |
| `src/pages/HandicapPage.tsx:542` | RoundDetailSheet | /profile handicap; /handicap redirects |
| `src/pages/messaging-v2/SharedGroundStrip.tsx:187` | RoundDetailSheet | /messages and conversation views |
| `src/pages/messaging-v2/ShareCards.tsx:134` | RoundDetailSheet | /messages and conversation views |
| `src/pages/FindPeoplePage.tsx:951` | openInviteSheet | /find-people |
| `src/components/invite/InviteSheetProvider.tsx:35` | InviteFriendsSheet | Global invitation provider on every mounted application route |
| `src/components/invite/InviteFriendsSheet.tsx:110` | ConnectedInviteState | Global invitation provider on every mounted application route |
| `src/components/likes/LikedByRow.tsx:193` | LikesSheet | Every LikedByRow caller, listed separately (both line and stack branches) |
| `src/components/likes/LikedByRow.tsx:408` | LikesSheet | Every LikedByRow caller, listed separately (both line and stack branches) |
| `src/components/header/PostingAsMenu.tsx:279` | openInviteSheet | Account menu on every personal/business page, including / and /profile |
| `src/components/explore-tab-new/WireTicker.tsx:107` | RoundDetailSheet | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/components/explore-tab-new/FindGolfersSheet.tsx:598` | openInviteSheet | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/components/explore-tab-new/FindGolfersSheet.tsx:670` | openInviteSheet | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/components/explore-tab-new/ExploreTabContent.tsx:182` | RoundDetailSheet | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx:1342` | RoundDetailSheet | All fullscreen origins: Clubhouse/Profile/business/Watch/course gallery |
| `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx:1344` | RoundDetailSheet | All fullscreen origins: Clubhouse/Profile/business/Watch/course gallery |
| `src/components/fullscreen-feed/FullscreenBottomStack.tsx:64` | PlayedWithViewerChip | All fullscreen origins: Clubhouse/Profile/business/Watch/course gallery |
| `src/components/feed/PostGolfTags.tsx:157` | PlayedWithPanel | Clubhouse and all feed consumers (profile/business posts) |
| `src/components/feed/PostGolfTags.tsx:184` | PlayedWithPanel | Clubhouse and all feed consumers (profile/business posts) |
| `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx:418` | VideoAboutSheet | All fullscreen origins: Clubhouse/Profile/business/Watch/course gallery |
| `src/components/settings/SettingsTabContent.tsx:210` | Button | /edit-profile?tab=settings |
| `src/components/feed/HomeRail.tsx:110` | RoundDetailSheet | Clubhouse and all feed consumers (profile/business posts) |
| `src/components/profile/rounds/ProfileRoundsTab.tsx:298` | RoundDetailSheet | /profile and /profile/:username (rounds/handicap sections) |
| `src/components/feed/FeedOverlayLayer.tsx:338` | LikesSheet | Clubhouse and all feed consumers (profile/business posts) |
| `src/features/post-v2/components/golf/GolfPostSections.tsx:87` | ShotTagChoices | Post composer, all posting origins |
| `src/components/feed/FeedCard.tsx:794` | LikedByRow | Clubhouse and all feed consumers (profile/business posts) |
| `src/components/feed/FeedCard.tsx:1005` | VideoAboutSheet | Clubhouse and all feed consumers (profile/business posts) |
| `src/components/feed/SnapFeed.tsx:885` | openInviteSheet | Clubhouse and all feed consumers (profile/business posts) |
| `src/components/posts-tab/PostsTabContent.tsx:425` | RoundDetailSheet | /profile and business profile Posts |
| `src/components/posts/ReviewBottomSheet.tsx:796` | LikedByRow | Review sheet on all feed/profile/course origins |
| `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:341` | RoundDetailSheet | /profile and /profile/:username (rounds/handicap sections) |
| `src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx:495` | CardScorecardSheet | /profile and /profile/:username (rounds/handicap sections) |
| `src/features/clubhouse-tour/TourSlot.tsx:176` | FeedPostActions | /tourhub; TourSlot also / (Clubhouse) |
| `src/features/explore-magazine/WeeklyClubShelf.tsx:115` | RoundDetailSheet | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/components/profile/handicap/whs/sections/recently-played/RecentlyPlayedFeed.tsx:124` | RoundDetailSheet | /profile and /profile/:username (rounds/handicap sections) |
| `src/components/courses/course-detail/you/YourRoundsSheet.tsx:202` | RoundDetailSheet | /courses and /courses/:courseId; selected About/You/browse entrypoint |
| `src/features/explore-magazine/CircleShelf.tsx:366` | RoundDetailSheet | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/features/explore-magazine/PersonalBestsShelf.tsx:110` | RoundDetailSheet | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/features/explore-magazine/ExploreMagazine.tsx:1513` | RoundDetailSheet | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/features/explore-magazine/ExploreCard.tsx:632` | LikedByRow | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/features/explore-magazine/ExploreCard.tsx:1463` | LikedByRow | /amateur legacy/dormant adapters; current Watch paths only where mounted |
| `src/features/tourhub/leaderboard/ScorecardSheet.tsx:112` | CardScorecardSheet | /tourhub; TourSlot also / (Clubhouse) |
| `src/features/tourhub/leaderboard/ScorecardSheet.tsx:165` | CardScorecardSheet | /tourhub; TourSlot also / (Clubhouse) |
| `src/components/courses/course-detail/about/CourseLatelySection.tsx:161` | RoundDetailSheet | /courses and /courses/:courseId; selected About/You/browse entrypoint |
| `src/components/courses/course-detail/about/CourseHonoursSection.tsx:47` | RoundDetailSheet | /courses and /courses/:courseId; selected About/You/browse entrypoint |
| `src/components/courses/course-detail/CourseYouTab.tsx:713` | RoundDetailSheet | /courses and /courses/:courseId; selected About/You/browse entrypoint |
| `src/components/course-media-tab/ShotTagCard.tsx:64` | ShotTagChoices | /courses/:courseId Media; HolePhotoFastPaths also AdminHoleTagging (admin) |
| `src/components/course-media-tab/HolePhotoTagDialog.tsx:18` | ShotTagCard | /courses/:courseId Media; HolePhotoFastPaths also AdminHoleTagging (admin) |
| `src/components/course-media-tab/HolePhotoFastPaths.tsx:194` | ShotTagCard | /courses/:courseId Media; HolePhotoFastPaths also AdminHoleTagging (admin) |
| `src/components/courses/browse/StandoutRoundsSection.tsx:92` | RoundDetailSheet | /courses and /courses/:courseId; selected About/You/browse entrypoint |
| `src/components/profile/handicap/whs/sections/PersonalBestsSection.tsx:380` | RoundDetailSheet | /profile and /profile/:username (rounds/handicap sections) |
| `src/components/course-media-tab/CourseMediaAddShot.tsx:102` | ShotTagCard | /courses/:courseId Media; HolePhotoFastPaths also AdminHoleTagging (admin) |
| `src/components/clubhouse/FriendsEmptyState.tsx:398` | openInviteSheet | / (Clubhouse) |
| `src/components/course-media-tab/CourseGalleryTagger.tsx:125` | ShotTagCard | /courses/:courseId Media; HolePhotoFastPaths also AdminHoleTagging (admin) |
| `src/features/courses/_shared/scorecard/RoundPagePreview.tsx:109` | TileSection | All scorecard hosts: Clubhouse, Profile, /round/:whsScoreId, /messages, Tour and Courses; transitive through RoundDetailSheet / Tour ScorecardSheet |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:233` | TileSection | All scorecard hosts: Clubhouse, Profile, /round/:whsScoreId, /messages, Tour and Courses; transitive through RoundDetailSheet / Tour ScorecardSheet |
| `src/features/courses/_shared/scorecard/RoundResults.tsx:240` | TileSection | All scorecard hosts: Clubhouse, Profile, /round/:whsScoreId, /messages, Tour and Courses; transitive through RoundDetailSheet / Tour ScorecardSheet |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:921` | TileSection | All scorecard hosts: Clubhouse, Profile, /round/:whsScoreId, /messages, Tour and Courses; transitive through RoundDetailSheet / Tour ScorecardSheet |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:970` | TileSection | All scorecard hosts: Clubhouse, Profile, /round/:whsScoreId, /messages, Tour and Courses; transitive through RoundDetailSheet / Tour ScorecardSheet |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1028` | TileSection | All scorecard hosts: Clubhouse, Profile, /round/:whsScoreId, /messages, Tour and Courses; transitive through RoundDetailSheet / Tour ScorecardSheet |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1039` | RoundResults | All scorecard hosts: Clubhouse, Profile, /round/:whsScoreId, /messages, Tour and Courses; transitive through RoundDetailSheet / Tour ScorecardSheet |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1119` | LikedByRow | All scorecard hosts: Clubhouse, Profile, /round/:whsScoreId, /messages, Tour and Courses; transitive through RoundDetailSheet / Tour ScorecardSheet |
| `src/features/composer-flow/ComposerFlowSheet.tsx:107` | ReviewCourseSearchSheet | Global composer entry on all nav-visible routes |
| `src/features/social-lists-v2/SocialListPage.tsx:275` | openInviteSheet | Social follower/following list routes |
| `src/features/review-v2/components/ReviewReceipt.tsx:107` | ReviewCourseSearchSheet | /courses/:courseId/rate and global review composer |

#### Declaration fixture and authorised test edits

- `src/test/fixtures/brief18EyebrowSites.json`: **76 → 76** sites. Remapped line numbers after plumbing removal; About selector is now `.video-about-kicker`; invite selector `.if1-group-title > span:first-child`; all colour probes now resolve label defaults, never opt-in branches. No added/deleted test case/file.
- `src/test/brief18EyebrowInk.test.tsx:117–119` (previous 117–120): old `createElement(TileSection, { kicker: 'Fixture', ink, children: null })` with `toBe(ink ? 'rgb(248, 250, 252)' : 'rgba(248, 250, 252, 0.42)')` → default render without ink, `toBe('rgb(248, 250, 252)')`. Reason: authorised E2 default replaces exactly the old grey/white colour branch; same existing case, no rename/delete.
- `src/test/brief18EyebrowInk.test.tsx:128` (previous 130): old `toBe('isTour || coursesHeadingInk')` → `toBeUndefined()` for the removed ink attribute. Reason: the brief explicitly withdraws that opt-in contract; both card/rounds consumers are still enumerated and the real default colour is asserted above.
- `accountGlanceWiring.test.tsx` and `likedByCollapse.test.tsx` **untouched**. No other test changed at this step. Before/after suite population **10,435/900 → 10,435/900**, delta **0/0**; the changed declaration case is not yet reported passing.
- Roadmap final-collapse line replaced by **done in batch C**; grouped captures and four sequential shards remain pending.

#### Step 3 — final sequential shard verification

All four commands ran **separately and sequentially**. Full stdout/stderr retained outside the repository at `/tmp/brief18-collapse-tests/shard-{1,2,3,4}.log`; raw logs are not committed. No assertion failure or `Timeout calling onTaskUpdate` occurred; no rerun was needed.

| Command | Files | Tests passed / executed | Duration |
|---|---:|---:|---:|
| `bun x vitest run --shard=1/4` | 225 passed | 2,500 / 2,500 | 188.47s |
| `bun x vitest run --shard=2/4` | 225 passed | 2,493 / 2,493 | 227.28s |
| `bun x vitest run --shard=3/4` | 225 passed | 2,607 / 2,607 | 185.61s |
| `bun x vitest run --shard=4/4` | 225 passed | 2,835 / 2,835 | 164.53s |
| **Total** | **900 passed** | **10,435 / 10,435** | **765.89s** |

Baseline **10,435 tests / 900 files** → final **10,435 tests / 900 files**; delta **0 tests / 0 files**. No cases or files added, deleted or renamed. The one existing `brief18EyebrowInk.test.tsx` case has the two authorised contract edits quoted above and passed in shard 3 (1/1; 76 default declaration probes). The prior batch C census-length change was 73→76, with no suite-population change. `accountGlanceWiring.test.tsx` passed **7/7** in shard 2 untouched; `likedByCollapse.test.tsx` passed **9/9** in shard 4 untouched. No other test file edited. Latest preview signal: **build OK**.

#### Step 4 — captures outstanding

No new batch C capture has been taken in this continuation. C1 (About/general, About/round, Played-with), C2 (connected Invite, Explore scorecard and nested Likes), and the additional **Collapsed defaults** caller group remain outstanding. They require real-component seeded-cache fixtures, before/after at 390/320, and a separate commit per group of at most six surfaces. No visual/overflow/session-flow claim is made from the passing shards. No temporary fixture page was added; the pre-edit state is reproducible from commit **a7c53f3b71**, and temporary editing/back-up apparatus was removed before close-out. Raw test logs remain outside the repository. This is not capture completion.


### Batch C capture list — group C1

Before: **3afd2ca7cf** (pre-change audit commit); after: **0556e2fd55** accepted ink defaults. Chromium fixture-only captures of real components with MemoryRouter/QueryClient providers and seeded fictional identity/data, no real account or service writes. The before pass redirects the changed modules/CSS to disposable collocated copies from that commit; the after pass imports the unchanged accepted source.

Three surfaces: VideoAboutSheet general groups, its real RoundVideoScorecard branch, and PlayedWithPanel. The fixture opens each with a button; no label is recreated. General groups are Chapters, Filmed at, In this video, Links, Thanks to and Gear in this video; round SCORECARD and PLAYED WITH are separate rows. Fixture-only missing Vite refresh preamble was repaired; rejected error images were removed.

| Surface / label | Before 390 | After 390 | Before 320 | After 320 | Lines 390 / 320 | Colour before → after |
|---|---|---|---|---|---|---|
| about-general / chapters | [Capture](batch-c-captures/about-general-before-390-chapters.png) | [Capture](batch-c-captures/about-general-after-390-chapters.png) | [Capture](batch-c-captures/about-general-before-320-chapters.png) | [Capture](batch-c-captures/about-general-after-320-chapters.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| about-general / filmed | [Capture](batch-c-captures/about-general-before-390-filmed.png) | [Capture](batch-c-captures/about-general-after-390-filmed.png) | [Capture](batch-c-captures/about-general-before-320-filmed.png) | [Capture](batch-c-captures/about-general-after-320-filmed.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| about-general / people | [Capture](batch-c-captures/about-general-before-390-people.png) | [Capture](batch-c-captures/about-general-after-390-people.png) | [Capture](batch-c-captures/about-general-before-320-people.png) | [Capture](batch-c-captures/about-general-after-320-people.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| about-general / links | [Capture](batch-c-captures/about-general-before-390-links.png) | [Capture](batch-c-captures/about-general-after-390-links.png) | [Capture](batch-c-captures/about-general-before-320-links.png) | [Capture](batch-c-captures/about-general-after-320-links.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| about-general / thanks | [Capture](batch-c-captures/about-general-before-390-thanks.png) | [Capture](batch-c-captures/about-general-after-390-thanks.png) | [Capture](batch-c-captures/about-general-before-320-thanks.png) | [Capture](batch-c-captures/about-general-after-320-thanks.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| about-general / gear | [Capture](batch-c-captures/about-general-before-390-gear.png) | [Capture](batch-c-captures/about-general-after-390-gear.png) | [Capture](batch-c-captures/about-general-before-320-gear.png) | [Capture](batch-c-captures/about-general-after-320-gear.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| about-round / scorecard | [Capture](batch-c-captures/about-round-before-390-scorecard.png) | [Capture](batch-c-captures/about-round-after-390-scorecard.png) | [Capture](batch-c-captures/about-round-before-320-scorecard.png) | [Capture](batch-c-captures/about-round-after-320-scorecard.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| played-with / played | [Capture](batch-c-captures/played-with-before-390-played.png) | [Capture](batch-c-captures/played-with-after-390-played.png) | [Capture](batch-c-captures/played-with-before-320-played.png) | [Capture](batch-c-captures/played-with-after-320-played.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.62)` → `rgb(248, 250, 252)` |

Context captures: `about-general-{before,after}-{390,320}.png`; `about-round-{before,after}-{390,320}.png`; `played-with-{before,after}-{390,320}.png`.

**44 captures; 32 label measurements.** No target-label, page/root or body viewport overflow at 320 or 390. All requested groups rendered; no component is not capturable. No new label wraps or three-line titles; fixture checks are not live authenticated flow or physical-device proof. Production/test files unchanged; no shard rerun for captures only (accepted 10,435/10,435 across 900 files, population delta 0/0).


### Batch C capture list — group C2

Before: **3afd2ca7cf** (pre-change audit commit); after: **0556e2fd55** accepted ink defaults. Chromium fixture-only captures of real components with MemoryRouter/QueryClient providers and seeded fictional identity/data, no real account or service writes. The before pass redirects the changed modules/CSS to disposable collocated copies from that commit; the after pass imports the unchanged accepted source.

| Surface / label | Before 390 | After 390 | Before 320 | After 320 | Lines 390 / 320 | Colour before → after |
|---|---|---|---|---|---|---|
| invite / club | [Capture](batch-c-captures/invite-before-390-club.png) | [Capture](batch-c-captures/invite-after-390-club.png) | [Capture](batch-c-captures/invite-before-320-club.png) | [Capture](batch-c-captures/invite-after-320-club.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| invite / playing | [Capture](batch-c-captures/invite-before-390-playing.png) | [Capture](batch-c-captures/invite-after-390-playing.png) | [Capture](batch-c-captures/invite-before-320-playing.png) | [Capture](batch-c-captures/invite-after-320-playing.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| invite / invited | [Capture](batch-c-captures/invite-before-390-invited.png) | [Capture](batch-c-captures/invite-after-390-invited.png) | [Capture](batch-c-captures/invite-before-320-invited.png) | [Capture](batch-c-captures/invite-after-320-invited.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| scorecard / feat | [Capture](batch-c-captures/scorecard-before-390-feat.png) | [Capture](batch-c-captures/scorecard-after-390-feat.png) | [Capture](batch-c-captures/scorecard-before-320-feat.png) | [Capture](batch-c-captures/scorecard-after-320-feat.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| scorecard / rounds | [Capture](batch-c-captures/scorecard-before-390-rounds.png) | [Capture](batch-c-captures/scorecard-after-390-rounds.png) | [Capture](batch-c-captures/scorecard-before-320-rounds.png) | [Capture](batch-c-captures/scorecard-after-320-rounds.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| scorecard / card | [Capture](batch-c-captures/scorecard-before-390-card.png) | [Capture](batch-c-captures/scorecard-after-390-card.png) | [Capture](batch-c-captures/scorecard-before-320-card.png) | [Capture](batch-c-captures/scorecard-after-320-card.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| scorecard / awards | [Capture](batch-c-captures/scorecard-before-390-awards.png) | [Capture](batch-c-captures/scorecard-after-390-awards.png) | [Capture](batch-c-captures/scorecard-before-320-awards.png) | [Capture](batch-c-captures/scorecard-after-320-awards.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| scorecard / holes | [Capture](batch-c-captures/scorecard-before-390-holes.png) | [Capture](batch-c-captures/scorecard-after-390-holes.png) | [Capture](batch-c-captures/scorecard-before-320-holes.png) | [Capture](batch-c-captures/scorecard-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| scorecard / own | [Capture](batch-c-captures/scorecard-before-390-own.png) | [Capture](batch-c-captures/scorecard-after-390-own.png) | [Capture](batch-c-captures/scorecard-before-320-own.png) | [Capture](batch-c-captures/scorecard-after-320-own.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| scorecard / field | [Capture](batch-c-captures/scorecard-before-390-field.png) | [Capture](batch-c-captures/scorecard-after-390-field.png) | [Capture](batch-c-captures/scorecard-before-320-field.png) | [Capture](batch-c-captures/scorecard-after-320-field.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| nested-likes / following | [Capture](batch-c-captures/nested-likes-before-390-following.png) | [Capture](batch-c-captures/nested-likes-after-390-following.png) | [Capture](batch-c-captures/nested-likes-before-320-following.png) | [Capture](batch-c-captures/nested-likes-after-320-following.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| nested-likes / others | [Capture](batch-c-captures/nested-likes-before-390-others.png) | [Capture](batch-c-captures/nested-likes-after-390-others.png) | [Capture](batch-c-captures/nested-likes-before-320-others.png) | [Capture](batch-c-captures/nested-likes-after-320-others.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |

Context captures: `invite-{before,after}-{390,320}.png`; `nested-likes-{before,after}-{390,320}.png`; `scorecard-{before,after}-{390,320}.png`.

**60 captures; 48 label measurements.** No target-label, page/root or body viewport overflow at 320 or 390. All requested groups rendered; no component is not capturable. No new label wraps or three-line titles; fixture checks are not live authenticated flow or physical-device proof. Production/test files unchanged; no shard rerun for captures only (accepted 10,435/10,435 across 900 files, population delta 0/0).
