# FIX — Who to follow rail and Find people page (2026-11-02)

## 1. Follow button alignment (WhoToFollowRail.tsx)
Card root is now a fixed-height (220px) flex column; the Follow button pins to
the bottom with marginTop: auto (was marginTop: 12). Both variants already
shared the 64px avatar + 4px top gap, the name line (marginTop 10), the fixed
34px two-line reason block and the fixed 16px figures line — a missing reason
or figure leaves its fixed space empty, so every button sits at the same
offset from the card top.

## 2. Followed card leaves the rail
A successful follow starts a 3s timer (FOLLOW_REMOVE_MS); the card then
collapses with the same 200ms width/padding/opacity animation as dismiss and
joins the session HIDDEN set, so it cannot return this session. An unfollow
inside the window cancels the timer. Reduced motion: removed at the 3s mark
with no animation. Suggestion queries are marked stale exactly as before
(markStale, refetchType 'none').

## 3. Bottom nav hidden on the page
FindPeoplePage calls useHideBottomNav() (the existing
useBottomNavVisibility/BottomNavigationContext mechanism, as Auth and
Welcome); the nav returns on unmount. The Invite footer already sits above
the safe area.

## 4. Rename: "Explore the community"
common.json findPeople.title updated in all six locales
(en/de/es/ja/ko/en-XA). The rail's See all button gained
aria-label findPeople.rail.seeAllAria ("See all, Explore the community").
Analytics event names unchanged. Route stays /find-people. Remaining
"Find people" strings are code comments only.

## 5. Suggested = the best of everything (findPeopleRules.suggestedGroups)
New order: From {club} (Follow all, as now), Played with you, Follows you,
Plays your courses, Followed by people you know, Popular on clbhouz (golfers
first, then up to 3 businesses), Playing lately, New to clbhouz. Every group
caps at 5 rows (SUGGESTED_CAP) and carries a See all {total} link that
switches to the Golfers tab; From {club} keeps Follow all instead. A person
appears once, in their first group (session-local dedup by user_id in group
order). Golfers and Businesses tabs unchanged.

## 6. Businesses tab — report, not guesses
Static contract (src/integrations/supabase/types.ts): get_suggested_businesses
takes only p_limit (the page passes 30) and returns business_id, name, slug,
logo_url, category, city, is_verified, followers, reason_type, distance_miles.
Per the hook header (usePeopleSuggestions.ts) the RPC already excludes
followed, blocked and dismissed businesses server-side. Any category filter,
follower minimum, verified-only rule or lower row limit lives in the function
body, which is NOT in this repo (WF1_PEOPLE_V1 was run by hand) — and the
standing rule reserves all SQL for Ben, so live row counts, reason-type
breakdowns and total/verified business counts are Ben's to run. No RPC change
made. Separately: when the Businesses tab shows fewer than 3 rows, a 13px
mute line now reads "More clubs and businesses are joining clbhouz."

## Tests
- wf1FindPeople.test.tsx 23 → 27 (+4, none deleted):
  - CHANGED 'orders the Suggested groups and caps popular businesses at 3' →
    'orders the Suggested groups as the best of everything, capped at 5 with
    See all': old asserted ids ['from-club','played-with','plays-courses',
    'popular'] and groups[3].businesses 3; new asserts the eight-group order,
    popular's 3-business/5-total caps and the seeAll link.
  - CHANGED 'groups the Suggested tab with Follow all on the club group and
    hides empty groups' → '...as the best of everything with Follow all...':
    old asserted four labels and that 'Follows you' was absent; new asserts
    the eight labels (Follows you now present, per the brief).
  - CHANGED header test: 'Find people' → 'Explore the community'.
  - NEW: cap-at-5/dedup rules; See all switches tab; nav hidden; joining line.
- wfFixRail.test.tsx NEW (6): shared card height/flex/pinned button across
  variants; fixed reason/figures space; follow→Following→gone after 3s;
  unfollow cancels; no session return; reduced-motion removal.
- Full suite in shards: 1,433 + 1,387 + 1,447 + 1,472 = 5,739/5,739 across
  534 files. Baseline 5,729/533 (post-RS) → +10 tests, +1 file, reconciled.
- tsgo --noEmit clean; preview build OK.

No SQL, no migrations, no RPC/edge-function changes, feed_config untouched,
round_pool_cap untouched, no native/Median changes.
