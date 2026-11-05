# RC3_WORDING — scope ruling required

## Stop before product edits

The brief says: “The only matches allowed are code comments, the admin event label course_record_book_opened, and the feature-name mentions RC2 left alone (JoinLandingPage, UnsyncedPitchCard, the ActivityPageV2 empty state, the Echo sources label).”

It also explains: “Only clbhouz members are counted, so no string may call a member's round the course's record.”

The whole-src audit found two other meanings of “course record” that cannot safely be renamed to a clbhouz member best:

- `src/features/tourhub/hooks/useEventMoments.ts:61`: `record: { icon: '📊', color: 'bg-blue-500/15 text-blue-600', label: 'Course Record' }` — a Tour event label, not a clbhouz member-best label.
- `src/features/admin/components/AddCourseSheet.tsx:129`: `subtitle="Create a new golf course record"` — creating a course catalogue entry, not recording a member's score.

Neither is on the permitted-match list. A ruling is required: preserve these two meanings as exceptions, or provide replacement wording.

Additional unlisted member-best headlines, admin job descriptions and stale English translations were found; these can be included under the brief's member-best wording rule without changing logic or keys. `SettingsPrivacyCard.tsx:16` is another feature-name mention not included in the named exception list.

## Work and verification

- Read the brief, relevant source/defaults and affected existing assertions; ran a read-only whole-src audit.
- Added the task to `roadmap.md`. No product, locale, assertion, case-name or fixture changes.
- No tests deleted, renamed or rewritten. No tests added.
- Last reported baseline: **6,948 tests / 611 files**. No tests executed for RC3 yet; no fresh suite total or build claim.
- No SQL, migrations, deployed RPC/edge changes, feed_config, cap, native/Median changes, guest browsing, review wizard, news or round-plot edits.

## Remaining matches

The full pre-edit whole-src audit follows in the companion retained output `docs/verification/rc3-wording/remaining-before.txt`; every match remains unchanged at this stop. English locale files are under `public/locales/en`, not `src`; their matching values also require the wording pass after the ruling.