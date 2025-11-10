-- Grant Ben full admin access
insert into admin_memberships (user_id, role)
values ('6a5bcbb9-c22c-4655-ad8e-088b2858ca3e', 'full')
on conflict (user_id) do update set role = excluded.role;