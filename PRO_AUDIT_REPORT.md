# Pro verification — audit only

**4 November 2026, UTC. No application changes.** This report answers the nine sections of `AUDIT_ONLY_pro_verification._Read_and_report._pasted.md:1–44`. No SQL, migrations, deployed-function changes, tests or build were run. The last reported suite remains **6,653 tests / 587 files**, not a fresh audit-run result. No tests were added, deleted, renamed or rewritten. `feed_config`, the 30-round pool cap and native/Median configuration were not changed.

## Evidence and limits

File references below describe **current repository source**, not proof that a migration or edge function is deployed. A read-only hosted schema snapshot was obtained at `/tmp/tool-results/security--get_table_schema/20261104-174523-424887`; its collection time is encoded in the filename, but the backend snapshot does not supply its own freshness timestamp. It exposes columns and RLS summaries, not a complete effective column-grant/trigger inventory. No SQL was used to fill those gaps. Consequently **successful self-verification, deployed edge parity and actual per-tour result coverage remain unverified**; none was exercised against production.

## 1. Welcome / sign-up

- Screen 1 owns `form.isCreator`; clicking its row updates local form state and records the toggle event. `CreatorSwitch` is decorative inside the row's switch, not a separate persistence mechanism (`src/pages/Welcome.tsx:44,102,113`). The shared form initializes it from `profile.is_creator` (`src/hooks/useProfileForm.ts:88`).
- Continue calls the identity save; the partial identity payload includes `is_creator`. A toggle alone is not saved. Global Skip only updates onboarding completion, so it does not save an unsaved creator choice (`src/pages/Welcome.tsx:92–104`; `src/hooks/useProfileSave.ts:164–173`).
- Progress is stored per user under `clbhouz.welcome.<userId>`: completed step, selected course and follow count. Reads validate/clamp completed to 0–4; writes tolerate unavailable storage. It is not a creator/name/photo draft store (`src/features/onboarding/welcomeRules.ts:1–9,22–26`). Resume chooses `min(5, completed + 1)` and rehydrates form/identity from the profile; unsaved creator/name/photo edits are not restored by this progress record (`src/pages/Welcome.tsx:40–49,86–89`).
- Welcome requires a non-anonymous signed-in user and a successfully loaded profile; anonymous users redirect home, signed-out users to auth, pending/error reads show loading/retry (`src/pages/Welcome.tsx:34–38`).
- Screen 4 is the step-4 branch, not a creator-dependent branch. An unsettled connection read shows loading; failure shows retry; a successful existing connection auto-completes it with `already_connected`. A successful new embedded connection completes with `connected`; “I don't have one” completes with `no_handicap` only after the connection read succeeds. Global Skip can leave setup from this screen (`src/pages/Welcome.tsx:50–60,91–100,116–117`).
- The embedded connect country is a history entry on `/welcome`. Its syncing state hides departure controls; supported countries open canonical credentials, unsupported countries use the waitlist. Waitlist pending/error has its own loading/retry (`src/pages/Welcome.tsx:50–57,116–117`; `src/features/onboarding/WelcomeHandicap.tsx:11–28`).
- Screen 5 requires **connection-query success**, not a non-null connection. It passes `connection.data?.id`, identity, selected course and follows to `WelcomeFirstLook`; successful null permits a no-handicap first look. Failed/pending connection reads show retry/loading and disable finish. No creator/pro status is passed (`src/pages/Welcome.tsx:117`; `src/features/onboarding/WelcomeFirstLook.tsx:23`).

## 2. Edit profile

- The Creator row is `EditProfileType`, mounted in the editor at `src/pages/EditProfile.tsx:165`. It keeps optimistic checked state, prevents concurrent saves and rolls back on failure (`src/features/edit-profile/EditProfileType.tsx:6–23`).
- `saveCreator` invokes the existing saver with `profileFields: 'creator'`; that partial writes only `is_creator`, then invalidates the relevant profile/creator reads (`src/pages/EditProfile.tsx:106`; `src/hooks/useProfileSave.ts:121–156`). Form hydration and dirty comparison include creator state (`src/hooks/useProfileForm.ts:88,160`).
- **Suggested fit, not implemented:** a separate professional-status row and request sheet alongside the existing profile-type section. Do not reuse the self-service Creator switch or its `is_creator` write: creator is a preference, whereas professional status needs authoritative review. The section and immediate-sheet save pattern already exist (`src/pages/EditProfile.tsx:100–106,165`; `src/features/edit-profile/EditProfileType.tsx:22–23`).

## 3. Personal profile

- Creator status comes from `useProfileCreator` / `get_profile_creator`, enabled for a signed-in non-anonymous viewer; it additionally requires a personal profile and a successful true result (`src/pages/ProfilePageV2.tsx:325–328`; `src/features/creator/profileCreator.ts`). `ProfileHero` passes it to `ProfileCoverBand`, which renders the Creator label next to identity (`src/components/profile/hero/ProfileHero.tsx:371–379`; `src/components/profile/hero/ProfileCoverBand.tsx:181–199`).
- Owner index inputs are profile England Golf/manual columns; other viewers use `get_visible_handicaps`. `resolveDisplayHandicap` receives actual connection presence; connected-null must not resurrect a stale manual figure (`src/pages/ProfilePageV2.tsx:696–716`; `src/lib/handicap/resolveHandicap.ts`). Hero's shown figure is `indexValue ?? trend?.current ?? null`, not a invented zero (`src/components/profile/hero/ProfileHero.tsx:183–186,223`).
- Connected index blocks, own disconnected Connect card and own linked-without-index notice are separate conditions. Without a handicap there is no real index block; own profiles can show the example invitation, while a linked account without an index shows its linked notice (`src/components/profile/hero/ProfileHero.tsx:355–357,442–452`; `src/components/profile/hero/HeroHandicapDisplay.tsx:98–104`).
- Base personal tabs come from `getProfileTabs`: Posts (`activity`), Courses and Handicap, with the obsolete Top 100 tab filtered out. Rounds is inserted after Courses: always for the personal owner, for others only when a viewer-scoped visible-round count is positive. Handicap is **personal owner only**, regardless of whether they have a handicap; never visitors. Creator adds Videos at the front and creator-tab selection supplies its default (`src/hooks/useProfileType.ts:55–76`; `src/pages/ProfilePageV2.tsx:367,406–431`). There is no personal Tour tab in this composition.
- Visitors' handicap/stats intents are handled separately rather than mounting the owner tab (`src/pages/ProfilePageV2.tsx:361–367,448–456,868–870`).
- `VerifiedAccountsNote` mounts only for the personal owner while `!profile.is_verified_golfer`; its profile variant is locally dismissible. Its CTA opens `/manage/contact?category=account&subject=Verification%20enquiry` (`src/pages/ProfilePageV2.tsx:1365–1370`; `src/components/profile/VerifiedAccountsNote.tsx:25–54`). English body: **“We verify golfers and professionals ourselves - there's nothing to apply for. If you're seeking verification, contact support and we'll take a look. If you represent a club, brand or business, set up a business page and you can request verification there.”** (`public/locales/en/common.json:304`). This existing invitation/support wording would contradict a new public pro application flow.

## 4. Member-name surfaces and identity propagation

### Current source inventory

These are distinct identity lanes; business actors and `sr_players` are not automatically personal-member identities. An existing generic `is_verified` tick is not evidence of professional status.

| Surface / name renderer | Author read / source |
|---|---|
| Clubhouse ordinary post header: `FeedCard` (`src/components/feed/FeedCard.tsx:931–956`); review/round cards share feed composition | `get_suggested_feed_v3`, `src/components/media-system/hooks/useSuggestedFeed.ts:33`; `CardFeed` owns the feed composition (`src/components/feed/CardFeed.tsx:103`). |
| Fullscreen/deep-link post authors | Direct posts/profile join, including existing generic `is_verified`, `src/lib/publishedPostViewer.ts:11–32`; author navigation/rendering in `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx:349` and `src/pages/PostDeepLinkPage.tsx:218`. |
| Comments and replies: `CommentCard:119`, `ReplyRow:81` | `comments_v2` reads plus batched personal `user_profiles` and separate business `business_accounts` enrichment (`src/features/comments-v2/hooks/useCommentsV2.ts:156–188,226–244,286–291`). Personal enrichment does not select a pro flag. |
| Search: `PersonRow`, suggested-person row in `SearchEmptyState:370–409` | `global_search_v2` (`src/features/search-v2/hooks/useGlobalSearchV2.ts:84`); `search_empty_state_v2` (`src/features/search-v2/hooks/useSearchEmptyStateV2.ts:65`). Search also shows Tour-player names, a separate actor lane (`SearchEmptyState.tsx:304–332`). |
| Followers/following/friends: `SocialListPage` | `get_social_list` (`src/features/social-lists-v2/hooks/useSocialListV2.ts:80,122,131`; `src/features/social-lists-v2/SocialListPage.tsx:633–641`). |
| Find golfers: `FindGolfersSheet` (`src/components/explore-tab-new/FindGolfersSheet.tsx:207–310`) | `find_golfers_v1` (`src/components/explore-tab-new/courseled/hooks/useFindGolfers.ts:58`). |
| Explore people row/sheet: `CreatorsRow:38,109–129` | **Current** `get_explore_people_row` (`src/features/explore-magazine/watch/useExplorePeopleRow.ts:28`), not the retained `useFeaturedCreators` hook. Generic verified badge renders separately at row line 129. |
| Creator spotlight: `CreatorSpotlight:135–160` | `get_watch_spotlights` (`src/features/explore-magazine/watch/useWatchBottom.ts:21`); creator videos use `get_creator_videos` at line 34. |
| Watch lead author: `WatchLead:418,482` | `get_watch_lead` (`src/features/explore-magazine/watch/useWatchLead.ts:20–23,45`). |
| Watch Community names: `WatchFeed:434–448,543` | Community feed post identities are carried into the member grouping (`src/features/explore-magazine/watch/WatchFeed.tsx:361–375`); do not replace these with Tour-player or business identifiers. |
| Clips/long-form post authors and viewer handoff | `get_watch_shorts_v2` / `get_long_form_videos_v2` (`src/features/explore-magazine/watch/useWatchClips.ts:32`; `useWatchVideos.ts:31`); `WatchFeed` passes normalized post identities into card/viewer composition (`WatchFeed.tsx:250–256,646–674`). |
| Watch course/region/Top 100 grids | `get_watch_course_videos`, `get_watch_region_videos`, `get_watch_top100_videos` (`src/features/explore-magazine/watch/useWatchMiddle.ts:47–65`); canonical viewer opens from `src/pages/WatchGridPage.tsx:9–12,27,45–47`. Course title text is not a member name. |
| Inbox conversations: `ConversationRow:64–79,318–331` | `get_inbox` (`src/hooks/messaging/useConversations.ts:27`). |
| Thread identity, message replies and sender | `get_conversation_detail`, `get_thread` (`src/hooks/messaging/useConversationDetail.ts:21`; `useThread.ts:34`); `ThreadV2Page:117–127,217–226`, `MessageBubble:232,367,405–406`. |
| Inbox starters/played-with rail and new conversation | Starter hooks in `src/pages/messaging-v2/InboxV2Page.tsx:76–79,245,283`; `get_my_last_fourball` (`src/hooks/messaging/useLastFourball.ts:24`); member labels in `MemberRailTile.tsx:13–38`, `InboxEmptyState.tsx:228–243`, `NewConversationSheet.tsx:158,273,483`. |
| Amateur/circle/course boards, drilldowns and standout rounds | `get_board_page`, `get_board_course_players`, `get_board_courses` (`src/components/explore-tab-new/courseled/hooks/useBoardPage.ts:109`; `useBoardCoursePlayers.ts:48`; `useBoardCourses.ts:85`; `BoardSeeAllSheet.tsx:63`); circle board `get_friend_leaderboard` (`src/lib/whs/api.ts:1055`); standout/source lanes retained in `ScoresLeaderboardsPage`. These are member-board identities, unlike professional Tour rows. |
| Course legends/record author | `HeroCourseRecord` and its `useCourseRecordSummary` / `useCourseLegends` readers (`src/components/courses/course-detail/about/HeroCourseRecord.tsx:5–80`; `src/components/courses/course-detail/useCourseRecordSummary.ts:1–73`; `src/hooks/gam/useCourseLegends.ts:1–16`). |
| Profile Top 100/career standings | `get_career_leaderboard` / optional `get_year_leaderboard` (`src/hooks/top100/useTop100Race.ts:25–39`); `Top100ListProgressSheet` renders player doors (`src/components/top100/sheets/Top100ListProgressSheet.tsx:9,160`). |
| Course reviews / single-review context | Direct `course_ratings` + `user_profiles:user_id` name/photo join (`src/hooks/useCourseReviews.ts:84–106`); `SingleReview` is the shared person-led review surface (`src/components/courses/course-detail/reviews/SingleReview.tsx`). Context-only reader selects handicap/gender, not identity/pro status (`src/hooks/useSingleReviewContext.ts:12–19`). |
| Business reviews, mentions and team feed | `get_business_reviews_v2`, `get_business_mentions`, `get_business_team_feed` via their dedicated hooks (`src/hooks/useBusinessReviews.ts`; `src/features/business-mentions`; `src/hooks/useBusinessTeamFeed.ts`). Personal reviewers/mention authors/team members must remain distinct from the business's own name. |
| Activity ledger and friend requests | `get_activity_feed` (`src/features/activity-v2/hooks/useActivityFeedV2.ts`), `get_activity_friend_requests` (`src/features/activity-v2/hooks/useFriendRequestsV2.ts:20–39`); `LedgerRow.tsx:347–358`, `FriendRequestsRail.tsx:204`. |
| Mention suggestions, likes and club-golfer discovery | Direct personal-profile select (`src/components/mentions/MentionsComposerInput.tsx:77–78`; `src/features/explore-magazine/useClubGolfers.ts:53–54`); `LikesSheet` name/profile door (`src/components/likes/LikesSheet.tsx:119`). Mention business results use a separate `business_accounts` select (`MentionsComposerInput.tsx:99–100`). |
| Admin verification names / Member Radar | Direct batched `user_profiles` enrichment in `useVerifications.ts:141–155`; renderer `VerificationsReview.tsx:618–636`; Radar's Stage 3 member reads remain independent (`src/features/admin/components/MemberRadar.tsx:524`). |
| Coach golfer names | Dedicated coach-hook family, not generic profile hero queries (`src/features/coach/hooks.ts:1–26`; `src/features/coach/BusinessCoachCards.tsx:43`). |
| Tournament member picks / Our record circle | `get_tournament_picks_board` (`src/features/tourhub/hooks/useTournamentPick.ts:50`); `get_our_pick_record` (`src/features/tourhub/hooks/usePickInsights.ts:15`), names in `OurRecordSheet.tsx:48–49`. Event golfer names at line 58 are professional-player identities, not member names. |

### Recommendation and RPC-count qualification

**Recommend one batched, minimal public identity read keyed by personal user IDs**, returning only approved professional status (e.g. `{user_id, is_pro}`), plus shared cached enrichment and a shared name-label primitive. It would add **one new read contract and require zero existing name RPC payload changes**. Existing direct-select lanes must also consume the enrichment; account switching and successful approval/removal must invalidate it. This is a proposal only, not a new permission/schema implementation. Existing independent identity lanes and actor separation are evidenced in the table above.

Adding a field to each RPC is a larger parallel contract change. This audit identifies **30 distinct source-called identity/video contracts to assess**, enumerated below; that is a **lower-bound change inventory, not an exhaustive active-member-name RPC count**. Some carry names only into a viewer, and some require a final reachability trace. It would be misleading to promise exactly 30 payload changes or reuse an earlier unsupported “36” estimate. Direct-select paths still require changes whichever option is used.

1. `get_suggested_feed_v3`
2. `global_search_v2`
3. `search_empty_state_v2`
4. `get_social_list`
5. `find_golfers_v1`
6. `get_explore_people_row`
7. `get_watch_spotlights`
8. `get_watch_lead`
9. `get_watch_shorts_v2`
10. `get_long_form_videos_v2`
11. `get_watch_course_videos`
12. `get_watch_region_videos`
13. `get_watch_top100_videos`
14. `get_creator_videos`
15. `get_inbox`
16. `get_thread`
17. `get_conversation_detail`
18. `get_my_last_fourball`
19. `get_board_page`
20. `get_board_course_players`
21. `get_board_courses`
22. `get_friend_leaderboard`
23. `get_career_leaderboard`
24. `get_year_leaderboard`
25. `get_business_reviews_v2`
26. `get_business_mentions`
27. `get_business_team_feed`
28. `get_activity_feed`
29. `get_activity_friend_requests`
30. `get_tournament_picks_board`

`get_our_pick_record` is an **additional confirmed member-name contract**, making **31 listed contracts in total** when the record sheet is included (`usePickInsights.ts:15`; `OurRecordSheet.tsx:48–49`). Other lanes include `get_wire_activity` (`src/components/explore-tab-new/hooks/useWireActivity.ts:46`), `get_friend_hybrid_snapshot` (`src/components/friend-sheet/useMemberTapResolver.ts:124`; `src/lib/whs/hooks/useFriendHybridSnapshot.ts:83`) and `get_connect_circle_preview` (`src/components/profile/handicap/whs/connect/EmptyStateScreen.tsx:132`), plus coach/standout/course-net-board contracts. **The exact comprehensive count and every transitive name renderer are not established by this audit.** Retained `get_featured_creators` exists in `useFeaturedCreators.ts:39` but current `CreatorsRow` imports `useExplorePeopleRow`; generated types and historical audit comments must not inflate the active count.

## 5. Rounds gate and other no-connection surfaces

- `roundsGateState`: missing user → `signedOut`; settled read error → `connected` (fail-open); not successful → `loading`; successful non-null connection → `connected`; successful null → `gated`. It has no creator/pro exemption. Its own comment explicitly says conversion device, not privacy boundary (`src/features/explore-magazine/RoundsGate.tsx:34–54`).
- Production caller is `ScoresLeaderboardsPage:329`; `RoundsGate` is conditionally mounted there with existing pool figures (`src/features/explore-magazine/ScoresLeaderboardsPage.tsx:593–601`). `useAmateurBoardState` **does not call the helper**: it separately computes `!!userId && whs.isSuccess && !whs.data`, then applies gated rung eligibility. Both owners would need the same authoritative pro exemption (`src/features/amateur/useAmateurBoardState.ts:155–167,202–221`). Test callers and explanatory `UnknownConnectionFallback` are not additional production gate decisions (`src/test/roundsGateAnalytics.test.tsx:40`; `src/features/explore-magazine/UnknownConnectionFallback.tsx:8`).
- Gate lifecycle: guests defer to guest-gate ownership; non-guests get first look, then >80px from arrival or a timer after content. These are lifecycle rules, not identity authorization (`RoundsGate.tsx:133–170`).

| Other surface | What actually blocks/prompts |
|---|---|
| Owner Handicap tab / handicap page | `ProfileHandicapTab` delegates existing state machine; disconnected section has the Connect-only presentation (`src/components/profile/handicap/ProfileHandicapTab.tsx:1–5`; `src/components/profile/handicap/whs/sections/NotConnectedSection.tsx:4–9,21–62`). HandicapPage handles settled absent connection separately from errors (`src/pages/HandicapPage.tsx:399–407,460–470`). |
| Profile hero / top-bar disconnected glance | Own settled-unlinked connection invitation and linked/no-index notice are distinct (`ProfileHero.tsx:355–357,452`; `src/features/chrome-v2/ConnectGlance.tsx`). |
| Profile Rounds empty | Owner's empty connection wrapper consults chip state; linked notice versus Connect CTA (`src/components/profile/rounds/ProfileRoundsTab.tsx:63–67,97–115`). Visitor empty presentation is not an owner connection invitation. |
| Settings Handicap | Disconnected card and “Connect prompts” preference, separate from connected index visibility (`src/components/settings/SettingsHandicapCard.tsx:30–57`). |
| Settings data export | Hidden unless connected, identified, successful known positive round total; this is an export-availability prerequisite, not a Rounds gate (`src/components/settings/SettingsYourData.tsx:16–25,53`). |
| Welcome | Optional screen-4 connection step and no-handicap completion, §1 above (`Welcome.tsx:116–117`). |
| StatBrowse | Empty measured-data Connect CTA; measured round branch explicitly has no Connect CTA (`src/components/courses/StatBrowse.tsx:777,854–863`). |
| Scores standing shelf | Connected shows standings; disconnected shows `ConnectStandingInvite` (`src/features/explore-magazine/ConnectStandingInvite.tsx:15,41–46`). |
| Handoff | Handicap destination is `/handicap` with Connect copy (`src/pages/gate/HandoffPage.tsx:56`); a destination hint, not proof of a separate gate. |
| Course website/records | “No rounds measured here yet…” explanatory connection copy (`src/components/courses/course-detail/CourseWebsiteSheet.tsx:548`); no evidence that browsing is blocked by it. |

Friend/circle not-synced invitations also exist in the shared WHS connection/circle surfaces (`src/components/profile/handicap/whs/connect/EmptyStateScreen.tsx:132`; `src/components/friend-sheet/useMemberTapResolver.ts:124`). No claim is made that removing a conversion gate creates actual handicap-backed records. Coach selection is not a handicap connection flow (`src/features/coach/hooks.ts:1–26`; `src/features/coach/CoachSheets.tsx:27–50`).

## 6. Admin verification, email and activity

### Queue and decisions

- Users is the golfer filter in Verifications; its pending count specifically counts `status === 'pending'` (`src/features/admin/components/VerificationsReview.tsx:41–56,176`). The loader reads golfer requests directly, but selects **`invited_by`, not subject `user_id`**, then assigns `requestedBy: invited_by` and enriches that profile as the row's name/avatar (`src/features/admin/hooks/useVerifications.ts:63–66,116–120,141–155`). Renderer uses that name and `requestedBy` for avatar identity (`VerificationsReview.tsx:618–636`). **Confirmed repository defect: inviter identity can be presented as the golfer under review.**
- Golfer reviewed-by/reason fields are not mapped like the business fields. The initial queries' errors are not thrown in `fetchVerifications`, so failed reads can become empty arrays (`useVerifications.ts:56–71,99–121,156–163`).
- UI explicitly treats an invited golfer as someone selected by the team, not an applicant supplying further evidence (`VerificationsReview.tsx:499–503`). `needs_more_info` is refused; approve/reject invokes `verify-golfer-decision`, removal invokes the same endpoint (`useVerifications.ts:255–277,347–359`).
- Repository edge function validates bearer user, requires `admin_memberships.role` full or limited, permits approved/rejected/removed, requires structured reason for rejection/removal and minimum three-character note for Other. It calls decision/removal RPCs with the **caller's JWT**, not a service-role caller token (`supabase/functions/verify-golfer-decision/index.ts:26–33,80–140`).
- Repository `decide_golfer_verification` rejects already-decided requests, writes request status/reviewer/reason, sets profile golfer verification on approval, and writes audit + notification. One accepted approval completes verification; the body does not implement a two-reviewer quorum despite request approval-count columns. SELECT then UPDATE is not locked and UPDATE lacks a status predicate (`supabase/migrations/20260818133810_2cb744b0-36f0-47b6-8006-9d92f824449c.sql:165–231`). Removal clears verification and marks approved requests removed (`same file:237–269`). These are repository findings, not assertions about deployed SQL.

### Email / push

- Approval email says the badge is live across profile, posts and reviews and includes an app-opening link. Rejection/removal email contains structured-reason wording plus admin note; HTML body is escaped. Recipient comes from auth email, falling back to profile email; no recipient/key means a successful skipped result (`supabase/functions/send-golfer-verification-result-email/index.ts:20–22,46–99`).
- The email handler itself does **not** validate caller identity in its source; its gateway deployment protection is unverified (`same file:38–54`). Do not expose a public pro request flow through this helper without confirming that boundary.
- Notification helper is launched without awaiting completion before returning the decision response. It awaits email invocation but does not inspect returned `error`; delivery success is therefore not guaranteed. Removal push uses the rejected kind due to its approved-versus-other ternary (`verify-golfer-decision/index.ts:35–69,147–152`).

### Activity kinds

- Decision/removal RPC source emits `golfer_verification_approved`, `golfer_verification_rejected`, `golfer_verification_removed` (`20260818133810_2cb744b0-36f0-47b6-8006-9d92f824449c.sql:212–220,259–262`).
- Ledger has the explicit **`golfer_verified`** presentation, not those three emitted kinds. Unknown no-actor kinds use generic Bell rather than that verification tile (`src/features/activity-v2/components/ledgerKinds.tsx:437–445,459–471`). Links explicitly route `golfer_verified` to `/profile`, while the three other kinds fall through generic data/actor handling; no equivalent profile destination is established (`src/features/activity-v2/utils/activityLinks.ts:452–454,474–489`).
- Repository activity RPC returns stored notification type/title/message/data without renaming these golfer kinds (`supabase/migrations/20260726113545_6f8418c3-d481-4d72-85ac-673dd76c9bbe.sql:46–47`). **Confirmed source mismatch, not a verified live-delivery result.**
- **Deployed `verify-golfer-decision` equals repository version: cannot tell.** Repository config/source and logs cannot prove deployed byte parity; no deployment-source comparison was available under the no-SQL, read-only audit constraints (`supabase/config.toml`; edge source above).

## 7. Security

### Own profile verification columns

**Live RLS does not prevent the owner from targeting verification fields. End-to-end exploitability is unverified, not “safe”.** Hosted snapshot shows owner UPDATE USING and WITH CHECK only `auth.uid() = id`, plus another owner UPDATE policy; no verification-column allowlist is expressed by those policies (`/tmp/tool-results/security--get_table_schema/20261104-174523-424887:9932–9948`). The profile includes `is_verified_golfer`, `golfer_verified_at`, `golfer_verified_by`, and generic `is_verified` (`same snapshot:3909–3911,3928`). Repository owner policy likewise only checks row ownership (`supabase/migrations/20250615053001-49d057ef-8835-4a70-a38c-894d9dfe6740.sql:31–36`).

Given UPDATE grants for those fields and no guarding trigger, a signed-in owner could submit them through the client. **Those prerequisites were not proven live**: the schema tool does not give a complete live trigger/column privilege inventory, and executing SQL or a production mutation was prohibited. The inspected repository timestamp trigger only sets `updated_at`, not verification protection (`supabase/migrations/20250616121232-d8b7f7b5-c43a-4378-b398-425ff91e6264.sql:1–22`). No verification guard was found in searched repository migrations, which is not proof of absence in production. The build should not rely on client save allowlists as its security boundary.

### `gvr_update_own`

Hosted policy permits selecting the **old own invited row**, with replacement check only own `user_id` (`hosted snapshot:7654–7660`). It does not limit the replacement row to invited status or whitelist editable columns. Subject to actual grants/constraints/triggers, a member could change status, evidence/note, inviter, timestamps and admin/reviewer/approval-looking metadata that the table exposes (`hosted snapshot:1804–1827`; `supabase/migrations/20251213065956_ce57fe4b-16ec-4b10-922e-5e00a41b3b2e.sql:59–61`). Allowed statuses still constrain values (`supabase/migrations/20251214062100_fac3ed2f-1c8b-415a-bdee-0b1436a9e496.sql:1–10`).

The owner cannot use this policy to change `user_id` to someone else. Moving away from invited loses this own-update eligibility on later updates. **Setting request status to approved is not itself proof that the profile becomes verified**: repository profile verification is an explicit write in the decision RPC (`20260818133810_2cb744b0-36f0-47b6-8006-9d92f824449c.sql:205–209`). Complete live side effects remain unverified.

## 8. Tour link and results

- `sr_players.id` is the internal player UUID; `sr_id` is the external identifier. Names and `tour_codes` are separate data fields (`hosted snapshot:2942–2975`). `/tourhub/player/:playerId` mounts the player page (`src/App.tsx:825`); `useTourPlayer` selects by **internal `id`** (`src/features/tourhub/hooks/useTourHubData.ts:404–418`). Do not store an external Sportradar string as this route ID.
- Current player page reads header and year/season results (`src/features/tourhub/player-v2/PlayerPage.tsx:1–65`); season reader calls `get_player_season_results(p_player_id, p_year)` (`src/features/tourhub/player-v2/data/usePlayerData.ts:27–32`; generated contract `src/integrations/supabase/types.ts:23893–23914`).
- No dedicated member-profile → `sr_players` link appears among the observed live profile columns (`hosted snapshot:3835–3930`). **Suggested link, not implemented:** administrator-approved internal player UUID for tour professionals; teaching professionals need not have a Tour record. A matching name alone should not establish ownership.
- Supported code vocabulary is PGA `pga`, DP World `euro` / stored `EURO`, LPGA `lpga` / `LPGA`, Korn Ferry `pgad` / `PGAD`, LIV `liv` / `LIV`, Champions `champ` / `CHAMP` (`src/features/tourhub/player-v2/playerRules.ts:19–21`; `src/features/tourhub/constants/tourMap.ts:16–18`). **This proves recognized labels, not that we hold populated season results for each tour.** Actual held results by tour cannot be enumerated from types/source; no live SQL was run. Leaderboards use internal player IDs (`hosted snapshot:2837–2860`).

## 9. Existing test coverage inventory

Files below exist in the checkout; listing is not a new pass claim. Tests were not changed or run. Citations identify their source files; the only specifically found golfer-kind parity case is called out explicitly.

| Area | Existing files |
|---|---|
| Welcome / creator | `src/test/ob1Welcome.test.tsx`, `ob13AuthHolding.test.tsx`, `ob14LinkedElsewhere.test.tsx`, `ob15SetupConnect.test.tsx`, `cr1CreatorChoice.test.tsx`. |
| Edit profile | `src/test/ep1EditProfile.test.tsx`, `ep2EditProfileYou.test.tsx`, `ep21UsernameRule.test.tsx`, `ep3EditProfileGolf.test.tsx`, `ep4LinksPrivacy.test.tsx`, `ep5Completion.test.tsx`, `ep51SearchAndCarets.test.tsx`, `ep52SheetsCropperCoach.test.tsx`, `cr1CreatorChoice.test.tsx`. |
| Profile hero / tabs / member sheets | `src/test/cr2CreatorProfile.test.tsx`, `linkedHandicapProfile.test.tsx`, `heroConnectPanel.test.tsx`, `heroConnectExample.test.tsx`, `profileHeroClubWhite.test.tsx`, `profileBioFull.test.tsx`, `profileRoundsVoice.test.tsx`, `profileCoursesVoice.test.tsx`, `profileAchievementsPane.test.tsx`, `profileSheetRebuild.test.tsx`, `profileSheetV3.test.tsx`. Related linked-null states: `linkedHandicapState.test.tsx`, `linkedHandicapManage.test.tsx`, `linkedHandicapDone.test.tsx`. |
| Rounds gate | `src/test/roundsGate.test.ts`, `roundsGateAnalytics.test.tsx`, `roundsGateLookLock.test.tsx`, `roundsGateNav.test.tsx`, `roundsGateShortScreen.test.tsx`, `unknownConnectionFallback.test.tsx`, `youTabNoGate.test.ts`. |
| No-connection Settings/export | `src/test/st2SettingsHandicapCard.test.tsx`, `st5SettingsYourData.test.tsx`. |
| Admin golfer decisions / security | No dedicated tests of golfer decision endpoint, the three emitted ledger kinds, own verification-field writes or invited-request-column restrictions were identified in the inspected test inventory. Admin queue tests alone must not be described as coverage of these security rules. |
| Activity golfer kind | `src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts:122` has **`golfer_verified`** parity; it is not proof of approved/rejected/removed rendering or delivery. |
| Tour player/result contract | `src/test/playerRebuildPage.test.tsx`, `playerRebuildRules.test.ts`, `playerSeason.test.ts`, `playersRules.test.ts`, `worldRankingsRebuild.test.tsx`. These do not establish member-to-player ownership or populated results for all recognized tours. |

## Close-out

Report only. The important source findings are the inviter-as-subject queue mapping, golfer notification-kind mismatch, invitation-only copy, duplicated Rounds eligibility decision and owner-update policies without verification-column restrictions. **Live trigger/grant enforcement, deployed edge parity, exhaustive name/RPC count and actual result coverage are explicitly not verified.** No pro feature build has started.