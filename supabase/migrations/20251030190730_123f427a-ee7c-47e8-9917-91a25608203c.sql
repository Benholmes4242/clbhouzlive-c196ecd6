-- Add show_handicap privacy flag to user_profiles
alter table user_profiles
  add column if not exists show_handicap boolean default true;

-- Backfill nulls to true so existing users still show HCP
update user_profiles set show_handicap = true where show_handicap is null;

comment on column user_profiles.show_handicap is 'Privacy flag: whether to display handicap to other users';