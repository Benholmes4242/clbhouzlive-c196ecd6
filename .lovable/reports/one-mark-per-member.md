# BRIEF_ONE_MARK_PER_MEMBER
Fixed: CreatorSpotlight, CreatorsRow (sheet row), WatchLead (lead byline), ImmersiveFullscreenChrome (author line) now print the plain name then ProOrVerifiedMark. Business authors pass no userId. CreatorsRow lists personal members only, so it has no business case.
ProOrVerifiedMark gained an optional tickClassName (fallback tick only) so Creators to follow keeps its "inline align-middle" tick; caught by ws3WatchBottom WS6.1 on the first run, fixed in product code, test unchanged.
Guard flags nothing beyond the four; FindPeoplePage allowed (its tick is on the business row only).
Profile hero today: ProfileCoverBand shows the PRO or AM badge only and renders no verified tick.
Test edit: proLabelCoverage.test.ts labelImport regex now also accepts ProOrVerifiedMark (it wraps ProLabel); needed because CreatorSpotlight no longer imports InlineProMemberName. Assertion otherwise unchanged.
Suite: 8,988 (2,250/2,199/2,238/2,301); delta +20, all in new oneMarkPerMember.test.tsx.
Unchecked: 375 signed-in Explore/viewer in a browser.
