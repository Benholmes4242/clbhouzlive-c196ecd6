# T4 hero board and surname fix

## Changes
- Swap TODAY and TOT only in the live overview board, preserving the completed Prize layout.
- Add one shared compound-surname helper and replace every local tour surname extractor with it.
- Add focused tests for the requested ordinary, compound, single-token, and empty names.
- Verify the live board at 320px and 390px, measuring name width, header clearance, and compound-surname fit.

## Technical details
- Keep the live tracks fixed at `44px minmax(0, 1fr) 40px 52px`, with no gap or spacer.
- Preserve original casing while absorbing the specified case-insensitive particles immediately before the final token.
- Run focused tests and the project TypeScript check through the existing harness.
