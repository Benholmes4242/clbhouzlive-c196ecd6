DO $$ BEGIN
  RAISE EXCEPTION
    'SUPERSEDED: this file DROPs and recreates RLS POLICIES on '
    'onboarding_nudges and email_unsubscribes, and redefines '
    'is_panel_admin. Running a stale copy silently changes who can '
    'read those tables and raises no error. Verify against '
    'pg_policies first; delete these lines only if you have decided '
    'to overwrite the live policies deliberately.';
END $$;

