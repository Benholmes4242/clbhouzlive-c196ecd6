# FIX_PHOTO_CROPPER_WHOLE_PHOTO

## Changes
- `src/features/onboarding/welcome-cropper.css`: deleted `.welcome-cropper img{max-width:none;max-height:none}`. Added `.welcome-cropper-stage` (absolute, left/right 0, top `calc(env(safe-area-inset-top, 0px) + 76px)`, bottom `calc(env(safe-area-inset-bottom, 0px) + 150px)`, overflow hidden; business appearance bottom `+ 172px`). Copied the existing square-frame 4px radius rule here too (it previously lived only in business-create.css, so the personal cover outside Create a business could lose it).
- `WelcomeCropper.tsx`: Cropper wrapped in the stage. Props, zoom 1–4, restrictPosition, contain, getCroppedImg output unchanged. Head/foot unchanged.
- `ProfilePageV2.tsx`: ImageCropModal replaced with WelcomeCropper (AVATAR_CROP_ASPECT, squircle, subtitle "This is how golfers will see you", onCancel → handleCropCancel(false), onUse → handleCropComplete).

## Other overrides audit
No other stylesheet rule reaches `.welcome-cropper img` or `.reactEasyCrop_*`. Tailwind preflight's `img{max-width:100%;height:auto}` does not set none and does not fight `.reactEasyCrop_Contain`. Nothing to report.

## Deleted
- `src/components/business/ImageCropModal.tsx` (only importer was ProfilePageV2). No tests covered it, so no tests deleted.
- `ImageCropperModal` component (edit-v2) kept: its only importers are ProfilePhotoCard and HeaderPhotoCard, which themselves have no importer outside tests. Not deleted per brief.

## Tests
- New `src/test/photoCropperWholePhoto.test.tsx` (+5): CSS scan, stage offsets both appearances, cropper inside stage, Cancel/Use handlers, ProfilePageV2 wiring (source assertion: the page is too heavy to mount for this; the handler names asserted are the existing ones).
- No existing assertions changed; no existing test asserted ImageCropModal on the profile page.
- Full suite: 9,054 → 9,059 (2,271 / 2,224 / 2,249 / 2,315). Delta +5 = the new file. Typecheck clean.

## Device checks
Unchecked: every flow (sign-up photo, Edit profile photo/cover, profile page photo, Create a business logo/cover, Edit business logo/cover) sits behind sign-in, which the automated browser cannot do on this project. Please check on a phone with a 3000px+ landscape and portrait photo at 375 and 320×568.
