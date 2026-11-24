Superseded by surface batches; not a ruling.

## Part 2 — provisional full-source extraction; NOT exhaustive sign-off

The read-only extraction scanned 1,083 files outside the delegated Tour/Explore/search groups; a second audit inspected 247 files in those groups. The first extraction produced 727 unresolved/provisional JSX candidate templates, 152 recognised-colour exclusions and 337 CSS rules declaring tracking (including rules below the threshold and resets). The Tour/Explore review returned 69 reviewed/provisional rows. These are **not** 796 distinct qualifying sites: overlaps, compound CSS, runtime conditional colours, inherited props and duplicate wrappers still need reconciliation. Consequently the brief’s rough 345-site figure cannot honestly be reconciled to a confirmed rendered-site count.

**Remaining work:** review every candidate’s resolved final colour/case/tracking, expand complex CSS to rendered consumers, trace routes, prove deadness, assign E1/E2/K1–K6, deduplicate, and capture every remaining feasible E1/E2. The table below preserves every extracted JSX candidate with its available evidence rather than guessing. `?` means role or reachability unverified, not dead. No D claim is made on mere absence of a caller. Counts below are extraction-row counts only, not signed-off role totals.

### Candidate role counts

| Role | Confirmed count |
|---|---|
| E1 | Not fully audited |
| E2 | Not fully audited |
| K1 | Not fully audited |
| K2 | Not fully audited |
| K3 | Not fully audited |
| K4 | Not fully audited |
| K5 | Not fully audited |
| K6 | Not fully audited |
| D | No deadness claims verified |
| ? | 727 extracted templates awaiting full role/route review |

### Uncertainty list

- Every `?` row below: final runtime colour/conditional branch and route/role have not both been verified.
- WatchFeed’s inline heading qualifiers: E1 versus K3; no Part 1 change.
- BusinessEmptyState “Your golfers”: chart-label K3 versus E2; retained grey.
- StandoutRounds NET/GROSS: stat K2 versus column K1; retained grey.
- AchievementCallout prop labels: uppercase output depends on the caller.
- CompetitionBoards caller style spread: final colour depends on caller overrides.
- LatestReviewsSheet is explicitly documented DEAD / NO CALLERS in its header; its canonical-looking caption was left unchanged. It is not proof that all other missing-callers candidates are dead.

### Extracted JSX templates

Values beginning `?` are unresolved expressions. Rows already Part 1 ink in the current build are baseline extraction rows, not remaining grey findings. Table ordering places unresolved roles and unresolved routes together, then sorts by file/line.

| Role | Route / dead | File:line | Rendered text/key | Size / weight / tracking | Colour | Evidence |
|---|---|---|---|---|---|---|
| ? | ? | `src/components/DeletedAccountScreen.tsx:39` | `Account closed` | 11 / 700 / 0.10em | `?SURFACE.dark.mute` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/GlobalBottomNavigation.tsx:52` | `Post` | 9 / 700 / 0.13em | `?` | src/components/bottom-navigation/postReviewMark.css:3 |
| ? | ? | `src/components/GlobalBottomNavigation.tsx:58` | `Review` | 9 / 700 / 0.13em | `?` | src/components/bottom-navigation/postReviewMark.css:3 |
| ? | ? | `src/components/GlobalBottomNavigation.tsx:583` | `{tab.id === 'tourhub' && tourLive ? 'Live' : tab.label}` | 9 / 700 / 0.13em | `#F7931E OR rgba(247,147,30,0.72) OR #34D77F OR ?(() => { const h = LIVE_INK.replace('#', ''); const n = parseInt(h, 16); return \`rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.62)\`; })() OR #FFFFFF OR #0F172A OR rgba(255,255,255,0.62) OR rgba(15,23,42,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/SuspendedScreen.tsx:145` | `Account status` | 11 / 600 / 0.14em | `rgba(255,255,255,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/SuspendedScreen.tsx:159` | `Reason` | 11 / 600 / 0.12em | `#94A3B8` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/SuspendedScreen.tsx:333` | `Submitted {formatDateNumeric(new Date(row.created_at))}` | 11 / ? / 0.08em | `#64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/achievements/LevelUpSheet.tsx:77` | `{t('levelUp.youReached')}` | 11 / 700 / 0.16em | `rgba(255,255,255,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/AccessRequestsSection.tsx:94` | `{t(\`${prefix}.askedToJoin\`)}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/index.css:658; src/index.css:659 |
| ? | ? | `src/components/business/AccessRequestsSection.tsx:94` | `{query.data.length}` | 10.5px / 700 / .12em | `rgba(248,250,252,0.42)` | src/index.css:658; src/index.css:659; src/index.css:660 |
| ? | ? | `src/components/business/AccessRequestsSection.tsx:121` | `{t(\`${prefix}.role\`)}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/index.css:659; src/index.css:676 |
| ? | ? | `src/components/business/BusinessCommandCard.tsx:241` | `{t('business.card.manage')}` | 11 / 700 / 0.10em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessEmptyState.tsx:110` | `On clbhouz today` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessEmptyState.tsx:152` | `Golf businesses on clbhouz` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessEmptyState.tsx:164` | `What every business gets` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessEmptyState.tsx:178` | `Your insights` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessEmptyState.tsx:179` | `Sample` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessEmptyState.tsx:193` | `Your golfers` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessEmptyState.tsx:207` | `Built for your kind of business` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessEmptyState.tsx:217` | `How it works` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessFollowersCard.tsx:81` | `{t('business.followers.kicker', { defaultValue: 'Their followers' })}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessFollowersCard.tsx:85` | `{t('business.followers.withHandicap', { count: handicap_count, n: formatNumber(handicap_count), defaultValue: \`${formatNumber(handicap_count)} with a handicap\` })}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessFollowersCard.tsx:103` | `{t('business.followers.you', { defaultValue: 'You' })}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessFollowersCard.tsx:120` | `{t('business.followers.wherePlay', { defaultValue: 'Where they play most' })}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessMentionsRail.tsx:59` | `{t('business.mentions.posts', { count: q.data.count, defaultValue: q.data.count === 1 ? '1 post' : \`${q.data.count} posts\` })}` | 10.5px / 700 / .12em | `rgba(248,250,252,.42)` | src/components/business/businessMentions.css:1; src/components/business/businessMentions.css:3 |
| ? | ? | `src/components/business/BusinessNearbyCourses.tsx:95` | `{t('business.nearby.rating', { defaultValue: 'Rating' })}` | 9.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessNearbyCourses.tsx:128` | `{t('business.nearby.kicker', { defaultValue: 'Courses nearby' })}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessNearbyCourses.tsx:131` | `{t('business.nearby.within', { defaultValue: 'Within 10 miles' })}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/BusinessTeamTab.tsx:109` | `{m.job_title &#124;&#124; t(ROLE_KEY[m.role])}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | src/index.css:3849 |
| ? | ? | `src/components/business/ClubFromTheClub.tsx:55` | `{heading}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/ClubFromTheClub.tsx:57` | `{postsCount === 1 ? '1 post' : \`${postsCount} posts\`}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/ClubHowItPlays.tsx:100` | `Early data` | 9.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/ClubHowItPlays.tsx:150` | `How it plays` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/ClubHowItPlays.tsx:152` | `{roundsLabel(total)}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/ClubVisiting.tsx:78` | `{nonClub ? kicker : 'Visiting'}` | 10.5px / 700 / .16em | `rgba(248,250,252,.62)` | src/index.css:561; src/index.css:562 |
| ? | ? | `src/components/business/ClubWhatGolfersSay.tsx:137` | `What golfers say` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/ClubWhatGolfersSay.tsx:162` | `What golfers say` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/ClubWhatGolfersSay.tsx:163` | `{total === 1 ? '1 review' : \`${formatNumber(total)} reviews\`}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/PhoneInputWithDialCode.tsx:109` | `Code` | 10px / 700 / .14em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-where-contact.css:8 |
| ? | ? | `src/components/business/PhoneInputWithDialCode.tsx:192` | `Number` | 10px / 700 / .14em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-where-contact.css:12; src/components/business/editor/business-where-contact.css:8 |
| ? | ? | `src/components/business/TeamInvitesSection.tsx:155` | `{t('business.team.sectionTwo.roleSheet.kicker')}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/index.css:659; src/index.css:676 |
| ? | ? | `src/components/business/TeamInvitesSection.tsx:174` | `{t(\`${P}.kicker\`)}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/index.css:709; src/index.css:659 |
| ? | ? | `src/components/business/TeamInvitesSection.tsx:174` | `{rows.length}` | 10.5px / 700 / .12em | `rgba(248,250,252,0.42)` | src/index.css:709; src/index.css:659; src/index.css:710 |
| ? | ? | `src/components/business/TeamListSection.tsx:194` | `{t(\`${P}.roleSheet.kicker\`)}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/index.css:659; src/index.css:676 |
| ? | ? | `src/components/business/TeamListSection.tsx:256` | `{t(\`${P}.kicker\`)}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/index.css:709; src/index.css:659 |
| ? | ? | `src/components/business/TeamListSection.tsx:256` | `{t(\`${P}.window\`)}` | 10.5px / 700 / .12em | `rgba(248,250,252,0.42)` | src/index.css:709; src/index.css:659; src/index.css:710 |
| ? | ? | `src/components/business/TeamRolesActivity.tsx:20` | `{t(\`${P}.rolesKicker\`)}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/index.css:709; src/index.css:659 |
| ? | ? | `src/components/business/TeamRolesActivity.tsx:54` | `{t(\`${P}.activityKicker\`)}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/index.css:709; src/index.css:659 |
| ? | ? | `src/components/business/YouCardShell.tsx:22` | `{kicker}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:539; src/index.css:540 |
| ? | ? | `src/components/business/editor/BusinessEditPreview.tsx:81` | `Business` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-edit.css:34; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/business/editor/BusinessEditProfileLinks.tsx:51` | `On your profile` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-edit.css:79; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/business/editor/BusinessEditProfileLinks.tsx:56` | `Links` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-edit.css:79; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/business/editor/BusinessEditSettings.tsx:34` | `Verification` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-edit.css:10; src/features/edit-profile/edit-profile.css:134; src/features/edit-profile/edit-profile.css:143; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/business/editor/BusinessEditSettings.tsx:41` | `Team` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-edit.css:10; src/features/edit-profile/edit-profile.css:134; src/features/edit-profile/edit-profile.css:143; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/business/editor/BusinessEditWhereContact.tsx:57` | `Where` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-where-contact.css:3; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/business/editor/BusinessEditWhereContact.tsx:61` | `Contact` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/components/business/editor/business-where-contact.css:3; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/business/editor/NotificationsSection.tsx:83` | `Notifications` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/business/hero/ClubProfileHero.tsx:188` | `{c.label}` | 9.5 OR 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/hero/ClubProfileHero.tsx:314` | `{t('business.clubHero.soon', 'Soon')}` | 9.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | src/index.css:2996; src/index.css:3486; src/index.css:3702; src/index.css:3755 |
| ? | ? | `src/components/business/hero/ClubProfileHero.tsx:327` | `{t('business.clubHero.soon', 'Soon')}` | 9.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | src/index.css:2996; src/index.css:3486; src/index.css:3702; src/index.css:3755 |
| ? | ? | `src/components/business/home/BusinessDoNextCard.tsx:74` | `{t('business.doNext.kicker')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/home/BusinessWeekCard.tsx:95` | `{t('business.week.kicker', { defaultValue: 'This week' })}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/home/BusinessWeekCard.tsx:96` | `{t('business.week.window', { defaultValue: 'Last 7 days' })}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/home/BusinessWeekCard.tsx:241` | `{l}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/home/BusinessWeekCard.tsx:287` | `{labels[0]}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/home/BusinessWeekCard.tsx:293` | `{labels[1]}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/home/BusinessWeekCard.tsx:299` | `{labels[2]}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/insights/InsightsAudienceSection.tsx:29` | `{right !== undefined && <span>{right}</span>}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsAudienceSection.tsx:29` | `{left}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsAudienceSection.tsx:29` | `{right}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsAudienceSection.tsx:57` | `{k('handicapsKicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5520; src/index.css:5554 |
| ? | ? | `src/components/business/insights/InsightsAudienceSection.tsx:66` | `{k('regionsKicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5520; src/index.css:5554 |
| ? | ? | `src/components/business/insights/InsightsCourseSection.tsx:40` | `{d.rounds > 0 && <span data-total={d.rounds}>{k('rounds', { count: d.rounds, n: formatNumber(d.rounds) })}</span>}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5640; src/index.css:5641 |
| ? | ? | `src/components/business/insights/InsightsCourseSection.tsx:40` | `{k('kicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5640; src/index.css:5641 |
| ? | ? | `src/components/business/insights/InsightsCourseSection.tsx:40` | `{k('rounds', { count: d.rounds, n: formatNumber(d.rounds) })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5640; src/index.css:5641 |
| ? | ? | `src/components/business/insights/InsightsCourseSection.tsx:56` | `{k('regionsKicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5640; src/index.css:5641; src/index.css:5663 |
| ? | ? | `src/components/business/insights/InsightsEngagementSection.tsx:40` | `{k('kicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsFollowersSection.tsx:34` | `{k('kicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsFollowersSection.tsx:35` | `{k('inTotal', { n: formatNumber(d.total) })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsFunnel.tsx:174` | `{k('kicker')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/insights/InsightsFunnel.tsx:175` | `{k('kickerDays', { days })}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/insights/InsightsPostsSection.tsx:103` | `{kind !== 'nothing' && <span data-kicker-right>{k('reachedLabel')}</span>}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5568; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsPostsSection.tsx:104` | `{k('kicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5568; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsPostsSection.tsx:105` | `{k('reachedLabel')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5568; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsReviewsSection.tsx:50` | `{k('kicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5616; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsReviewsSection.tsx:70` | `{k('kicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5616; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsReviewsSection.tsx:70` | `{k('count', { count: d.total, n: formatNumber(d.total) })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5616; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsReviewsSection.tsx:95` | `{k('scoresKicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5616; src/index.css:5520; src/index.css:5627 |
| ? | ? | `src/components/business/insights/InsightsVisitsSection.tsx:33` | `{k(days === 90 ? 'weeklyKicker' : 'kicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5519; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsVisitsSection.tsx:33` | `{k('visitCount', { count: funnel.opened.visits, n: formatNumber(funnel.opened.visits) })} · {k('golferCount', { count: funnel.opened.value, n: formatNumber(funnel.opened.value) })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5519; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsVisitsSection.tsx:41` | `{k('sourcesKicker')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5519; src/index.css:5520 |
| ? | ? | `src/components/business/insights/InsightsVisitsSection.tsx:41` | `{k('sourcesUnit')}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/index.css:5519; src/index.css:5520 |
| ? | ? | `src/components/business/verification/VerificationFlowSheet.tsx:732` | `{safeIndex + 1} / {pages.length}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/verification/VerificationFlowSheet.tsx:1117` | `Image or PDF · Max 10MB` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/verification/VerificationFlowSheet.tsx:1203` | `Choose one` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/business/verification/VerificationFlowSheet.tsx:1299` | `What the reviewer will get` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/clubhouse/ClubhouseEmptyState.tsx:39` | `Sign in` | 13 / 600 / 0.10em | `#0F172A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/clubhouse/ClubhouseEmptyState.tsx:86` | `Sign in` | 13 / 600 / 0.10em | `#0F172A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/clubhouse/FriendsEmptyState.tsx:299` | `See your feed` | 13 / 700 / 0.10em | `#0A0A0C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/clubhouse/FriendsEmptyState.tsx:512` | `{followed && <Check size={12} strokeWidth={2.6} />} {followed ? 'Following' : 'Follow'}` | 12 / 600 / 0.10em | `rgba(255,255,255,0.40) OR #000000` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/clubhouse/FriendsEmptyState.tsx:594` | `{icon}` | 11 / 600 / 0.10em | `rgba(255,255,255,0.60)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/course-media-tab/CoursePlaceTiles.tsx:32` | `{t('media.v2.shots', { count, defaultValue: "{{count}} shots" })}` | 9.5px / 700 / .14em | `rgba(248,250,252,.42)` | src/components/course-media-tab/media-v2.css:30; src/components/course-media-tab/media-v2.css:4; src/components/course-media-tab/media-v2.css:6 |
| ? | ? | `src/components/course-media-tab/HoleWalk.tsx:36` | `{t('media.v2.coverage', { shot: walk.photographed, holes: holes.length, defaultValue: \`${walk.photographed} of ${holes.length} holes\` })}` | 9.5px / 700 / .14em | `rgba(248,250,252,.42)` | src/index.css:808; src/components/course-media-tab/media-v2.css:7; src/components/course-media-tab/media-v2.css:4; src/components/course-media-tab/media-v2.css:6 |
| ? | ? | `src/components/course-media-tab/ReadyShotCover.tsx:27` | `{t('media.v2.processing', { defaultValue: "Processing" })}` | 11px / 700 / .14em | `rgba(248,250,252,.42)` | src/components/course-media-tab/media-v2.css:24 |
| ? | ? | `src/components/course-media-tab/ShotTagCard.tsx:56` | `{t('media.v3.position', { ...position, defaultValue: \`${position.i} OF ${position.n}\` })}` | 11 / 700 / 0.16em | `rgba(248,250,252,.42)` | src/components/course-media-tab/media-v3.css:1; src/components/course-media-tab/media-v3.css:2; src/components/course-media-tab/media-v3.css:5; src/components/course-media-tab/media-v2.css:6 |
| ? | ? | `src/components/course-media-tab/ShotTagChoices.tsx:16` | `{t('media.v3.holes', { defaultValue: 'A hole on the course' })}` | 9.5px / 700 / .14em | `rgba(248,250,252,.42)` | src/components/course-media-tab/media-v2.css:6; src/components/course-media-tab/media-v3.css:15 |
| ? | ? | `src/components/course-media-tab/ShotTagChoices.tsx:21` | `{t('media.v3.around', { defaultValue: 'Around the club' })}` | 9.5px / 700 / .14em | `rgba(248,250,252,.42)` | src/components/course-media-tab/media-v2.css:6; src/components/course-media-tab/media-v3.css:15 |
| ? | ? | `src/components/courses/BrowseCourseCard.tsx:78` | `COURSE RECORD` | 8.5px / 700 / 0.14em | `#E2B04A` | src/components/courses/courseListCard.css:1; src/components/courses/courseListCard.css:14; src/components/courses/courseListCard.css:15; src/components/courses/courseListCard.css:26; src/components/courses/courseListCard.css:27; src/components/courses/courseListCard.css:28 |
| ? | ? | `src/components/courses/BrowseCourseCard.tsx:79` | `GROSS` | 8px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/components/courses/courseListCard.css:1; src/components/courses/courseListCard.css:14; src/components/courses/courseListCard.css:15; src/components/courses/courseListCard.css:26; src/components/courses/courseListCard.css:30; src/components/courses/courseListCard.css:32 |
| ? | ? | `src/components/courses/CourseDirectorySheet.tsx:235` | `{t('directorySheet.recentHeading')}` | 11 / 700 / 0.14em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/CourseDirectorySheet.tsx:279` | `{t('directorySheet.ratedHeading')}` | 11 / 700 / 0.14em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/CourseListRow.tsx:12` | `COURSE` | 9px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/components/courses/courseListView.css:4; src/components/courses/courseListView.css:6 |
| ? | ? | `src/components/courses/CourseMasthead.tsx:131` | `{kicker}` | 11 / 700 / 0.15em | `?kickerColor` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/CoursesPageHero.tsx:309` | `COURSE RECORD` | 8.5px / 700 / 0.14em | `#E2B04A` | src/components/courses/courseListCard.css:26; src/components/courses/courseListCard.css:27; src/components/courses/courseListCard.css:28 |
| ? | ? | `src/components/courses/CoursesPageHero.tsx:310` | `GROSS` | 8px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/components/courses/courseListCard.css:26; src/components/courses/courseListCard.css:30; src/components/courses/courseListCard.css:32 |
| ? | ? | `src/components/courses/RateNudge.tsx:154` | `{t('rateNudge.rateCta')}` | 11 / 700 / 0.10em | `#0A0A0C` | src/index.css:3849; src/index.css:3876 |
| ? | ? | `src/components/courses/ReviewRailSlot.tsx:96` | `{loc}` | 9 / 700 / .16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/ReviewRailSlot.tsx:301` | `{label}` | 9 / 700 / .19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/StatBrowse.tsx:613` | `{g.country}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/StatBrowse.tsx:661` | `{t('statBrowse.colRegion')}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/StatBrowse.tsx:708` | `{reason}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/StatBrowse.tsx:883` | `{country ? t('statBrowse.empty.lensSwitch', { country }) : t('statBrowse.empty.lensSwitchAll')}` | 12px / 700 / 0.10em | `#0A0A0C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/Top100CoursesHubPanel.tsx:398` | `FEWER THAN TWO RATINGS` | 11px / 700 / .16em | `rgba(248,250,252,.62)` | src/components/courses/top100/top100Compare.css:1; src/components/courses/top100/top100Compare.css:2 |
| ? | ? | `src/components/courses/UnifiedCourseCard.tsx:291` | `{viewerStatus === 'rated' ? t('card.rated') : t('card.played')}` | 11 / 700 / 0.10em | `rgba(255,255,255,0.82)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/UnifiedCourseCard.tsx:334` | `{statChip.unit}` | 11 / 700 / 0.10em | `rgba(255,255,255,0.75)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/YourStatsChip.tsx:86` | `{label}` | 9 / 700 / 0.10em | `?` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/browse/HardestSection.tsx:65` | `Avg over par` | 8 / 700 / 0.16em | `rgba(255,255,255,0.78)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/browse/LatestCoursesSection.tsx:153` | `{row.media_count === 1 ? 'Member shot' : 'Member shots'}` | 8 / 700 / 0.16em | `rgba(255,255,255,0.82)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/browse/LatestHolesSection.tsx:86` | `PAR {row.par} {row.yards != null && <>{' \u00B7 '}{row.yards} YDS</>}` | 8.5px / 700 / 0.14em | `rgba(255,255,255,0.88)` | src/components/courses/browse/latestHoles.css:2; src/components/courses/browse/latestHoles.css:9; src/components/courses/browse/latestHoles.css:11 |
| ? | ? | `src/components/courses/browse/ListScopeHeader.tsx:84` | `{caption}` | 10 / 700 / 0.18em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/browse/ListScopeHeader.tsx:97` | `{cell.label}` | 9 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/browse/sectionShells.tsx:286` | `{'\u00A0'}` | 10 / 700 / 0.13em | `rgba(248,250,252,0.58)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/AboutMediaStrip.tsx:120` | `{\`${photoCount} ${photoCount === 1 ? 'photo' : 'photos'} \u00B7 ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}\`}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CategoryScores.tsx:92` | `{label}` | 8 / 700 / 0.08em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CategoryScores.tsx:146` | `{label}` | 9 / 700 / 0.09em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CategoryScores.tsx:179` | `{t('courseDetail.communityScore.overall')}` | 9 / 700 / 0.09em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:297` | `{t('courseDetail.claim.sheet.panelKicker')}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:298` | `{t(rounds < 10 ? 'courseDetail.claim.sheet.earlyData' : 'courseDetail.claim.sheet.live')}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:313` | `{t('courseDetail.claim.sheet.roundsMeasured')}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:323` | `{t('courseDetail.claim.sheet.rated')}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:336` | `{t('courseDetail.claim.sheet.photos')}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:347` | `{t('courseDetail.claim.sheet.holeByHole')}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:443` | `{t('courseDetail.claim.sheet.gainsTitle')}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:474` | `{t('courseDetail.claim.sheet.stepsTitle')}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:553` | `{t('courseDetail.claim.sheet.claimAsLabel')}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/ClaimCourseSheet.tsx:699` | `{t('courseDetail.claim.sheet.kicker')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CourseRecordBook.tsx:197` | `{isCourseRecord && <Crown size={10} color={A.AMBER} strokeWidth={2.6} />} {legendCategoryLabel[category]}` | 11 / 700 / 0.13em | `#F7931E OR ?undefined` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CourseRecordBook.tsx:235` | `{t(\`courseDetail.records.units.${UNIT_KEY[category]}\`)}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CourseWebsiteSheet.tsx:401` | `{t('courseDetail.websiteSheet.officialWebsite', { defaultValue: 'OFFICIAL WEBSITE' })}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CourseWebsiteSheet.tsx:472` | `{t('courseDetail.websiteSheet.beforeYouGo', { defaultValue: 'BEFORE YOU GO' })}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CourseWebsiteSheet.tsx:476` | `{(rounds as number) < 10 ? t('courseDetail.websiteSheet.earlyData', { defaultValue: 'EARLY DATA · {{n}} ROUNDS', n: rounds, }) : t('courseDetail.websiteSheet.roundsMeasured', { defaultValue: '{{n}} ROUNDS MEASURED', n: rounds, })}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CourseWebsiteSheet.tsx:498` | `{t('courseDetail.websiteSheet.avgOverPar', { defaultValue: 'AVG OVER PAR' })}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CourseWebsiteSheet.tsx:513` | `{t('courseDetail.websiteSheet.hardestHole', { defaultValue: 'HARDEST HOLE' })}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/CourseWebsiteSheet.tsx:531` | `{t('courseDetail.websiteSheet.ratedOutOfTen', { defaultValue: 'RATED /10' })}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AboutSection.tsx:167` | `{kicker}` | 11 OR 9 / 700 / 0.16em OR 0.19em | `#F8FAFC OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:54` | `{label}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:68` | `{t(bucket.labelKey.replace('courses:', ''))}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:133` | `{t('courseDetail.holes.colPar')}` | 7 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:137` | `{t('courseDetail.holes.colSi')}` | 7 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:143` | `{t('courseDetail.plays.legendField')}` | 7 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:148` | `{t('courseDetail.plays.legendYou')}` | 7 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:214` | `{t('courseDetail.allHolesSheet.si')}` | 8 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:216` | `{t('courseDetail.allHolesSheet.plays')}` | 8 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/AllHolesSheet.tsx:341` | `{courseName}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/CenteredStatStrip.tsx:22` | `{item.label}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/CourseHonoursSection.tsx:64` | `{paged ? ( <span data-honours-position className="honours-pos"> {fillTemplate(t('courseDetail.honours.pageOf', { k: page + 1, pages: pages.length, defaultValue: '{{k}} of {{pages}}' }) as string, { k: page + 1, pages: pages.length })} </span> ) : null}` | 10px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/components/courses/course-detail/about/course-honours.css:2; src/components/courses/course-detail/about/course-honours.css:4 |
| ? | ? | `src/components/courses/course-detail/about/CourseHonoursSection.tsx:65` | `{label} ·` | 10px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/components/courses/course-detail/about/course-honours.css:2; src/components/courses/course-detail/about/course-honours.css:4 |
| ? | ? | `src/components/courses/course-detail/about/CourseHonoursSection.tsx:65` | `{rows.length}` | 10px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/components/courses/course-detail/about/course-honours.css:2; src/components/courses/course-detail/about/course-honours.css:4 |
| ? | ? | `src/components/courses/course-detail/about/DefendsPar.tsx:183` | `{c.l}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/DefendsPar.tsx:189` | `{t('courseDetail.defends.parScaleLabel')}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/DefendsPar.tsx:288` | `{b.label}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/HeroCourseRecord.tsx:70` | `Course record` | 10 / 700 / 0.13em | `#D6A84B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/HeroCourseRecord.tsx:81` | `Gross` | 9.5 / 700 / 0.13em | `rgba(255,255,255,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/HowItPlays.tsx:207` | `{column.label}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/HowItPlays.tsx:222` | `{label}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/HowItPlays.tsx:420` | `{t('courseDetail.plays.hardestHole')}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/RecordBook.tsx:50` | `{category === 'lowest_gross_all_time' ? <Crown size={10} color={A.AMBER} strokeWidth={2.6} /> : null} {legendCategoryLabel[category]}` | 9 / 700 / 0.19em | `?tone ?? A.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/RecordBook.tsx:66` | `{t(\`courseDetail.records.units.${UNIT_KEY[category]}\`)}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/TheVerdict.tsx:88` | `{Math.round(pct) <= VERDICT_EASIER_CLAIM_MAX ? ( <span style={{ color: A.MUTE }}>{t('courseDetail.verdict.easierThan', { pct: 100 - Math.round(pct) })}</span> ) : ( <span>{t('courseDetail.verdict.easiest')}</span> )} {Math.round(pct) >= VERDICT_HARDER_CLAIM_MIN ? ( <span style={{ color: A.MUTE }}>{t('courseDetail.verdict.harderThan', { pct: Math.round(pct) })}</span> ) : ( <span>{t('courseDetail.verdict.hardest')}</span> )}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/TheVerdict.tsx:90` | `{t('courseDetail.verdict.easierThan', { pct: 100 - Math.round(pct) })}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/TheVerdict.tsx:92` | `{t('courseDetail.verdict.easiest')}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/TheVerdict.tsx:95` | `{t('courseDetail.verdict.harderThan', { pct: Math.round(pct) })}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/TheVerdict.tsx:97` | `{t('courseDetail.verdict.hardest')}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/about/verdictBits.tsx:26` | `{label}` | 9 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/reviews/SingleReview.tsx:114` | `Played {month}` | 10 / 700 / 0.09em | `#A6C2F0` | src/index.css:5240 |
| ? | ? | `src/components/courses/course-detail/reviews/TheScore.tsx:98` | `Community` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/BoardList.tsx:59` | `{r.held ? t('courseDetail.youTab.grabs.heldTag') : t('courseDetail.youTab.unclaimed.open')}` | 11 / 700 / 0.08em | `rgba(248,250,252,0.42) OR #D6A84B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/ProjectionSection.tsx:63` | `{rightLabel}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:61` | `{t('courseDetail.youTab.unclaimed.tile', { count: openBoards })}` | 10.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/WhereYouStandHere.tsx:124` | `90 days` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/WhereYouStandHere.tsx:125` | `All time` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourFormHere.tsx:206` | `{formatDate(sel.playDate)}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourFormHere.tsx:209` | `{t('courseDetail.youTab.clear')}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourFormHere.tsx:234` | `{t('courseDetail.youTab.form.best', { score: best })}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourFormHere.tsx:237` | `{t('courseDetail.youTab.form.worst', { score: worst })}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:43` | `{label}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:171` | `{courseName}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:211` | `{t('courseDetail.yourHolesSheet.distribution')}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:217` | `{t(\`courseDetail.yourHolesSheet.${key}\`)}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:227` | `{t('courseDetail.yourHolesSheet.holes')}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:239` | `PAR` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:240` | `BEST` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:244` | `{doubleShare} % DOUBLE+` | 9 / 700 / 0.19em | `#7AA6EC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:246` | `YOU` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:247` | `FIELD` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:256` | `{t('courseDetail.yourHolesSheet.pars')}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:256` | `{t('courseDetail.yourHolesSheet.parsMeta')}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:270` | `TOTAL` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:274` | `{t('courseDetail.yourHolesSheet.thirds')}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:274` | `{t('courseDetail.yourHolesSheet.thirdsMeta')}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourHolesSheet.tsx:278` | `{index === 0 ? '1-6' : index === 1 ? '7-12' : '13-18'}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourRoundsSheet.tsx:56` | `{label}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourRoundsSheet.tsx:112` | `{courseName}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/YourRoundsSheet.tsx:163` | `{year}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/many/FormLast20Section.tsx:48` | `Best {best}` | 10 / 700 / 0.1em | `rgba(248,250,252,0.30)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/many/FormLast20Section.tsx:49` | `Worst {worst}` | 10 / 700 / 0.1em | `rgba(248,250,252,0.30)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/many/ManySections.tsx:310` | `of {total} holes birdied here` | 11 / 700 / 0.1em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/many/ManySections.tsx:327` | `{l}` | 9.5 / 700 / 0.08em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/many/manyBits.tsx:41` | `{kicker}` | 11 / 700 / 0.16em | `?kickerColor` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/many/manyBits.tsx:69` | `{f.label}` | 9.5 / 700 / 0.08em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/youBits.tsx:24` | `{label}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/course-detail/you/youBits.tsx:113` | `{label} ›` | 12 / 700 / 0.11em | `#F8FAFC OR rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/top100/HundredRaceParts.tsx:42` | `{leaderValue > 0 ? <span ref={caption} data-leader-caption className="t100-leader-caption" style={{ left: captionLeft }}>{t('amateur.leaderboards.hundredSlab.nobodyPast', { n: leaderValue })}</span> : null}` | 9.5px / 700 / .1em | `rgba(248,250,252,.42)` | src/components/courses/top100/t100Race.css:9; src/components/courses/top100/t100Race.css:15 |
| ? | ? | `src/components/courses/top100/HundredRaceParts.tsx:43` | `0` | 9.5px / 700 / .1em | `rgba(248,250,252,.42)` | src/components/courses/top100/t100Race.css:9; src/components/courses/top100/t100Race.css:15 |
| ? | ? | `src/components/courses/top100/HundredRaceParts.tsx:44` | `{t('amateur.leaderboards.hundredSlab.nobodyPast', { n: leaderValue })}` | 9.5px / 700 / .1em | `rgba(248,250,252,.42)` | src/components/courses/top100/t100Race.css:9; src/components/courses/top100/t100Race.css:15; src/components/courses/top100/t100Race.css:18 |
| ? | ? | `src/components/courses/top100/HundredRaceParts.tsx:45` | `{listLength}` | 9.5px / 700 / .1em | `rgba(248,250,252,.42)` | src/components/courses/top100/t100Race.css:9; src/components/courses/top100/t100Race.css:15; src/components/courses/top100/t100Race.css:17 |
| ? | ? | `src/components/courses/top100/TheArgumentSection.tsx:34` | `{label}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/courses/top100/Top100CompareChart.tsx:49` | `SEE ALL {n}` | 11px / 700 / .14em | `rgba(248,250,252,.62)` | src/components/courses/top100/top100Compare.css:4; src/components/courses/top100/top100Compare.css:3; src/components/courses/top100/top100Compare.css:5 |
| ? | ? | `src/components/courses/top100/Top100Leaderboard.tsx:101` | `LEADER {leader.value}` | 10px / 700 / .12em | `rgba(248,250,252,.42)` | src/components/courses/top100/top100Compare.css:1; src/components/courses/top100/top100Compare.css:5; src/components/courses/top100/top100Compare.css:18; src/components/courses/top100/top100Compare.css:24 |
| ? | ? | `src/components/courses/top100/Top100Leaderboard.tsx:103` | `LEADER {leader.value}` | 10px / 700 / .12em | `rgba(248,250,252,.42)` | src/components/courses/top100/top100Compare.css:1; src/components/courses/top100/top100Compare.css:5; src/components/courses/top100/top100Compare.css:18; src/components/courses/top100/top100Compare.css:24 |
| ? | ? | `src/components/courses/top100/Top100Leaderboard.tsx:104` | `LEADER {leader.value}` | 10px / 700 / .12em | `rgba(248,250,252,.42)` | src/components/courses/top100/top100Compare.css:1; src/components/courses/top100/top100Compare.css:5; src/components/courses/top100/top100Compare.css:18; src/components/courses/top100/top100Compare.css:24 |
| ? | ? | `src/components/courses/top100/Top100RaceSection.tsx:37` | `{t('amateur.leaderboards.seeAllMembers')}` | 11px / 700 / .16em | `rgba(248,250,252,.62)` | src/components/courses/top100/t100Race.css:1; src/components/courses/top100/t100Race.css:5; src/components/courses/top100/t100Race.css:43 |
| ? | ? | `src/components/courses/top100/Top100YourHundred.tsx:9` | `YOUR HUNDRED` | 11px / 700 / .16em | `rgba(248,250,252,.62)` | src/components/courses/top100/top100Compare.css:2; src/components/courses/top100/top100Compare.css:3; src/components/courses/top100/top100Compare.css:6; src/components/courses/top100/top100Compare.css:2; src/components/courses/top100/top100Compare.css:6 |
| ? | ? | `src/components/feed/CourseStatsSheet.tsx:79` | `{label}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/CourseStatsSheet.tsx:289` | `{t('feed.courseSheet.hardestHoleLabel')}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/FeedActorPicker.tsx:109` | `POST AS` | 9 / 700 / 0.19em | `#0F172A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/FeedCommentPreview.tsx:182` | `{\`See all ${total} comments\`}` | 9 / 700 / 0.19em | `?MID` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/PostGolfContext.tsx:105` | `{facts.kicker}` | 9.5 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/PostGolfContext.tsx:192` | `ROUND` | 10 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/PostGolfTags.tsx:105` | `PLAYED WITH` | 10 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/ScorePostBody.tsx:74` | `{t('amateur.stream.stat.net', 'Net')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/ScorePostBody.tsx:82` | `{t('amateur.stream.stat.gross', 'Gross')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/ScorePostBody.tsx:92` | `{t('amateur.stream.stat.gross', 'Gross')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/ScorePostBody.tsx:98` | `{t('amateur.stream.stat.handicap', 'Handicap')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/ScorePostBody.tsx:104` | `{featCell.label}` | 10 / 700 / 0.12em | `#FBBC2E` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/ScorePostBody.tsx:109` | `{t('amateur.stream.stat.awards', 'Awards')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/roundTilePlot.tsx:316` | `{feat.word}` | 9 / 700 / 0.14em | `#FFD200` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/roundTilePlot.tsx:346` | `OUT` | 10 / 700 / 0.14em | `rgba(248,250,252,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/feed/roundTilePlot.tsx:346` | `IN` | 10 / 700 / 0.14em | `rgba(248,250,252,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/friend-sheet/parts/HeadToHeadCard.tsx:105` | `{count === 1 ? 'Duel' : 'Duels'}` | 11 / 700 / 0.10em | `rgba(242,244,247,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/friend-sheet/parts/HeadToHeadCard.tsx:195` | `STBL` | 10 / 700 / 0.10em | `rgba(242,244,247,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/fullscreen-feed/CourseGalleryChrome.tsx:148` | `{t('media.gallery.jump', { defaultValue: 'JUMP TO A HOLE' })}` | 9px / 700 / .14em | `rgba(248,250,252,0.68)` | src/components/fullscreen-feed/course-gallery.css:6; src/components/fullscreen-feed/course-gallery.css:4; src/components/fullscreen-feed/course-gallery.css:19; src/components/fullscreen-feed/course-gallery.css:20; src/components/fullscreen-feed/course-gallery.css:21 |
| ? | ? | `src/components/fullscreen-feed/CourseGalleryChrome.tsx:160` | `{kickerHole(group.hole)}` | 9.5px / 700 / .16em | `rgba(248,250,252,0.68)` | src/components/fullscreen-feed/course-gallery.css:63; src/components/fullscreen-feed/course-gallery.css:40 |
| ? | ? | `src/components/fullscreen-feed/CourseGalleryChrome.tsx:160` | `{t('media.gallery.shots', { count: group.shots.length, defaultValue: \`${group.shots.length} ${shotWord(group.shots.length)}\` })}` | 9px / 700 / .14em | `rgba(248,250,252,0.68)` | src/components/fullscreen-feed/course-gallery.css:63; src/components/fullscreen-feed/course-gallery.css:21 |
| ? | ? | `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx:494` | `{statusKind === 'want_to_play' ? 'Want to play' : 'Played'}` | 8.5 / 700 / 0.12em | `#F7931E OR #FFFFFF` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/handicap/ConnectGhostPrompt.tsx:185` | `{eyebrow}` | 11 / 700 / 0.11em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/handicap/IndexWindowChart.tsx:112` | `{t('common:handicap.chart.low', { value: low, defaultValue: \`Low ${low}\` })}` | 7.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/handicap/IndexWindowChart.tsx:117` | `{t('common:handicap.chart.ago', { window: windowWord, defaultValue: \`${windowWord} ago\` })}` | 7.5 / 700 / 0.16em | `rgba(248,250,252,0.30)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/handicap/IndexWindowChart.tsx:118` | `{t('common:handicap.chart.today', { defaultValue: 'Today' })}` | 7.5 / 700 / 0.16em | `rgba(248,250,252,0.30)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/invite/ConnectedInviteState.tsx:56` | `{label}` | 10px / 700 / .16em | `rgba(248,250,252,.42)` | src/components/invite/inviteConnected.css:19 |
| ? | ? | `src/components/invite/ConnectedInviteState.tsx:56` | `{rows.length}` | 10px / 700 / .16em | `rgba(248,250,252,.42)` | src/components/invite/inviteConnected.css:19 |
| ? | ? | `src/components/invite/InviteFriendsSheet.tsx:134` | `{sub}` | 8 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/invite/InviteFriendsSheet.tsx:257` | `{t('invite.unconnected.share')}` | 12 / 700 / 0.10em | `#0A0A0C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/likes/LikesSheet.tsx:165` | `{businessTypeLabel(l.businessType)}` | 9 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/likes/LikesSheet.tsx:171` | `HCP` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/likes/LikesSheet.tsx:196` | `{label}` | 9 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/likes/LikesSheet.tsx:214` | `{count === 1 ? '1 person' : \`${count.toLocaleString()} people\`}` | 9.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/maintenance/MaintenanceWall.tsx:67` | `{t('maintenance.kicker', { defaultValue: 'MAINTENANCE' })}` | 10 / 700 / 0.16em | `#0E1216` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/maintenance/MaintenanceWall.tsx:104` | `{t('maintenance.checkAgain', { defaultValue: 'Check again' })}` | 10 / 700 / 0.14em | `#0E1216` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/maintenance/MaintenanceWall.tsx:124` | `{'\u203A'}` | 13 / 700 / 0.14em | `#0E1216` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/manage/fieldTreatment.tsx:125` | `{children}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/manage/overlays/DeleteAccountConfirmSheet.tsx:63` | `Permanent` | 11 / 700 / 0.16em | `#FF5A5A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/manage/ui.tsx:111` | `{children}` | 11 / 700 / 0.14em | `#FF5A5A OR rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/map/LocationMapCard.tsx:96` | `Directions` | 9 / 700 / 0.13em | `rgba(255,255,255,0.66)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/map/MapExpandedView.tsx:246` | `{t('map.kicker')}` | 10 / 700 / 0.16em | `rgba(255,255,255,0.66)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/mentions/MentionsComposerInput.tsx:633` | `Mention someone` | 11 / 700 / 0.08em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/posts/ReviewBottomSheet.tsx:498` | `{locationStr}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/AchievementsPane.tsx:39` | `{label}` | 11px / 700 / 0.13em | `hsl(var(--muted-foreground))` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/clubs/ClubsCard.tsx:131` | `{t('clubs.homeClub', 'HOME CLUB')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/clubs/ClubsCard.tsx:182` | `{t('clubs.setHomeClub', 'SET HOME CLUB')}` | 11 / 700 / 0.14em | `#0A0A0C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/clubs/ClubsCard.tsx:288` | `{t('clubs.courseCount', '{{n}} COURSES', { n: courses.length })}` | 8 / 700 / 0.12em | `rgba(255,255,255,0.82)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/clubs/ClubsCard.tsx:339` | `{f.label}` | 7.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/clubs/ClubsCard.tsx:407` | `{t('clubs.alsoMember', 'ALSO A MEMBER AT')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/clubs/ClubsCard.tsx:436` | `{t('clubs.roundsCount', '{{n}} ROUNDS', { n: count })}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.30)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/AddCourseModal.tsx:90` | `{kicker}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/AddCourseModal.tsx:336` | `{t('topTen.sheet.kicker', 'Courses')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/AddCourseModal.tsx:445` | `{text}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/AllCoursesList.tsx:679` | `SCORING FROM YOUR IMPORTED ROUNDS` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | src/components/profile/courses/coursesArchive.css:3 |
| ? | ? | `src/components/profile/courses/BreakdownsPickerSheet.tsx:350` | `{mode !== 'review' && ( <span style={{ color: A.INK, fontVariantNumeric: 'tabular-nums lining-nums', }} > {int}.{dec} </span> )} {dateText && ( <> {mode !== 'review' && <span style={{ color: A.BORDER }}> · </span>} <span>{mode === 'review' ? 'PLAYED ' : 'ADDED '}{dateText}</span> </> )}` | 10 / 700 / 0.10em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/BreakdownsPickerSheet.tsx:376` | `·` | 10 / 700 / 0.10em | `rgba(255,255,255,0.10)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/BreakdownsPickerSheet.tsx:377` | `{mode === 'review' ? 'PLAYED ' : 'ADDED '} {dateText}` | 10 / 700 / 0.10em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/CourseLegacyCard.tsx:130` | `{displayName}` | 11 / 700 / 0.14em | `rgba(248,250,252,0.30)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/DossierCard.tsx:54` | `{label}` | 10.5 / 700 / 0.11em | `?tone` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/DossierCard.tsx:209` | `{dateText && where ? ' \u00B7 ' : ''}` | 12 OR 11 / 400 OR 700 / 0 OR 0.10em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/DossierCard.tsx:214` | `{dateText}` | 12 OR 11 / 400 OR 700 / 0 OR 0.10em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/DossierCard.tsx:216` | `{where}` | 12 OR 11 / 400 OR 700 / 0 OR 0.10em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/DossierCard.tsx:227` | `{t('row.notRated', { defaultValue: 'Not rated' })}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/JourneySummaryCard.tsx:142` | `{tile.label}` | 9.5 / 700 / 0.11em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/courses/my-ratings/MyRatingsTierDivider.tsx:56` | `{tierName}` | 11 / 700 / 0.12em | `?reviewTierColor(tierName as RatingTier, 'dark') OR rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/edit-v2/LocationSection.tsx:80` | `Country` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:78; src/features/edit-profile/edit-profile.css:52; src/features/business-create/business-create.css:24 |
| ? | ? | `src/components/profile/edit-v2/LocationSection.tsx:210` | `Town or city` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:78; src/features/edit-profile/edit-profile.css:52; src/features/business-create/business-create.css:24 |
| ? | ? | `src/components/profile/edit-v2/ProfilePhotoCard.tsx:210` | `Profile Photo` | 11px / 700 / 0.08em | `hsl(var(--muted-foreground))` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/edit-v2/VisibilityDropdown.tsx:177` | `{SHEET_TITLE}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:121` | `{label}` | 11 / 700 / 0.16em | `?CHART.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:122` | `{count}` | 11 / 700 / 0.16em | `?CHART.MUTE` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:151` | `{label}` | 11 / 700 / 0.16em | `?CHART.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:152` | `{count}` | 11 / 700 / 0.16em | `?CHART.MUTE` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:215` | `{t(\`streaks.type.${type}.explainer\`)}` | 11 / 700 / 0.14em | `?CHART.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:239` | `{unitLabel(current)}` | 11 / 700 / 0.16em | `?CHART.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:290` | `{t('streaks.freezeHeld', { count: freeze })}` | 11 / 700 / 0.16em | `?CHART.MUTE` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:294` | `{t('streaks.freezeRefill', { when: relativeTime(row.freeze_refill_at), })}` | 11 / 700 / 0.16em | `?CHART.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:366` | `{t('streaks.kicker')}` | 11 / 700 / 0.16em | `?CHART.AMBER` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:389` | `{t('streaks.longestEverLabel')}` | 11 / 700 / 0.16em | `?CHART.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/gam/streaks/StreaksSheet.tsx:401` | `{t(\`streaks.unit.${STREAK_SHEET_CONFIG[longest.streak_type].unit}\`, { count: longest.best_count, })} {' \u00b7 '} {t(\`streaks.type.${longest.streak_type}.short\`)}` | 11 / 700 / 0.16em | `?CHART.MUTE` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/IndexChart.tsx:326` | `{fmt(points[0].t)}` | 10 / 700 / 0.13em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/IndexChart.tsx:327` | `{fmt(points[lastIdx].t)}` | 10 / 700 / 0.13em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/IndexChart.tsx:337` | `{z.l}` | 10 / 700 / 0.13em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/IndexChart.tsx:367` | `Lowest {fmtHcp(min)}` | 10 / 700 / 0.13em | `#4ADE80` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/IndexChart.tsx:368` | `Highest {fmtHcp(max)}` | 10 / 700 / 0.13em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/LastTwentyBars.tsx:122` | `{oldestLabel ?? 'Oldest'}` | 10 / 700 / 0.13em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/LastTwentyBars.tsx:123` | `{newestLabel ?? 'Newest'}` | 10 / 700 / 0.13em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/LastTwentyBars.tsx:143` | `{nextLabel}` | 10 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/MiniRing.tsx:91` | `{label}` | 10 / 700 / 0.13em | `?inkWithAlpha(INK_BASE, 0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/charts/MiniRing.tsx:92` | `{sub}` | 10 / 700 / 0.13em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/CountryScreen.tsx:122` | `Partnership agreed` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/CountryScreen.tsx:135` | `Not yet open` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/CountryScreen.tsx:150` | `Open now` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/CountryScreen.tsx:175` | `{c.pickerBody ?? c.body}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.72)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/CountryScreen.tsx:188` | `Everywhere else` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/CountryScreen.tsx:189` | `{\`${notYet.length} countries\`}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/EnglandGolfForm.tsx:48` | `{label}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/HandicapCard.tsx:64` | `{label}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/HandicapCard.tsx:102` | `{kicker}` | 11 / 700 / 0.16em | `?kickerColor ?? DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/HandicapCard.tsx:132` | `12 months` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/ParRings.tsx:78` | `{label}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/ParRings.tsx:79` | `{holesLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/Primitives.tsx:41` | `{aside}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/Primitives.tsx:74` | `{label}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/Primitives.tsx:89` | `{label}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/Primitives.tsx:174` | `{children} {chevron ? <ChevronRight size={12} strokeWidth={2.6} /> : null}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WaitlistToggle.tsx:15` | `{joined ? 'Waiting \u2713' : 'Count me in \u203A'}` | 10 / 700 / 0.13em | `#F8FAFC OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:207` | `{t('whsConnect.done.indexLabel')}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:228` | `{t('whsConnect.done.span')}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:233` | `{t('whsConnect.done.coursesSince', { courses: counts.courses, year: sinceYear })}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:242` | `{t('whsConnect.done.shotsLabel')}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:264` | `{t('whsConnect.done.shotsLabel')}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:287` | `{t('whsConnect.done.damagingLabel')}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:288` | `{t('whsConnect.done.damagingAside')}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx:334` | `{\`PAR ${h.par}\`}` | 11 / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/AgeingOutSection.tsx:61` | `{t('common:handicap.ageingOut.kicker')}` | 11 / 700 / 0.16em | `#F7931E OR #F8FAFC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/AgeingOutSection.tsx:73` | `{t('common:handicap.ageingOut.inRounds', { count })}` | 9 / 700 / 0.12em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/HcpSection.tsx:72` | `{kicker}` | 9 / 700 / 0.19em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/HolesSection.tsx:189` | `{b.label}` | 9 / 700 / 0.1em | `?CHART.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/IndexSection.tsx:239` | `{CHIP_LABEL[k]}` | 11 / 700 / 0.12em | `?SURFACE.dark.ink OR ?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/IndexSection.tsx:273` | `{label}` | 8.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/IndexSection.tsx:292` | `{windowLabel}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/IndexSection.tsx:355` | `{l}` | 9 / 700 / 0.11em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx:206` | `{t(\`common:handicap.mechanism.detail.${k}\`)}` | 9 / 700 / 0.1em | `?CHART.DIM` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx:233` | `{t('common:handicap.mechanism.countingEight')}` | 9.5 / 700 / 0.14em | `#4ADE80` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/SeeAllRow.tsx:67` | `{label} &rsaquo;` | 12 / 700 / 0.11em | `?inkWithAlpha(INK_BASE, 0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/_shared/darkAtoms.tsx:222` | `{label}` | 11 / 700 / 0.16em | `rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/_shared/darkAtoms.tsx:377` | `{children}` | 11 / 700 / 0.14em | `?` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/_shared/darkAtoms.tsx:439` | `{syncedAgo && ( <> <span style={{ color: 'var(--hcp-t-40)' }}> · SYNCED {syncedAgo}</span> </> )}` | 11 / 700 / 0.18em | `rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/_shared/darkAtoms.tsx:448` | `{label}` | 11 / 700 / 0.18em | `#22C55E OR #16A34A OR #F7931E OR rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/_shared/darkAtoms.tsx:451` | `· SYNCED {syncedAgo}` | 11 / 700 / 0.18em | `rgba(255, 255, 255, 0.38) OR #94A3B8` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/CompareSheet.tsx:238` | `HEAD TO HEAD` | 10.5 / 700 / 0.18em | `rgba(248,250,252,0.5)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:64` | `{d.label}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.5)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:92` | `{label}` | 10.5 / 700 / 0.18em | `rgba(248,250,252,0.5)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:124` | `GROSS` | 8.5 / 700 / 0.12em | `rgba(248,250,252,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:125` | `PTS` | 8.5 / 700 / 0.12em | `rgba(248,250,252,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:141` | `YOU` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:141` | `{first}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:194` | `SHOTS APART` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.5)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:200` | `YOU V {first.toUpperCase()}` | 10.5 / 700 / 0.18em | `rgba(248,250,252,0.5)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:203` | `YOU` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:203` | `{first}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:215` | `TOGETHER` | 10.5 / 700 / 0.18em | `rgba(248,250,252,0.5)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:226` | `COURSE BY COURSE` | 10.5 / 700 / 0.18em | `rgba(248,250,252,0.5)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/_shared/CourseEyebrow.tsx:17` | `{label}` | 11 / 700 / 0.16em | `#FFFFFF OR #F8FAFC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:233` | `{movementLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:235` | `{rankLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:238` | `{memberLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:247` | `{gapLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:249` | `{unitLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:275` | `{nearestLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:459` | `{formatChampionsWhen(row.attained_at)}` | 10.5 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:503` | `{posLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:505` | `{memberLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:506` | `{whenLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts.tsx:507` | `{markLabel}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/course-legends/flat/FlatBoardSheet.tsx:116` | `{courseName}` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet.tsx:139` | `ALL ACTIVE &middot; {cohorts.totalActive}` | 11 / 700 / 0.16em | `rgba(242,244,247,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet.tsx:158` | `INACTIVE &middot; {cohorts.totalInactive}` | 11 / 700 / 0.16em | `rgba(242,244,247,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx:62` | `STALE` | 11 / 700 / 0.14em | `#854F0B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx:262` | `{isStaleRow && <StalePill />}` | 11 / 700 / 0.16em | `#854F0B OR rgba(255,255,255,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx:278` | `{entry.friend_home_club ?? (isYou ? 'No home club set' : '')}` | 11 / 700 / 0.16em | `#854F0B OR rgba(255,255,255,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteCard.tsx:126` | `Invite` | 11 / 700 / 0.13em | `rgba(255,255,255,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx:74` | `Ready to invite · {invitable.length}` | 11 / 700 / 0.14em | `rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx:30` | `{children}` | 9 / 700 / 0.12em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx:73` | `{[invite.invitee_home_club, formatRelativeAgoLong(invite.sent_at)] .filter(Boolean) .join(' \u00B7 ')}` | 9 / 700 / 0.12em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx:88` | `{statusLabel}` | 9 / 700 / 0.12em | `?statusColor` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx:194` | `{t('invites.kicker')}` | 11 / 700 / 0.16em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx:208` | `{t('invites.split', { pending: groups.pending.length, joined: groups.joined.length, })}` | 9 / 700 / 0.12em | `?inkWithAlpha(INK_BASE, 0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/last-round-card/CinemaCardShapeStrip.tsx:58` | `HOLE 1` | 10 / 700 / 0.16em | `rgba(255,255,255,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/last-round-card/CinemaCardShapeStrip.tsx:59` | `SHAPE OF THE ROUND` | 10 / 700 / 0.16em | `rgba(255,255,255,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/last-round-card/CinemaCardShapeStrip.tsx:60` | `18` | 10 / 700 / 0.16em | `rgba(255,255,255,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/round-card/RoundCardHoleStrip.tsx:65` | `{label}` | 10 / 700 / 0.12em | `rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/round-card/RoundCardShell.tsx:100` | `GROSS` | 11 / 700 / 0.16em | `rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/round-card/RoundCardShell.tsx:126` | `{fmtDiff(differential)} DIFF` | 13 / 700 / 0.08em | `#C97211` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/round-card/RoundCardShell.tsx:154` | `STABLEFORD` | 11 / 700 / 0.16em | `rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/round-card/RoundCardShell.tsx:217` | `HOLE BY HOLE` | 11 / 700 / 0.16em | `rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:358` | `{label}` | 10 / 700 / 0.12em | `rgba(255, 255, 255, 0.96) OR #0F172A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:514` | `{title}` | 11 / 700 / 0.16em | `rgba(255, 255, 255, 0.55) OR #64748B` | src/styles/handicap-dark.css:20; src/styles/handicap-dark.css:292 |
| ? | ? | `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:580` | `{month}` | 11 / 700 / 0.16em | `rgba(255, 255, 255, 0.55) OR #64748B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:591` | `{count} {count === 1 ? 'round' : 'rounds'}` | 11 / 700 / 0.16em | `rgba(255, 255, 255, 0.38) OR #94A3B8` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:699` | `{labels.gross}` | 9.5 / 700 / 0.13em | `rgba(255, 255, 255, 0.38) OR #94A3B8` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:765` | `{labels.playedTo}` | 9.5 / 700 / 0.13em | `rgba(255, 255, 255, 0.38) OR #94A3B8` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/HeroConnectExample.tsx:44` | `{t('hero.connectExamplePill', { defaultValue: 'Example' })}` | 8.5 / 700 / 0.16em | `rgba(248,250,252,0.30)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/HeroHandicapDisplay.tsx:85` | `{t('hero.handicapIndex', 'Handicap index')}` | 9 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/HeroHandicapDisplay.tsx:102` | `{l.window}` | 7.5 / 700 / 0.16em | `rgba(255,255,255,0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/HeroHandicapDisplay.tsx:111` | `{slot.label}` | 7.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/HeroHandicapDisplay.tsx:142` | `{t('hero.lastFiveRounds', 'Last five rounds')}` | 9 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/HeroShell.tsx:139` | `{label}` | 10 / 700 / 0.08em OR 0.12em | `rgba(255,255,255,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/HeroShell.tsx:170` | `{headline.label}` | 11 / 700 / 0.12em | `rgba(255,255,255,0.45)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileCoverBand.tsx:28` | `{label}` | 10 / 700 / 0.14em | `#0A0A0C OR #FFFFFF` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileCoverBand.tsx:208` | `{addHomeClubLabel}` | 11 / 700 / 0.15em | `rgba(255,255,255,0.55)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileHero.tsx:201` | `World amateur ranking` | 7.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileHero.tsx:377` | `{t('hero.friends', 'Friends')}` | 10 / 700 / 0.11em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileHero.tsx:378` | `{friendsFig}` | 10 / 700 / 0.11em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileHero.tsx:382` | `{t('hero.followers', 'Followers')}` | 10 / 700 / 0.11em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileHero.tsx:383` | `{followersFig}` | 10 / 700 / 0.11em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileHero.tsx:387` | `{t('hero.mutual', 'Mutual')}` | 10 / 700 / 0.11em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileHero.tsx:388` | `{formatNumber(mutualCount)}` | 10 / 700 / 0.11em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileTopTenRail.tsx:237` | `{t('topTen.kicker', 'Top 10')}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileTopTenRail.tsx:246` | `{audienceMarker}` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileTopTenRail.tsx:257` | `{pillKicker}` | 7 / 700 / 0.08em | `rgba(255,255,255,0.7)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileTopTenRail.tsx:319` | `{t('topTen.golfers', 'Golfers')}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/ProfileTopTenRail.tsx:323` | `{pillKicker}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:219` | `{getRatingTierLabel(hero.rating)}` | 9.5 OR 8.5 / 700 / 0.16em | `?scoreColor(hero.rating)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:163` | `Every round` | 11 / 700 / 0.16em | `#F7931E OR #F8FAFC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:180` | `Gross` | 8.5 / 700 / 0.14em | `?inkWithAlpha(INK_BASE, 0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:181` | `Net` | 8.5 / 700 / 0.14em | `?inkWithAlpha(INK_BASE, 0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:182` | `Vs hcp` | 8.5 / 700 / 0.14em | `?inkWithAlpha(INK_BASE, 0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:183` | `Index` | 8.5 / 700 / 0.14em | `?inkWithAlpha(INK_BASE, 0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:222` | `{medalTotal(r) > 0 ? ( <Pill padding="3px 8px"> <AwardCluster scale="pill" gold={r.medals_gold ?? 0} silver={r.medals_silver ?? 0} bronze={r.medals_bronze ?? 0} surfaceColor={CHART.CANVAS} /> </Pill> ) : null} {!full18 ? ( <Pill tone={CHART.MUTE} style={CAPS}> {r.whs_joined && r.is_nine_hole ? t('rounds.nineHoles', '9 holes') : t('rounds.notFull', 'Not a full 18')} </Pill> ) : null} {fs.map((f) => <FeatPill key={f} label={f} />)}` | 10 / 600 / 0.08em | `?inkWithAlpha(INK_BASE, 0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:223` | `{formatDayMonthShortGB(parsePlayDate(r.play_date))}` | 10 / 600 / 0.08em | `?inkWithAlpha(INK_BASE, 0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:231` | `{r.whs_joined && r.is_nine_hole ? t('rounds.nineHoles', '9 holes') : t('rounds.notFull', 'Not a full 18')}` | 9 / 700 / 0.12em | `?inkWithAlpha(INK_BASE, 0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/ProfileRoundsTab.tsx:282` | `{t('rounds.private.cta', 'Privacy settings')} ›` | 11 / 700 / 0.11em | `?SURFACE.dark.ink` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/sections/CoursesPlayedSection.tsx:63` | `{t(\`profile.rounds.courses.kicker${voice}\`, { name: ownerFirstName })}` | 11 / 700 / 0.16em | `#F7931E OR #F8FAFC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/sections/CoursesPlayedSection.tsx:87` | `{'Rounds Average'}` | 9 / 700 / 0.1em | `?inkWithAlpha(INK_BASE, 0.30)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/sections/SeasonSection.tsx:29` | `{label}` | 9 / 700 / 0.11em | `?inkWithAlpha(INK_BASE, 0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/sections/SeasonSection.tsx:43` | `{t(isOwnProfile ? 'profile.rounds.seasonOwn' : 'profile.rounds.seasonFriend', { possessive: profileOwnerPossessive(ownerFirstName), defaultValue: isOwnProfile ? 'Your season' : '{{possessive}} season' })}` | 11 / 700 / 0.16em | `#F7931E OR #F8FAFC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/profile/rounds/sections/YearSection.tsx:60` | `The year` | 11 / 700 / 0.16em | `#F7931E OR #F8FAFC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/settings/SettingsHandicapCard.tsx:46` | `BEING CHECKED` | 9.5px / 700 / 0.12em | `rgba(248,250,252,0.62)` | src/features/edit-profile/edit-profile.css:144; src/features/pro-verification/pro-status-controls.css:5; src/features/pro-verification/pro-status-controls.css:6 |
| ? | ? | `src/components/settings/SettingsTabContent.tsx:181` | `Your handicap` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:134; src/features/edit-profile/edit-profile.css:143; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/settings/SettingsTabContent.tsx:189` | `Privacy` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:134; src/features/edit-profile/edit-profile.css:143; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/settings/SettingsTabContent.tsx:193` | `Notifications` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:134; src/features/edit-profile/edit-profile.css:143; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/settings/SettingsTabContent.tsx:196` | `Account` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:134; src/features/edit-profile/edit-profile.css:143; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/settings/SettingsTabContent.tsx:206` | `Friends` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:134; src/features/edit-profile/edit-profile.css:143; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/settings/SettingsTabContent.tsx:213` | `Help` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:134; src/features/edit-profile/edit-profile.css:143; src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/settings/SettingsYourData.tsx:62` | `Your data` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/components/settings/sheets/DeleteAllDataConfirmSheet.tsx:47` | `Permanent` | 11 / 700 / 0.16em | `#FF5A5A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/settings/sheets/DeleteAllDataConfirmSheet.tsx:61` | `Type DELETE to confirm` | 11 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/settings/sheets/DeleteAllDataConfirmSheet.tsx:108` | `Keep my data` | 11 / 700 / 0.13em | `rgba(248,250,252,0.72)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/settings/ui/SettingsChevronRow.tsx:68` | `Locked` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | src/index.css:3849; src/index.css:3876 |
| ? | ? | `src/components/settings/ui/SettingsLevelRow.tsx:75` | `{labels[opt.value]}` | 11 / 700 / 0.10em | `#0A0A0C OR rgba(248,250,252,0.62)` | src/index.css:3849; src/index.css:3876 |
| ? | ? | `src/components/settings/ui/SettingsRow.tsx:74` | `{children}` | ? / 600 / 0.10em | `?` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/settings/ui/SettingsSection.tsx:27` | `{title}` | 11 / 700 / 0.19em | `#E24B3F OR #F8FAFC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/shared/ReviewGhostScore.tsx:78` | `{tierLabel}` | ? / 700 / 0.14em | `?reviewLabelColor(rating, surface)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/shared/ReviewScoreRow.tsx:101` | `{label}` | 7 / 700 / 0.14em | `rgba(255,255,255,0.50)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/shared/ScoreFigureRow.tsx:76` | `{lead.label}` | 9 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/shared/ScoreFigureRow.tsx:85` | `{c.label}` | 9 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/top100/sheets/Top100ListProgressSheet.tsx:150` | `{\`Top 100 ${RANK_SCOPE_LABEL[slug]}\`}` | 10.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/top100/sheets/Top100ListProgressSheet.tsx:208` | `{RANK_SCOPE_LABEL[s]}` | 9.5 / 700 / 0.10em | `#F7931E OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/top100/sheets/Top100ListProgressSheet.tsx:240` | `{right ? <span>{right}</span> : null}` | 10.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/top100/sheets/Top100ListProgressSheet.tsx:252` | `·` | 10.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/top100/sheets/Top100ListProgressSheet.tsx:253` | `{n}` | 10.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/top100/sheets/Top100ListProgressSheet.tsx:255` | `{right}` | 10.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/components/ui/SectionHeader.tsx:122` | `{children}` | 10 / 700 / 0.12em | `var(--hcp-t-40, rgba(248,250,252,0.62))` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/activity-v2/ActivityPageV2.tsx:122` | `{label}` | 11 / 700 / 0.14em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/activity-v2/components/ActivityActionsSheet.tsx:162` | `Notification options` | 11 / 700 / 0.12em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/activity-v2/components/FeaturedMomentCard.tsx:88` | `While you were away` | 11 / 700 / 0.12em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/activity-v2/components/FeaturedMomentCard.tsx:129` | `{kicker}` | 11 / 700 / 0.10em | `rgba(255,255,255,0.72)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/activity-v2/components/FriendRequestsRail.tsx:100` | `{pending ? '…' : 'Accept'}` | 11 / 700 / 0.10em | `#0A0A0C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/activity-v2/components/FriendRequestsRail.tsx:124` | `Decline` | 11 / 700 / 0.10em | `rgba(248,250,252,0.72)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/activity-v2/components/FriendRequestsRail.tsx:174` | `Friend requests · {rows!.length}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/amateur-ranking/SettingsWagrCard.tsx:30` | `BEING CHECKED` | 9.5px / 700 / 0.12em | `rgba(248,250,252,0.62)` | src/features/amateur-ranking/wagr-settings.css:2; src/features/amateur-ranking/wagr-settings.css:3; src/features/edit-profile/edit-profile.css:144; src/features/pro-verification/pro-status-controls.css:5; src/features/pro-verification/pro-status-controls.css:6 |
| ? | ? | `src/features/amateur-ranking/WagrLinkSheet.tsx:50` | `WORLD AMATEUR GOLF RANKING` | 11px / 700 / 0.16em | `#F8FAFC OR #F8FAFC` | src/features/amateur-ranking/wagr-settings.css:2; src/features/amateur-ranking/wagr-settings.css:12; src/features/amateur-ranking/wagr-settings.css:14; src/index.css:5878 |
| ? | ? | `src/features/amateur/AmateurFilterRail.tsx:73` | `{t('discover.filterBoard.edit', 'Edit')}` | 12 / 700 / 0.11em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/amateur/AmateurHero.tsx:441` | `{kicker}` | 11 / 700 / 0.16em | `rgba(255,255,255,0.66)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/amateur/AmateurHero.tsx:592` | `{row ? row.course_name ?? t('discover.coursesPlayed.course', 'Course') : spreadLine}` | 11 / 700 / 0.16em | `rgba(255,255,255,0.70)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business-create/BusinessCreateFinish.tsx:31` | `All set` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:8 |
| ? | ? | `src/features/business-create/BusinessCreateFinish.tsx:38` | `Next` | 10px / 700 / .16em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:11; src/features/business-create/business-create.css:175 |
| ? | ? | `src/features/business-create/BusinessCreateStep3.tsx:138` | `{t('businessCreate.contactKicker', { defaultValue: 'Contact' })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:8 |
| ? | ? | `src/features/business-create/BusinessCreateStep3.tsx:144` | `{t('businessCreate.phone', { defaultValue: 'Phone' })}` | 10px / 700 / .12em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:89; src/features/business-create/business-create.css:91; src/features/business-create/business-create.css:93 |
| ? | ? | `src/features/business-create/BusinessCreateStep3.tsx:154` | `{field === 'email' ? t('businessCreate.email', { defaultValue: 'Email' }) : field === 'website' ? t('businessCreate.website', { defaultValue: 'Website' }) : t('businessCreate.booking', { defaultValue: 'Booking' })}` | 10px / 700 / .12em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:89; src/features/business-create/business-create.css:91; src/features/business-create/business-create.css:93 |
| ? | ? | `src/features/business-create/BusinessCreateStep3.tsx:180` | `{t('businessCreate.mainButton', { defaultValue: 'Your main button' })}` | 10px / 700 / .16em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:11 |
| ? | ? | `src/features/business-create/BusinessCreateStep4.tsx:59` | `Your profile` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:8 |
| ? | ? | `src/features/business-create/BusinessCreateStep4.tsx:77` | `About` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:156; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/business-create/BusinessCreateStep4.tsx:80` | `Year founded` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:78; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/business-create/Step2Club.tsx:150` | `{t('businessCreate.clubKicker', { defaultValue: 'Your club' })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:8 |
| ? | ? | `src/features/business-create/Step2College.tsx:92` | `{t('businessCreate.collegeKicker', { defaultValue: 'Your college' })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:8 |
| ? | ? | `src/features/business-create/Step2Other.tsx:148` | `{t('businessCreate.otherKicker', { defaultValue: 'Your business' })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:8 |
| ? | ? | `src/features/business-create/Step2Other.tsx:194` | `{t('businessCreate.countryLabel', { defaultValue: 'Country' })}` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:68; src/features/business-create/business-create.css:78; src/features/business-create/business-create.css:65; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/business-create/Step2Other.tsx:247` | `{t('businessCreate.areaKicker', { defaultValue: 'Your golf on clbhouz' })}` | 10px / 700 / .16em | `rgba(248,250,252,0.62)` | src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:37; src/features/business-create/business-create.css:80 |
| ? | ? | `src/features/business-create/step2Bits.tsx:31` | `{label}` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:73; src/features/business-create/business-create.css:78; src/features/business-create/business-create.css:65; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/business-create/step2Bits.tsx:33` | `{label}` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:73; src/features/business-create/business-create.css:78; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:151` | `CARD AGAINST COURSE` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:152` | `{fmt(ladder.rounds)} FULL ROUNDS` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:160` | `{rows.length === 1 ? \`Plays ${direction} than its card\` : \`Play ${direction} than their card\`}` | 10.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:213` | `The sample` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:218` | `{c.label}` | 10 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:309` | `{hasFullRounds && <span style={{ color: HIP.DIM, letterSpacing: '0.12em' }}>{fmt(data.complete_rounds)} FULL ROUNDS</span>}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:310` | `HOLE BY HOLE` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:311` | `{fmt(data.complete_rounds)} FULL ROUNDS` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:322` | `{label}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:340` | `HOLE {h.hole_no} {h.yards == null ? '' : \` · ${fmt(h.yards)} YD\`} · {fmt(holeTotal)} ROUNDS` | 11 / 700 / 0.14em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:434` | `HOW IT PLAYS` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:435` | `{\`${fmt(m.total)} HOLES\`}` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:508` | `Records` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:531` | `Records` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:573` | `Your tees` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:582` | `Your tees` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:583` | `{fmt(sum)} rounds` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:587` | `Yardage` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:588` | `Rounds` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:589` | `To par` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:653` | `WHERE THE TEE SHEET HAS ROOM` | 10.5px / 700 / .16em | `rgba(248,250,252,.62)` | src/features/business/clubAnalytics/teeSheet.css:1; src/features/business/clubAnalytics/teeSheet.css:2 |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:658` | `ACROSS THE WEEK` | 10.5px / 700 / .14em | `rgba(248,250,252,.42)` | src/features/business/clubAnalytics/teeSheet.css:1; src/features/business/clubAnalytics/teeSheet.css:6 |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:662` | `ACROSS THE YEAR` | 10.5px / 700 / .14em | `rgba(248,250,252,.42)` | src/features/business/clubAnalytics/teeSheet.css:1; src/features/business/clubAnalytics/teeSheet.css:6 |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:681` | `Who plays here` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:692` | `Who plays here` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/business/clubAnalytics/sections.tsx:693` | `{fmt(data.handicap_rounds)} rounds` | 11 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/chrome-v2/AccountGlance.tsx:90` | `ADMIN` | 9.5px / 700 / .13em | `rgba(248,250,252,.42)` | src/features/chrome-v2/account-glance.css:12; src/features/chrome-v2/account-glance.css:40; src/features/chrome-v2/account-glance.css:44 |
| ? | ? | `src/features/chrome-v2/ChromeIsland.tsx:405` | `HANDICAP` | 8.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/chrome-v2/ChromeIsland.tsx:415` | `INDEX` | 8.5 / 700 / 0.12em | `rgba(15,23,42,0.42) OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/chrome-v2/ChromeIsland.tsx:470` | `INDEX` | 8.5 / 700 / 0.12em | `rgba(15,23,42,0.42) OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/chrome-v2/ConnectGlance.tsx:42` | `{label}` | 8.5px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/features/chrome-v2/index-glance.css:18; src/features/chrome-v2/index-glance.css:20 |
| ? | ? | `src/features/chrome-v2/IndexGlance.tsx:126` | `Your handicap index` | 9.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/chrome-v2/IndexGlance.tsx:167` | `{s.label}` | 8.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/clubhouse-tour/SlotBoard.tsx:26` | `{rounds.map(rd => <span key={rd} data-slot-round-header={rd} className={\`tour-slot-round-header${rd === columns?.liveRound ? ' tour-slot-live' : ''}\`}>R{rd}</span>)}` | 10px / 700 / .08em | `rgba(248,250,252,.42)` | src/features/clubhouse-tour/tourSlot.css:38; src/features/clubhouse-tour/tourSlot.css:57; src/features/clubhouse-tour/tourSlot.css:39; src/features/clubhouse-tour/tourSlot.css:41 |
| ? | ? | `src/features/clubhouse-tour/SlotBoard.tsx:27` | `{label}` | 10px / 700 / .08em | `rgba(248,250,252,.42)` | src/features/clubhouse-tour/tourSlot.css:38; src/features/clubhouse-tour/tourSlot.css:57; src/features/clubhouse-tour/tourSlot.css:39; src/features/clubhouse-tour/tourSlot.css:41; src/features/clubhouse-tour/tourSlot.css:42 |
| ? | ? | `src/features/clubhouse-tour/SlotBoard.tsx:28` | `R {rd}` | 10px / 700 / .08em | `rgba(248,250,252,.42)` | src/features/clubhouse-tour/tourSlot.css:38; src/features/clubhouse-tour/tourSlot.css:57; src/features/clubhouse-tour/tourSlot.css:39; src/features/clubhouse-tour/tourSlot.css:41 |
| ? | ? | `src/features/clubhouse-tour/SlotBoard.tsx:29` | `{t('board.columns.tot')}` | 10px / 700 / .08em | `rgba(248,250,252,.42)` | src/features/clubhouse-tour/tourSlot.css:38; src/features/clubhouse-tour/tourSlot.css:57; src/features/clubhouse-tour/tourSlot.css:39; src/features/clubhouse-tour/tourSlot.css:41; src/features/clubhouse-tour/tourSlot.css:49 |
| ? | ? | `src/features/clubhouse-tour/TourSlot.tsx:74` | `● LIVE` | 11px / 700 / .15em | `#34D77F` | src/features/clubhouse-tour/tourSlot.css:2; src/features/clubhouse-tour/tourSlot.css:3; src/features/clubhouse-tour/tourSlot.css:6; src/features/clubhouse-tour/tourSlot.css:7; src/features/clubhouse-tour/tourSlot.css:8 |
| ? | ? | `src/features/clubhouse-tour/TourSlot.tsx:87` | `{lead.heading}` | 10px / 700 / .14em | `rgba(248,250,252,.62)` | src/features/clubhouse-tour/tourSlot.css:2; src/features/clubhouse-tour/tourSlot.css:11; src/features/clubhouse-tour/tourSlot.css:52; src/features/clubhouse-tour/tourSlot.css:12; src/features/clubhouse-tour/tourSlot.css:13; src/features/clubhouse-tour/tourSlot.css:14 |
| ? | ? | `src/features/clubhouse-tour/TourSlot.tsx:93` | `{lead.figureLabel}` | 10px / 700 / .14em | `rgba(248,250,252,.62)` | src/features/clubhouse-tour/tourSlot.css:2; src/features/clubhouse-tour/tourSlot.css:11; src/features/clubhouse-tour/tourSlot.css:52; src/features/clubhouse-tour/tourSlot.css:22; src/features/clubhouse-tour/tourSlot.css:25 |
| ? | ? | `src/features/clubhouse-tour/TourSlot.tsx:100` | `{f.label}` | 9.5px / 700 / .14em | `rgba(248,250,252,.42)` | src/features/clubhouse-tour/tourSlot.css:2; src/features/clubhouse-tour/tourSlot.css:33; src/features/clubhouse-tour/tourSlot.css:34; src/features/clubhouse-tour/tourSlot.css:35; src/features/clubhouse-tour/tourSlot.css:37 |
| ? | ? | `src/features/coach/BusinessCoachCards.tsx:19` | `{t('coach.inviteKicker')}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/features/coach/coach.css:1; src/features/coach/coach.css:2 |
| ? | ? | `src/features/coach/BusinessCoachCards.tsx:35` | `{t('coach.chartLabel')}` | 10px / 700 / .12em | `rgba(248,250,252,.42)` | src/features/coach/coach.css:54; src/features/coach/coach.css:55 |
| ? | ? | `src/features/coach/BusinessCoachCards.tsx:45` | `{t('coach.resultsKicker')}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/features/coach/coach.css:1; src/features/coach/coach.css:2 |
| ? | ? | `src/features/coach/BusinessCoachCards.tsx:45` | `{t('coach.golfers', { count: results.n })}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/features/coach/coach.css:1; src/features/coach/coach.css:2 |
| ? | ? | `src/features/coach/BusinessCoachCards.tsx:45` | `{t('coach.teamKicker')}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/features/coach/coach.css:1; src/features/coach/coach.css:2 |
| ? | ? | `src/features/coach/BusinessCoachCards.tsx:45` | `{t('coach.ofTen', { n: results.n })}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/features/coach/coach.css:1; src/features/coach/coach.css:2 |
| ? | ? | `src/features/coach/BusinessCoachCards.tsx:45` | `{t('coach.namedKicker')}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/features/coach/coach.css:1; src/features/coach/coach.css:2 |
| ? | ? | `src/features/coach/BusinessCoachCards.tsx:45` | `{t('coach.namedOf', { n: team.named.length, active: team.active })}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62)` | src/features/coach/coach.css:1; src/features/coach/coach.css:2 |
| ? | ? | `src/features/comments-v2/CommentsSheetV2.tsx:439` | `{t('comments.count', { count: visibleCount })}` | 9.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/comments-v2/components/CommentActionSheetV2.tsx:101` | `{icon}` | 13 / 500 / 0.10em | `#FF5A5A OR rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/comments-v2/components/CommentActionSheetV2.tsx:102` | `{label}` | 13 / 500 / 0.10em | `#FF5A5A OR #F8FAFC` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/comments-v2/components/ReportCommentSheetV2.tsx:118` | `Next` | 13 / 700 / 0.10em | `#FFFFFF OR rgba(248,250,252,0.40)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/comments-v2/components/ReportCommentSheetV2.tsx:198` | `Done` | 13 / 700 / 0.10em | `#0A0A0C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/SiLadder.tsx:121` | `Hole` | 8.5 / 700 / 0.13em | `rgba(248,250,252,0.62) OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/SiLadder.tsx:125` | `SI` | 8.5 / 700 / 0.13em | `rgba(248,250,252,0.62) OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/SiLadder.tsx:129` | `Plays` | 8.5 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1052` | `{tH('roundResults.scope.fieldHeading')}` | 9.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/GlassCardFootAction.tsx:37` | `{label}` | 9.5 / 700 / 0.11em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/RoundResults.tsx:200` | `{t('roundResults.columns.round')}` | 9 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/RoundResults.tsx:201` | `{t('roundResults.columns.score')}` | 9 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/RoundResults.tsx:203` | `{t('roundResults.columns.best', { possessive })}` | 9 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/RoundResults.tsx:251` | `{t('roundResults.scope.ownHeading', { possessive: scope.possessive })}` | 9.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/TrajectoryLine.tsx:620` | `{subParts.join(' \u00B7 ')}` | 8.5 / 700 / 0.13em | `?T.readDim` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/TrajectoryLine.tsx:625` | `{rightText}` | 8.5 / 700 / 0.13em | `?T.readInk` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/TrajectoryLine.tsx:678` | `{holes[i].holeNo}` | 8.5 / 700 / 0.13em | `?T.tickInk OR ?T.tickDim` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/scorecardParts.tsx:69` | `{kicker}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/scorecardParts.tsx:201` | `{t('courses:scorecard.legendNotPlayed')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/scorecardParts.tsx:328` | `{Math.abs(delta).toFixed(1)}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/scorecardParts.tsx:329` | `{arrow}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/scorecardParts.tsx:360` | `{kicker}` | 9.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/scorecardParts.tsx:396` | `{label}` | 9 / 700 / 0.08em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/_shared/scorecard/scorecardParts.tsx:527` | `{courseLocation}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:53` | `{label}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:323` | `{holes[i].hole_no}` | 10 / 700 OR 600 / 0.13em | `rgba(248,250,252,0.72) OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:548` | `{connection ? t('courses:discover.scores.beTheFirst', 'Play it and you will be the first.') : t( 'courses:discover.scores.connectToAppear', 'Connect your handicap and every round you play here appears automatically.', )}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:729` | `{t('courses:courseDetail.plays.legendYou')}` | 7 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:758` | `{t( 'courses:courseDetail.plays.noFieldYet', 'No one else has posted a hole-by-hole round here yet', )}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:860` | `{basis}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:873` | `{t('courses:courseDetail.holes.tapHint')}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:116` | `{label}` | 11 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:259` | `{SCALE_MIN}` | 7 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:260` | `{t('courses:courseDetail.card.standardMark', { standard: STANDARD_SLOPE })}` | 7 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:270` | `{SCALE_MAX}` | 7 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:343` | `{tee.tee_label}` | 11 / 700 / 0.13em | `#F8FAFC OR rgba(248,250,252,0.72)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:388` | `{tee.total_yards == null ? '' : fmtInt(tee.total_yards)}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.72) OR rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:658` | `{t('courses:courseDetail.card.compare.kicker')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:663` | `{m.label}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:679` | `{name}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:701` | `{label}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:713` | `{tail}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:806` | `{t('courses:courseDetail.card.shape.parN', { n: c.par })}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1025` | `{\`${ slope != null ? t('courses:courseDetail.card.slopeLabel') : t('courses:courseDetail.card.lengthLabel') } \u00B7 ${t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}\`}` | 11 / 700 / 0.19em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1075` | `{cell.label}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1108` | `{t('courses:teeCard.col.hole')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1109` | `{t('courses:teeCard.col.length')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1110` | `{t('courses:teeCard.col.yards')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1111` | `{t('courses:teeCard.col.par')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1112` | `{t('courses:teeCard.col.si')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1149` | `{t('courses:courseDetail.card.rampEasier')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1156` | `{t('courses:courseDetail.card.rampHarder')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1303` | `{\`${ slope != null ? t('courses:courseDetail.card.slopeLabel') : t('courses:courseDetail.card.lengthLabel') } \u00B7 ${t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}\`}` | 11 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/Extremes.tsx:42` | `{label}` | 9.5 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/Extremes.tsx:65` | `{t('courseDetail.plays.fieldAvg', 'Field avg')}` | 8.5 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/HoleRowV2.tsx:325` | `{t(b.labelKey)}` | 6.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/HoleRowV2.tsx:491` | `{t('courses:courseDetail.holes.colPar')}` | 6.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/HoleRowV2.tsx:499` | `{t('courses:courseDetail.holes.colSi')}` | 6.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/HoleRowV2.tsx:533` | `{t('courses:courseDetail.plays.legendField')}` | 6.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/HoleRowV2.tsx:555` | `{t('courses:courseDetail.plays.legendYou')}` | 6.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/HoleRowV2.tsx:634` | `{s.label}` | 6.5 / 700 / 0.1em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/HoleRowV2.tsx:701` | `{label}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/ParTypeBars.tsx:123` | `{t('courseDetail.parTypes.parNPlural', { n: r.par, defaultValue: 'Par {{n}}s' })}` | 9.5 / 700 / 0.13em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/tokens.tsx:388` | `{aside}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/tokens.tsx:520` | `{it.label}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/tokens.tsx:566` | `{it.label}` | 11 / 700 / 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/tokens.tsx:626` | `{label}` | 11 / 700 / 0.13em | `?tone` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/courses/components/holes/analytical/tokens.tsx:725` | `{guidanceHeading}` | 11 / 700 / 0.16em OR 0.13em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/echo-chat/components/CompareBars.tsx:70` | `{benchmarkLabel} {fmt(benchmark)}` | 10 / 700 / 0.12em | `#6C7885` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/echo-chat/components/HolesBar.tsx:76` | `{holes[0].holeNo}` | 10 / 700 / 0.12em | `#6C7885` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/echo-chat/components/HolesBar.tsx:77` | `{holes[holes.length - 1].holeNo}` | 10 / 700 / 0.12em | `#6C7885` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/echo-chat/components/StateCards.tsx:114` | `{ex.kind}` | 11 / 700 / 0.12em | `#6C7885` | src/features/echo-chat/echo-chat.css:48; src/features/echo-chat/echo-chat.css:63 |
| ? | ? | `src/features/echo-chat/components/ThreadPrimitives.tsx:68` | `{children}` | 10 / 700 / 0.12em | `#6C7885` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/echo-chat/components/ThreadPrimitives.tsx:102` | `{b.text}` | 11 / 700 / 0.12em | `#6C7885` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/edit-profile/EditProfileGolf.tsx:70` | `Your golf` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/features/edit-profile/EditProfileGolf.tsx:96` | `Or` | 11px / 700 / .14em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:88 |
| ? | ? | `src/features/edit-profile/EditProfileGolf.tsx:97` | `Your own handicap` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:78; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/edit-profile/EditProfileLinksPrivacy.tsx:44` | `Links` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/features/edit-profile/EditProfileLinksPrivacy.tsx:49` | `Who sees what` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/features/edit-profile/EditProfileType.tsx:21` | `Profile type` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/features/edit-profile/EditProfileYou.tsx:57` | `{t('editProfile.you', { defaultValue: 'You' })}` | 10px / 700 / .16em | `rgba(248,250,252,0.42) OR rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:33 |
| ? | ? | `src/features/edit-profile/EditProfileYou.tsx:98` | `{t('editProfile.first', { defaultValue: 'First' })}` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:44; src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:78; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/edit-profile/EditProfileYou.tsx:99` | `{t('editProfile.last', { defaultValue: 'Last' })}` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/edit-profile/edit-profile.css:44; src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:78; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/edit-profile/EditProfileYou.tsx:108` | `{t('editProfile.displayName', { defaultValue: 'Display name' })}` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:78; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/edit-profile/EditProfileYou.tsx:174` | `{t('editProfile.username', { defaultValue: 'Username' })}` | 10px / 700 / .14em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:22; src/features/business-create/business-create.css:78; src/features/edit-profile/edit-profile.css:59; src/features/business-create/business-create.css:24 |
| ? | ? | `src/features/home-club/HomeClubPrompt.tsx:35` | `Home club` | 10px / 700 / 0.14em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/onboarding/WelcomeFirstLook.tsx:51` | `{t('welcome.startHere', { defaultValue: 'Start here' })}` | 10px / 700 / .16em | `rgba(248,250,252,.42)` | src/styles/welcome.css:41 |
| ? | ? | `src/features/onboarding/WelcomeHandicap.tsx:28` | `{t('welcome.connectNow', { defaultValue: 'Connect now' })}` | 9.5px / 700 / .16em | `rgba(248,250,252,.42)` | src/styles/welcome.css:13; src/styles/welcome.css:15; src/styles/welcome.css:15 |
| ? | ? | `src/features/onboarding/WelcomeHandicap.tsx:28` | `{t('welcome.partnership', { defaultValue: 'Partnership agreed' })}` | 9.5px / 700 / .16em | `rgba(248,250,252,.42)` | src/styles/welcome.css:13; src/styles/welcome.css:15; src/styles/welcome.css:15 |
| ? | ? | `src/features/post-v2/StageComposer.tsx:1055` | `{savingDraft?'Saving':t('closeGuard.saveDraft')}` | 15 / 700 / .14em | `#0A0A0C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/StageComposer.tsx:1057` | `DISCARD` | 13 / 700 / .14em | `#E2574C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/StageComposer.tsx:1209` | `Sharing` | 10.5px / 700 / .18em | `rgba(248,250,252,.42)` | src/features/post-v2/components/golf/composerGolf.css:2; src/features/post-v2/components/golf/composerGolf.css:3 |
| ? | ? | `src/features/post-v2/StageComposer.tsx:1252` | `{t('stage.chooseFromLibrary')}` | 12 / 700 / 0.10em | `#11131A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/components/AdjustSheet.tsx:248` | `Done` | 12 / 700 / 0.10em | `#16161A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/components/CoverFrameSheet.tsx:60` | `Apply` | 12 / 600 / 0.10em | `#16161A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/components/DraftsSheetV2.tsx:96` | `Delete` | 12 / 700 / 0.10em | `#16161A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/components/ImmersiveSuccessShell.tsx:98` | `Tap anywhere to close` | 11 / 700 / 0.14em | `rgba(255,255,255,0.4)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/components/PostSuccessV2.tsx:70` | `{t('composer:postFlow.live')}` | 11px / 700 / 0.16em | `#3DDC97` | src/styles/post-flow.css:1; src/styles/post-flow.css:60; src/styles/post-flow.css:61; src/styles/post-flow.css:63 |
| ? | ? | `src/features/post-v2/components/golf/ComposerGolf.tsx:14` | `On the course` | 10.5px / 700 / .18em | `rgba(248,250,252,.42)` | src/features/post-v2/components/golf/composerGolf.css:1; src/features/post-v2/components/golf/composerGolf.css:2; src/features/post-v2/components/golf/composerGolf.css:3 |
| ? | ? | `src/features/post-v2/components/golf/GolfPostSections.tsx:114` | `Where` | 10.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/components/golf/GolfPostSections.tsx:132` | `{course && <button type="button" style={labelAction} onClick={onCancel}>Cancel</button>}` | 10.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/components/golf/GolfPostSections.tsx:132` | `Where` | 10.5 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/post-v2/components/golf/GolfPostSections.tsx:192` | `Played with` | 10.5px / 700 / .18em | `rgba(248,250,252,.42)` | src/features/post-v2/components/golf/composerGolf.css:1; src/features/post-v2/components/golf/composerGolf.css:2; src/features/post-v2/components/golf/composerGolf.css:3 |
| ? | ? | `src/features/post-v2/components/golf/GolfPostSections.tsx:199` | `IN CAPTION` | 10px / 700 / .08em | `rgba(248,250,252,.42)` | src/features/post-v2/components/golf/composerGolf.css:1; src/features/post-v2/components/golf/composerGolf.css:58; src/features/post-v2/components/golf/composerGolf.css:61; src/features/post-v2/components/golf/composerGolf.css:66 |
| ? | ? | `src/features/post-v2/components/golf/ShareFooter.tsx:22` | `{busy ? <Loader2 size={16} className="animate-spin text-[var(--pf-ink)]" style={{ display: 'block', margin: '0 auto' }} /> : label}` | 15 / 700 / 0.14em | `rgba(248,250,252,0.42) OR #0A0A0C` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/pro-profile/LinkedProSections.tsx:38` | `LIVE · {tour.toUpperCase()}` | 9px / 700 / .1em | `#34D77F` | src/features/pro-profile/pro-profile.css:2; src/features/pro-profile/pro-profile.css:6; src/features/pro-profile/pro-profile.css:7; src/features/pro-profile/pro-profile.css:52 |
| ? | ? | `src/features/pro-profile/ProAskSheets.tsx:17` | `ASK {first.toUpperCase()}` | 10px / 700 / .14em | `rgba(248,250,252,0.62)` | src/features/pro-profile/pro-profile.css:140 |
| ? | ? | `src/features/pro-profile/ProAskSheets.tsx:53` | `HOW IT LOOKS ON YOUR PROFILE` | 10px / 700 / .12em | `rgba(248,250,252,0.42)` | src/features/pro-profile/pro-profile.css:1; src/features/pro-profile/pro-profile.css:59; src/features/pro-profile/pro-profile.css:163; src/features/pro-profile/pro-profile.css:194; src/features/pro-profile/pro-profile.css:195 |
| ? | ? | `src/features/pro-verification/ProDetailsSheet.tsx:74` | `GOLF PROFESSIONAL` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/pro-verification/pro-verification.css:5; src/features/pro-verification/pro-verification.css:7; src/features/pro-verification/pro-verification.css:9; src/features/pro-verification/pro-verification.css:10 |
| ? | ? | `src/features/pro-verification/ProDetailsSheet.tsx:89` | `WHICH TOUR` | 10px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/features/pro-verification/pro-verification.css:5; src/features/pro-verification/pro-verification.css:7; src/features/pro-verification/pro-verification.css:13; src/features/pro-verification/pro-verification.css:19 |
| ? | ? | `src/features/pro-verification/ProDetailsSheet.tsx:96` | `WHICH TOUR` | 10px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/features/pro-verification/pro-verification.css:5; src/features/pro-verification/pro-verification.css:7; src/features/pro-verification/pro-verification.css:13; src/features/pro-verification/pro-verification.css:19 |
| ? | ? | `src/features/pro-verification/ProDetailsSheet.tsx:100` | `YOUR TOUR PROFILE` | 10px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/features/pro-verification/pro-verification.css:5; src/features/pro-verification/pro-verification.css:7; src/features/pro-verification/pro-verification.css:13; src/features/pro-verification/pro-verification.css:19 |
| ? | ? | `src/features/pro-verification/ProDetailsSheet.tsx:108` | `HOW CAN WE CHECK?` | 10px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/features/pro-verification/pro-verification.css:5; src/features/pro-verification/pro-verification.css:7; src/features/pro-verification/pro-verification.css:13; src/features/pro-verification/pro-verification.css:19 |
| ? | ? | `src/features/pro-verification/ProDetailsSheet.tsx:113` | `YOUR PGA` | 10px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/features/pro-verification/pro-verification.css:5; src/features/pro-verification/pro-verification.css:7; src/features/pro-verification/pro-verification.css:13; src/features/pro-verification/pro-verification.css:19 |
| ? | ? | `src/features/pro-verification/ProDetailsSheet.tsx:119` | `WHERE YOU COACH` | 10px / 700 / 0.14em | `rgba(248,250,252,0.42)` | src/features/pro-verification/pro-verification.css:5; src/features/pro-verification/pro-verification.css:7; src/features/pro-verification/pro-verification.css:13; src/features/pro-verification/pro-verification.css:19 |
| ? | ? | `src/features/pro-verification/ProLabel.tsx:22` | `{word}` | 7.5px / 700 / 0.14em | `transparent` | src/features/pro-verification/pro-label.css:2 |
| ? | ? | `src/features/pro-verification/ProStatusSheet.tsx:33` | `GOLF PROFESSIONAL` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/pro-verification/pro-status-controls.css:12; src/features/pro-verification/pro-status-controls.css:13; src/features/pro-verification/pro-status-controls.css:14 |
| ? | ? | `src/features/profile-sheet-v2/components/YourCourseAnalyticsSheet.tsx:728` | `{label}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/ReviewComposerV2.tsx:278` | `Retry` | 15 / 600 / 0.10em | `#16161A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/ReviewComposerV2.tsx:1062` | `{t('review.wizard.draftRestored.discard')}` | 11.5 / 700 / 0.10em | `#FF6B6B` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/ReviewComposerV2.tsx:1103` | `{t('review.wizard.draftRestored.mediaDismiss')}` | 11.5 / 700 / 0.10em | `rgba(248,250,252,0.60)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/ReviewComposerV2.tsx:1168` | `{t('review.wizard.stepOne.wordsHeading')}` | 10.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/ReviewComposerV2.tsx:1246` | `{t('review.wizard.stepOne.photosHeading')}` | 10.5 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/components/EditLossSheet.tsx:56` | `Keep them` | 12 / 700 / 0.10em | `#16161A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/components/MediaTray.tsx:155` | `Add` | 11 / 700 / 0.10em | `? OR rgba(248,250,252,0.60)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/components/OverallScrubber.tsx:23` | `{t('review.wizard.step3.overallLabel')}` | 10px / 700 / .16em | `rgba(248,250,252,.62)` | src/index.css:5710 |
| ? | ? | `src/features/review-v2/components/RemoveReviewSheetV2.tsx:132` | `{submitting ? 'Removing...' : 'Remove'}` | 12 / 700 / 0.10em | `#16161A` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/review-v2/components/ReviewScoreHeadings.tsx:23` | `{t('review.wizard.step3.breakdownLabel')}` | 10px / 700 / .16em | `rgba(248,250,252,.62)` | src/index.css:5706; src/index.css:5732; src/index.css:5707; src/index.css:5710 |
| ? | ? | `src/features/review-v2/components/SubmitBar.tsx:120` | `{label}` | 12.5 / 700 / 0.10em | `#16161A OR rgba(248,250,252,0.60)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/social-suggestions/NobodySawThatRound.tsx:127` | `{roundLine}` | 9 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/social-suggestions/SuggestedGolferRow.tsx:116` | `{reasonText(golfer, t)}` | 9 / 700 / 0.14em | `#F7931E OR rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/social-suggestions/SuggestedGolfersBlock.tsx:58` | `{t('suggestedGolfers.heading')}` | 11 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/social-suggestions/SuggestedGolfersBlock.tsx:69` | `{t('suggestedGolfers.seeAll')}` | 10 / 700 / 0.14em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/social-suggestions/SuggestedGolfersBlock.tsx:153` | `{t(reason.key, { ...reason.vars, defaultValue: reason.def })}` | 9 / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/social-suggestions/SuggestedGolfersRail.tsx:54` | `{t('suggestedGolfers.railKicker', 'GOLFERS YOU MIGHT KNOW')}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/features/video-details/RoundVideoScore.tsx:15` | `SCORECARD` | 10.5px / 700 / .18em | `rgba(248,250,252,.42)` | src/features/video-details/video-viewer.css:15; src/features/video-details/round-video.css:3; src/features/video-details/video-viewer.css:15 |
| ? | ? | `src/features/video-details/VideoAboutSheet.tsx:27` | `{name}` | 10.5px / 700 / .18em | `rgba(248,250,252,.42)` | src/features/video-details/video-viewer.css:15; src/features/video-details/video-viewer.css:15 |
| ? | ? | `src/pages/BusinessCreate.tsx:143` | `{t('businessCreate.kicker', { defaultValue: 'Put your business on clbhouz' })}` | 11px / 700 / 0.16em | `rgba(248,250,252,0.62)` | src/features/business-create/business-create.css:2; src/features/business-create/business-create.css:138; src/features/business-create/business-create.css:170; src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:8 |
| ? | ? | `src/pages/BusinessCreate.tsx:148` | `{t(\`businessCreate.group.${g.key}\`, { defaultValue: g.label })}` | 10px / 700 / .16em | `rgba(248,250,252,0.42)` | src/features/business-create/business-create.css:2; src/features/business-create/business-create.css:138; src/features/business-create/business-create.css:170; src/features/business-create/business-create.css:7; src/features/business-create/business-create.css:135; src/features/business-create/business-create.css:139; src/features/business-create/business-create.css:11 |
| ? | ? | `src/pages/BusinessInvitePage.tsx:327` | `{t('business.team.sectionFive.homeClubGroup', { club: business?.club_name &#124;&#124; '', defaultValue: \`Home club: ${business?.club_name &#124;&#124; ''}\` })}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/BusinessInvitePage.tsx:342` | `{t('business.team.sectionFive.followGroup', { business: businessName, defaultValue: \`Follow ${businessName}\` })}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/BusinessInvitePage.tsx:419` | `{t('business.team.sectionFive.roleKicker', { defaultValue: 'Role' })}` | 11 / 700 / 0.16em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/BusinessReviewsPage.tsx:335` | `Awaiting reply` | 10px / 700 / 0.15em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/BusinessReviewsPage.tsx:402` | `You replied · {r.response!.updated_at ? \`edited ${relativeTime(r.response!.updated_at)}\` : relativeTime(r.response!.created_at)}` | 10px / 700 / 0.14em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/ClubAnalyticsPage.tsx:203` | `Missing a course?` | 9 / 700 / 0.19em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/EchoHistoryPage.tsx:432` | `{section.label}` | 11 / 700 / 0.12em | `#8B929C` | src/index.css:2725; src/index.css:2734; src/index.css:2737 |
| ? | ? | `src/pages/EchoV2Page.tsx:287` | `{t('chat.chart.holesTitle', 'Where the strokes go')}` | 11 / 700 / 0.12em | `#6C7885` | src/features/echo-chat/echo-chat.css:20; src/features/echo-chat/echo-chat.css:31; src/features/echo-chat/echo-chat.css:34; src/features/echo-chat/echo-chat.css:38 |
| ? | ? | `src/pages/EchoV2Page.tsx:303` | `{t('chat.chart.coursesTitle', 'Course by course')}` | 11 / 700 / 0.12em | `#6C7885` | src/features/echo-chat/echo-chat.css:20; src/features/echo-chat/echo-chat.css:31; src/features/echo-chat/echo-chat.css:34; src/features/echo-chat/echo-chat.css:38 |
| ? | ? | `src/pages/FindPeoplePage.tsx:313` | `{group.followAll ? ( <FollowAllButton group={group} followed={followed} markFollowed={markFollowed} /> ) : group.seeAll ? ( /* FIX §5 — a capped Suggested group links to its full tab. */ <button type="button" onClick={() => onTab(group.seeAll!.tab)} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 600, letterSpacing: 0, textTransform: 'none', color: A.INK, fontFamily: ROW_FONT, cursor: 'pointer', }} > {t('findPeople.seeAll', { count: group.seeAll.total, defaultValue: \`See all ${group.seeAll.total}\` })} </button> ) : ( <span>{group.count ?? total}</span> )}` | 10 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/FindPeoplePage.tsx:326` | `{copy(group.label)}` | 10 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/FindPeoplePage.tsx:350` | `{group.count ?? total}` | 10 / 700 / 0.16em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/ProfilePageV2.tsx:1191` | `{isFollowing ? t('hero.following', 'Following') : t('hero.follow', 'Follow')}` | 11 / 700 / 0.12em | `#0A0A0C` | src/index.css:3849; src/index.css:3876 |
| ? | ? | `src/pages/Welcome.tsx:145` | `{connectOpen &#124;&#124; proBranch ? t('welcome.kickerConnect', { defaultValue: 'Your handicap' }) : t(\`welcome.kicker${step}\`, { defaultValue: ['Welcome to clbhouz', 'Your golf', 'Your golf friends', 'Optional', 'All set'][step - 1] })}` | 10.5px / 700 / .16em | `rgba(248,250,252,0.62) OR rgba(248,250,252,.62)` | src/styles/welcome.css:2; src/styles/welcome.css:6; src/styles/welcome.css:6 |
| ? | ? | `src/pages/auth/AuthCallback.tsx:154` | `{t('callback.brandTagline')}` | 11 / ? / 0.08em | `?SURFACE.dark.dim` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/gate/HandoffPage.tsx:231` | `{t('gate.terms', { defaultValue: 'Terms' })}` | 8.5 / 700 / 0.17em | `rgba(255,255,255,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/gate/HandoffPage.tsx:234` | `{t('gate.privacy', { defaultValue: 'Privacy' })}` | 8.5 / 700 / 0.17em | `rgba(255,255,255,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/gate/home/WebCourseCard.tsx:13` | `HOLE` | 9 / 700 / .14em | `rgba(248,250,252,.42)` | src/App.css:36 |
| ? | ? | `src/pages/gate/home/WebCourseCard.tsx:13` | `VS PAR` | 9 / 700 / .14em | `rgba(248,250,252,.42)` | src/App.css:36 |
| ? | ? | `src/pages/gate/home/WebCourseCard.tsx:13` | `CARD` | 9 / 700 / .14em | `rgba(248,250,252,.42)` | src/App.css:36 |
| ? | ? | `src/pages/manage/HelpPage.tsx:32` | `{caption}` | 11px / 600 / 0.12em | `rgba(248,250,252,0.62)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/manage/MyRequestsPage.tsx:156` | `{cat}` | 11px / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/manage/MyRequestsPage.tsx:162` | `{status.label}` | 11px / 700 / 0.12em | `?status.fg` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/manage/SupportThreadPage.tsx:140` | `{cat}` | 11px / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/manage/SupportThreadPage.tsx:146` | `{status.label}` | 11px / 700 / 0.12em | `?status.fg` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/messaging-v2/ConversationSettingsSheet.tsx:589` | `{t('messaging:list.members')}` | 11 / 700 / 0.12em | `#6C7885` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/messaging-v2/HeadToHeadCard.tsx:64` | `{t('h2h.labelPoints', { defaultValue: 'Head to head · points' })}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/messaging-v2/HeadToHeadCard.tsx:81` | `{t('h2h.labelGross', { defaultValue: 'Gross' })}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/messaging-v2/InboxV2Page.tsx:390` | `{t('messaging:banner.businessTitle')}` | 11 / 700 / 0.12em | `#6C7885` | src/features/messaging-dark/messages-dark.css:107; src/features/messaging-dark/messages-dark.css:121; src/features/messaging-dark/messages-dark.css:124; src/features/echo-chat/echo-chat.css:48; src/features/echo-chat/echo-chat.css:63 |
| ? | ? | `src/pages/messaging-v2/NewConversationSheet.tsx:560` | `{t('compose.playedWith', { defaultValue: 'Played with' })}` | 11 / 700 / 0.12em | `#6C7885` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/messaging-v2/PlayingOffRail.tsx:124` | `{t('playingOff.eyebrow', { defaultValue: 'Playing off' })}` | 11 / 700 / 0.12em | `#6C7885` | Inline/constant/inherited candidate; role and route unverified. |
| ? | ? | `src/pages/messaging-v2/ShareCards.tsx:70` | `{t('share.roundLabel', { defaultValue: 'Round' })}` | 9.5 / 700 / 0.12em | `rgba(248,250,252,0.42)` | Inline/constant/inherited candidate; role and route unverified. |

### CSS candidates awaiting consumer expansion

| File:line | Selector | Size / weight / tracking | Colour |
|---|---|---|---|
| `src/components/business/addressPanel.css:4` | `.addr-panel` | ? / ? / normal | `?` |
| `src/components/business/businessMentions.css:2` | `.business-mentions-head h2` | 10.5px / 700 / .16em | `var(--business-mention-mute)` |
| `src/components/business/businessMentions.css:3` | `.business-mentions-count` | 10.5px / 700 / .12em | `var(--business-mention-dim)` |
| `src/components/business/businessMentions.css:19` | `.business-mention-hidden` | 9.5px / 700 / .1em | `var(--business-mention-photo-ink)` |
| `src/components/business/editor/business-edit.css:42` | `.be2-name` | 22px / 700 / -.02em | `?` |
| `src/components/business/editor/business-edit.css:64` | `.be2-fld>span` | 10px / 700 / .14em | `var(--ep-dim)` |
| `src/components/business/editor/business-where-contact.css:8` | `.be3-fld>span,.be3-field-label` | 10px / 700 / .14em | `var(--ep-dim)` |
| `src/components/course-media-tab/hole-photo-fast.css:5` | `.hole-photo-fast-title` | 16px / 700 / 0 | `?` |
| `src/components/course-media-tab/hole-walk.css:13` | `.hole-walk-open .hole-walk-count` | ? / ? / .06em | `var(--hole-walk-faint)` |
| `src/components/course-media-tab/hole-walk.css:15` | `.hole-walk-legend` | 9.5px / 700 / .06em | `var(--hole-walk-dim)` |
| `src/components/course-media-tab/hole-walk.css:22` | `.hole-walk-photo-open` | 12.5px / 700 / .07em | `var(--hole-walk-faint)` |
| `src/components/course-media-tab/hole-walk.css:27` | `.hole-walk-stats span` | 9.5px / 700 / .08em | `var(--hole-walk-dim)` |
| `src/components/course-media-tab/hole-walk.css:42` | `.hole-walk-months span` | 10px / 700 / .09em | `var(--hole-walk-body)` |
| `src/components/course-media-tab/hole-walk.css:61` | `.hole-walk-owner-label` | 9.5px / 700 / .08em | `var(--hole-walk-dim)` |
| `src/components/course-media-tab/media-v2.css:2` | `.media-v2-top h2` | 24px / 700 / 0 | `?` |
| `src/components/course-media-tab/media-v2.css:5` | `.media-v2-head h3` | 17px / 700 / 0 | `var(--media-v2-ink)` |
| `src/components/course-media-tab/media-v2.css:6` | `.media-v2-label` | 9.5px / 700 / .14em | `var(--media-v2-dim)` |
| `src/components/course-media-tab/media-v2.css:24` | `.media-v2-processing` | 11px / 700 / .14em | `var(--media-v2-dim)` |
| `src/components/course-media-tab/media-v3.css:1` | `.media-v3-tag-card` | ? / ? / 0 | `var(--media-v2-ink)` |
| `src/components/course-media-tab/shot-tag-choices.css:7` | `.shot-tag-title` | 20px / 700 / 0 | `?` |
| `src/components/course-media-tab/shot-tag-choices.css:8` | `.shot-tag-position` | 9.5px / 700 / .14em | `var(--media-v2-dim)` |
| `src/components/courses/browse/latestHoles.css:10` | `.latest-hole-number` | 40px / 700 / -0.05em | `var(--latest-hole-ink)` |
| `src/components/courses/browse/latestHoles.css:11` | `.latest-hole-label` | 8.5px / 700 / 0.14em | `var(--latest-hole-label-ink)` |
| `src/components/courses/browse/latestHoles.css:12` | `.latest-hole-course` | 17px / 700 / -0.03em | `?` |
| `src/components/courses/browse/standout-rounds.css:6` | `.standout-course-name` | 17px / 700 / -0.02em | `#F8FAFC` |
| `src/components/courses/browse/standout-rounds.css:11` | `.standout-stamp` | 8.5px / 700 / 0.14em | `#F8FAFC` |
| `src/components/courses/course-detail/about/course-honours.css:4` | `.honours-head` | 10px / 700 / 0.16em | `rgba(248,250,252,0.62)` |
| `src/components/courses/course-detail/about/course-honours.css:6` | `.honours-pos` | ? / ? / 0.06em | `rgba(248,250,252,0.42)` |
| `src/components/courses/course-detail/about/course-honours.css:23` | `.honours-dt small` | 10px / 700 / 0.1em | `rgba(248,250,252,0.42)` |
| `src/components/courses/courseListCard.css:10` | `.course-list-position` | 24px / 700 / -0.04em | `var(--course-list-position)` |
| `src/components/courses/courseListCard.css:12` | `.course-list-name` | 18px / 700 / -0.01em | `var(--course-list-photo-ink)` |
| `src/components/courses/courseListCard.css:18` | `.course-list-figure` | 20px / 700 / -0.02em | `?` |
| `src/components/courses/courseListCard.css:28` | `.course-list-record-label` | 8.5px / 700 / 0.14em | `var(--course-list-record)` |
| `src/components/courses/courseListCard.css:32` | `.course-list-gross-label` | 8px / 700 / 0.14em | `var(--course-list-dim)` |
| `src/components/courses/courseListView.css:6` | `.course-list-columns` | 9px / 700 / 0.14em | `var(--course-list-dim)` |
| `src/components/courses/courseListView.css:12` | `.course-list-row-name` | 15px / 600 / -0.01em | `?` |
| `src/components/courses/courseListView.css:16` | `.course-list-row-figure` | 18px / 700 / -0.02em | `?` |
| `src/components/courses/top100/t100Race.css:15` | `.t100-captions` | 9.5px / 700 / .1em | `var(--t100-dim)` |
| `src/components/courses/top100/t100Race.css:26` | `.t100-photo-name` | 10px / 700 / .04em | `var(--t100-ink)` |
| `src/components/courses/top100/t100Race.css:41` | `.t100-value` | 22px / 700 / -.02em | `?` |
| `src/components/courses/top100/t100Race.css:42` | `.t100-break` | 12px / ? / .2em | `var(--t100-dim)` |
| `src/components/courses/top100/t100Race.css:43` | `.t100-see` | 11px / 700 / .16em | `var(--t100-mute)` |
| `src/components/courses/top100/top100Compare.css:2` | `.t100b-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--t100b-ink)` |
| `src/components/courses/top100/top100Compare.css:2` | `.t100b-label` | 11px / 700 / .16em | `var(--t100b-mute)` |
| `src/components/courses/top100/top100Compare.css:2` | `.t100b-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `var(--t100b-ink)` |
| `src/components/courses/top100/top100Compare.css:4` | `.t100b-axis` | 9.5px / 700 / .12em | `var(--t100b-dim)` |
| `src/components/courses/top100/top100Compare.css:5` | `.t100b-see-all` | 11px / 700 / .14em | `var(--t100b-mute)` |
| `src/components/courses/top100/top100Compare.css:24` | `.t100b-lb-labels` | 10px / 700 / .12em | `var(--t100b-dim)` |
| `src/components/feed/feed-media-chrome.css:5` | `[data-hole-card-label]` | 8px / ? / .1em | `?` |
| `src/components/feed/feed-media-chrome.css:9` | `[data-score-tile] [data-score-label]` | 8px / ? / .1em | `?` |
| `src/components/feed/feed-media-chrome.css:13` | `[data-hole-card-label]` | 7px / ? / .06em | `?` |
| `src/components/feed/feed-media-chrome.css:17` | `[data-score-tile] [data-score-label]` | 7px / ? / .06em | `?` |
| `src/components/fullscreen-feed/course-gallery.css:2` | `.course-gallery-chrome` | ? / ? / 0 | `#F8FAFC` |
| `src/components/fullscreen-feed/course-gallery.css:3` | `.course-gallery-chrome button` | ? / ? / 0 | `?` |
| `src/components/fullscreen-feed/course-gallery.css:10` | `.course-gallery-heading b` | 17px / 700 / -0.02em | `#FFFFFF` |
| `src/components/fullscreen-feed/course-gallery.css:21` | `.course-gallery-label` | 9px / 700 / .14em | `rgba(248,250,252,0.68)` |
| `src/components/fullscreen-feed/course-gallery.css:40` | `.course-gallery-kicker` | 9.5px / 700 / .16em | `rgba(248,250,252,0.68)` |
| `src/components/fullscreen-feed/course-gallery.css:41` | `.course-gallery-facts h2` | 15px / 600 / 0 | `#FFFFFF` |
| `src/components/fullscreen-feed/course-gallery.css:46` | `.course-gallery-stats span` | 8.5px / 700 / .12em | `rgba(248,250,252,0.68)` |
| `src/components/fullscreen-feed/course-gallery.css:47` | `.course-gallery-stats span` | 7.5px / ? / .04em | `?` |
| `src/components/fullscreen-feed/course-gallery.css:66` | `.course-gallery-grid header .course-gallery-label` | 12px / 400 / 0 | `rgba(248,250,252,0.5)` |
| `src/components/fullscreen-feed/fullscreen-stack.css:12` | `.fs-stack-member .fs-following` | 10px / 700 / .14em | `rgba(248,250,252,.62)` |
| `src/components/fullscreen-feed/fullscreen-stack.css:14` | `.fs-review-chip` | 10.5px / 700 / .1em | `#F8FAFC` |
| `src/components/fullscreen-feed/fullscreen-stack.css:19` | `.fs-stats span` | 8.5px / 700 / .1em | `rgba(248,250,252,.62)` |
| `src/components/fullscreen-feed/fullscreen-stack.css:26` | `.fs-stats span` | 7px / ? / .04em | `?` |
| `src/components/invite/inviteConnected.css:3` | `.if1-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/components/invite/inviteConnected.css:8` | `.if1-stat b` | 20px / 700 / -.03em | `?` |
| `src/components/invite/inviteConnected.css:10` | `.if1-stat span` | 9.5px / 700 / .12em | `var(--invite-dim)` |
| `src/components/invite/inviteConnected.css:12` | `.if1 .if1-bulk, .if1 .if1-share` | 15px / 600 / 0 | `?` |
| `src/components/invite/inviteConnected.css:19` | `.if1-group-title` | 10px / 700 / .16em | `var(--invite-dim)` |
| `src/components/moderation/reportSheet.css:6` | `.report-reason-title` | 15px / 600 / -0.01em | `#F8FAFC` |
| `src/components/profile/courses/coursesArchive.css:7` | `.courses-archive .archive-heading h2` | 22px !important / ? / 0 !important | `?` |
| `src/components/profile/courses/coursesArchive.css:21` | `.courses-archive .archive-control` | ? / 700 / 0 | `?` |
| `src/components/profile/handicap/whs/connect/connect-seat.css:2` | `.connect-seat h1` | 38px / 700 / -0.035em | `?` |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:57` | `.champions-cabinet-tile[data-state="yours"] .champions-cabinet-state` | ? / 700 / 0.08em | `?` |
| `src/components/profile/hero/profile-form.css:8` | `.profile-form-gross` | 20px / 700 / -.02em | `?` |
| `src/components/settings/settingsNotifications.css:8` | `.st4-friends>b` | 16px / 700 / -0.01em | `var(--ep-ink)` |
| `src/components/settings/settingsPrivacy.css:3` | `.st3-seen i` | 10px / 700 / 0.16em | `var(--ep-dim)` |
| `src/components/settings/settingsYourData.css:2` | `.bizc-sheet[data-testid=st5-your-data-sheet]` | ? / ? / 0 | `?` |
| `src/components/settings/settingsYourData.css:3` | `.bizc-sheet[data-testid=st5-your-data-sheet] .bizc-sheet-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/components/settings/settingsYourData.css:11` | `.bizc-sheet .st5-email` | 16px / 600 / 0 | `var(--bizc-canvas)` |
| `src/components/toast/toast.css:14` | `.eh-toast` | 13px / ? / 0.02em | `hsl(var(--background))` |
| `src/features/activity-v2/activity-rounds.css:9` | `.activity-score-tile b` | 19px / 700 / -.03em | `?` |
| `src/features/amateur-ranking/ranking-tab.css:7` | `.amateur-ranking-tab .amr-hd h2` | 9px / 700 / .16em | `rgba(248,250,252,.42)` |
| `src/features/amateur-ranking/ranking-tab.css:10` | `.amateur-ranking-tab .amr-hl>strong` | 44px / 700 / -.02em | `?` |
| `src/features/amateur-ranking/ranking-tab.css:12` | `.amateur-ranking-tab .amr-hl b` | 10px / 700 / .14em | `rgba(248,250,252,.62)` |
| `src/features/amateur-ranking/ranking-tab.css:19` | `.amateur-ranking-tab .amr-ch .amr-ax` | 8px / 700 / .12em | `?` |
| `src/features/amateur-ranking/ranking-tab.css:25` | `.amateur-ranking-tab .amr-tile span` | 7px / 700 / .1em | `rgba(248,250,252,.42)` |
| `src/features/amateur-ranking/ranking-tab.css:32` | `.amateur-ranking-tab .amr-pts i` | 7.5px / ? / .12em | `rgba(248,250,252,.42)` |
| `src/features/amateur-ranking/ranking-tab.css:39` | `.amateur-ranking-tab .amr-career b` | 9px / 700 / .14em | `rgba(248,250,252,.42)` |
| `src/features/amateur-ranking/ranking-tab.css:49` | `.amateur-ranking-tab.amr-sheet .pro-collection-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `rgba(248,250,252,.62)` |
| `src/features/amateur-ranking/ranking-tab.css:50` | `.amateur-ranking-tab.amr-sheet h2` | 20px / 700 / -.01em | `?` |
| `src/features/amateur-ranking/ranking-tab.css:52` | `.amateur-ranking-tab.amr-sheet .pro-collection-field label` | 10px / 700 / .1em | `rgba(248,250,252,.42)` |
| `src/features/amateur-ranking/wagr-settings.css:14` | `.wagr-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--pro-profile-amber)` |
| `src/features/amateur-ranking/wagr-settings.css:15` | `.wagr-heading.wagr-heading` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `var(--ep-ink)` |
| `src/features/business/clubAnalytics/courseLead.css:3` | `.club-course-lead-early` | 10.5px / 700 / .14em | `var(--team-ink)` |
| `src/features/business/clubAnalytics/courseLead.css:4` | `.club-course-lead-headline` | 23px / 700 / -.02em | `var(--team-ink)` |
| `src/features/business/clubAnalytics/teeSheet.css:2` | `.tee-sheet-kicker` | 10.5px / 700 / .16em | `var(--tee-sheet-muted)` |
| `src/features/business/clubAnalytics/teeSheet.css:3` | `.tee-sheet-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/features/business/clubAnalytics/teeSheet.css:6` | `.tee-sheet-subheading` | 10.5px / 700 / .14em | `var(--tee-sheet-dim)` |
| `src/features/business-create/business-create.css:2` | `.bizc-shell` | ? / ? / 0 | `var(--bizc-ink)` |
| `src/features/business-create/business-create.css:8` | `.bizc-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--bizc-mute)` |
| `src/features/business-create/business-create.css:9` | `.bizc-body h1` | 28px / 700 / -0.035em | `?` |
| `src/features/business-create/business-create.css:11` | `.bizc-group` | 10px / 700 / .16em | `var(--bizc-dim)` |
| `src/features/business-create/business-create.css:24` | `.bizc-field-label` | 10px / 700 / .14em | `var(--bizc-dim)` |
| `src/features/business-create/business-create.css:44` | `.bizc-clubcard-name` | 18px / 700 / -0.01em | `?` |
| `src/features/business-create/business-create.css:50` | `.bizc-facts i` | 9.5px / 700 / .12em | `var(--bizc-dim)` |
| `src/features/business-create/business-create.css:80` | `.bizc-areakick` | 10px / 700 / .16em | `var(--bizc-mute)` |
| `src/features/business-create/business-create.css:93` | `.bizc-row-label` | 10px / 700 / .12em | `var(--bizc-dim)` |
| `src/features/business-create/business-create.css:113` | `.bizc-sheet-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `var(--bizc-ink)` |
| `src/features/business-create/business-create.css:151` | `.bizc-mini-name` | 20px / 700 / -0.02em | `?` |
| `src/features/business-create/business-create.css:157` | `.bizc-about-count` | 11px / 600 / 0 | `?` |
| `src/features/business-create/business-create.css:171` | `.bizc-finish-body .bizc-mini-name` | ? / ? / 0 | `?` |
| `src/features/chrome-v2/account-glance.css:12` | `.account-glance` | ? / ? / 0 | `var(--account-ink)` |
| `src/features/chrome-v2/account-glance.css:13` | `.account-glance button.account-button` | ? / ? / 0 | `inherit` |
| `src/features/chrome-v2/account-glance.css:44` | `.account-admin` | 9.5px / 700 / .13em | `var(--account-dim)` |
| `src/features/chrome-v2/account-glance.css:46` | `.account-glance button.account-signout-button` | 11px / 700 / .16em | `var(--account-dim)` |
| `src/features/chrome-v2/index-glance.css:12` | `.connect-glance-kicker` | 9.5px / 700 / 0.14em | `var(--glance-amber)` |
| `src/features/chrome-v2/index-glance.css:20` | `.connect-glance-stat-label` | 8.5px / 700 / 0.14em | `var(--glance-dim)` |
| `src/features/chrome-v2/island-back.css:8` | `.island-back-name` | 16px / 700 / -0.01em | `?` |
| `src/features/chrome-v2/page-title.css:4` | `.chrome-page-title h1` | 30px / 700 / 0 | `var(--island-back-ink)` |
| `src/features/chrome-v2/tour-glance.css:8` | `.tour-menu-kicker` | 9.5px / 700 / 0.14em | `?` |
| `src/features/clubhouse-tour/tourSlot.css:7` | `.tour-slot-kicker` | 11px / 700 / .15em | `var(--feed-tour-ink)` |
| `src/features/clubhouse-tour/tourSlot.css:9` | `.tour-slot-title` | 28px / 700 / -.01em | `?` |
| `src/features/clubhouse-tour/tourSlot.css:14` | `.tour-slot-lead-heading` | 10px / 700 / .14em | `var(--feed-tour-mute)` |
| `src/features/clubhouse-tour/tourSlot.css:25` | `.tour-slot-figure-label` | 10px / 700 / .14em | `var(--feed-tour-mute)` |
| `src/features/clubhouse-tour/tourSlot.css:29` | `.tour-slot-round-node span` | 9.5px / 700 / .14em | `var(--feed-tour-faint)` |
| `src/features/clubhouse-tour/tourSlot.css:37` | `.tour-slot-fact-label` | 9.5px / 700 / .14em | `var(--feed-tour-faint)` |
| `src/features/clubhouse-tour/tourSlot.css:41` | `.tour-slot-board-header` | 10px / 700 / .08em | `var(--feed-tour-faint)` |
| `src/features/coach/coach.css:2` | `.coach-kicker` | 10.5px / 700 / .16em | `var(--club-you-muted)` |
| `src/features/coach/coach.css:3` | `.coach-kicker span:last-child` | ? / ? / .12em | `var(--tee-sheet-dim)` |
| `src/features/coach/coach.css:4` | `.coach-title` | 17px / 700 / -.01em | `?` |
| `src/features/coach/coach.css:12` | `.coach-sheet h2` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/features/coach/coach.css:44` | `.coach-big b` | 44px / 700 / -.03em | `?` |
| `src/features/coach/coach.css:55` | `.coach-chart-label` | 10px / 700 / .12em | `var(--tee-sheet-dim)` |
| `src/features/composer-flow/post-or-review.css:9` | `.post-or-review` | ? / ? / 0 | `var(--post-review-ink)` |
| `src/features/composer-flow/post-or-review.css:11` | `.post-or-review-header h1` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/features/composer-flow/post-or-review.css:18` | `.post-or-review-box-head h2` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/features/composer-flow/post-or-review.css:27` | `.post-or-review-divider b` | 11px / 700 / 0.16em | `var(--post-review-dim)` |
| `src/features/composer-flow/review-course-search.css:5` | `.rcs` | ? / ? / 0 | `var(--rcs-ink)` |
| `src/features/composer-flow/review-course-search.css:8` | `.rcs-head h1` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `var(--rcs-ink)` |
| `src/features/composer-flow/review-course-search.css:20` | `.rcs-section h2` | 10.5px / 700 / 0.16em | `var(--rcs-dim)` |
| `src/features/composer-flow/review-course-search.css:40` | `.rcs-right small.rcs-yours` | ? / 700 / 0.08em | `?` |
| `src/features/creator/profile-creator.css:7` | `.profile-round-video` | 10px / 700 / .02em | `var(--welcome-canvas)` |
| `src/features/edit-profile/edit-profile.css:24` | `.ep-name` | 22px / 700 / -0.02em | `?` |
| `src/features/edit-profile/edit-profile.css:33` | `.ep-group` | 10px / 700 / .16em | `var(--ep-dim)` |
| `src/features/edit-profile/edit-profile.css:51` | `.ep-count` | 11px / 600 / 0 | `var(--ep-dim)` |
| `src/features/edit-profile/edit-profile.css:88` | `.ep-golf-or` | 11px / 700 / .14em | `var(--ep-dim)` |
| `src/features/edit-profile/edit-profile.css:147` | `.st2-name` | 17px / 700 / -0.01em | `?` |
| `src/features/edit-profile/edit-profile.css:154` | `.st2-figure b` | 22px / 700 / -0.03em | `var(--ep-ink)` |
| `src/features/edit-profile/edit-profile.css:156` | `.st2-figure>span` | 9.5px / 700 / 0.12em | `var(--ep-dim)` |
| `src/features/find-people/follow-tiles.css:10` | `.follow-tile .follow-tile-avatar [data-avatar-fallback]` | ? / 700!important / 0!important | `var(--follow-tile-mute)` |
| `src/features/guest/guestGate.css:67` | `.guest-gate-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--eyebrow-ink)` |
| `src/features/guest/guestGate.css:76` | `.guest-gate-head` | 26px / 700 / -0.035em | `#f8fafc` |
| `src/features/guest/guestGate.css:129` | `.guest-gate-pill` | 16px / 700 / -0.01em | `#0a0a0c` |
| `src/features/member-badge/member-badge.css:7` | `.mbc-kicker > span:last-child` | 9.5px / 700 / 0.14em | `rgba(248,250,252,0.42)` |
| `src/features/member-badge/member-badge.css:8` | `.mbc-title` | 22px / 700 / -0.02em | `?` |
| `src/features/member-badge/member-badge.css:12` | `.mbc-fact span` | 8.5px / 700 / 0.14em | `rgba(248,250,252,0.42)` |
| `src/features/post-v2/components/golf/composerGolf.css:3` | `.composer-golf-kicker` | 10.5px / 700 / .18em | `var(--pf-dim)` |
| `src/features/post-v2/components/golf/composerGolf.css:66` | `.pf4-with-tagcap` | 10px / 700 / .08em | `rgba(248,250,252,.42)` |
| `src/features/post-v2/components/golf/composerGolf.css:99` | `.composer-rounds-head h3` | 17px / 700 / -.02em | `?` |
| `src/features/post-v2/components/golf/composerGolf.css:102` | `.composer-rounds-grp` | 9.5px / 700 / .16em | `rgba(248,250,252,.42)` |
| `src/features/post-v2/components/golf/composerGolf.css:106` | `.composer-rounds-dt small` | 9.5px / 700 / .1em | `rgba(248,250,252,.42)` |
| `src/features/post-v2/components/video/videoCreator.css:3` | `.video-creator .vc-kicker` | 10.5px / 700 / .18em | `var(--video-dim)` |
| `src/features/post-v2/components/video/videoCreator.css:10` | `.video-creator .vc-title-type` | ? / ? / .12em | `?` |
| `src/features/post-v2/components/video/videoCreator.css:63` | `.vc-sheet-surface>div:nth-child(2)>div` | 21px / 700 / 0 | `?` |
| `src/features/post-v2/components/video/videoCreator.css:73` | `.video-creator .vc-sheet-action` | 15px / 700 / .14em | `var(--video-canvas)` |
| `src/features/pro-profile/pro-profile.css:4` | `.pro-profile-heading h2` | 9px / 700 / .16em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:7` | `.pro-profile-kicker` | 9px / 700 / .1em | `var(--pro-profile-mute)` |
| `src/features/pro-profile/pro-profile.css:13` | `.pro-profile-tile span` | 9.5px / 700 / .1em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:17` | `.pro-season-tiles .pro-profile-tile span` | 7px / 700 / .1em | `?` |
| `src/features/pro-profile/pro-profile.css:38` | `.pro-season-form-heading span` | 9px / 700 / .16em | `?` |
| `src/features/pro-profile/pro-profile.css:39` | `.pro-season-form-heading span:last-child` | 10px / ? / 0 | `?` |
| `src/features/pro-profile/pro-profile.css:48` | `.pro-result-round-strokes` | 10.5px / 600 / .02em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:60` | `.pro-profile-sheet h2` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/features/pro-profile/pro-profile.css:61` | `.pro-profile-sheet .pro-collection-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `?` |
| `src/features/pro-profile/pro-profile.css:94` | `.pro-hero-headline b` | 10px / 700 / .14em | `var(--pro-profile-mute)` |
| `src/features/pro-profile/pro-profile.css:101` | `.pro-hero-name` | 26px / 700 / 0 | `var(--pro-profile-ink)` |
| `src/features/pro-profile/pro-profile.css:121` | `.pro-bag-slot` | 9px / 700 / .1em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:129` | `.pro-partner-unlinked>span:last-child` | 12px / ? / .04em | `?` |
| `src/features/pro-profile/pro-profile.css:135` | `.pro-career-timeline b` | 9px / 700 / .14em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:140` | `.pro-collection-kicker` | 10px / 700 / .14em | `var(--pro-profile-mute)` |
| `src/features/pro-profile/pro-profile.css:142` | `.pro-collection-field>label` | 10px / 700 / .1em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:179` | `.pro-ask-kicker` | 9px / 700 / .12em | `var(--pro-profile-amber)` |
| `src/features/pro-profile/pro-profile.css:181` | `.pro-ask-sheet h2` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/features/pro-profile/pro-profile.css:195` | `.pro-ask-eg-label` | 10px / 700 / .12em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:235` | `.pro-kit-tiles span` | 9.5px / 700 / .1em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:253` | `.pro-ss-lab` | 9px / 700 / .14em | `var(--pro-profile-mute)` |
| `src/features/pro-profile/pro-profile.css:259` | `.pro-ss-h` | 9px / 700 / .16em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:263` | `.pro-ss-stats span` | 7.5px / 700 / .08em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:279` | `.pro-ss-reach span` | 7.5px / 700 / .08em | `var(--pro-profile-dim)` |
| `src/features/pro-profile/pro-profile.css:298` | `.pro-finish-header>span` | 9px / 700 / .14em | `var(--pro-profile-amber)` |
| `src/features/pro-verification/pro-label.css:2` | `.pro-label-text` | 7.5px / 700 / 0.14em | `transparent` |
| `src/features/pro-verification/pro-label.css:21` | `.pro-hero-descriptor span` | 9.5px / 700 / 0.13em | `var(--pro-note-muted)` |
| `src/features/pro-verification/pro-label.css:23` | `.profile-pro-tour-heading` | 10px / 700 / 0.14em | `var(--pro-note-muted)` |
| `src/features/pro-verification/pro-label.css:25` | `.profile-pro-tour a.pro-player-link` | 12.5px / 700 / 0 | `var(--pro-note-ink)` |
| `src/features/pro-verification/pro-status-controls.css:6` | `.pro-being-checked` | 9.5px / 700 / 0.12em | `var(--pro-controls-muted)` |
| `src/features/pro-verification/pro-status-controls.css:14` | `.pro-status-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--pro-controls-muted)` |
| `src/features/pro-verification/pro-status-controls.css:15` | `.pro-status-heading` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/features/pro-verification/pro-verification.css:10` | `.pds-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `rgba(248,250,252,0.62)` |
| `src/features/pro-verification/pro-verification.css:11` | `.pds-head h2` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `#F8FAFC` |
| `src/features/pro-verification/pro-verification.css:19` | `.pds-label` | 10px / 700 / 0.14em | `rgba(248,250,252,0.42)` |
| `src/features/review-v2/components/reviewReceipt.css:4` | `.review-receipt` | ? / ? / 0 | `var(--receipt-ink)` |
| `src/features/review-v2/components/reviewReceipt.css:20` | `.review-receipt h2` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--receipt-dim)` |
| `src/features/video-details/round-video.css:2` | `.round-video-kicker` | 9.5px / 700 / .14em | `var(--video-about-mute)` |
| `src/features/video-details/round-video.css:3` | `.video-about .round-video-score-door` | 11.5px / 700 / .06em | `var(--video-about-mute)` |
| `src/features/video-details/video-viewer.css:2` | `.video-teaser .video-title` | 16px / 700 / 0 | `var(--video-about-ink)` |
| `src/features/video-details/video-viewer.css:4` | `.video-teaser .video-more` | inherit / 700 / 0 | `var(--video-about-ink)` |
| `src/features/video-details/video-viewer.css:10` | `.video-about` | ? / ? / 0 | `var(--video-about-ink)` |
| `src/features/video-details/video-viewer.css:11` | `.video-about h2` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/features/video-details/video-viewer.css:15` | `.video-about-kicker` | 10.5px / 700 / .18em | `var(--video-about-dim)` |
| `src/index.css:32` | `.keyboard-done-pill.keyboard-done-pill` | 14px / 700 / 0 | `var(--keyboard-done-ink)` |
| `src/index.css:540` | `.club-you-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--club-you-muted)` |
| `src/index.css:541` | `.club-you-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/index.css:562` | `.club-visiting-kicker` | 10.5px / 700 / .16em | `var(--club-visiting-mute)` |
| `src/index.css:563` | `.club-visiting-row` | ? / ? / 0 | `var(--club-visiting-ink)` |
| `src/index.css:571` | `.club-visiting-tag` | 9.5px / 700 / .1em | `?` |
| `src/index.css:600` | `.review-upload-overlay` | ? / ? / 0 | `var(--review-upload-ink)` |
| `src/index.css:604` | `.review-upload-percent` | 10px / 700 / 0 | `?` |
| `src/index.css:605` | `.review-upload-percent-sign` | 7.5px / 700 / 0 | `?` |
| `src/index.css:659` | `.team-request-kicker` | 10.5px / 700 / .16em | `var(--team-muted)` |
| `src/index.css:660` | `.team-request-count` | ? / ? / .12em | `var(--team-dim)` |
| `src/index.css:674` | `.team-sheet-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `var(--team-ink)` |
| `src/index.css:692` | `.team-s4-table th` | 9.5px / 700 / .04em | `var(--team-dim)` |
| `src/index.css:710` | `.team-list-window` | ? / ? / .12em | `var(--team-dim)` |
| `src/index.css:751` | `.team-list-title` | ? / ? / var(--section-title-tracking) | `?` |
| `src/index.css:770` | `.sheet-door-button` | 12px / 600 / 0 | `?` |
| `src/index.css:2335` | `.inline-msg-role` | ? / ? / .2px | `var(--hub-text-dim)` |
| `src/index.css:2520` | `.name-first, .name-last` | var(--fs-name) / var(--fw-name) / 0 | `?` |
| `src/index.css:2549` | `.meta-label` | var(--fs-label) / var(--fw-label) / .08em | `?` |
| `src/index.css:4013` | `.echo-label` | 16px / 400 / 0.08em | `#fff` |
| `src/index.css:5016` | `.eh-row-when` | 13px / 400 / 0.01em | `var(--eh-meta)` |
| `src/index.css:5113` | `.eh-msg__label` | 12px / ? / .4px | `var(--eh-meta)` |
| `src/index.css:5520` | `.insights-visits-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--team-muted)` |
| `src/index.css:5521` | `.insights-visits-kicker > span:last-child` | ? / ? / .12em | `var(--team-dim)` |
| `src/index.css:5549` | `.insights-audience-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/index.css:5552` | `.insights-audience-tile .n` | 22px / 700 / -.01em | `?` |
| `src/index.css:5569` | `.insights-posts-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/index.css:5590` | `.insights-followers-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/index.css:5595` | `.insights-followers-reached` | 22px / 700 / -.01em | `?` |
| `src/index.css:5596` | `.insights-followers-of` | 13px / 600 / 0 | `var(--team-dim)` |
| `src/index.css:5603` | `.insights-engagement-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/index.css:5611` | `.insights-engagement-tile-n` | 22px / 700 / -.01em | `?` |
| `src/index.css:5617` | `.insights-reviews-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/index.css:5641` | `.insights-course-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--team-muted)` |
| `src/index.css:5642` | `.insights-course-kicker > span:nth-child(2)` | ? / ? / .12em | `var(--team-dim)` |
| `src/index.css:5643` | `.insights-course-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/index.css:5672` | `.insights-course-link` | 13px / 700 / 0 | `var(--team-ink)` |
| `src/index.css:5677` | `.review-score-theme` | ? / ? / 0 | `var(--score-ink)` |
| `src/index.css:5687` | `.review-score-heading` | 22px / 700 / -0.035em | `var(--score-ink)` |
| `src/index.css:5692` | `.review-score-number` | ? / 700 / 0 | `?` |
| `src/index.css:5710` | `.review-score-kicker` | 10px / 700 / .16em | `var(--score-muted)` |
| `src/index.css:5730` | `.review-score-action` | 16px / 700 / 0 | `var(--score-on-white)` |
| `src/index.css:5759` | `.overview-news, .tour-news` | ? / ? / 0 | `var(--news-ink)` |
| `src/index.css:5773` | `.overview-news-story` | ? / ? / 0 | `var(--news-ink)` |
| `src/index.css:5778` | `.overview-news-kicker` | 10px / 700 / .14em | `var(--news-mute)` |
| `src/index.css:5842` | `.tour-news-sec` | 10.5px / 700 / .16em | `var(--news-dim)` |
| `src/index.css:5843` | `.tour-news-sec .count` | 11.5px / 600 / 0 | `?` |
| `src/index.css:5855` | `.tour-news-grp` | 10.5px / 700 / .16em | `var(--news-dim)` |
| `src/index.css:5859` | `.tour-news-ar-date small` | 9px / 700 / .12em | `var(--news-dim)` |
| `src/index.css:5877` | `.canon-sheet-title.canon-sheet-title.canon-sheet-title` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/index.css:5878` | `.canon-sheet-eyebrow.canon-sheet-eyebrow.canon-sheet-eyebrow` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `var(--ep-ink,#F8FAFC)` |
| `src/pages/auth/components/auth-hero.css:20` | `.auth-hero-brand h1` | 34px / 800 / -.035em | `var(--auth-ink)` |
| `src/pages/auth/components/auth-hero.css:31` | `.auth-hero-screen .auth-hero-pill` | 16px / 700 / -.01em | `var(--bg-page)` |
| `src/pages/auth/components/auth-hero.css:40` | `.auth-hero-panel h2` | 24px / 700 / -.035em | `?` |
| `src/styles/dark-golf-passport.css:183` | `.dgp-dna-stat-label` | 12px / 500 / 0.5px | `var(--dgp-text-secondary)` |
| `src/styles/dark-golf-passport.css:319` | `.dgp-section-title` | 18px / 600 / -0.01em | `var(--dgp-text-primary)` |
| `src/styles/glassToast.css:21` | `.glass-toast-title, .glass-tile-title` | 14px / 600 / -0.01em | `#F8FAFC` |
| `src/styles/handicap-dark.css:237` | `.hcp-dark .hcp-eyebrow` | 10.5px / 700 / 0.16em | `var(--hcp-t-60)` |
| `src/styles/hero-glass.css:77` | `.hero-tournament-name` | 22px / 700 / -0.3px | `#FFFFFF` |
| `src/styles/hero-glass.css:97` | `.hero-meta` | 11px / 700 / 1.2px | `rgba(255, 255, 255, 0.6)` |
| `src/styles/hero-glass.css:180` | `.live-text` | 11px / 700 / 1.2px | `#22C55E` |
| `src/styles/hero-glass.css:196` | `.tour-badge` | 12px / 600 / 0.5px | `white` |
| `src/styles/hero-glass.css:308` | `.countdown-label` | 12px / 700 / 1.5px | `rgba(255, 255, 255, 0.6)` |
| `src/styles/hero-glass.css:530` | `.tie-battle-icon` | 10px / ? / 2px | `?` |
| `src/styles/hybrid-hero.css:19` | `.hybrid-hero-title` | clamp(24px, 8.5vw, 42px) / 700 / -0.035em | `white` |
| `src/styles/hybrid-hero.css:71` | `.upcoming-facts span` | 9.5px / 700 / .12em | `var(--tv-dim)` |
| `src/styles/hybrid-hero.css:76` | `.upcoming-last-header` | 10px / 700 / .08em | `rgba(248,250,252,.62)` |
| `src/styles/hybrid-hero.css:85` | `.recap-figs span` | ? / ? / var(--hero-label-tracking) | `var(--cw-dim)` |
| `src/styles/hybrid-hero.css:90` | `.recap-pts-label` | 10px / 700 / .08em | `rgba(248,250,252,.62)` |
| `src/styles/hybrid-hero.css:101` | `.recap-record-figs span` | 9.5px / 700 / .14em | `var(--cw-dim)` |
| `src/styles/hybrid-hero.css:112` | `.upcoming-event-facts span` | 9.5px / 700 / var(--hero-label-tracking) | `rgba(248,250,252,.42)` |
| `src/styles/hybrid-hero.css:116` | `.upcoming-sec-kick` | 10px / 700 / .16em | `rgba(248,250,252,.62)` |
| `src/styles/hybrid-hero.css:123` | `.upcoming-sct .n.tot` | 9px / 700 / .08em | `rgba(248,250,252,.62)` |
| `src/styles/hybrid-hero.css:126` | `.upcoming-sct .y` | 10.5px / ? / -.01em | `?` |
| `src/styles/post-flow.css:1` | `.pf` | ? / ? / 0 | `var(--pf-ink)` |
| `src/styles/post-flow.css:4` | `.pf-header h3` | var(--section-title-size) / var(--section-title-weight) / var(--section-title-tracking) | `?` |
| `src/styles/post-flow.css:12` | `.pf-group` | 10.5px / 700 / .16em | `var(--pf-dim)` |
| `src/styles/post-flow.css:34` | `.pf-best-head` | 10px / 700 / .16em | `var(--pf-dim)` |
| `src/styles/post-flow.css:46` | `.pf-label` | 10.5px / 700 / .16em | `var(--pf-dim)` |
| `src/styles/post-flow.css:48` | `.pf-day-week` | 10px / 700 / .1em | `var(--pf-dim)` |
| `src/styles/post-flow.css:57` | `.pf .pf-schedule-cta` | 15px / ? / .14em | `?` |
| `src/styles/post-flow.css:61` | `.pf-kicker` | var(--section-eyebrow-size) / var(--section-eyebrow-weight) / var(--section-eyebrow-tracking) | `?` |
| `src/styles/post-flow.css:64` | `.pf-headline` | 30px / 700 / -0.035em | `?` |
| `src/styles/post-flow.css:72` | `.pf-hint` | 10.5px / 700 / .16em | `var(--pf-dim)` |
| `src/styles/theme-tokens.css:137` | `.tile-title` | 17px / 600 / -0.01em | `var(--hub-text)` |
| `src/styles/tour-hub-tokens.css:208` | `.th-display-xl` | 44px / 700 / -0.022em | `?` |
| `src/styles/tour-hub-tokens.css:216` | `.th-display-l` | 34px / 700 / -0.020em | `?` |
| `src/styles/tour-hub-tokens.css:224` | `.th-display-m` | 28px / 600 / -0.018em | `?` |
| `src/styles/tour-hub-tokens.css:232` | `.th-headline` | 22px / 600 / -0.015em | `?` |
| `src/styles/tour-hub-tokens.css:240` | `.th-title-1` | 20px / 600 / -0.012em | `?` |
| `src/styles/tour-hub-tokens.css:248` | `.th-title-2` | 17px / 600 / -0.010em | `?` |
| `src/styles/tour-hub-tokens.css:256` | `.th-title-3` | 15px / 600 / -0.008em | `?` |
| `src/styles/tour-hub-tokens.css:264` | `.th-body` | 15px / 400 / -0.006em | `?` |
| `src/styles/tour-hub-tokens.css:272` | `.th-body-small` | 13px / 400 / -0.004em | `?` |
| `src/styles/tour-hub-tokens.css:280` | `.th-caption-1` | 12px / 500 / 0 | `?` |
| `src/styles/tour-hub-tokens.css:288` | `.th-caption-2` | 11px / 600 / 0.020em | `?` |
| `src/styles/tour-hub-tokens.css:297` | `.th-micro` | 10px / 700 / 0.030em | `?` |
| `src/styles/web-home.css:16` | `.web-home .fig` | ? / 700 / -.04em | `?` |
| `src/styles/web-home.css:25` | `.web-home .cta` | 18px / 600 / -.01em | `var(--cta-ink)` |
| `src/styles/web-home.css:27` | `.web-home .disp` | ? / 700 / -.055em | `?` |
| `src/styles/web-home.css:30` | `.web-home .brand` | 24px / 700 / -.04em | `?` |
| `src/styles/web-home.css:38` | `.web-home .hero h1` | clamp(34px,4.9vw,64px) / ? / -.045em | `?` |
| `src/styles/web-home.css:43` | `.web-home .badge small` | 10.5px / ? / .02em | `rgba(255,255,255,.8)` |
| `src/styles/web-home.css:44` | `.web-home .badge b` | 20px / 600 / -.02em | `?` |
| `src/styles/web-home.css:57` | `.web-home .sk` | 8px / 700 / .16em | `var(--dim)` |
| `src/styles/web-home.css:58` | `.web-home .st` | 17px / 700 / -.03em | `?` |
| `src/styles/web-home.css:72` | `.web-home .belt span` | clamp(22px,2.6vw,30px) / 600 / -.035em | `#2A3038` |
| `src/styles/web-home.css:85` | `.web-home .hitlabel` | 11px / 700 / .16em | `var(--ldim)` |
| `src/styles/web-home.css:93` | `.web-home .lcard .nm` | clamp(24px,2.6vw,30px) / 700 / -.035em | `?` |
| `src/styles/web-home.css:124` | `.web-home .quote q` | clamp(18px,2vw,22px) / 500 / -.01em | `rgba(255,255,255,.9)` |
| `src/styles/web-home.css:134` | `.web-home .step h3` | clamp(22px,2.4vw,30px) / 600 / -.03em | `#8C939C` |
| `src/styles/web-home.css:152` | `.web-home .crest .tile b` | 17px / 600 / -.02em | `?` |
| `src/styles/web-home.css:155` | `.web-home .soon` | 10px / 700 / .12em | `#0B0D10` |
| `src/styles/web-home.css:158` | `.web-home .join h2` | clamp(28px,3.8vw,44px) / ? / -.04em | `?` |
| `src/styles/web-home.css:165` | `.web-home .four h3` | 22px / 600 / -.025em | `?` |
| `src/styles/web-home.css:172` | `.web-home .qa button` | clamp(18px,2vw,23px) / 600 / -.02em | `var(--lnk)` |
| `src/styles/web-home.css:186` | `.web-home footer h4` | 22px / 600 / -.03em | `?` |
| `src/styles/welcome.css:2` | `.welcome-shell` | ? / ? / 0 | `var(--welcome-ink)` |
| `src/styles/welcome.css:6` | `.welcome-kicker` | 10.5px / 700 / .16em | `var(--welcome-mute)` |
| `src/styles/welcome.css:7` | `.welcome-body h1` | 28px / 700 / -0.035em | `?` |
| `src/styles/welcome.css:10` | `.welcome-field label` | 10px / 700 / .14em | `var(--welcome-dim)` |
| `src/styles/welcome.css:12` | `.welcome-stats span` | 9.5px / 700 / .12em | `var(--welcome-dim)` |
| `src/styles/welcome.css:15` | `.welcome-group-label` | 9.5px / 700 / .16em | `var(--welcome-dim)` |
| `src/styles/welcome.css:37` | `.welcome-final-id b` | 19px / 700 / -0.01em | `?` |
| `src/styles/welcome.css:38` | `.welcome-final-facts i` | 9.5px / 700 / .12em | `var(--welcome-dim)` |
| `src/styles/welcome.css:41` | `.welcome-final-sec` | 10px / 700 / .16em | `var(--welcome-dim)` |

### Available E1/E2 context captures

The Part 1 real-component captures above and their 390 label crops cover the certain changed E1/E2 set, including two invitation row groups. They do **not** fulfil the requested every-E1/E2 inventory screenshot set. Part 2 remains explicitly incomplete; no exhaustive coverage or approved 345-site reconciliation is claimed.
