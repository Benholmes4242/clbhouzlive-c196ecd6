# BRIEF_COURSE_CARD_V3
Suite: `npx vitest run --shard=N/4` ×4 — 2,250 / 2,195 / 2,228 / 2,305 = 8,978, all passing (baseline 8,964, +14).
+9 new courseCardV3.test.tsx; +5 appended to coursesListPhotoCards.test.tsx (list gap 0, holes = 18×rounds ×3 scopes, header labels).
Changed (planned): courseListCardV2 rated label 'from 2 ratings'→'2 ratings', 'from 1 rating'→'1 rating';
coursesListPhotoCards: head test 'Plays to'/'−1.4' → 'Holes'/'1,026' and no Plays to; region test figures add holes, asserts no '−1.6';
zero-scope figures add holes:0; 150px→190px (two tests); 'browse cards meet without a gap' renamed 'browse cards sit 10px apart in card view' (asserted '0px' on two wrappers → '10px' on the first).
Breakdown: new opt-in CategoryScores layout="strip"; split/grid4/pairs untouched (split now has no caller, kept).
Live checks 375/320: 190px photos, 10px tiles, 10px photo→lead, no overflow, list rows without Record, header 312 / 4,314 / 77,652.
