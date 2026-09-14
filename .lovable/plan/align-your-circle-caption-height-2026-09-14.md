# Align Your Circle caption height

## What will change
- Make the “Your circle” caption use the same fixed 35px caption block as “This week at {club}”.
- Keep the avatar fixed at 20px and vertically centred against the complete name-and-HCP block.
- Fit the member name and HCP on two tight rows by using compact line heights and slightly smaller caption typography where needed; neither row will be removed.
- Preserve the same 35px reservation when HCP is private or unavailable, so every circle tile remains the same height across the rail.

## Technical details
- Add an opt-in compact two-row caption mode to the shared course tile rather than changing its existing consumers.
- Enable that mode only for the circle rail and remove its taller two-name-line reservation.
- Keep clipping/truncation contained inside the text column so the tile width and page width cannot expand.

## Verification
- Run the focused checks and inspect the All tab at mobile width.
- Compare circle and club tile caption bounding boxes, verify equal total tile heights, and confirm avatar centring for both visible-HCP and private/no-HCP rows.
- Confirm the HCP row remains readable and no horizontal overflow is introduced.
