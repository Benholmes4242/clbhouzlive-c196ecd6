# Verification document retention — IMPLEMENTED

BRIEF_VERIFICATION_PHASE_3 §4.3. Built as scoped: three SQL functions
(`list_expired_verification_documents`, `mark_verification_document_purged`,
`verification_documents_referenced`), the service-role edge function
`verification-document-purge`, and two cron entries in
`docs/sql/verification_document_purge_cron.sql` (daily retention sweep 03:15 UTC,
weekly orphan sweep Sunday 03:45 UTC). The periods and mechanism below are what
runs; "proposed" wording is retained for the reasoning.


## What is held

Bucket `business-verification-docs`, **private**, paths `<business_id>/<ts>-<filename>`.
Referenced by `business_verification_requests.proof_document_url` (a storage path,
not a URL). Files are registrations, licences, tax records — identity evidence.

## Proposed period

| State of the request | Retain | Reason |
| --- | --- | --- |
| `pending` / `needs_more_info` | Until decision | The reviewer needs it |
| `approved` | **90 days after decision** | Appeal window and audit of the decision |
| `rejected` | **30 days after decision** | Shorter: the applicant may correct and resubmit, but we keep declined evidence briefly |
| Abandoned upload (no request row references the path) | **7 days** | Uploads happen before submit; orphans are pure liability |

After the period the FILE is deleted; the request row and `proof_metadata` stay
(minus `document_path`), so the audit trail of *what was decided* survives while
the document itself does not.

## Proposed mechanism

1. A `pg_cron` daily job calling a `SECURITY DEFINER` function
   `public.purge_expired_verification_documents()` which:
   - selects request rows past their window with a non-null `proof_document_url`,
   - deletes the object via the storage admin API (edge function invoked with the
     service role, since SQL cannot delete bucket objects),
   - nulls `proof_document_url` and stamps `proof_metadata.document_purged_at`.
2. Orphan sweep: list objects older than 7 days whose path is not referenced by
   any request row, and delete them.
3. Log each purge to `admin_audit_log` so a deletion is itself auditable.

## Not proposed

No user-facing "delete my document" button in this phase — a business deleting
evidence mid-review would strand the reviewer. Deletion on account closure should
be folded into the existing account-deletion path when that is next touched.
