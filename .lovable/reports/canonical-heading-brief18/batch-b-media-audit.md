# Batch B audit notes — Media and review sheets

Source trace: CourseMediaTabNew imports media-v2/media-v3; HoleWalk and HoleMediaVideo import hole-walk. ShotTagChoices renders media-v2-label plus media-v3-tag-label. Scope group-heading override only, never media-v2-label global. ShotTagCard position stays metadata. hole-walk stats/months/owner selectors have no live JSX users; shot-tag-choices.css has no import.

ReviewComposerV2 is the rate route composer; EditLossSheet, RemoveReviewSheetV2, ReviewReceipt and ReviewCourseSearchSheet are nested surfaces. ReviewScoreHeadings breakdown and search recent/threshold/popular groups are E2. Search is shared outside Courses: require explicit scoped opt-in, not global CSS recolour.

Ben's provisional D row ReviewComposerV2.tsx:106 remains unchanged as instructed. Source inspection finds STEP1_HEADING consumed at :1168 and :1246; preserve the provisional designation without claiming proven deadness. No deletion or recolour is authorised by this continuation for that row.

Resolved roles: tagging holes/around E2; coverage/shots K2; position/processing K3; condition age K6; OR TYPE IT K5. Disabled SubmitBar and restored-media discard remain K4. EditLoss/Remove controls retain their original control colours.

No unresolved role in these inspected surfaces. Full per-label rows belong in report.md before changes.
