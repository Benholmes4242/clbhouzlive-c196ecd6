# FIX_RECORD_AVATARS_AND_KEYBOARD_BAR
- useCourseRecordHolders and useTop100Enrichment read public_profiles (id, display_name, profile_photo_url); deleted_at filter dropped. View (migration 20260625082640) filters deleted_at IS NULL, is_public, not suspended, email confirmed.
- src/utils/median/keyboardAccessory.ts: hideKeyboardAccessoryOnce(), called at load and on median_library_ready in useMedianStatusBar; sends once, guarded, never throws.
- Tests: new recordAvatarsKeyboardBar.test.tsx (+4). courseListFacesV2.test.tsx mock chain changed (removed `.is()` step) because the code no longer calls it; no assertion changed.
- Suite 9,013 (2,238/2,241/2,230/2,304), was 9,009; +4 all new.
