# Note for the reader who finds the December 2025 revocation rows

Between the introduction of `public.revoke_business_verification` (December 2025)
and Phase 5B of the verification programme (August 2026) — about eight months —
the function was `SECURITY DEFINER`, had `EXECUTE` granted to `authenticated`,
and contained **no admin check**. Any signed-in user who knew the function name
and a `business_id` could have stripped the verified badge from any business
account. Phase 5B added the `public.is_admin()` gate (`Forbidden - Admin
required`) that should have been there from the start.

Blast radius was nil. `verification_audit_log` records exactly two revocations,
both on 2025-12-16, and both belong to a single self-test loop: the same account
submitted, approved and revoked its own verification request inside nine minutes.
No third party was affected, no badge was removed from a business that had not
asked for it, and — because the whole verification programme was still being
built — there were no live verified businesses to take a badge from. There still
are none. Read the two December rows as a developer exercising the path, not as
an incident.

Nothing else is outstanding from this: revocation is now admin-gated, writes a
structured reason to `verification_audit_log`, and notifies the business's owners
and admins.
