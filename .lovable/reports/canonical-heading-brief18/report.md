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


### Batch C capture list — Collapsed defaults / group D1

Before: **3afd2ca7cf** (pre-change audit commit); after: **0556e2fd55** accepted ink defaults. Chromium fixture-only captures of real components with MemoryRouter/QueryClient providers and seeded fictional identity/data, no real account or service writes. The before pass redirects the changed modules/CSS to disposable collocated copies from that commit; the after pass imports the unchanged accepted source.

Four outside-batch caller surfaces, opened through the **real Clubhouse FeedCard**: attached round row → RoundDetailSheet → CardScorecardSheet/TileSection/RoundResults; FeedCard liked-by row → LikesSheet; FeedCard video title → VideoAboutSheet; inline Played-with chip → PlayedWithMediaOverlay → PlayedWithPanel. The normal round wrapper has no multi-round chip, so its round-chip role is covered in Explore C2 rather than fabricated here. All use accepted defaults, with no surface flag. The fixture post missing canonical 0:00 chapters was repaired in fixture data only; no parser/source was edited.

| Surface / label | Before 390 | After 390 | Before 320 | After 320 | Lines 390 / 320 | Colour before → after |
|---|---|---|---|---|---|---|
| collapsed-scorecard / feat | [Capture](batch-c-captures/collapsed-scorecard-before-390-feat.png) | [Capture](batch-c-captures/collapsed-scorecard-after-390-feat.png) | [Capture](batch-c-captures/collapsed-scorecard-before-320-feat.png) | [Capture](batch-c-captures/collapsed-scorecard-after-320-feat.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-scorecard / card | [Capture](batch-c-captures/collapsed-scorecard-before-390-card.png) | [Capture](batch-c-captures/collapsed-scorecard-after-390-card.png) | [Capture](batch-c-captures/collapsed-scorecard-before-320-card.png) | [Capture](batch-c-captures/collapsed-scorecard-after-320-card.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-scorecard / awards | [Capture](batch-c-captures/collapsed-scorecard-before-390-awards.png) | [Capture](batch-c-captures/collapsed-scorecard-after-390-awards.png) | [Capture](batch-c-captures/collapsed-scorecard-before-320-awards.png) | [Capture](batch-c-captures/collapsed-scorecard-after-320-awards.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-scorecard / holes | [Capture](batch-c-captures/collapsed-scorecard-before-390-holes.png) | [Capture](batch-c-captures/collapsed-scorecard-after-390-holes.png) | [Capture](batch-c-captures/collapsed-scorecard-before-320-holes.png) | [Capture](batch-c-captures/collapsed-scorecard-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-scorecard / own | [Capture](batch-c-captures/collapsed-scorecard-before-390-own.png) | [Capture](batch-c-captures/collapsed-scorecard-after-390-own.png) | [Capture](batch-c-captures/collapsed-scorecard-before-320-own.png) | [Capture](batch-c-captures/collapsed-scorecard-after-320-own.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-scorecard / field | [Capture](batch-c-captures/collapsed-scorecard-before-390-field.png) | [Capture](batch-c-captures/collapsed-scorecard-after-390-field.png) | [Capture](batch-c-captures/collapsed-scorecard-before-320-field.png) | [Capture](batch-c-captures/collapsed-scorecard-after-320-field.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-likes / following | [Capture](batch-c-captures/collapsed-likes-before-390-following.png) | [Capture](batch-c-captures/collapsed-likes-after-390-following.png) | [Capture](batch-c-captures/collapsed-likes-before-320-following.png) | [Capture](batch-c-captures/collapsed-likes-after-320-following.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-likes / others | [Capture](batch-c-captures/collapsed-likes-before-390-others.png) | [Capture](batch-c-captures/collapsed-likes-after-390-others.png) | [Capture](batch-c-captures/collapsed-likes-before-320-others.png) | [Capture](batch-c-captures/collapsed-likes-after-320-others.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-about / chapters | [Capture](batch-c-captures/collapsed-about-before-390-chapters.png) | [Capture](batch-c-captures/collapsed-about-after-390-chapters.png) | [Capture](batch-c-captures/collapsed-about-before-320-chapters.png) | [Capture](batch-c-captures/collapsed-about-after-320-chapters.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-about / filmed | [Capture](batch-c-captures/collapsed-about-before-390-filmed.png) | [Capture](batch-c-captures/collapsed-about-after-390-filmed.png) | [Capture](batch-c-captures/collapsed-about-before-320-filmed.png) | [Capture](batch-c-captures/collapsed-about-after-320-filmed.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-about / people | [Capture](batch-c-captures/collapsed-about-before-390-people.png) | [Capture](batch-c-captures/collapsed-about-after-390-people.png) | [Capture](batch-c-captures/collapsed-about-before-320-people.png) | [Capture](batch-c-captures/collapsed-about-after-320-people.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-about / links | [Capture](batch-c-captures/collapsed-about-before-390-links.png) | [Capture](batch-c-captures/collapsed-about-after-390-links.png) | [Capture](batch-c-captures/collapsed-about-before-320-links.png) | [Capture](batch-c-captures/collapsed-about-after-320-links.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-about / thanks | [Capture](batch-c-captures/collapsed-about-before-390-thanks.png) | [Capture](batch-c-captures/collapsed-about-after-390-thanks.png) | [Capture](batch-c-captures/collapsed-about-before-320-thanks.png) | [Capture](batch-c-captures/collapsed-about-after-320-thanks.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-about / gear | [Capture](batch-c-captures/collapsed-about-before-390-gear.png) | [Capture](batch-c-captures/collapsed-about-after-390-gear.png) | [Capture](batch-c-captures/collapsed-about-before-320-gear.png) | [Capture](batch-c-captures/collapsed-about-after-320-gear.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-played / played | [Capture](batch-c-captures/collapsed-played-before-390-played.png) | [Capture](batch-c-captures/collapsed-played-after-390-played.png) | [Capture](batch-c-captures/collapsed-played-before-320-played.png) | [Capture](batch-c-captures/collapsed-played-after-320-played.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.62)` → `rgb(248, 250, 252)` |

Context captures: `collapsed-about-{before,after}-{390,320}.png`; `collapsed-likes-{before,after}-{390,320}.png`; `collapsed-played-{before,after}-{390,320}.png`; `collapsed-scorecard-{before,after}-{390,320}.png`.

**76 captures; 60 label measurements.** No target-label, page/root or body viewport overflow at 320 or 390. All requested groups rendered; no component is not capturable. No new label wraps or three-line titles; fixture checks are not live authenticated flow or physical-device proof. Production/test files unchanged; no shard rerun for captures only (accepted 10,435/10,435 across 900 files, population delta 0/0).


### Batch C capture list — Collapsed defaults / group D2

Before: **3afd2ca7cf** (pre-change audit commit); after: **0556e2fd55** accepted ink defaults. Chromium fixture-only captures of real components with MemoryRouter/QueryClient providers and seeded fictional identity/data, no real account or service writes. The before pass redirects the changed modules/CSS to disposable collocated copies from that commit; the after pass imports the unchanged accepted source.

Three outside-batch caller surfaces: actual **PostingAsMenu → AccountGlance Invite friends → InviteSheetProvider → InviteFriendsSheet → ConnectedInviteState**; post composer **GolfPostSections/ShotTagSheet → ShotTagChoices**; actual **ComposerFlowSheet Review search → ReviewCourseSearchSheet**. The account menu closes before the invitation opens through its unchanged callback. Neither the Share/Invite writes nor composer publication is invoked.

| Surface / label | Before 390 | After 390 | Before 320 | After 320 | Lines 390 / 320 | Colour before → after |
|---|---|---|---|---|---|---|
| collapsed-invite / club | [Capture](batch-c-captures/collapsed-invite-before-390-club.png) | [Capture](batch-c-captures/collapsed-invite-after-390-club.png) | [Capture](batch-c-captures/collapsed-invite-before-320-club.png) | [Capture](batch-c-captures/collapsed-invite-after-320-club.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-invite / playing | [Capture](batch-c-captures/collapsed-invite-before-390-playing.png) | [Capture](batch-c-captures/collapsed-invite-after-390-playing.png) | [Capture](batch-c-captures/collapsed-invite-before-320-playing.png) | [Capture](batch-c-captures/collapsed-invite-after-320-playing.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-invite / invited | [Capture](batch-c-captures/collapsed-invite-before-390-invited.png) | [Capture](batch-c-captures/collapsed-invite-after-390-invited.png) | [Capture](batch-c-captures/collapsed-invite-before-320-invited.png) | [Capture](batch-c-captures/collapsed-invite-after-320-invited.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-tagger / holes | [Capture](batch-c-captures/collapsed-tagger-before-390-holes.png) | [Capture](batch-c-captures/collapsed-tagger-after-390-holes.png) | [Capture](batch-c-captures/collapsed-tagger-before-320-holes.png) | [Capture](batch-c-captures/collapsed-tagger-after-320-holes.png) | 390: 1 → 1; 320: 1 → 1 | `rgb(248, 250, 252)` → `rgb(248, 250, 252)` (**no visible change**) |
| collapsed-tagger / around | [Capture](batch-c-captures/collapsed-tagger-before-390-around.png) | [Capture](batch-c-captures/collapsed-tagger-after-390-around.png) | [Capture](batch-c-captures/collapsed-tagger-before-320-around.png) | [Capture](batch-c-captures/collapsed-tagger-after-320-around.png) | 390: 1 → 1; 320: 1 → 1 | `rgb(248, 250, 252)` → `rgb(248, 250, 252)` (**no visible change**) |
| collapsed-search / recent | [Capture](batch-c-captures/collapsed-search-before-390-recent.png) | [Capture](batch-c-captures/collapsed-search-after-390-recent.png) | [Capture](batch-c-captures/collapsed-search-before-320-recent.png) | [Capture](batch-c-captures/collapsed-search-after-320-recent.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-search / threshold | [Capture](batch-c-captures/collapsed-search-before-390-threshold.png) | [Capture](batch-c-captures/collapsed-search-after-390-threshold.png) | [Capture](batch-c-captures/collapsed-search-before-320-threshold.png) | [Capture](batch-c-captures/collapsed-search-after-320-threshold.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |
| collapsed-search / popular | [Capture](batch-c-captures/collapsed-search-before-390-popular.png) | [Capture](batch-c-captures/collapsed-search-after-390-popular.png) | [Capture](batch-c-captures/collapsed-search-before-320-popular.png) | [Capture](batch-c-captures/collapsed-search-after-320-popular.png) | 390: 1 → 1; 320: 1 → 1 | `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)` |

Context captures: `collapsed-invite-{before,after}-{390,320}.png`; `collapsed-search-{before,after}-{390,320}.png`; `collapsed-tagger-{before,after}-{390,320}.png`.

**44 captures; 32 label measurements.** No target-label, page/root or body viewport overflow at 320 or 390. All requested groups rendered; no component is not capturable. No new label wraps or three-line titles; fixture checks are not live authenticated flow or physical-device proof. Production/test files unchanged; no shard rerun for captures only (accepted 10,435/10,435 across 900 files, population delta 0/0).


#### Collapsed-default cascade and containment findings

- **Post composer ShotTagChoices: no visible change.** Both real ShotTagSheet group heads already compute to `rgb(248, 250, 252)` before, because the composer's existing styles override the default media-label treatment. The before module comes from 3afd2ca7cf and has no inline ink default; it is not an after module relabelled as before. Both 390/320 pairs are recorded unchanged, rather than manufacturing grey.
- **ComposerFlowSheet search:** its three heads genuinely change `rgba(248, 250, 252, 0.42)` → `rgb(248, 250, 252)`. This is outside the review receipt, so the receipt cascade does not apply here.
- **Receipt search (existing batch B evidence): no visible change.** The accepted receipt captures already demonstrate `.review-receipt h2` supplying ink before the opt-in/default changes. That earlier finding remains valid; this capture-only request does not replace it with a false colour-change claim.
- **320 containment:** all 43 changed-label/context rows fit within the viewport in both states, with no target text, root or body horizontal overflow. All target labels are one line at both widths. The actual post tag-sheet title “What's in this shot?” wraps to two lines at 320 before and after; unchanged. Tall scorecards/About sheets retain existing internal vertical scrolling and footer clipping at the viewport limit; lower labels were scrolled into view for their individual real-element crops. No geometry/style fix was made.
- All components rendered with the real providers and seeded cache/read adapters; **no “not capturable” fallback or label-only reconstruction was needed**. Element crops show real mounted labels, not manually copied styles/text. The outside-batch Clubhouse, account-menu and composer callbacks were exercised to open their actual shared children. This is fixture presentation evidence, not a hosted signed-in account, physical iPhone or write-flow check.

### Batch C capture-only close-out

**224 accepted screenshots, 172 label measurements, 43 label/context rows:** C1 44 screenshots / 32 measurements; C2 60 / 48; collapsed D1 76 / 60; collapsed D2 44 / 32. Explore groups are three surfaces each; collapsed defaults are split into four and three surfaces, so no group exceeds six. Before is **3afd2ca7cf** everywhere; after is the accepted **0556e2fd55** source.

Group commits: C1 **a212757d50**; C2 **8362dd26bc**; collapsed D1 **d42857b2cd**; collapsed D2/cleanup committed after the final removal/check. Each group's full label table and measurements are above/in this directory.

No production or test change is retained. No SQL, migration, feed_config access or pool-cap change. No shard rerun for captures only: accepted **10,435/10,435 across 900 files**, suite before/after **10,435/900 → 10,435/900**, delta **0/0**; no tests added, deleted, edited, renamed or rewritten.

Disposable fixture startup and chapter-seed issues were repaired in the apparatus only. The temporary page, 38 pre-change modules, 22 original read-forwarding copies, 22 adapter modules and the seed/entry pair (84 source files in total), plus rejected fixture-error screenshots, are removed in the final cleanup; raw browser scripts/logs are outside the repository and removed after recording the accepted audit evidence. Temporary copies briefly included in the D1 checkpoint are explicitly removed by the close-out commit; they are not production changes.


## Batch D — Clubhouse, Profile and Handicap, round, Messages, Activity

### Step 1 — complete source-traced audit, before changes

**Request baseline:** `7c86830e3b`; accepted suite **10,435 tests / 900 files**. No production or test changes in this audit checkpoint. Capture before-source will be this step’s audit commit. Audit narratives/census live in this directory, never in disposable browser apparatus.

Scope: `/` mounted through App.tsx:235/268 → ClubhouseWrapped re-export → Clubhouse; `/profile` and `/profile/:username` through ProfileWrapped/ProfilePageV2 (all available tabs including Handicap, creators, pros, ranking and achievements); followers/following App.tsx:751–753 through ProfileSocialListRoute; both rivalry redirects App.tsx:632/634 → profile Handicap compare; `/round/:whsScoreId` App.tsx:717/864 → RoundPage; `/messages` and `/messages/:conversationId` App.tsx:737/738 through MessagingShell; `/notificationmessages` App.tsx:744 → ActivityPageV2. Opened sheets, global overlays, account/search and composer auxiliaries are included. Navigation to an unlisted route is a scope exit; global shared defaults’ outside-D reach is nevertheless enumerated below.

Source rendering, conditions, providers, import/caller chains and CSS inheritance—not a pattern scan alone—establish selection. The supplementary `batch-d-import-inventory.json` is explicitly syntactic discovery only, not proof that every imported module renders. The authoritative unified per-label census is `batch-d-labels.json`. Completed supporting narratives: `batch-d-messaging-activity-audit.md`, `batch-d-clubhouse-round-audit.md`, `batch-d-chrome-audit.md` (its final correction withdraws the initial desktop false positives), and `batch-d-audit-notes.md`.

### Full label table

Each row is one source literal/key/conditional render variant; repeated items do not multiply rows. A generated weekday/month expression is one row with its full output range, while distinct copy-key/branch variants are expanded. Existing A–C components keep their recorded roles in the reference ledger after this table. Only E1/E2 rows are planned for ink; all K/D rows stay unchanged.


#### Clubhouse/round/composer

| File:line | Text/key | Route / runtime parent | Role | Old → planned colour / keep |
|---|---|---|---|---|
| src/components/feed/ScorePostBody.tsx:74; style:64 | amateur.stream.stat.net — NET | H → score figure | K2 | keep A.DIM; .12em |
| src/components/feed/ScorePostBody.tsx:82; style:64 | amateur.stream.stat.gross — GROSS (main) | H → score figure | K2 | keep A.DIM; .12em |
| src/components/feed/ScorePostBody.tsx:93; style:64 | amateur.stream.stat.gross — GROSS (secondary) | H → score figure | K2 | keep A.DIM; .12em |
| src/components/feed/ScorePostBody.tsx:99; style:64 | amateur.stream.stat.handicap — HANDICAP | H → handicap figure | K2 | keep A.DIM; .12em |
| src/components/feed/ScorePostBody.tsx:110; style:64 | amateur.stream.stat.awards — AWARDS | H → award count | K2 | keep A.DIM; .12em |
| src/components/feed/roundTilePlot.tsx:345–346 | OUT | F/H → 18-hole plot footer | K3 | keep T40; .14em |
| src/components/feed/roundTilePlot.tsx:345–346 | IN | F/H → 18-hole plot footer | K3 | keep T40; .14em |
| src/components/feed/FeedCommentPreview.tsx:181–203 | See all {total} comments | F → comment-preview action | K4 | keep MID #A7AAAE; .19em |
| src/components/feed/PostGolfContext.tsx:105 | facts.kicker | F/V → expanded on-media HoleCard | K6 | keep rgba(248,250,252,.62); .16em |
| src/components/feed/PostGolfContext.tsx:112; feed-media-chrome.css:5 | STROKE INDEX | F/V → HoleCard statistic | K2 | keep rgba(248,250,252,.62); .1em |
| src/components/feed/PostGolfContext.tsx:112; feed-media-chrome.css:5 | FIELD LOSES | F/V → HoleCard statistic | K2 | keep rgba(248,250,252,.62); .1em |
| src/components/feed/PostGolfContext.tsx:192–193 | ROUND | F/V → attached-round opening row | K4 | keep rgba(248,250,252,.42); .14em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:14; composerGolf.css:3 | ON THE COURSE | P → StageComposer:1182 → course form block | K5 | keep --pf-dim; .18em |
| src/features/post-v2/components/golf/GolfPostSections.tsx:192; composerGolf.css:3 | PLAYED WITH | P → StageComposer:1197 → editable people field | K5 | keep --pf-dim; .18em |
| src/features/post-v2/components/golf/GolfPostSections.tsx:199; composerGolf.css:66 | IN CAPTION | P → tagged-person state | K4 | keep rgba(248,250,252,.42); .08em |
| src/features/post-v2/StageComposer.tsx:1209; composerGolf.css:3 | SHARING | P → sharing settings form block | K5 | keep --pf-dim; .18em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:40,44; composerGolf.css:102 | THIS WEEK | PR → chronological round-list group | E2 | rgba(248,250,252,.42) → --pf-ink (#F8FAFC); .16em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:40,44; composerGolf.css:102 | EARLIER | PR → chronological round-list group | E2 | rgba(248,250,252,.42) → --pf-ink (#F8FAFC); .16em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:45; composerGolf.css:106 | Localised short weekday, MON–SUN | PR → round date cell | K3 | keep rgba(248,250,252,.42); .1em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:45; composerGolf.css:106 | Localised short month, JAN–DEC | PR → round date cell | K3 | keep rgba(248,250,252,.42); .1em |
| src/features/post-v2/components/video/VideoComposerFields.tsx:40; videoCreator.css:3 | TITLE | PV → title form label | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoComposerFields.tsx:40; videoCreator.css:10 | LONG FORM | PV → video type qualifier | K4 | keep --video-dim; .12em |
| src/features/post-v2/components/video/VideoComposerFields.tsx:40; videoCreator.css:10 | SHORT | PV → alternate video type qualifier | K4 | keep --video-dim; .12em |
| src/features/post-v2/components/video/VideoComposerFields.tsx:67; videoCreator.css:3 | VIDEO | PV → cover/chapters form field | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:22; videoCreator.css:3 | DESCRIPTION | PV → description form label | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:17,26; videoCreator.css:3 | CREDITS | PV → editable collection | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:17,26; videoCreator.css:3 | LINKS | PV → editable collection | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:17,26; videoCreator.css:3 | THANKS TO | PV → editable collection | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:17,26; videoCreator.css:3 | GEAR IN THIS VIDEO | PV → editable collection | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsSheets.tsx:52; videoCreator.css:3 | THEIR ROLE | PV → credit editor | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/CourseTagSheet.tsx:44,50; src/styles/post-flow.css:12 | postFlow.yourClub — YOUR CLUB | PC → course-list group | E2 | --pf-dim → --pf-ink, first span only; .16em |
| src/features/post-v2/components/CourseTagSheet.tsx:44,50; src/styles/post-flow.css:12 | postFlow.yourCourses — YOUR COURSES | PC → course-list group | E2 | --pf-dim → --pf-ink, first span only; .16em |
| src/features/post-v2/components/CourseTagSheet.tsx:44,50; src/styles/post-flow.css:12 | postFlow.popular — POPULAR ON clbhouz | PC → course-list group | E2 | --pf-dim → --pf-ink, first span only; .16em; source brand unchanged |
| src/features/post-v2/components/CourseTagSheet.tsx:51; src/styles/post-flow.css:12 | postFlow.results — RESULTS | PC → searched course-list group | E2 | --pf-dim → --pf-ink, first span only; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:25; src/styles/post-flow.css:34 | postFlow.bestTime — BEST TIME | PS → earned best-time chart group | E2 | --pf-dim → --pf-ink, first span only; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:25; src/styles/post-flow.css:34 | postFlow.last30Days — LAST 30 DAYS | PS → chart sampling-period meta | K3 | keep --pf-dim; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:32; src/styles/post-flow.css:46 | postFlow.date — DATE | PS → date input group | K5 | keep --pf-dim; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:33; src/styles/post-flow.css:46 | postFlow.time — TIME | PS → time input group | K5 | keep --pf-dim; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:32; src/styles/post-flow.css:48,51 | postFlow.today — TODAY | PS → day selection control | K4 | keep --pf-dim / selected --pf-on-dim; .1em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:32; src/styles/post-flow.css:48,51 | format(d, EEE), MON–SUN | PS → other day selection controls | K4 | keep --pf-dim / selected --pf-on-dim; .1em |
| src/features/post-v2/components/PostSuccessV2.tsx:77; src/styles/post-flow.css:73 | composer:postFlow.tapElsewhere — TAP ANYWHERE ELSE TO CLOSE | PX → posted-card success | K6 | keep --pf-dim; .16em |
| src/features/post-v2/components/ImmersiveSuccessShell.tsx:97–115 | TAP ANYWHERE TO CLOSE | PX → successful no-card fallback | K6 | keep rgba(255,255,255,.4); .14em |
| src/features/post-v2/components/golf/GolfPostSections.tsx:114 | WHERE | Imported WhereSection has no production JSX caller; Stage mounts ComposerCourseBlock:1182 | D | keep GP.dim; .14em |
| src/features/post-v2/components/golf/GolfPostSections.tsx:132 | WHERE (alternate) | Same uncalled component | D | keep GP.dim; .14em |
| src/components/clubhouse/FriendsEmptyState.tsx:521–537 | FOLLOWING | Friends-only ClubhouseEmptyState branch; Clubhouse fixed FEED_TAB=foryou:114 | D | keep INK_FAINT rgba(255,255,255,.40); .10em |

#### Messages/Activity

| File:line | Text/key | Route / runtime parent | Role | Old → planned colour / keep |
|---|---|---|---|---|
| src/pages/messaging-v2/InboxV2Page.tsx:390–391 | messaging:banner.businessTitle — BUSINESS MESSAGING | M → business banner | E1 | #6C7885 → A.INK (#F8FAFC), explicit ruling |
| src/pages/messaging-v2/NewConversationSheet.tsx:560–561 | compose.playedWith — PLAYED WITH | M → compose → played-with list | E2 | #6C7885 → A.INK (#F8FAFC), explicit ruling |
| src/pages/messaging-v2/ConversationSettingsSheet.tsx:589–590 | messaging:list.members — MEMBERS | T → details → group-member list | E2 | #6C7885 → A.INK (#F8FAFC), explicit ruling |
| src/pages/messaging-v2/PlayingOffRail.tsx:124–125 | playingOff.eyebrow — PLAYING OFF | T → member handicap tiles | E2 | #6C7885 → A.INK (#F8FAFC), explicit ruling |
| src/pages/messaging-v2/HeadToHeadCard.tsx:64; LABEL:27–33 | h2h.labelPoints — HEAD TO HEAD · POINTS | T → direct-thread context → points figure | K2 | keep rgba(248,250,252,.42) |
| src/pages/messaging-v2/HeadToHeadCard.tsx:81; LABEL:27–33 | h2h.labelGross — GROSS | T → direct-thread context → gross figure | K2 | keep rgba(248,250,252,.42) |
| src/pages/messaging-v2/ShareCards.tsx:70–80 | share.roundLabel — ROUND | T → MessageBubble → RoundShareCardView | K3 | keep local DIM (.42) |
| src/features/activity-v2/ActivityPageV2.tsx:121–146,485 | NEW | A → renderBucket → SectionHeader | E2 | ACT.INK_45 (A.MUTE) → ACT.INK (A.INK) |
| src/features/activity-v2/ActivityPageV2.tsx:121–146,485 | TODAY | A → renderBucket → SectionHeader | E2 | ACT.INK_45 → ACT.INK |
| src/features/activity-v2/ActivityPageV2.tsx:121–146,485 | YESTERDAY | A → renderBucket → SectionHeader | E2 | ACT.INK_45 → ACT.INK |
| src/features/activity-v2/ActivityPageV2.tsx:121–146,485 | THIS WEEK | A → renderBucket → SectionHeader | E2 | ACT.INK_45 → ACT.INK |
| src/features/activity-v2/ActivityPageV2.tsx:121–146,485 | EARLIER | A → renderBucket → SectionHeader | E2 | ACT.INK_45 → ACT.INK |
| src/features/activity-v2/ActivityPageV2.tsx:473–475,485; style:121–135 | TODAY · {n} GOLFERS POSTED ROUNDS | A → All/Friends → expanded Today fold | E2 | ACT.INK_45 → ACT.INK; suffix in same node |
| src/features/activity-v2/ActivityPageV2.tsx:473–475,485; style:121–135 | YESTERDAY · {n} GOLFERS POSTED ROUNDS | A → All/Friends → expanded Yesterday fold | E2 | ACT.INK_45 → ACT.INK; suffix in same node |
| src/features/activity-v2/ActivityPageV2.tsx:473–475,485; style:121–135 | THIS WEEK · {n} GOLFERS POSTED ROUNDS | A → All/Friends → expanded This week fold | E2 | ACT.INK_45 → ACT.INK; suffix in same node |
| src/features/activity-v2/ActivityPageV2.tsx:473–475,485; style:121–135 | EARLIER · {n} GOLFERS POSTED ROUNDS | A → All/Friends → expanded Earlier fold | E2 | ACT.INK_45 → ACT.INK; suffix in same node |
| src/features/activity-v2/components/FriendRequestsRail.tsx:174–186 | FRIEND REQUESTS · {n} | A → populated friend-request rail | E2 | ACT.INK_45 → ACT.INK; same-node count |
| src/features/activity-v2/components/FeaturedMomentCard.tsx:88–100 | WHILE YOU WERE AWAY | A → qualifying featured moment | E1 | rgba(248,250,252,.62) → A.INK |
| src/features/activity-v2/components/ActivityActionsSheet.tsx:162–173 | NOTIFICATION OPTIONS | A → LedgerRow long-press → options | E2 | ACT.INK_45 → ACT.INK |
| src/features/activity-v2/components/FriendRequestsRail.tsx:126–145 | DECLINE | A → decline control | K4 | keep INK_60 rgba(248,250,252,.60) |
| src/features/activity-v2/components/FeaturedMomentCard.tsx:64,134–140 | YOUR CLIP IS TRENDING | A → video-target celebration | K6 | keep rgba(255,255,255,.72) |
| src/features/activity-v2/components/FeaturedMomentCard.tsx:64,134–140 | YOUR POST IS TRENDING | A → post-target celebration | K6 | keep rgba(255,255,255,.72) |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:62–68 | suggestedGolfers.heading — GOLFERS TO FOLLOW | A → first non-empty bucket → suggested golfers | E1 | A.DIM → A.INK |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:78–86 | suggestedGolfers.seeAll — SEE ALL | A → suggested-golfers navigation control | K4 | keep rgba(248,250,252,.62) |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.club — MEMBER AT {club} | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.playedWith — {course}, {date} | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.playedWithCourse — {course} | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.playedWithDate — {date} | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.playedWithFallback — PLAYED WITH YOU | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.reciprocal — FOLLOWS YOU | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.course — PLAYS {course} | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.clubmateMutual — FOLLOWED BY {count} FROM {club} | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.mutual — FOLLOWED BY {count} YOU FOLLOW | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.popular — POPULAR ON clbhouz | A → suggestion-row context | K3 | keep A.DIM; catalogue brand lowercase |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.active — {count} ROUNDS IN THE LAST TWO WEEKS | A → suggestion-row context | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:152–166 | findPeople.reason.recentlyJoined — NEW TO clbhouz | A → suggestion-row context | K3 | keep A.DIM; catalogue brand lowercase |
| src/features/social-suggestions/NobodySawThatRound.tsx:111–113,131–137 | {course_name} · {gross_score} | A → after-round prompt; score present | K3 | keep A.DIM |
| src/features/social-suggestions/NobodySawThatRound.tsx:111–113,131–137 | {course_name} | A → after-round prompt; score absent/falsy | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolferRow.tsx:120–129; copy:24–43 | suggestedGolfers.reason.course — YOU HAVE BOTH PLAYED {course}. | A → after-round prompt → golfer row | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolferRow.tsx:120–129; copy:24–43 | suggestedGolfers.reason.clubmate_mutual — FOLLOWED BY GOLFERS AT {club}. | A → after-round prompt → golfer row | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolferRow.tsx:120–129; copy:24–43 | suggestedGolfers.reason.mutual — FOLLOWED BY {count} GOLFERS YOU FOLLOW. | A → after-round prompt → golfer row | K3 | keep A.DIM |
| src/features/social-suggestions/SuggestedGolferRow.tsx:120–129; copy:24–43 | suggestedGolfers.reason.recently_joined — NEW TO clbhouz. | A → after-round prompt → golfer row | K3 | keep A.DIM; catalogue brand lowercase |
| src/features/social-suggestions/SuggestedGolferRow.tsx:120–129; copy:24–43 | suggestedGolfers.reason.active — {count} ROUNDS IN THE LAST FORTNIGHT. | A → after-round prompt → golfer row | K3 | keep A.DIM |

#### Global chrome/search/account

| File:line | Text/key | Route / runtime parent | Role | Old → planned colour / keep |
|---|---|---|---|---|
| src/features/chrome-v2/ChromeIsland.tsx:405 | HANDICAP | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → disconnected control | K4 | keep rgba(248,250,252,.42); .12em |
| src/features/chrome-v2/ChromeIsland.tsx:415 | INDEX | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → linked/nonconnected Manage | K2 | keep resolved-dark rgba(248,250,252,.42); .12em |
| src/features/chrome-v2/ChromeIsland.tsx:470–479 | INDEX | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → connected control | K2 | keep resolved-dark rgba(248,250,252,.42); .12em |
| src/features/chrome-v2/IndexGlance.tsx:125–136 (colour132) | YOUR HANDICAP INDEX | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → IndexGlance | E1 | local DIM → local INK (#F8FAFC); .14em |
| src/features/chrome-v2/IndexGlance.tsx:110–113,167–178 | LOW INDEX | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → IndexGlance statistics | K2 | keep DIM; .14em |
| src/features/chrome-v2/IndexGlance.tsx:110–113,167–178 | LAST ROUND | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → IndexGlance statistics | K2 | keep DIM; .14em |
| src/features/chrome-v2/IndexGlance.tsx:110–113,167–178 | VS PAR | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → IndexGlance statistics | K2 | keep DIM; .14em |
| src/components/handicap/IndexWindowChart.tsx:112–114 | common:handicap.chart.low — LOW {value} | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → IndexGlance chart | K3 | keep rgba(248,250,252,.42); .16em |
| src/components/handicap/IndexWindowChart.tsx:116–117 | common:handicap.chart.ago — {window} AGO | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → IndexGlance chart | K3 | keep rgba(248,250,252,.30); .16em |
| src/components/handicap/IndexWindowChart.tsx:116,118 | common:handicap.chart.today — TODAY | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → IndexGlance chart | K3 | keep rgba(248,250,252,.30); .16em |
| src/features/chrome-v2/ConnectGlance.tsx:40–42; index-glance.css:20 | LOW INDEX | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → ConnectGlance example statistics | K2 | keep --glance-dim; .14em |
| src/features/chrome-v2/ConnectGlance.tsx:40–42; index-glance.css:20 | LAST ROUND | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → ConnectGlance example statistics | K2 | keep --glance-dim; .14em |
| src/features/chrome-v2/ConnectGlance.tsx:40–42; index-glance.css:20 | VS PAR | /, /profile, /profile/:username, /notificationmessages → GlobalHeader → ChromeIsland → HcpCell → ConnectGlance example statistics | K2 | keep --glance-dim; .14em |
| src/features/composer-flow/ComposerFlowSheet.tsx:90; post-or-review.css:27 | composerFlow:or — OR | Scoped route → global compose entry separator | K3 | keep --post-review-dim; .16em |

#### Profile/Handicap/social lists

| File:line | Text/key | Route / runtime parent | Role | Old → planned colour / keep |
|---|---|---|---|---|
| src/components/profile/courses/AddCourseModal.tsx:336 | topTen.sheet.kicker — COURSES | /profile, /profile/:username → Top 10 → AddCourseModal; also /edit-profile Golf | E2 | A.MUTE → A.INK |
| src/components/profile/courses/AddCourseModal.tsx:445,498 | topTen.sheet.played — COURSES YOU HAVE PLAYED | /profile, /profile/:username → Top 10 → AddCourseModal; also /edit-profile Golf | E2 | A.DIM → A.INK |
| src/components/profile/courses/AddCourseModal.tsx:445,504 | topTen.sheet.results — COURSES | /profile, /profile/:username → Top 10 → AddCourseModal; also /edit-profile Golf | E2 | A.DIM → A.INK |
| src/components/profile/courses/AddCourseModal.tsx:90,141 | topTen.golfers — GOLFERS | /profile, /profile/:username → Top 10 → AddCourseModal; also /edit-profile Golf | K2 | keep A.DIM |
| src/components/profile/courses/AddCourseModal.tsx:90,142 | topTen.you — YOU | /profile, /profile/:username → Top 10 → AddCourseModal; also /edit-profile Golf | K2 | keep A.DIM |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:155,176 | toReview.railCourses — COURSES | /profile, /profile/:username → Courses → AllCoursesList | K2 | keep A.DIM |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:156,176 | toReview.railYears — YEARS | /profile, /profile/:username → Courses → AllCoursesList | K2 | keep A.DIM |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:102,255–259 | toReview.bandThisYear — THIS YEAR | /profile, /profile/:username → Courses → AllCoursesList | E2 | A.DIM → A.INK; label only, count kept |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:104,255–259 | toReview.bandLastYear — LAST YEAR | /profile, /profile/:username → Courses → AllCoursesList | E2 | A.DIM → A.INK; label only, count kept |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:105,255–259 | toReview.bandEarlier — EARLIER | /profile, /profile/:username → Courses → AllCoursesList | E2 | A.DIM → A.INK; label only, count kept |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:267–271 | {courses.length} | /profile, /profile/:username → Courses → AllCoursesList | K3 | keep A.DIM |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:357–376 | PLAYED {dateText} | /profile, /profile/:username → Courses → AllCoursesList | K3 | keep A.MUTE |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:357–376 | ADDED {dateText} | /profile, /profile/:username → Courses → AllCoursesList | K3 | keep A.MUTE |
| src/components/profile/courses/my-ratings/MyRatingsTierDivider.tsx:60–67; AllCoursesList:555–560,590–595 | NOT YET RATED | /profile, /profile/:username → Courses → AllCoursesList | E2 | A.MUTE → A.INK; semantic exceptional tier kept |
| src/components/profile/courses/my-ratings/MyRatingsTierDivider.tsx:60–67; AllCoursesList:555–560,590–595 | EXCELLENT AND BELOW | /profile, /profile/:username → Courses → AllCoursesList | E2 | A.MUTE → A.INK; semantic exceptional tier kept |
| src/components/profile/courses/my-ratings/MyRatingsTierDivider.tsx:75–80 | {count} | /profile, /profile/:username → Courses → AllCoursesList | K3 | keep A.MUTE |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:120,440 | streaks.sectionRunning — RUNNING NOW | Own /profile → StreaksSheetMount → StreaksSheet | E2 | CHART.DIM → CHART.INK on text span only |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:122,440 | {active.length} | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:148,456 | streaks.sectionBroken — BROKEN | Own /profile → StreaksSheetMount → StreaksSheet | K4 | keep CHART.DIM; full-width disclosure control |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:152,456 | {lapsed.length} | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:148,468 | streaks.sectionNotStarted — NOT STARTED | Own /profile → StreaksSheetMount → StreaksSheet | K4 | keep CHART.DIM; full-width disclosure control |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:152,468 | {fresh.length} | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:215–216 | streaks.type.counter.explainer — Consecutive rounds being counted towards your handicap. | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.DIM; explanation/state, not group |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:215–216 | streaks.type.cutting.explainer — Counter rounds that dropped your handicap index. | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.DIM; explanation/state, not group |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:215–216 | streaks.type.sub_80.explainer — Posted scores below 80 in a row. | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.DIM; explanation/state, not group |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:215–216 | streaks.type.no_up.explainer — Counter rounds that did not increase your handicap index. Defensive streak — holding the line. | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.DIM; explanation/state, not group |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:215–216 | streaks.type.sub_par.explainer — Counter rounds with a score below par. The hardest streak in the system. | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.DIM; explanation/state, not group |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:215–216 | streaks.type.birdie_round.explainer — Rounds with at least one birdie. | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.DIM; explanation/state, not group |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:215–216 | streaks.type.round_played.explainer — Weeks where you played at least one round. Pure activity streak — your engagement baseline. | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.DIM; explanation/state, not group |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:192,239 | streaks.unit.rounds_one — ROUND | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.DIM |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:192,239 | streaks.unit.rounds_other — ROUNDS | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.DIM |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:192,239 | streaks.unit.weeks_one — WEEK | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.DIM |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:192,239 | streaks.unit.weeks_other — WEEKS | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.DIM |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:290–291 | streaks.freezeHeld_one — {count} FREEZE HELD | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.MUTE |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:290–291 | streaks.freezeHeld_other — {count} FREEZES HELD | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.MUTE |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:294–298 | streaks.freezeRefill — NEXT REFILL {when} | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.DIM |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:389 | streaks.longestEverLabel — LONGEST EVER | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.DIM |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:401–404 | streaks.unit.rounds_one — ROUND | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.MUTE; longest-record unit |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:401–404 | streaks.unit.rounds_other — ROUNDS | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.MUTE; longest-record unit |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:401–404 | streaks.unit.weeks_one — WEEK | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.MUTE; longest-record unit |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:401–404 | streaks.unit.weeks_other — WEEKS | Own /profile → StreaksSheetMount → StreaksSheet | K2 | keep CHART.MUTE; longest-record unit |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:406 | streaks.type.counter.short — COUNTER ROUNDS | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE; record identity |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:406 | streaks.type.cutting.short — INDEX CUTS | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE; record identity |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:406 | streaks.type.sub_80.short — ROUNDS UNDER 80 | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE; record identity |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:406 | streaks.type.no_up.short — INDEX HOLDS | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE; record identity |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:406 | streaks.type.sub_par.short — SUB-PAR ROUNDS | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE; record identity |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:406 | streaks.type.birdie_round.short — BIRDIE ROUNDS | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE; record identity |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:406 | streaks.type.round_played.short — WEEKS PLAYED | Own /profile → StreaksSheetMount → StreaksSheet | K3 | keep CHART.MUTE; record identity |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:22,200 | YOU V {FIRST} | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | E2 | KICK .50 ink → HH_INK on group declaration only; shared Board KICK kept |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:22,215 | TOGETHER | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | E2 | KICK .50 ink → HH_INK on group declaration only; shared Board KICK kept |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:22,230 | COURSE BY COURSE | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | E2 | KICK .50 ink → HH_INK on group declaration only; shared Board KICK kept |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:92,219 | GROSS | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K2 | keep rgba(248,250,252,.50); scoreboard metric |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:92,220 | STABLEFORD | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K2 | keep rgba(248,250,252,.50); scoreboard metric |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:205 | YOU | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K1 | keep COLH .45 ink |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:205 | {first} | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K1 | keep COLH .45 ink |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:125 | GROSS | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K2 | keep .45 ink |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:126 | PTS | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K2 | keep .45 ink |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:133–136 | YOUR BEST EVER | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K2 | keep .50 ink |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:133–136 | {FIRST}'S BEST EVER | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K2 | keep .50 ink |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:142 | YOU | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K1 | keep .45 ink |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:142 | {first} | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K1 | keep .45 ink |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:194 | SHOTS APART | /profile, /profile/:username and rivalry redirects → CompareSheet → HeadToHeadDetail | K2 | keep .50 ink |
| src/features/pro-profile/ProCollectionSections.tsx:25,27; pro-profile.css:4 | IN THE BAG | /profile, /profile/:username pro body → collections/Ask | E1 | --pro-profile-dim → --pro-profile-ink |
| src/features/pro-profile/ProCollectionSections.tsx:25,28; pro-profile.css:4 | PARTNERS | /profile, /profile/:username pro body → collections/Ask | E1 | --pro-profile-dim → --pro-profile-ink |
| src/features/pro-profile/ProCollectionSections.tsx:29; pro-profile.css:4 | CAREER | /profile, /profile/:username pro body → collections/Ask | E1 | --pro-profile-dim → --pro-profile-ink |
| src/features/pro-profile/ProAskSection.tsx:114; pro-profile.css:4 | ASK {FIRST} | /profile, /profile/:username pro body → collections/Ask | E1 | --pro-profile-dim → --pro-profile-ink |
| src/features/pro-profile/LinkedProSections.tsx:27; pro-profile.css:4 | HOW HE PLAYS | /profile, /profile/:username pro body → collections/Ask | E1 | --pro-profile-dim → --pro-profile-ink |
| src/features/pro-profile/LinkedProSections.tsx:38; pro-profile.css:4 | THIS WEEK | /profile, /profile/:username pro body → collections/Ask | E1 | --pro-profile-dim → --pro-profile-ink |
| src/features/pro-profile/ProSeasonSection.tsx:38; pro-profile.css:4 | {year} SEASON | /profile, /profile/:username pro body → ProSeasonSection | E1 | --pro-profile-dim → --pro-profile-ink |
| src/features/pro-profile/ProSeasonSection.tsx:39; pro-profile.css:37–39 | FORM · LAST 10 | /profile, /profile/:username pro body → ProSeasonSection | E2 | --pro-profile-dim → --pro-profile-ink, first span only; newest first kept |
| src/features/pro-profile/ProCollectionSheets.tsx:21; pro-profile.css:140; ranking-tab.css:49 | IN THE BAG | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-mute / amateur .62 ink → corresponding ink |
| src/features/pro-profile/ProCollectionSheets.tsx:21; pro-profile.css:140; ranking-tab.css:49 | PARTNERS | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-mute / amateur .62 ink → corresponding ink |
| src/features/pro-profile/ProCollectionSheets.tsx:21; pro-profile.css:140; ranking-tab.css:49 | CAREER | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-mute / amateur .62 ink → corresponding ink |
| src/features/pro-profile/ProCollectionSheets.tsx:29; pro-profile.css:142; ranking-tab.css:52 | WHAT IS IT | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSheets.tsx:30; pro-profile.css:142; ranking-tab.css:52 | BRAND | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSheets.tsx:31; pro-profile.css:142; ranking-tab.css:52 | MODEL | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSheets.tsx:31; pro-profile.css:142; ranking-tab.css:52 | DETAIL (OPTIONAL) | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSheets.tsx:36; pro-profile.css:142; ranking-tab.css:52 | SEARCH clbhouz | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSheets.tsx:36; pro-profile.css:142; ranking-tab.css:52 | PARTNER NAME | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSheets.tsx:36; pro-profile.css:142; ranking-tab.css:52 | WEBSITE (OPTIONAL) | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSheets.tsx:41; pro-profile.css:142; ranking-tab.css:52 | YEAR | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSheets.tsx:41; pro-profile.css:142; ranking-tab.css:52 | WHAT HAPPENED | /profile, /profile/:username pro body → collections/Ask | K5 | keep --pro-profile-dim / amateur .42 ink |
| src/features/pro-profile/ProCollectionSections.tsx:27; pro-profile.css:121 | DRIVER | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSections.tsx:27; pro-profile.css:121 | FAIRWAY | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSections.tsx:27; pro-profile.css:121 | HYBRID | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSections.tsx:27; pro-profile.css:121 | IRONS | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSections.tsx:27; pro-profile.css:121 | WEDGES | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSections.tsx:27; pro-profile.css:121 | PUTTER | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSections.tsx:27; pro-profile.css:121 | BALL | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSheets.tsx:22; pro-profile.css:121 | DRIVER | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSheets.tsx:22; pro-profile.css:121 | FAIRWAY | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSheets.tsx:22; pro-profile.css:121 | HYBRID | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSheets.tsx:22; pro-profile.css:121 | IRONS | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSheets.tsx:22; pro-profile.css:121 | WEDGES | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSheets.tsx:22; pro-profile.css:121 | PUTTER | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProCollectionSheets.tsx:22; pro-profile.css:121 | BALL | /profile, /profile/:username pro body → collections/Ask | K3 | keep --pro-profile-dim; bag slot metadata |
| src/features/pro-profile/ProAskSheets.tsx:17,45; pro-profile.css:140 | ASK {FIRST} (explainer) | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-mute → --pro-profile-ink |
| src/features/pro-profile/ProAskSheets.tsx:17,85; pro-profile.css:140 | ASK {FIRST} (ask) | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-mute → --pro-profile-ink |
| src/features/pro-profile/ProAskSheets.tsx:17,135; pro-profile.css:140 | ASK {FIRST} (questions) | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-mute → --pro-profile-ink |
| src/features/pro-profile/ProAskSheets.tsx:17,193; pro-profile.css:140 | ASK {FIRST} (answer editor) | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-mute → --pro-profile-ink |
| src/features/pro-profile/ProAskSheets.tsx:17,226; pro-profile.css:140 | ASK {FIRST} (answers) | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-mute → --pro-profile-ink |
| src/features/pro-profile/ProAskSheets.tsx:53; pro-profile.css:195 | HOW IT LOOKS ON YOUR PROFILE | /profile, /profile/:username pro body → collections/Ask | E2 | --pro-profile-dim → --pro-profile-ink; illustrative answer group |
| src/features/pro-verification/ProfileTourTab.tsx:34; pro-label.css:23 | {year} | /profile, /profile/:username → Tour tab | E2 | --pro-note-muted → --pro-note-ink on year-group label only |
| src/features/pro-verification/ProfileTourTab.tsx:34; pro-label.css:23 | UNDATED | /profile, /profile/:username → Tour tab | E2 | --pro-note-muted → --pro-note-ink on year-group label only |
| src/features/pro-verification/ProfileTourTab.tsx:45; pro-label.css:23 | {PRO_TOUR} · {shownYear} | /profile, /profile/:username → Tour tab | K3 | keep --pro-note-muted; source/period meta |
| src/features/pro-profile/ProSeasonSection.tsx:36,38; pro-profile.css:17 | EVENTS | /profile, /profile/:username pro body → ProSeasonSection | K2 | keep --pro-profile-dim |
| src/features/pro-profile/ProSeasonSection.tsx:36,38; pro-profile.css:17 | CUTS MADE | /profile, /profile/:username pro body → ProSeasonSection | K2 | keep --pro-profile-dim |
| src/features/pro-profile/ProSeasonSection.tsx:36,38; pro-profile.css:17 | BEST | /profile, /profile/:username pro body → ProSeasonSection | K2 | keep --pro-profile-dim |
| src/features/pro-profile/ProSeasonSection.tsx:36,38; pro-profile.css:17 | SCORING | /profile, /profile/:username pro body → ProSeasonSection | K2 | keep --pro-profile-dim |
| src/features/pro-profile/ProSeasonSection.tsx:26; pro-profile.css:13 | FINISH | /profile, /profile/:username pro body → ProSeasonSection | K2 | keep --pro-profile-dim; result metric |
| src/features/pro-profile/ProSeasonSection.tsx:26; pro-profile.css:13 | STROKES | /profile, /profile/:username pro body → ProSeasonSection | K2 | keep --pro-profile-dim; result metric |
| src/features/pro-profile/ProSeasonSection.tsx:26; pro-profile.css:13 | TO PAR | /profile, /profile/:username pro body → ProSeasonSection | K2 | keep --pro-profile-dim; result metric |
| src/features/pro-profile/ProSeasonSection.tsx:26; pro-profile.css:13 | WORLD RANK | /profile, /profile/:username pro body → ProSeasonSection | K2 | keep --pro-profile-dim; result metric |
| src/features/social-lists-v2/SocialListPage.tsx:371,461–462 | EVERYONE | /profile/:username/followers, /following → SocialListPage; also business social lists | E2 | A.BODY → A.INK; sole muted Section consumer; pending amber retained |
| src/components/profile/rounds/ProfileRoundsTab.tsx:156,180 | GROSS | /profile, /profile/:username → Rounds tab | K1 | keep RT.DIM |
| src/components/profile/rounds/ProfileRoundsTab.tsx:156,181 | NET | /profile, /profile/:username → Rounds tab | K1 | keep RT.DIM |
| src/components/profile/rounds/ProfileRoundsTab.tsx:156,182 | VS HCP | /profile, /profile/:username → Rounds tab | K1 | keep RT.DIM |
| src/components/profile/rounds/ProfileRoundsTab.tsx:156,183 | INDEX | /profile, /profile/:username → Rounds tab | K1 | keep RT.DIM |
| src/components/profile/rounds/ProfileRoundsTab.tsx:222 | Round-row date/metadata | /profile, /profile/:username → Rounds tab | K3 | keep RT.DIM |
| src/components/profile/rounds/sections/SeasonSection.tsx:29,69 | ROUNDS ALL TIME | /profile, /profile/:username → Rounds tab | K2 | keep RT.DIM |
| src/components/profile/rounds/sections/SeasonSection.tsx:29,70 | COURSES THIS YEAR | /profile, /profile/:username → Rounds tab | K2 | keep RT.DIM |
| src/components/profile/rounds/sections/SeasonSection.tsx:29,71 | MONTHS PLAYED THIS YEAR | /profile, /profile/:username → Rounds tab | K2 | keep RT.DIM |
| src/components/profile/rounds/sections/CoursesPlayedSection.tsx:87–88 | ROUNDS   AVERAGE | /profile, /profile/:username → Rounds tab | K1 | keep RT.FAINT; metric legend |
| src/components/profile/handicap/whs/sections/HcpSection.tsx:75–84; src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx:117–121 | handicap.roundsThatCount.eyebrow — ROUNDS THAT COUNT | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | E1 | CHART.DIM (.40) → CHART.INK; every live supplied kicker E1 |
| src/components/profile/handicap/whs/sections/HcpSection.tsx:75–84; src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx:164–167 | handicap.mechanism.kicker — THE MECHANISM | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | E1 | CHART.DIM (.40) → CHART.INK; every live supplied kicker E1 |
| src/components/profile/handicap/whs/sections/HcpSection.tsx:75–84; src/components/profile/handicap/whs/sections/HolesSection.tsx:77 | handicap.strokes.kicker — WHERE THE STROKES GO (withheld) | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | E1 | CHART.DIM (.40) → CHART.INK; every live supplied kicker E1 |
| src/components/profile/handicap/whs/sections/HcpSection.tsx:75–84; src/components/profile/handicap/whs/sections/HolesSection.tsx:113–115 | handicap.strokes.kicker — WHERE THE STROKES GO (populated) | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | E1 | CHART.DIM (.40) → CHART.INK; every live supplied kicker E1 |
| src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx:206–207 | handicap.mechanism.detail.gross — GROSS | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx:206–207 | handicap.mechanism.detail.net — NET | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx:206–207 | handicap.mechanism.detail.diff — DIFF | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/charts/LastTwentyBars.tsx:121–123; RoundsThatCountSection:223 | handicap.mechanism.oldest — OLDEST · {date} | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K3 | keep LABEL_STYLE grey; chart axis |
| src/components/profile/handicap/whs/charts/LastTwentyBars.tsx:121–124; RoundsThatCountSection:224 | handicap.mechanism.newest — NEWEST · {date} | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K3 | keep LABEL_STYLE grey; chart axis |
| src/components/profile/handicap/whs/sections/HolesSection.tsx:105,191–196 | handicap.holes.birdiePlus — BIRDIE+ | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/HolesSection.tsx:106,191–196 | handicap.holes.par — PAR | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/HolesSection.tsx:107,191–196 | handicap.holes.bogey — BOGEY | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/HolesSection.tsx:108,191–196 | handicap.holes.doublePlus — DOUBLE+ | Own /profile Handicap → WhsHandicapTab → HandicapDashboard | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:122 | PARTNERSHIP AGREED | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | E2 | connect grey → connect INK (#F8FAFC), label only; shared state/count/control tokens kept |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:135 | NOT YET OPEN | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | E2 | connect grey → connect INK (#F8FAFC), label only; shared state/count/control tokens kept |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:150 | OPEN NOW | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | E2 | connect grey → connect INK (#F8FAFC), label only; shared state/count/control tokens kept |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:175–176 | ENGLAND GOLF / IPLAY / IGOLF | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K3 | keep connect MUTE/DIM; federation or count metadata |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:188 | EVERYWHERE ELSE | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | E2 | connect grey → connect INK (#F8FAFC), label only; shared state/count/control tokens kept |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:189 | {notYet.length} COUNTRIES | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K3 | keep connect MUTE/DIM; federation or count metadata |
| src/components/profile/handicap/whs/connect/WaitlistToggle.tsx:15–16 | COUNT ME IN › | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K4 | keep .42 ink; waitlist control |
| src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:207 | whsConnect.done.indexLabel — HANDICAP INDEX | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K6 | keep connect DIM; completion/celebration label |
| src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:228 | whsConnect.done.span — 12 MONTHS | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K6 | keep connect DIM; completion/celebration label |
| src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:233–234 | whsConnect.done.coursesSince — {courses} COURSES - SINCE {year} | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K6 | keep connect DIM; completion/celebration label |
| src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:242 | whsConnect.done.shotsLabel — WHERE YOUR SHOTS GO (rings ready) | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K6 | keep connect DIM; completion/celebration label |
| src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:264 | whsConnect.done.shotsLabel — WHERE YOUR SHOTS GO (landing) | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K6 | keep connect DIM; completion/celebration label |
| src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:287 | whsConnect.done.damagingLabel — YOUR MOST DAMAGING HOLES | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K6 | keep connect DIM; completion/celebration label |
| src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:288 | whsConnect.done.damagingAside — VS FIELD | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K6 | keep connect DIM; completion/celebration label |
| src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:334 | PAR {h.par} | Own /profile Handicap → disconnected latch → connection arrives without unmount → WhsConnectScreen; also /manage/handicap flow | K6 | keep connect DIM; completion/celebration label |
| src/components/profile/handicap/whs/sections/recently-played/RecentlyPlayedFeed.tsx:84 | handicap.friendsRounds.kicker — FRIENDS’ ROUNDS | No production mounting caller | D | keep CHART.DIM through HcpSection |
| src/components/profile/handicap/whs/charts/LastTwentyBars.tsx:122 | OLDEST (default) | Mechanism sole caller overrides date labels; no eight/next props | D | keep LABEL_STYLE/A.DIM; default/next branch not rendered |
| src/components/profile/handicap/whs/charts/LastTwentyBars.tsx:123 | NEWEST (default) | Mechanism sole caller overrides date labels; no eight/next props | D | keep LABEL_STYLE/A.DIM; default/next branch not rendered |
| src/components/profile/handicap/whs/charts/LastTwentyBars.tsx:143 | {nextLabel} | Mechanism sole caller overrides date labels; no eight/next props | D | keep LABEL_STYLE/A.DIM; default/next branch not rendered |
| src/components/profile/handicap/whs/charts/IndexChart.tsx:326 | First formatted date | Old WHS IndexChart not mounted; profile hero wraps shared IndexWindowChart instead | D | keep LABEL_STYLE grey |
| src/components/profile/handicap/whs/charts/IndexChart.tsx:327 | Last formatted date | Old WHS IndexChart not mounted; profile hero wraps shared IndexWindowChart instead | D | keep LABEL_STYLE grey |
| src/components/profile/handicap/whs/charts/IndexChart.tsx:333 | OFF BEST | Old WHS IndexChart not mounted; profile hero wraps shared IndexWindowChart instead | D | keep LABEL_STYLE grey |
| src/components/profile/handicap/whs/charts/IndexChart.tsx:334 | MID | Old WHS IndexChart not mounted; profile hero wraps shared IndexWindowChart instead | D | keep LABEL_STYLE grey |
| src/components/profile/handicap/whs/charts/IndexChart.tsx:335 | NEAR BEST | Old WHS IndexChart not mounted; profile hero wraps shared IndexWindowChart instead | D | keep LABEL_STYLE grey |
| src/components/profile/handicap/whs/charts/IndexChart.tsx:368 | HIGHEST {value} | Old WHS IndexChart not mounted; profile hero wraps shared IndexWindowChart instead | D | keep LABEL_STYLE grey |
| src/components/profile/handicap/whs/charts/MiniRing.tsx:91 | {label} | No production JSX caller | D | keep CHART.MUTE |
| src/components/profile/handicap/whs/charts/MiniRing.tsx:92 | {sub} | No production JSX caller | D | keep LABEL_STYLE grey |
| src/components/profile/hero/ProfileTopTenRail.tsx:237 | topTen.kicker — TOP 10 | /profile, /profile/:username → ProfilePageV2 → ProfileTopTenRail | E1 | A.MUTE → A.INK |
| src/components/profile/hero/ProfileTopTenRail.tsx:225,246 | ONLY ME | /profile, /profile/:username → ProfilePageV2 → ProfileTopTenRail → owner audience marker | K3 | keep A.MUTE |
| src/components/profile/hero/ProfileTopTenRail.tsx:225,246 | FRIENDS ONLY | /profile, /profile/:username → ProfilePageV2 → ProfileTopTenRail → owner audience marker | K3 | keep A.MUTE |
| src/components/profile/hero/ProfileTopTenRail.tsx:225,246 | FOLLOWERS & FRIENDS | /profile, /profile/:username → ProfilePageV2 → ProfileTopTenRail → owner audience marker | K3 | keep A.MUTE |
| src/components/profile/hero/ProfileTopTenRail.tsx:319 | topTen.golfers — GOLFERS | /profile, /profile/:username → ProfilePageV2 → ProfileTopTenRail → rating figure caption | K2 | keep A.DIM; photo-pill variants excluded |
| src/components/profile/hero/ProfileTopTenRail.tsx:216,323 | topTen.you — YOU | /profile, /profile/:username → ProfilePageV2 → ProfileTopTenRail → rating figure caption | K2 | keep A.DIM; photo-pill variants excluded |
| src/components/profile/hero/ProfileTopTenRail.tsx:64–68,216,323 | ownerScoreLabel(ownerName), owner name clipped to nine cells | /profile, /profile/:username → ProfilePageV2 → ProfileTopTenRail → rating figure caption | K2 | keep A.DIM; photo-pill variants excluded |
| src/components/profile/hero/ProfileTopTenRail.tsx:216,323 | topTen.them — THEM | /profile, /profile/:username → ProfilePageV2 → ProfileTopTenRail → rating figure caption | K2 | keep A.DIM; photo-pill variants excluded |
| src/components/profile/hero/HeroHandicapDisplay.tsx:27,85 | hero.handicapIndex — HANDICAP INDEX | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay | K2 | keep A.DIM |
| src/components/profile/hero/HeroHandicapDisplay.tsx:28,102; ProfileHero:256,263 | Covered short-window span — 90 DAYS | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay → delta period | K3 | keep W_40 |
| src/components/profile/hero/HeroHandicapDisplay.tsx:28,102; indexWindow.ts:71–73 | daysWord(win90.spanDays), partial covered span | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay → delta period | K3 | keep W_40 |
| src/components/profile/hero/HeroHandicapDisplay.tsx:28,102; ProfileHero:264 | hero.window12mo — 12 MONTHS | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay → delta period | K3 | keep W_40 |
| src/components/profile/hero/HeroHandicapDisplay.tsx:111; ProfileHero:275–286 | hero.cohortMen — OF MEN ON clbhouz | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay → percentile/comparison figure | K2 | keep A.DIM |
| src/components/profile/hero/HeroHandicapDisplay.tsx:111; ProfileHero:275–286 | hero.cohortWomen — OF WOMEN ON clbhouz | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay → percentile/comparison figure | K2 | keep A.DIM |
| src/components/profile/hero/HeroHandicapDisplay.tsx:111; ProfileHero:275–286 | hero.cohortAll — OF GOLFERS ON clbhouz | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay → percentile/comparison figure | K2 | keep A.DIM |
| src/components/profile/hero/HeroHandicapDisplay.tsx:111; ProfileHero:275–286 | hero.againstYou — AGAINST YOU | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay → percentile/comparison figure | K2 | keep A.DIM |
| src/components/profile/hero/HeroHandicapDisplay.tsx:27,142 | hero.lastFiveRounds — LAST FIVE ROUNDS | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay → form figure | K2 | keep A.DIM |
| src/components/profile/hero/ProfileHero.tsx:115,201 | WORLD AMATEUR RANKING | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay | K2 | keep A.DIM |
| src/components/profile/hero/ProfileHero.tsx:326,377–378 | hero.friends — FRIENDS | /profile, /profile/:username → ProfilePageV2 → hero clickable social counter | K4 | keep caption A.DIM; figure A.MUTE |
| src/components/profile/hero/ProfileHero.tsx:326,382–383 | hero.followers — FOLLOWERS | /profile, /profile/:username → ProfilePageV2 → hero clickable social counter | K4 | keep caption A.DIM; figure A.MUTE |
| src/components/profile/hero/ProfileHero.tsx:326,387–388 | hero.mutual — MUTUAL | /profile, /profile/:username → ProfilePageV2 → ProfileHero → HeroHandicapDisplay | K2 | keep caption A.DIM; figure A.MUTE |
| src/components/profile/courses/JourneySummaryCard.tsx:106,142 | TOP 100 PLAYED | /profile, /profile/:username → ProfilePageV2 → Courses → JourneySummaryCard | K2 | keep A.DIM |
| src/components/profile/courses/JourneySummaryCard.tsx:107,142 | AVERAGE RATING | /profile, /profile/:username → ProfilePageV2 → Courses → JourneySummaryCard | K2 | keep A.DIM |
| src/components/profile/courses/JourneySummaryCard.tsx:108,142 | COURSES RATED | /profile, /profile/:username → ProfilePageV2 → Courses → JourneySummaryCard | K2 | keep A.DIM |
| src/components/profile/AchievementsPane.tsx:30–31,39,86 | BADGES EARNED | /profile, /profile/:username → ProfilePageV2 → AchievementsPane → Figure | K2 | keep text-muted-foreground; .13em |
| src/components/profile/AchievementsPane.tsx:30–31,39,87 | COURSE TITLES | /profile, /profile/:username → ProfilePageV2 → AchievementsPane → Figure | K2 | keep text-muted-foreground; .13em |
| src/components/profile/clubs/ClubsCard.tsx:244,339 | clubs.roundsHere — ROUNDS HERE | /profile, /profile/:username → ProfilePageV2 → ClubsCard → home-club figure | K2 | keep A.DIM |
| src/components/profile/clubs/ClubsCard.tsx:245,339 | clubs.best — BEST | /profile, /profile/:username → ProfilePageV2 → ClubsCard → home-club figure | K2 | keep A.DIM |
| src/components/profile/clubs/ClubsCard.tsx:249,339 | clubs.vsAway — VS AWAY | /profile, /profile/:username → ProfilePageV2 → ClubsCard → home-club figure | K2 | keep A.DIM |
| src/components/profile/clubs/ClubsCard.tsx:436–437 | clubs.roundsCount — {n} ROUNDS | /profile, /profile/:username → ProfilePageV2 → ClubsCard → secondary-club metadata | K3 | keep rgba(248,250,252,.30) |
| src/components/profile/clubs/ClubsCard.tsx:53–58,131 | clubs.homeClub — HOME CLUB | /profile, /profile/:username → ProfilePageV2 → ClubsCard | E1 | A.MUTE → A.INK at shared Heading default |
| src/components/profile/clubs/ClubsCard.tsx:53–58,407 | clubs.alsoMember — ALSO A MEMBER AT | /profile, /profile/:username → ProfilePageV2 → ClubsCard | E2 | A.DIM → A.INK at own label; heading count kept |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:61,249–256 | 30D | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → Index window control | K4 | keep inactive CHART.DIM; active ink |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:61,249–256 | 90D | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → Index window control | K4 | keep inactive CHART.DIM; active ink |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:61,249–256 | 12M | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → Index window control | K4 | keep inactive CHART.DIM; active ink |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:73–81,212,273 | handicap.walk.headlineLabel — HANDICAP INDEX | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → Index figure | K2 | keep A.DIM |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:73–81,221,273 | format(cur.ts, 'd MMM yyyy').toUpperCase() | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → Index scrubbed-point date | K3 | keep A.DIM |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:65–68,216,292 | handicap.walk.window30 — 30 DAYS | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → default movement period | K3 | keep A.DIM; .14em override |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:65–68,216,292 | handicap.walk.window90 — 90 DAYS | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → default movement period | K3 | keep A.DIM; .14em override |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:65–68,216,292 | handicap.walk.window12 — 12 MONTHS | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → default movement period | K3 | keep A.DIM; .14em override |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:226–228,292 | handicap.walk.firstInWindow — FIRST IN WINDOW | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → scrubbed movement period | K3 | keep A.DIM |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:229–230,292 | handicap.walk.noChange — NO CHANGE | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → scrubbed movement period | K3 | keep A.DIM |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:231,292 | handicap.walk.thisStep — THIS STEP | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → scrubbed movement period | K3 | keep A.DIM |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:350,355–356 | handicap.walk.rangeHighWindow fallback — 30D HIGH | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → range figure | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:350,355–356 | handicap.walk.rangeHighWindow fallback — 90D HIGH | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → range figure | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:350,355–356 | handicap.walk.rangeHighWindow fallback — 12M HIGH | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → range figure | K2 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/IndexSection.tsx:351,355–356 | handicap.walk.rangeLowWindow fallback — LOW | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → low range figure | K2 | keep CHART.DIM, green figure unchanged |
| src/components/profile/handicap/whs/sections/AgeingOutSection.tsx:73–74 | handicap.ageingOut.inRounds_one — IN {count} ROUND | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → ageing-out expiry meta | K3 | keep CHART.DIM |
| src/components/profile/handicap/whs/sections/AgeingOutSection.tsx:73–74 | handicap.ageingOut.inRounds_other — IN {count} ROUNDS | Own /profile Handicap → WhsHandicapTab → HandicapDashboard → ageing-out expiry meta | K3 | keep CHART.DIM |
| src/features/amateur-ranking/ProfileRankingTab.tsx:82; ranking-tab.css:7 | RECENT EVENTS | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab | E1 | rgba(248,250,252,.42) → corresponding ink |
| src/features/amateur-ranking/ProfileRankingTab.tsx:95; ranking-tab.css:7 | CAREER | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab | E1 | rgba(248,250,252,.42) → corresponding ink |
| src/features/amateur-ranking/ProfileRankingTab.tsx:59; ranking-tab.css:12 | WORLD AMATEUR RANKING | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → headline figure | K2 | keep rgba(248,250,252,.62) |
| src/features/amateur-ranking/ProfileRankingTab.tsx:52,75; ranking-tab.css:25 | BEST RANK | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → tile caption | K2 | keep rgba(248,250,252,.42) |
| src/features/amateur-ranking/ProfileRankingTab.tsx:52,76; ranking-tab.css:25 | WINS | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → tile caption | K2 | keep rgba(248,250,252,.42) |
| src/features/amateur-ranking/ProfileRankingTab.tsx:52,77; ranking-tab.css:25 | TOP 10S | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → tile caption | K2 | keep rgba(248,250,252,.42) |
| src/features/amateur-ranking/ProfileRankingTab.tsx:52,78; ranking-tab.css:25 | EVENTS | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → tile caption | K2 | keep rgba(248,250,252,.42) |
| src/features/amateur-ranking/ProfileRankingTab.tsx:71; ranking-tab.css:19 | axisLabel(rows[0].week), ISO-week Thursday uppercase month/year | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → chart axis | K3 | keep SVG fill rgba(248,250,252,.42) |
| src/features/amateur-ranking/ProfileRankingTab.tsx:72; ranking-tab.css:19 | axisLabel(rows[rows.length-1].week), uppercase month/year | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → chart axis | K3 | keep SVG fill rgba(248,250,252,.42) |
| src/features/amateur-ranking/ProfileRankingTab.tsx:89; ranking-tab.css:32 | PTS | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → event-points unit | K2 | keep rgba(248,250,252,.42) |
| src/features/amateur-ranking/ProfileRankingTab.tsx:97; ranking-tab.css:39 | {entry.year} | /profile, /profile/:username → ProfilePageV2 → ProfileRankingTab → career year | K3 | keep rgba(248,250,252,.42) |
| src/features/pro-profile/ProProfileBuildOne.tsx:36; pro-profile.css:94 | WORLD RANKING | /profile, /profile/:username → ProfilePageV2 → ProProfileBuildOne → headline figure | K2 | keep --pro-profile-mute |
| src/features/pro-profile/ProProfileBuildOne.tsx:36; pro-profile.css:94 | BEST FINISH {year} | /profile, /profile/:username → ProfilePageV2 → ProProfileBuildOne → headline figure | K2 | keep --pro-profile-mute |
| src/features/pro-profile/ProSeasonSection.tsx:25; pro-profile.css:7 | [event.tour_name, dateLabel, event.country].filter(Boolean).join( · ).toUpperCase() | /profile, /profile/:username → ProfilePageV2 → ProProfileBuildOne → result-detail provenance | K3 | keep --pro-profile-mute |
| src/features/pro-profile/ProCollectionSections.tsx:29; pro-profile.css:135 | {entry.year} | /profile, /profile/:username → ProfilePageV2 → ProProfileBuildOne → career timeline | K3 | keep --pro-profile-dim |
| src/components/profile/handicap/whs/sections/compare/CompareSheet.tsx:281–282 | handicap.compare.kicker — COMPARE | /profile, /profile/:username → ProfilePageV2 and rivalry redirects → CompareSheet → list/search header | E2 | CHART.MUTE → CHART.INK |
| src/components/profile/handicap/whs/sections/compare/CompareSheet.tsx:238 | HEAD TO HEAD | /profile, /profile/:username → ProfilePageV2 and rivalry redirects → CompareSheet → selected detail header | E2 | rgba(248,250,252,.5) → CHART.INK |

### Counts by role

Counts below exclude already-recorded A–C reference components; no old role is silently reopened. The **331** new/source-specific rows include **316 reachable rows + 15 D exclusions**. Profile is the corrected union of 163 closure +66 additive rows; 15 original connection D rows were reclassified in place, not appended as duplicates.

| Area | E1 | E2 | K1 | K2 | K3 | K4 | K5 | K6 | D | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Clubhouse/round/composer | 0 | 7 | 0 | 7 | 5 | 7 | 13 | 3 | 3 | 45 |
| Messages/Activity | 3 | 14 | 0 | 2 | 20 | 2 | 0 | 2 | 0 | 43 |
| Global chrome/search/account | 1 | 0 | 0 | 8 | 4 | 1 | 0 | 0 | 0 | 14 |
| Profile/Handicap/social lists | 15 | 32 | 9 | 73 | 63 | 8 | 9 | 8 | 12 | 229 |
| **Total** | 19 | 53 | 9 | 90 | 92 | 18 | 22 | 13 | 15 | **331** |

### “?” list and source corrections

**“?” list: none.** No role remains uncertain, so no 390 uncertainty crop is required at step 1. Backend-dependent visibility does not make a source-proven role uncertain; no live-account or overflow claim is made from this audit.

- **Messages ruling, 21:13 UTC:** “surface ink” MSG.INK is #F4F6F8, but Ben explicitly selected canonical **#F8FAFC on only the four E labels**. MSG/MT/EC tokens and every other Messages colour stay unchanged.
- **Fixture-count ruling, 21:10 UTC:** Ben authorised only `brief18EyebrowInk.test.tsx:90` length 76 → audited site total alongside additions; report the exact final value. No test edited yet.
- **Desktop account false positives withdrawn:** Switch profile and Business Profiles use `tracking-wider` = **.05em** (installed Tailwind, no config/CSS override). They are live desktop labels but below this brief’s .08em selection, not E candidates. PostingAsMenu stays unchanged.
- **Handicap connection latch is live:** initially disconnected owner sees NotConnectedSection; if the query’s connection row arrives without unmount, startedDisconnected stays true and the flow mounts. Country group labels are therefore E2 even though ordinary manage-return remounts directly into the dashboard. Federation/count/waitlist labels stay K3/K4; eight completion labels stay K6. This corrects the earlier blanket D assumption.
- **Mixed-use tokens stay:** Streak LABEL also serves explanations/units/disclosures; compare KICK also serves metric boards; Tour’s shared heading CSS also serves linked source/year metadata; connect LABEL_LG also serves the country count. Change only each E label/default.
- **Sibling metadata stays grey:** Activity fold suffix and friend-request count are already in the same text node; no split/geometry change. Course picker and best-time sampling meta are separate siblings; colour only the first E span. Pro form’s newest-first sibling stays muted.
- **Dormant branches are not restored:** fixed foryou Clubhouse makes Friends Following D; WhereSection is imported but uncalled; old WHS IndexChart/MiniRing/RecentlyPlayedFeed are not runtime charts/sections. Hero’s local IndexChart wraps the shared IndexWindowChart. Unconsumed pro kit/sponsor CSS has no literal row to invent.
- **Gallery is Courses-owned:** courseGallery must be explicitly supplied by useCourseGallery; ordinary feed opens keep null. replaceGallery cannot create the mode. Gallery descendants retain B.
- **Current owners, not historical comments:** GlobalPostComposer mounts StageComposer, not retired composer; current feed uses the global fullscreen/review hosts, not the legacy unmounted FeedOverlayLayer.

### Previously recorded A–C labels — see batch A/B/C

These are reached from D but retain their existing classification/defaults. They are reference rows, not fresh source-colour changes or members of the 331-row count. All their grey K variants remain listed in their original full tables.

| Component / source | Label variants | Recorded role / disposition |
|---|---|---|
| scorecardParts TileSection; CardScorecardSheet; RoundResults | Feat, rounds, card, awards, holes, own, field | E2, see A/B/C; already ink by shared-default collapse |
| LikesSheet | People you follow; Everyone else | E2, see B/C; already ink |
| VideoAboutSheet / RoundVideoScorecard | Chapters, Filmed at, In this video, Links, Thanks to, Gear in this video, SCORECARD | E2, see C; already ink |
| PlayedWithPanel (not composer editable field) | PLAYED WITH | E2, see C; already ink |
| ConnectedInviteState | From home club, Playing most, Invited groups | E2, see C; already ink; separate stat/count K rows retained |
| ShotTagChoices / Media pieces | Hole/place group labels | See B/C; shared ink defaults and distinct K control/tag/state roles retained |
| ReviewCourseSearchSheet / review composer breakdown | Search groups / Overall category group | See B/C; already ink; receipt cascade findings retained |
| AccountGlance | ADMIN; SIGN OUT | K3 / K4, see C; keep dim |
| YourCourseAnalyticsSheet | Where you score best; Where it bites; unused LABEL | K2 / K2 / D, see C |
| SearchOverlayV2 | Previews | D, see C; production mounts omit commit mode |
| ReportCommentSheetV2 | Disabled Next | K4, see B/C; keep dim |
| FullscreenBottomStack:80 / fullscreen-stack.css:12 | FOLLOWING | K3, see C; keep .62 |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.hole | HOLE | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.par | PAR | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.yards | YARDS | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.strokeIndex | STROKE INDEX | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.field | FIELD LOSES | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.overall | OVERALL | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.design | DESIGN | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.condition | CONDITION | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.clubhouse | CLUBHOUSE | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.facilities | FACILITIES | K2, see C; keep .62 (.1em wide / .04em below340px) |
| FullscreenBottomStack:42 / fullscreen-stack.css:19; fullscreen.stats.members | MEMBERS | K2, see C; keep .62 (.1em wide / .04em below340px) |
| PostGolfContext:77 | PAR {par} | K2, see C; keep .62 |
| PostGolfContext:77 | {yards} YDS | K2, see C; keep .62 |
| CommentsSheetV2:439–440 | comments.count | K3, see B/C; keep A.DIM |
| Tour/player and Courses descendants | Their recorded section/group/stat/meta/control/celebration variants | See A/B/C; no new role or token repoint |

### Batch D — new shared reach

Only label-owned defaults change; **no surface-only props/flags**. Every direct caller of a changed shared component and newly reached route is recorded here.

| Changed shared label/component | Every direct caller / transitive host | New outside-D reach |
|---|---|---|
| AddCourseModal header + list groups | ProfilePageV2:1439; EditProfileGolf:84 | `/edit-profile` Golf; `/edit-profile-v2` alias redirects there |
| HcpSection kicker | IndexSection:266 and PersonalBestsSection:293 omit kicker; RoundsThatCountSection:117/164 and HolesSection:77/113 supply E1; RecentlyPlayedFeed:83 is dormant | No live outside-D caller; no headings/meta/stats/token changes |
| ClubsCard home/secondary heads | ProfilePageV2:165 (via profile clubs wrapper), only production caller | No outside-D caller |
| BreakdownsPickerSheet band head | AllCoursesList:726/738 | No outside-D caller |
| MyRatingsTierDivider fallback head | AllCoursesList:555/590 | No outside-D caller; semantic Exceptional colour and trailing count remain |
| StreaksSectionLabel Running now | StreaksSheet:440; StreaksSheetMount from ProfilePageV2:1594; old HandicapPage:539 dormant | No live outside-D caller; Broken/Not started disclosures stay K4 |
| CompareSheet and HeadToHeadDetail E groups | CompareMount at ProfilePageV2:1595/1598; old HandicapPage:505/541 dormant; CompareSheet owns its detail | Profile and requested rivalry redirect state only; no extra outside-D route |
| Pro headings/form/collection/Ask defaults | ProProfileBuildOne→ProSeasonSection / LinkedProSections / ProOwnerSections→ProCollectionSections/ProAskSection; ProCollectionSheet from ProCollectionSections:30 and ProfileRankingTab:102; all five Ask Kicker consumers listed in census | All live callers within profile D; amateur career CSS override explicitly receives ink; form/stat/meta siblings kept |
| ProfileTourTab year head | ProfilePageV2:949 only | No outside-D caller; linked tour/year descriptor remains grey |
| SocialListPage Section default | ProfileSocialListRoute:94; BusinessSocialListRoute:53 | `/business/:idOrSlug/followers`, `/business/:idOrSlug/following` |
| CountryScreen group heads | WhsConnectScreen; its profile latch, HandicapManagePage:136, WelcomeHandicap:23 | `/manage/handicap`; onboarding `/welcome` uses initial-country/completeOnSuccess state, not a duplicated CountryScreen implementation |
| IndexGlance E1 | ChromeIsland:483 inside HcpCell; HcpCell hosts ChromeIsland:893 and NewsChromeBridge:88; AppHeader:220 dormant | Island-route map and four NewsChromeBridge pages below |
| ComposerRoundsSheet E groups | StageComposer:1046 only; StageComposer from GlobalPostComposer:57 and PostV2Page:10 | Personal composer from all origins, Courses/Watch/Explore shared round entrypoints and direct `/post-v2`; business-only instances cannot expose personal rounds |
| CourseTagSheet E groups | StageComposer:961 only; same two Stage hosts | Global composer, business profiles/home/Insights/create-finish and direct `/post-v2` |
| ScheduleSheetV2 BEST TIME | StageComposer:984; ScheduledPostsSheetV2:162 (both Stage scheduled-list mounts:912/1004) | Same global/direct/business origins, including rescheduling |

**Every composer opening command:** MoreOptionsDrawer:113; PostOwnerMenu:101 (FeedCard:969/1046); RoundDetailSheet:357 (all A–C shared round callers preserved in the prior complete caller census); ComposerFlowSheet:67; LedgerRow:239; BusinessProfilePage:398/406; BusinessInsightsPageV2:131/162; BusinessHomeHeader:316; BusinessDoNextCard:63; BusinessCreateFinish:42. Outside-D business routes include `/business/:idOrSlug`, `/business/:id/insights`, and `/business/create`; global overlays inherit the opening page. Development store helpers are not additional production routes.

**IndexGlance exact shared reach:** global header resolves dark; `/round/*` and `/handicap/*` hide Hcp, Messages registry is none. Live outside-D island pages: `/find-people`, `/watch/courses`, `/watch/top100`, `/watch/region/:region`, `/amateur`, `/courses`, `/courses/:courseId`, business profiles and social lists, `/tourhub`, `/tourhub/tournament/:id`, `/tourhub/player/:id`, and the four bridge pages `/tour/news`, `/tour/news/:slug`, `/discover/news`, `/discover/news/:slug`. Exact first-match matcher domains, exclusions, redirect-only aliases and the unmatched DEFAULT_SPEC complement are fully enumerated in `batch-d-chrome-audit.md`; this complement prevents a falsely closed route list. AppHeader is dormant: DiscoverHeader only nonembedded (live caller supplies embedded), and TourPageShell only !headerB (both live consumers supply headerB).

**D-local Messages/Activity caller closure:** Inbox only App; NewConversationSheet only Inbox:452; ConversationSettingsSheet only Thread:643; PlayingOffRail only Thread:489; Activity SectionHeader:485, FeaturedMoment:535, FriendRequests:536, actions:624, SuggestedGolfers:608 only Activity; none gains an outside-D presentation caller. SuggestedGolferRow reason helpers have outside-D import users, but their metadata colours/logic are not touched.

### Next numbered steps

Step 2: colour-only E1/E2 defaults and declaration fixture; authorised length assertion only unless an existing assertion pins an explicitly changed grey. Preserve K tokens, source-regex adjacency, copy, fonts, weights, tracking, sizes and spacing.
Step 3: four separate sequential `bun x vitest run --shard=N/4` commands, full output outside repo, 10,435/900 delta. One worker-timeout rerun; any assertion failure stops and is quoted.
Step 4: real-component seeded-cache before audit commit / after, 390/320, groups ≤6 plus outside-D shared-reach groups. Commit each group without staging temporary pages/copies; remove every temporary file, verify status clean. No visual/overflow claim yet.


### Step 2 — Batch D colour-only implementation

Audit-before checkpoint **e580da4955**. Applied **36 label-default declarations across 26 production files**, covering the table’s **72 E1/E2 text/render variants**. No K1–K6/D token, typography, copy, geometry, data read/write, visibility/permission, feed_config or pool-cap change. No surface-only heading prop/flag introduced.

The two heading-only local defaults (`GROUP_DEFAULT` in the tier divider and `GROUP_KICK` in compare detail) preserve the old mixed-use K constants. Exceptional tier colours still use reviewTierColor; only its grey fallback is ink. Compare’s stat Board retains KICK, while three E groups use GROUP_KICK. Streak’s Running now text alone receives ink; its count/disclosure/explanation/unit styles stay. Pro’s first form span, picker’s first group span and best-time first span receive ink; adjacent sampling/source/count metadata stays grey. The Tour year text gets a local ink declaration; its linked source/year descriptor remains muted. Social Section retains the explicit pending-amber override and now defaults ink; its original optional muted API introduces no new per-surface flag.

Messages imports the existing A.INK token for only the four labels, following Ben’s #F8FAFC ruling. MSG/MT/EC tokens stay byte-unchanged. Country GROUP_LABEL is heading-only and now ink; Open now/Everywhere else use local overrides without recolouring LABEL_LG’s country count. Shared headings apply on every recorded caller, including edit-profile, business social lists, manage-handicap, global composer and the island/news reach map.

#### Changed declaration list

| File:line (after) | Declaration/default |
|---|---|
| src/components/profile/clubs/ClubsCard.tsx:131 | Local E-label colour property/default |
| src/components/profile/clubs/ClubsCard.tsx:407 | Local E-label colour property/default |
| src/components/profile/courses/AddCourseModal.tsx:336 | Local E-label colour property/default |
| src/components/profile/courses/AddCourseModal.tsx:445 | Local E-label colour property/default |
| src/components/profile/courses/BreakdownsPickerSheet.tsx:256 | Local E-label colour property/default |
| src/components/profile/courses/my-ratings/MyRatingsTierDivider.tsx:18 | Local E-label colour property/default |
| src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:121 | Local E-label colour property/default |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:23 | Local E-label colour property/default |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:150 | Local E-label colour property/default |
| src/components/profile/handicap/whs/connect/CountryScreen.tsx:188 | Local E-label colour property/default |
| src/components/profile/handicap/whs/sections/compare/CompareSheet.tsx:238 | Local E-label colour property/default |
| src/components/profile/handicap/whs/sections/compare/CompareSheet.tsx:281 | Local E-label colour property/default |
| src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:23 | Local E-label colour property/default |
| src/components/profile/handicap/whs/sections/HcpSection.tsx:78 | Local E-label colour property/default |
| src/components/profile/hero/ProfileTopTenRail.tsx:237 | Local E-label colour property/default |
| src/features/activity-v2/ActivityPageV2.tsx:130 | Local E-label colour property/default |
| src/features/activity-v2/components/ActivityActionsSheet.tsx:167 | Local E-label colour property/default |
| src/features/activity-v2/components/FeaturedMomentCard.tsx:95 | Local E-label colour property/default |
| src/features/activity-v2/components/FriendRequestsRail.tsx:182 | Local E-label colour property/default |
| src/features/amateur-ranking/ranking-tab.css:7 | .amateur-ranking-tab .amr-hd h2 |
| src/features/amateur-ranking/ranking-tab.css:49 | .amateur-ranking-tab.amr-sheet .pro-collection-kicker |
| src/features/chrome-v2/IndexGlance.tsx:132 | Local E-label colour property/default |
| src/features/post-v2/components/golf/composerGolf.css:102 | .composer-rounds-grp |
| src/features/pro-profile/pro-profile.css:4 | .pro-profile-heading h2 |
| src/features/pro-profile/pro-profile.css:38 | .pro-season-form-heading > span:first-child |
| src/features/pro-profile/pro-profile.css:141 | .pro-collection-kicker |
| src/features/pro-profile/pro-profile.css:196 | .pro-ask-eg-label |
| src/features/pro-verification/ProfileTourTab.tsx:34 | Local E-label colour property/default |
| src/features/social-lists-v2/SocialListPage.tsx:462 | Local E-label colour property/default |
| src/features/social-suggestions/SuggestedGolfersBlock.tsx:64 | Local E-label colour property/default |
| src/pages/messaging-v2/ConversationSettingsSheet.tsx:590 | Local E-label colour property/default |
| src/pages/messaging-v2/InboxV2Page.tsx:391 | Local E-label colour property/default |
| src/pages/messaging-v2/NewConversationSheet.tsx:561 | Local E-label colour property/default |
| src/pages/messaging-v2/PlayingOffRail.tsx:125 | Local E-label colour property/default |
| src/styles/post-flow.css:13 | .pf-group > span:first-child |
| src/styles/post-flow.css:36 | .pf-best-head > span:first-child |

#### Every test edit

- **src/test/brief18EyebrowInk.test.tsx:90**: `expect(sites).toHaveLength(76)` → `expect(sites).toHaveLength(112)`. Reason: Ben’s explicit 21:10 UTC authorisation reconciles the 36 required new declaration entries. This is the **only assertion edit**; computed-ink expectations, source/attribute checks, and test name are unchanged.
- **src/test/fixtures/brief18EyebrowSites.json**: append **36 entries**, preserving all original **76** records byte-for-value, **76 → 112**. The companion `batch-d-changed-sites.json` lists exactly those additions.
- No assertion pinning old grey on these elements was found to require another edit; no source-regex test was edited. No test added, deleted, renamed or rewritten. Population **10,435 tests / 900 files → 10,435 / 900**, delta **0 tests / 0 files**. Execution is still pending the four sequential shards; this is not a pass claim.

Latest available post-production-edit preview signal: **build OK, 2026-11-24T21:24:53Z**. No temporary page/before copies exist at this step. Step 3 and grouped captures remain open.

### Resolver-only ruling and previous stop

The previous sequential run stopped in **shard 3**, not shard 4: shard 1 passed 2,500/2,500 in 225 files; shard 2 passed 2,493/2,493 in 225 files; shard 3 passed 2,606/2,607 in 225 files. Executed subtotal 7,600, passing subtotal 7,599; shard 4 was not run. Error: **src/test/brief18EyebrowInk.test.tsx:21:37 — `Error: EISDIR: illegal operation on a directory, read`**, called by imported/named/evaluate while reading a directory.

The first added folder-importing colour site is **src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:121** (Running now): its **line 9** imports `CHART` from `../../whs/charts`, an index-module directory. Added CompareSheet colour sites at **238 and 281** likewise import CHART from `../../charts`. Production imports are valid; the declaration resolver incorrectly accepted a directory.

Authorised test edit, **src/test/brief18EyebrowInk.test.tsx:5,35**: add `statSync` to the fs import; suffix candidates `['', '.ts', '.tsx', '/index.ts', '/index.tsx']` with `.find(existsSync)` → `['.ts', '.tsx', '/index.ts', '/index.tsx', '']` with `.find(path => existsSync(path) && statSync(path).isFile())`. Reason: resolve a file/index module, never feed a directory to readFileSync. **No assertion, test name, fixture entry, production file or other resolver logic changed.** Population remains 10,435 tests / 900 files; new execution results follow below. Raw logs are retained outside the repository.

### Step 3 — resolver-ruling rerun: stopped on shard 3

All commands below ran sequentially, each as its own command. Full output remains at `/tmp/brief18-d-ruling-tests/shard-N.log`, outside the repository. No worker `Timeout calling onTaskUpdate` occurred; no shard was rerun.

| Shard / exact command | Files | Passing / executed tests | Duration | Result |
|---|---:|---:|---:|---|
| `bun x vitest run --shard=1/4` | 225 passed / 225 | 2,500 / 2,500 | 153.13s | Passed |
| `bun x vitest run --shard=2/4` | 225 passed / 225 | 2,493 / 2,493 | 137.21s | Passed |
| `bun x vitest run --shard=3/4` | 224 passed, 1 failed / 225 | 2,606 / 2,607 | 165.63s | Assertion failure; stop |
| `bun x vitest run --shard=4/4` | Not run | Not run | — | Blocked by stop rule |

**Executed subtotal: 7,600 tests across 675 files; 7,599 passing tests, 1 failure, 674 passing files and 1 failing file.** Full-suite population remains **10,435 tests / 900 files → 10,435 / 900**, delta **0 tests / 0 files** against the accepted baseline. This is not a full-suite pass. No tests added, removed, renamed or rewritten; the only continuation test edit is the authorised resolver file-selection change at lines 5 and 35, with the pre-existing Batch D length assertion 76→112 already documented above. The 112-entry fixture list and all assertions are unchanged by this continuation.

Failing test: **src/test/brief18EyebrowInk.test.tsx:110:78**, `every Part 1 eyebrow declaration computes to rgb(248, 250, 252)`.

Tool's exact words:

```text
AssertionError: src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:121 has a resolved colour: expected 'undefined' to be 'string' // Object.is equality

Expected: "string"
Received: "undefined"
```

The directory-read EISDIR no longer appears; the first added Streaks declaration instead remains unresolved by the test resolver. No further resolver/source/test correction or rerun was attempted after this assertion failure. Shard 4 and all Batch D/shared-reach captures remain blocked pending Ben's ruling. No temporary capture page, before-source copies or capture files were created; no visual or 320px overflow claim is made.


### Step 3 — second resolver ruling: final sequential run

**Authorised resolver-only edit — `src/test/brief18EyebrowInk.test.tsx:26–29,37,52–69`:** duplicate import path selection → shared `moduleFile()` with the existing file-only `.ts`, `.tsx`, `/index.ts`, `/index.tsx`, bare-path order; `named()` local declaration/import or `undefined` → local declaration/import, named export-from (including aliases), then export-star traversal. Depth guard is retained. No assertion, expected colour, 112-site count or fixture list changed. StreaksSheet's Running now label and `color: CHART.INK` are unchanged in production. The test now follows charts/index.ts to tokens.ts and its INK_BASE. No additional expression-evaluator extension was needed.

The rule checked is that every selected E1/E2 declaration resolves to canonical ink, including imported tokens and barrel re-exports. The test evaluates all 112 sites and the shared TileSection default; only the test resolver was modified. Production routes, jobs, data and permissions were outside this resolver-only authorisation and were not altered.

Each command ran sequentially as its own command; complete output is retained outside the repository at `/tmp/brief18-d-second-resolver/shard-N.log`. No worker timeout, retry or failure occurred. This final table supersedes the stopped table above (retained as historical stop evidence).

| Exact command | Files passed / executed | Tests passed / executed | Duration | Result |
|---|---:|---:|---:|---|
| `bun x vitest run --shard=1/4` | 225 / 225 | 2,500 / 2,500 | 138.93s | Passed |
| `bun x vitest run --shard=2/4` | 225 / 225 | 2,493 / 2,493 | 143.19s | Passed |
| `bun x vitest run --shard=3/4` | 225 / 225 | 2,607 / 2,607 | 168.22s | Passed |
| `bun x vitest run --shard=4/4` | 225 / 225 | 2,835 / 2,835 | 167.91s | Passed |
| **Total** | **900 / 900** | **10,435 / 10,435** | | **Passed** |

**Baseline 10,435 / 900 → final 10,435 / 900; delta 0 tests / 0 files.** No tests added, deleted, renamed or rewritten. The sole existing test `every Part 1 eyebrow declaration computes to rgb(248, 250, 252)` retains every assertion; its authorised 76→112 count edit and 36 fixture additions are accounted for in Step 2. Both resolver edits are documented above. Captures follow in separately committed groups.
