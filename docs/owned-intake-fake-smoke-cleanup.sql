-- Cleanup helper for fake owned-intake smoke rows only.
-- This must never be widened to delete real leads.

begin;

delete from public.form_submissions
where lead_id in (
  select id
  from public.leads
  where email like 'test+owned-intake-%@example.com'
     or email like 'test+dedup-%@example.com'
);

delete from public.shortlist_sessions
where anonymous_id like 'smoke-%';

delete from public.leads
where email like 'test+owned-intake-%@example.com'
   or email like 'test+dedup-%@example.com';

commit;
