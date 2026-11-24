# Batch D — Messages and Activity audit

Read-only, source/caller-traced census. No SQL, migrations, tests or source changes. `M` = `/messages` → InboxV2Page; `T` = `/messages/:conversationId` → ThreadV2Page; `A` = `/notificationmessages` → ActivityPageV2. MessagingShell owns M/T (App.tsx:736–738); Activity is App.tsx:744. Navigation out is a scope exit; shared scorecard/results/Likes/comments retain A–C roles.

**43 selected-grey rows:** E1 3, E2 14, K1 0, K2 2, K3 20, K4 2, K5 0, K6 2, D 0. **Nine E declarations**; eight K declarations. Ben's 21:13 UTC ruling selects canonical #F8FAFC for the four Messages labels only; MSG/MT/EC tokens remain frozen. Uppercase below is CSS-rendered text, not a copy change; catalogue source branding remains lowercase clbhouz.

| File:line | Text/key | Route / parent | Role | Old → planned / keep |
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

## Runtime distinctions and exclusions

- Fold suffix is constructed in `headerLabel` and shares `{label}`. No New fold variant (`tone === 'new'` disables folding). Do not split its node or change geometry to preserve a grey suffix.
- Accept/pending … is inverted canvas, not grey. SuggestedGolferRow's club and reciprocal reasons are amber; SuggestedGolfersBlock's reciprocal reason is independently grey and selected.
- ConversationSettingsSheet Together/Head to head use MT.MICRO .06em, below threshold. Activity chips, ordinary menus/settings/report/share/add-people inputs and round captions lack qualifying typography.
- Messaging share pickers' BizcSheet wrapper does not cause every business CSS label selector to render. Only actual descendants are counted.
- No selected dead declaration or unresolved role in this local census. The ink choice was resolved by Ben at 21:13 UTC.

## Every presentation caller and shared reach

| Component | Production caller | Outside D |
|---|---|---|
| InboxV2Page | App.tsx:342,737 | none |
| NewConversationSheet | InboxV2Page.tsx:22,452 | none |
| ConversationSettingsSheet (named/default exports checked) | ThreadV2Page.tsx:15,643 | none |
| PlayingOffRail | ThreadV2Page.tsx:30,489 | none |
| Local SectionHeader | ActivityPageV2.tsx:485 | none |
| FeaturedMomentCard | ActivityPageV2.tsx:535 | none |
| FriendRequestsRail | ActivityPageV2.tsx:536 | none |
| ActivityActionsSheet | ActivityPageV2.tsx:624 | none |
| SuggestedGolfersBlock | ActivityPageV2.tsx:608 | none |
| NobodySawThatRound | ActivityPageV2.tsx:538 | none |
| Rendered SuggestedGolferRow | NobodySawThatRound.tsx:148 | none |

`reasonText` helper has external users: WelcomeGolfers → Welcome.tsx:149 (`/welcome`); PeopleShelf → ExploreMagazine.tsx:1349 (reach/dormancy see C); SuggestedGolfersRail has no located production presentation caller. These helper users do not share the proposed heading declaration. Keep helper logic and metadata colours unchanged. MT.EYEBROW's four production consumers are exactly the four selected Messages sites; do not repoint MT.MICRO, MSG or EC tokens.