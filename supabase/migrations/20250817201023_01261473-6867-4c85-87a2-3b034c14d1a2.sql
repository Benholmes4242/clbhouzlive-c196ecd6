-- Auto-remove videos from profile photos (migrate to photo only)
UPDATE user_profiles 
SET 
  profile_video_url = NULL,
  profile_video_thumbnail_url = NULL,
  has_profile_video = FALSE,
  updated_at = NOW()
WHERE has_profile_video = TRUE;