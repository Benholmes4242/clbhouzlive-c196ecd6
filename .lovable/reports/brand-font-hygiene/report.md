# Brand and font hygiene

## Outcome

Lowercased member-facing copy and named AI prompts, removed exactly five Geist declarations, and deployed all 15 changed functions. No SQL, migrations, feed_config, pool-cap, weights, layout or business-logic changes. Comments, identifiers, locale keys and CLBHOUZ LTD preserved.

## Five font changes and computed evidence

All five declarations were removed to inherit; these SVG elements remain inline in the document and inherit successfully. Chromium actual-component fixtures, not a simulated CSS-only page, returned:

| Element / original location | Removed | Computed font-family |
|---|---|---|
| `src/features/business/clubAnalytics/teeSheet.css:1 — tee-sheet card` | `font-family:Geist,sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `src/features/business/clubAnalytics/sections.tsx:299 — hole table headings` | `fontFamily: 'Geist, sans-serif'` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `src/components/explore-tab-new/courseled/RoundShape.tsx:264 — good-hole SVG label` | `fontFamily="Geist, sans-serif"` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `src/components/explore-tab-new/courseled/RoundShape.tsx:272 — SVG end-label group` | `fontFamily="Geist, sans-serif"` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `src/components/feed/roundTilePlot.tsx:316 — feed feat label` | `fontFamily: 'Geist, sans-serif'` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |

Browser had zero page errors. Fixture page removed; no app route added. The fixture label initially lacked its halo input and was not rendered; corrected fixture only, then all five measured. Physical iOS font rendering is not claimed.

## Off-stack families found (audit only, unchanged)

The brief asks to list additional families; only the five named Geist declarations are changed. Remaining literal off-stack font declarations:

| Location | Stack | Off-stack families |
|---|---|---|
| `src/features/admin/components/memberRadar.css:5` | `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif` | SF Pro Display |
| `src/features/business-create/business-create.css:2` | `-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display",system-ui,sans-serif` | SF Pro Display, system-ui |
| `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:931` | `'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif` | Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji |
| `src/features/edit-profile/edit-profile.css:3` | `-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display",system-ui,sans-serif` | SF Pro Display, system-ui |
| `src/features/explore-magazine/achievementIcons.tsx:66` | `'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif` | Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji |
| `src/styles/web-home.css:7` | `-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif` | SF Pro Display |

Generated configuration `src/tailwind.config.lov.json:3591–3597` also contains the default serif stack: ui-serif, Georgia, Cambria, Times New Roman, Times, serif. This is configuration, not a newly applied font; unchanged. Canonical subsets containing only allowed families are not off-stack. inherit, including inherit !important, is not a family. No other Geist remains in src. The separately embedded server export Geist in generate-round-share-card/card.ts and fonts.ts is outside the requested src font audit and is loaded by its renderer; untouched.

Monospace declarations found (code/debug/identifier/editor surfaces; retained):
- `src/components/mentions/MentionsComposerInput.tsx:658` — `ui-monospace, SFMono-Regular, Menlo, monospace`
- `src/diag/roundPushDiag.tsx:75` — `10px/1.3 ui-monospace, Menlo, monospace`
- `src/features/admin/AdminDrawer.tsx:155` — `ui-monospace, SFMono-Regular, Menlo, monospace`
- `src/features/admin/components/ApprovalDetailDrawer.tsx:102` — `monospace`
- `src/features/admin/components/ApprovalDetailDrawer.tsx:135` — `monospace`
- `src/features/admin/components/LegalDocumentsTab.tsx:230` — `ui-monospace, SFMono-Regular, Menlo, monospace`
- `src/features/admin/components/ModerationDetailDrawer.tsx:296` — `monospace`
- `src/features/admin/components/ModerationDetailDrawer.tsx:317` — `monospace`
- `src/features/admin/components/amateur/AmateurStoryEditor.tsx:307` — `ui-monospace, SFMono-Regular, monospace`
- `src/features/admin/components/amateur/AmateurStoryEditor.tsx:343` — `ui-monospace, monospace`
- `src/features/admin/components/amateur/AmateurStoryEditor.tsx:370` — `ui-monospace, monospace`
- `src/features/admin/components/analytics/ScreensLens.tsx:96` — `ui-monospace, Menlo, monospace`
- `src/features/admin/components/health/healthUi.tsx:21` — `ui-monospace, Menlo, monospace`
- `src/features/admin/components/wire/WireBlockEditor.tsx:150` — `ui-monospace, monospace`
- `src/features/admin/components/wire/WireBlockEditor.tsx:159` — `ui-monospace, monospace`
- `src/features/admin/components/wire/WireBlockEditor.tsx:169` — `ui-monospace, monospace`
- `src/features/admin/components/wire/WireBlockEditor.tsx:175` — `ui-monospace, monospace`
- `src/features/admin/components/wire/WireStoryEditor.tsx:303` — `ui-monospace, SFMono-Regular, monospace`
- `src/features/admin/components/wire/WireStoryEditor.tsx:337` — `ui-monospace, monospace`
- `src/features/admin/components/wire/WireStoryEditor.tsx:364` — `ui-monospace, monospace`
- `src/features/admin/pages/AnalyticsDiagnostics.tsx:463` — `ui-monospace, SFMono-Regular, Menlo, monospace`
- `src/features/admin/pages/AnalyticsDiagnostics.tsx:469` — `ui-monospace, SFMono-Regular, Menlo, monospace`
- `src/features/admin/pages/AnalyticsDiagnostics.tsx:556` — `ui-monospace, SFMono-Regular, Menlo, monospace`
- `src/features/admin/pages/AnalyticsDiagnostics.tsx:685` — `ui-monospace, SFMono-Regular, Menlo, monospace`
- `src/features/admin/pages/SettingsPage.tsx:38` — `ui-monospace, SFMono-Regular, Menlo, monospace`
- `src/perf/AudioDebugHud.tsx:252` — `monospace`
- `src/perf/AudioDebugHud.tsx:284` — `monospace`
- `src/perf/AudioDebugHud.tsx:345` — `monospace`
- `src/perf/AudioLogsButton.tsx:30` — `monospace`
- `src/perf/BootTimelineToggleButton.tsx:35` — `monospace`
- `src/perf/LogHud.tsx:22` — `monospace`
- `src/perf/LogHud.tsx:79` — `monospace`
- `src/perf/LogHud.tsx:105` — `monospace`
- `src/perf/PerfHud.tsx:67` — `monospace`
- `src/perf/PerfHud.tsx:100` — `monospace`
- `src/perf/PerfToggleButton.tsx:52` — `monospace`

## Every copy change

Locations below refer to current source lines. Only brand case changed; surrounding text, email addresses and conditional behavior are preserved. Prompt instruction insertions are reported separately.

### `public/sw.js:62` — Push notification fallback title

Before:
```text
data = { title: 'Clbhouz', body: event.data.text() };
```
After:
```text
data = { title: 'clbhouz', body: event.data.text() };
```

### `public/sw.js:85` — Push notification fallback title

Before:
```text
self.registration.showNotification(data.title || 'Clbhouz', options)
```
After:
```text
self.registration.showNotification(data.title || 'clbhouz', options)
```

### `src/components/business/DeleteBusinessDialog.tsx:54` — Delete business confirmation

Before:
```text
This will permanently remove {businessName} from Clbhouz. This action can{"'"}t be undone.
```
After:
```text
This will permanently remove {businessName} from clbhouz. This action can{"'"}t be undone.
```

### `src/components/business/RequestAccessModal.tsx:157` — Business access request dialog

Before:
```text
<span className="font-medium text-foreground">{businessName}</span> already has a business profile on Clbhouz.
```
After:
```text
<span className="font-medium text-foreground">{businessName}</span> already has a business profile on clbhouz.
```

### `src/components/courses/CourseRankBadges.tsx:135` — Course community-rating tooltip and its matching filter predicate

Before:
```text
tooltip: "Clbhouz Community Rating"
```
After:
```text
tooltip: "clbhouz Community Rating"
```

### `src/components/courses/CourseRankBadges.tsx:148` — Course community-rating tooltip and its matching filter predicate

Before:
```text
tooltip: "Clbhouz Community Rating"
```
After:
```text
tooltip: "clbhouz Community Rating"
```

### `src/components/courses/CourseRankBadges.tsx:170` — Course community-rating tooltip and its matching filter predicate

Before:
```text
badge.tooltip !== "Clbhouz Community Rating"
```
After:
```text
badge.tooltip !== "clbhouz Community Rating"
```

### `src/components/courses/CourseRankBadges.tsx:178` — Course community-rating tooltip and its matching filter predicate

Before:
```text
tooltip: "Clbhouz Community Rating",
```
After:
```text
tooltip: "clbhouz Community Rating",
```

### `src/features/pro-profile/ProCollectionSheets.tsx:36` — Pro profile Add a partner search label

Before:
```text
return <><h2 id="pro-collection-title">Add a partner</h2><div className="pro-collection-field"><label htmlFor="partner-search">SEARCH CLBHOUZ</label><Input className="pro-collection-input" id="partner-search" value={search} onChange={e=>setSearch(e.target.value)}/>{search.trim().length>=2&&!query.isError&&query.data?.map(b=>{const added=partners.some(p=>p.business_id===b.id);return <div className="pro-business-match" key={b.id}><ProBusinessLogo business={b}/><span><b>{b.name}</b><small>{[b.category,b.city||b.region].filter(Boolean).join(' · ')}</small></span><Button variant="ghost" disabled={busy||added} onClick={()=>void add(b.name,b.id)}>{added?'Added':'Add'}</Button></div>;})}</div><p className="pro-collection-or">Not on clbhouz?</p><div className="pro-collection-field"><label htmlFor="partner-name">PARTNER NAME</label><Input className="pro-collection-input" id="partner-name" maxLength={60} placeholder="e.g. Kent Autos" value={name} onChange={e=>setName(e.target.value)}/></div><div className="pro-collection-field"><label htmlFor="partner-website">WEBSITE (OPTIONAL)</label><Input className="pro-collection-input" id="partner-website" maxLength={200} placeholder="e.g. kentautos.co.uk" value={website} onChange={e=>setWebsite(e.target.value)}/></div><Button variant={null} size={null} className="pro-profile-command pro-collection-outline" disabled={busy||!name.trim()} onClick={()=>void add(name,null,website)}>Add by name</Button></>;
```
After:
```text
return <><h2 id="pro-collection-title">Add a partner</h2><div className="pro-collection-field"><label htmlFor="partner-search">SEARCH clbhouz</label><Input className="pro-collection-input" id="partner-search" value={search} onChange={e=>setSearch(e.target.value)}/>{search.trim().length>=2&&!query.isError&&query.data?.map(b=>{const added=partners.some(p=>p.business_id===b.id);return <div className="pro-business-match" key={b.id}><ProBusinessLogo business={b}/><span><b>{b.name}</b><small>{[b.category,b.city||b.region].filter(Boolean).join(' · ')}</small></span><Button variant="ghost" disabled={busy||added} onClick={()=>void add(b.name,b.id)}>{added?'Added':'Add'}</Button></div>;})}</div><p className="pro-collection-or">Not on clbhouz?</p><div className="pro-collection-field"><label htmlFor="partner-name">PARTNER NAME</label><Input className="pro-collection-input" id="partner-name" maxLength={60} placeholder="e.g. Kent Autos" value={name} onChange={e=>setName(e.target.value)}/></div><div className="pro-collection-field"><label htmlFor="partner-website">WEBSITE (OPTIONAL)</label><Input className="pro-collection-input" id="partner-website" maxLength={200} placeholder="e.g. kentautos.co.uk" value={website} onChange={e=>setWebsite(e.target.value)}/></div><Button variant={null} size={null} className="pro-profile-command pro-collection-outline" disabled={busy||!name.trim()} onClick={()=>void add(name,null,website)}>Add by name</Button></>;
```

### `src/features/social-lists-v2/SocialListPage.tsx:306` — Social list invitation

Before:
```text
Invite friends to Clbhouz
```
After:
```text
Invite friends to clbhouz
```

### `src/locales/de/composer.json:68` — Composer / search Popular heading (locale value)

Before:
```text
"popular": "POPULAR ON CLBHOUZ",
```
After:
```text
"popular": "POPULAR ON clbhouz",
```

### `src/locales/en-XA/composer.json:68` — Composer / search Popular heading (locale value)

Before:
```text
"popular": "POPULAR ON CLBHOUZ",
```
After:
```text
"popular": "POPULAR ON clbhouz",
```

### `src/locales/en/composer.json:68` — Composer / search Popular heading (locale value)

Before:
```text
"popular": "POPULAR ON CLBHOUZ",
```
After:
```text
"popular": "POPULAR ON clbhouz",
```

### `src/locales/es/composer.json:68` — Composer / search Popular heading (locale value)

Before:
```text
"popular": "POPULAR ON CLBHOUZ",
```
After:
```text
"popular": "POPULAR ON clbhouz",
```

### `src/locales/ja/composer.json:68` — Composer / search Popular heading (locale value)

Before:
```text
"popular": "POPULAR ON CLBHOUZ",
```
After:
```text
"popular": "POPULAR ON clbhouz",
```

### `src/locales/ko/composer.json:68` — Composer / search Popular heading (locale value)

Before:
```text
"popular": "POPULAR ON CLBHOUZ",
```
After:
```text
"popular": "POPULAR ON clbhouz",
```

### `src/pages/PostDeepLinkPage.tsx:301` — Shared post missing-author fallback

Before:
```text
const displayName = profile?.display_name || profile?.username || 'Clbhouz Member';
```
After:
```text
const displayName = profile?.display_name || profile?.username || 'clbhouz Member';
```

### `src/pages/manage/SupportThreadPage.tsx:180` — Business support thread author label

Before:
```text
{mine ? 'You' : 'Clbhouz Support'}
```
After:
```text
{mine ? 'You' : 'clbhouz Support'}
```

### `supabase/functions/connect-whs/index.ts:357` — Handicap connect sign-in error

Before:
```text
return errResponse({ ok: false, error_code: "not_authenticated", message: "Sign in to Clbhouz first" }, 401);
```
After:
```text
return errResponse({ ok: false, error_code: "not_authenticated", message: "Sign in to clbhouz first" }, 401);
```

### `supabase/functions/daily-editorial-generation/index.ts:688` — Editorial course-list eyebrow

Before:
```text
eyebrow: 'THE CLBHOUZ LIST',
```
After:
```text
eyebrow: 'THE clbhouz LIST',
```

### `supabase/functions/daily-editorial-generation/index.ts:698` — Editorial course-list eyebrow

Before:
```text
eyebrow: 'THE CLBHOUZ LIST',
```
After:
```text
eyebrow: 'THE clbhouz LIST',
```

### `supabase/functions/generate-course-mood-blurb/index.ts:117` — Course mood creator fallback, AI prompt and fallback blurb

Before:
```text
let creatorHandle = "a Clbhouz creator";
```
After:
```text
let creatorHandle = "a clbhouz creator";
```

### `supabase/functions/generate-course-mood-blurb/index.ts:138` — Course mood creator fallback, AI prompt and fallback blurb

Before:
```text
const prompt = `You are writing a single 1-2 sentence editorial blurb for the Clbhouz golf app. Write in British English, restrained voice, no hype or adjective stacking.
```
After:
```text
const prompt = `You are writing a single 1-2 sentence editorial blurb for the clbhouz golf app. Write in British English, restrained voice, no hype or adjective stacking.
```

### `supabase/functions/generate-course-mood-blurb/index.ts:142` — Course mood creator fallback, AI prompt and fallback blurb

Before:
```text
Rating on Clbhouz: ${ratingAvg} from ${reviewCount} reviews
```
After:
```text
Rating on clbhouz: ${ratingAvg} from ${reviewCount} reviews
```

### `supabase/functions/generate-course-mood-blurb/index.ts:208` — Course mood creator fallback, AI prompt and fallback blurb

Before:
```text
blurb = `A ${courseTypeStr} course in ${locationStr || "an unspecified region"}, rated ${ratingAvg} on Clbhouz from ${reviewCount} reviews.${majorClause}`;
```
After:
```text
blurb = `A ${courseTypeStr} course in ${locationStr || "an unspecified region"}, rated ${ratingAvg} on clbhouz from ${reviewCount} reviews.${majorClause}`;
```

### `supabase/functions/generate-editorial-cards/index.ts:234` — Course of the Week AI selection prompt

Before:
```text
CRITICAL RULE: Every course in this list already has at least 1 community review on Clbhouz. You MUST only select a course_id that appears in this exact list. Never invent or suggest a course not in the list.
```
After:
```text
CRITICAL RULE: Every course in this list already has at least 1 community review on clbhouz. You MUST only select a course_id that appears in this exact list. Never invent or suggest a course not in the list.
```

### `supabase/functions/generate-handicap-insights/index.ts:35` — Handicap insights AI system prompt

Before:
```text
const SYSTEM_PROMPT = `You are Echo, the AI caddie inside Clbhouz, a golf social platform.
```
After:
```text
const SYSTEM_PROMPT = `You are Echo, the AI caddie inside clbhouz, a golf social platform.
```

### `supabase/functions/notify-match-request/index.ts:82` — Match request email sender

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/request-course-claim/index.ts:95` — Course claim request email sender/body

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/request-course-claim/index.ts:98` — Course claim request email sender/body

Before:
```text
html: `<p><strong>${businessName}</strong> has requested to claim a course on Clbhouz.</p>
```
After:
```text
html: `<p><strong>${businessName}</strong> has requested to claim a course on clbhouz.</p>
```

### `supabase/functions/request-course/index.ts:221` — Course request email sender/body

Before:
```text
`New course request on Clbhouz\n\n` +
```
After:
```text
`New course request on clbhouz\n\n` +
```

### `supabase/functions/request-course/index.ts:254` — Course request email sender/body

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/send-business-verification-email/index.ts:55` — Business verification request email body/footer/sender

Before:
```text
A new business has requested verification on Clbhouz.
```
After:
```text
A new business has requested verification on clbhouz.
```

### `supabase/functions/send-business-verification-email/index.ts:88` — Business verification request email body/footer/sender

Before:
```text
<p>A new business has requested verification on Clbhouz:</p>
```
After:
```text
<p>A new business has requested verification on clbhouz:</p>
```

### `supabase/functions/send-business-verification-email/index.ts:118` — Business verification request email body/footer/sender

Before:
```text
This is an automated message from Clbhouz.
```
After:
```text
This is an automated message from clbhouz.
```

### `supabase/functions/send-business-verification-email/index.ts:138` — Business verification request email body/footer/sender

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/send-business-verification-result-email/index.ts:67` — Business verification result email subject/body/header/footer/sender

Before:
```text
subject: `${businessName} is verified on Clbhouz 🎉`,
```
After:
```text
subject: `${businessName} is verified on clbhouz 🎉`,
```

### `supabase/functions/send-business-verification-result-email/index.ts:69` — Business verification result email subject/body/header/footer/sender

Before:
```text
`Great news — ${businessName} is now verified on Clbhouz.
```
After:
```text
`Great news — ${businessName} is now verified on clbhouz.
```

### `supabase/functions/send-business-verification-result-email/index.ts:76` — Business verification result email subject/body/header/footer/sender

Before:
```text
<p style="margin:0 0 16px;color:#334155;"><strong>${businessName}</strong> is now verified on Clbhouz. Your badge is live across your profile, posts and reviews.</p>
```
After:
```text
<p style="margin:0 0 16px;color:#334155;"><strong>${businessName}</strong> is now verified on clbhouz. Your badge is live across your profile, posts and reviews.</p>
```

### `supabase/functions/send-business-verification-result-email/index.ts:120` — Business verification result email subject/body/header/footer/sender

Before:
```text
<div style="background:#0f172a;color:#fff;padding:18px 22px;font-weight:700;">Clbhouz</div>
```
After:
```text
<div style="background:#0f172a;color:#fff;padding:18px 22px;font-weight:700;">clbhouz</div>
```

### `supabase/functions/send-business-verification-result-email/index.ts:123` — Business verification result email subject/body/header/footer/sender

Before:
```text
<p style="margin-top:24px;color:#64748b;font-size:12px;">This is an automated message from Clbhouz.</p>
```
After:
```text
<p style="margin-top:24px;color:#64748b;font-size:12px;">This is an automated message from clbhouz.</p>
```

### `supabase/functions/send-business-verification-result-email/index.ts:188` — Business verification result email subject/body/header/footer/sender

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/send-course-claim-result-email/index.ts:48` — Course claim result email header/body/footer/sender

Before:
```text
<div style="background:#0f172a;color:#fff;padding:18px 22px;font-weight:700;">Clbhouz</div>
```
After:
```text
<div style="background:#0f172a;color:#fff;padding:18px 22px;font-weight:700;">clbhouz</div>
```

### `supabase/functions/send-course-claim-result-email/index.ts:51` — Course claim result email header/body/footer/sender

Before:
```text
<p style="margin-top:24px;color:#64748b;font-size:12px;">This is an automated message from Clbhouz.</p>
```
After:
```text
<p style="margin-top:24px;color:#64748b;font-size:12px;">This is an automated message from clbhouz.</p>
```

### `supabase/functions/send-course-claim-result-email/index.ts:63` — Course claim result email header/body/footer/sender

Before:
```text
text: `Your course claim for ${businessName} has been approved. It's now linked on Clbhouz.\n\nView your profile: ${profileUrl}`,
```
After:
```text
text: `Your course claim for ${businessName} has been approved. It's now linked on clbhouz.\n\nView your profile: ${profileUrl}`,
```

### `supabase/functions/send-course-claim-result-email/index.ts:66` — Course claim result email header/body/footer/sender

Before:
```text
<p style="margin:0 0 16px;color:#334155;">Your course claim for <strong>${businessName}</strong> has been approved and the course is now linked to your business on Clbhouz.</p>
```
After:
```text
<p style="margin:0 0 16px;color:#334155;">Your course claim for <strong>${businessName}</strong> has been approved and the course is now linked to your business on clbhouz.</p>
```

### `supabase/functions/send-course-claim-result-email/index.ts:147` — Course claim result email header/body/footer/sender

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/send-domain-verification-code/index.ts:151` — Domain verification email sender

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/support-reply-notify/index.ts:126` — Support reply email sender

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/support-ticket-notify/index.ts:140` — Support ticket email sender

Before:
```text
from: "Clbhouz <noreply@clbhouz.co.uk>",
```
After:
```text
from: "clbhouz <noreply@clbhouz.co.uk>",
```

### `supabase/functions/echo-intelligence-v2/index.ts:229` — AI predictions/course context and platform-data instruction

Before:
```text
lines.push(`\nClbhouz Predictions:`);
```
After:
```text
lines.push(`\nclbhouz Predictions:`);
```

### `supabase/functions/echo-intelligence-v2/index.ts:243` — AI predictions/course context and platform-data instruction

Before:
```text
lines.push(`\n## Clbhouz Course Database`);
```
After:
```text
lines.push(`\n## clbhouz Course Database`);
```

### `supabase/functions/echo-intelligence-v2/index.ts:958` — AI predictions/course context and platform-data instruction

Before:
```text
`You have access to real Clbhouz platform data — course ratings, tournament predictions, and player statistics. Present it as your own knowledge.`,
```
After:
```text
`You have access to real clbhouz platform data — course ratings, tournament predictions, and player statistics. Present it as your own knowledge.`,
```

## Prompt instruction insertions

Exactly one line added to each of these prompts:
```text
The brand name is always lowercase "clbhouz", even at the start of a sentence.
```
- `supabase/functions/generate-handicap-insights/index.ts:36` — existing system / Course of Week selection / mood prompt respectively.
- `supabase/functions/generate-editorial-cards/index.ts:232` — existing system / Course of Week selection / mood prompt respectively.
- `supabase/functions/generate-course-mood-blurb/index.ts:139` — existing system / Course of Week selection / mood prompt respectively.

## Deployment confirmations

Supabase deploy tool explicitly returned “Successfully deployed edge functions” for every name below. Submitted source SHA-256 is deployment evidence, not proof that an email was received or an AI response obeyed the instruction. No emails or AI generation were triggered during verification.

- **connect-whs**: deployed; `768cffe3734bffb0fa112768a265c11c3b6e88205e5078c1f54904461f24147d`
- **daily-editorial-generation**: deployed; `ffd79021b43cadbede7dbd9adfbf0758740d5b00c59676b8669d566522e5f2ad`
- **generate-course-mood-blurb**: deployed; `65371fbbc5d5a13ccec028a576dda750b0a52635e5ec3f91a1836b1009d0fc2d`
- **generate-editorial-cards**: deployed; `5fc5840987e440a127989074de2be3e96b4c5666bae261456cb34c7c27e945d9`
- **generate-handicap-insights**: deployed; `b6ade1f4ca21b4fb08f17c338191af8126a018d72ec1f1d3941eab6de9005c90`
- **notify-match-request**: deployed; `f33a8f29ca34a791a7bd360a51f6c6502d2ae124edf0f79a04ecec8186e410e1`
- **request-course-claim**: deployed; `cb67479d9146fb3227c41c56480616e980478f4acd9a0dd301ba50ec01d39ab3`
- **request-course**: deployed; `6210bbbc54fe05a3af5df6aaa4ca4daaf0f7fb99b5c55f7603307d76039c66a1`
- **send-business-verification-email**: deployed; `78cdfbf7f0104b7961432e78d6b4b5ed25e594ebbb2cb3fe702ac9d6495199d8`
- **send-business-verification-result-email**: deployed; `0ddbb8d938b42c446cd300e0dfe8512fd7daf7beb68b9ac7325b231df625813b`
- **send-course-claim-result-email**: deployed; `8c5179b06385c4c79d5f5fd0d3410bd6e582359ac66f9753a65a9abfd1b7a6f0`
- **send-domain-verification-code**: deployed; `d3fc810f945a06418a6ef58f59c0d4ebae0e1e77c144b7f97b716f59820a82d9`
- **support-reply-notify**: deployed; `9ff377692411edd372ac69a9066525d25c9c5e9e880f423ea0cc880404d35071`
- **support-ticket-notify**: deployed; `3d8a2e44d86609b728387297c02f65f25fb82c57266b3e944fea1231781f371a`
- **echo-intelligence-v2**: deployed; `0f96a57e6f6d25618932b43c102171ef7ab5744e144b7eb8414f866b7f94012f`

## Tests and count reconciliation

Baseline: 10,111 tests /879 files (closed Brief 6). After: **10,127/10,127 tests /880 files**. Delta **+16 tests /+1 file**, entirely `src/test/brandCase.test.ts` (12 matcher fixtures plus 4 source-scope guards). Existing test totals unchanged; no test deleted or renamed.

Authorized existing test updates (three occurrences in two cases):
- `src/test/proOwnerRedesign.test.tsx:67`, “partners door opens the existing partner editor”: `expect(screen.getByLabelText('SEARCH CLBHOUZ')).toBeInTheDocument()` → `expect(screen.getByLabelText('SEARCH clbhouz')).toBeInTheDocument()`; follows the authorized search-label brand correction.
- `src/test/proCollectionSections.test.tsx:245,256`, “partners: Add links a business, Added for existing, Add by name stores no business”: `fireEvent.change(screen.getByLabelText('SEARCH CLBHOUZ'), { target: { value: 'Tit' } })` → same lookup with `SEARCH clbhouz`; these are interaction lookups, not changed assertions. Case remains intact.
- No other old-copy expectations found. golferVerificationMessages and roundShareCard negative Clbhouz assertions preserved and passed.

Guard fixtures (one case each):
- lowercase literal
- locale identifier
- variable identifier
- component identifier
- legal name
- capitalized support
- capitalized JSX
- comments
- locale key
- locale value
- template tail
- JSX attribute

Guard scopes: src/locales, src/pages, src/features, src/components. AST parsing excludes comments, identifiers, property keys and module names; recursive JSON parsing checks values only. Each scope has 60s budget.

Focused command: `./node_modules/.bin/vitest run src/test/brandCase.test.ts src/test/proOwnerRedesign.test.tsx src/test/proCollectionSections.test.tsx src/test/golferVerificationMessages.test.ts src/test/roundShareCard.test.ts` — 72/72, 5 files.

| Sequential command | Passed /total tests | Files | Duration | Local raw output |
|---|---:|---:|---:|---|
| `./node_modules/.bin/vitest run --shard=1/4` | 2447/2447 | 220 | 145.15s | `shard-1.log` |
| `./node_modules/.bin/vitest run --shard=2/4` | 2474/2474 | 220 | 178.98s | `shard-2.log` |
| `./node_modules/.bin/vitest run --shard=3/4` | 2462/2462 | 220 | 291.13s | `shard-3.log` |
| `./node_modules/.bin/vitest run --shard=4/4` | 2744/2744 | 220 | 201.74s | `shard-4.log` |

No failures, retries, timeout exception or isolation runs. Full logs retained locally and ignored by .gitignore; not staged. Latest preview build: build OK.

## Audit boundaries and verification limitations

index.html, public manifest/app-store strings and public SVG assets had no capitalized brand copy needing change; metadata already lowercase. In addition to named strings, six composer locale values, partner search label, push defaults, email senders/bodies/subject, editorial eyebrows, WHS sign-in message and Echo prompt context were corrected. Remaining capitalized matches are comments, identifiers, legal name or protocol/internal-only text: geocode-club User-Agent and the connect-whs vault credential description. These are not member-visible and remain unchanged. Existing stored/server-authored content was not rewritten.

No hosted signed-in email/send flow or AI-output readback was performed: deployments and source copy are confirmed, delivery and generated-output behavior are not. Computed fonts are real browser fixture evidence; physical iOS is unverified. The six off-stack declarations are audit findings, not silently expanded fixes.
