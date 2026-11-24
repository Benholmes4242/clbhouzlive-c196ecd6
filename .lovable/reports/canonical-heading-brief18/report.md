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
