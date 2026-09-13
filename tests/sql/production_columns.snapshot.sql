-- PRODUCTION COLUMN SNAPSHOT (AUDIT RULING 3, brief item 7b). NOT production SQL.
--
-- WHY THIS FILE EXISTS. tests/sql/explore_stream_d1_fixture.sql invented
-- gam_round_stats.id. Production has no such column: its key is whs_score_id.
-- The invented column let `g.id` compile locally, twelve assertions went green,
-- and FOUR LIVE VIEWS ran on the client fallback for two ship reports and a
-- device check. One column of drift cost the whole D1-D4 verification chain its
-- meaning. This snapshot is the cheapest insurance in the build.
--
-- WHAT IT IS. Every column of every table the Explore harness fixtures declare,
-- taken from the live project (information_schema.columns, data_type) on
-- 2026-09-13, project ref ybxkehyomcakqjvuhnna.
--
--   NARROW TABLES are recorded in FULL. The fixture must declare every column,
--   with the same type, and no others.
--
--   WIDE TABLES (user_profiles ~90 columns, golf_courses ~24) are recorded as
--   the DECLARED SUBSET the deployed Explore function family actually reads -
--   each row below verified present in production with the type shown. The
--   fixture must declare exactly this subset: an extra column here is the very
--   bug this guard exists to catch, so the subset is strict too, not a floor.
--
-- HOW TO REFRESH. Re-run the two queries in the header of
-- tests/sql/schema_parity_assert.sql against the project and replace the rows
-- below. Refreshing is a deliberate act with a date on it, never a silent fix.
\set ON_ERROR_STOP on

create table prod_columns (
  table_name  text not null,
  column_name text not null,
  data_type   text not null,
  primary key (table_name, column_name)
);

/* Tables recorded as a declared subset rather than in full; see the header. */
create table prod_columns_subset (table_name text primary key, reason text not null);
insert into prod_columns_subset values
  ('user_profiles', 'Wide member table; the Explore family reads six columns.'),
  ('golf_courses',  'Wide course table; the Explore family reads seven columns.');

insert into prod_columns (table_name, column_name, data_type) values
('amateur_stories','id','uuid'),
('amateur_stories','slug','text'),
('amateur_stories','kicker','text'),
('amateur_stories','headline','text'),
('amateur_stories','standfirst','text'),
('amateur_stories','body_blocks','jsonb'),
('amateur_stories','source_text','text'),
('amateur_stories','image_url','text'),
('amateur_stories','image_credit','text'),
('amateur_stories','categories','ARRAY'),
('amateur_stories','tournament_name','text'),
('amateur_stories','published_at','timestamp with time zone'),
('amateur_stories','created_at','timestamp with time zone'),
('amateur_stories','updated_at','timestamp with time zone'),
('course_ratings','id','uuid'),
('course_ratings','user_id','uuid'),
('course_ratings','course_id','uuid'),
('course_ratings','rating','numeric'),
('course_ratings','created_at','timestamp with time zone'),
('course_ratings','updated_at','timestamp with time zone'),
('course_ratings','review','text'),
('course_ratings','review_date','timestamp with time zone'),
('course_ratings','helpful_count','integer'),
('course_ratings','unhelpful_count','integer'),
('course_ratings','design_score','numeric'),
('course_ratings','condition_score','numeric'),
('course_ratings','facilities_score','numeric'),
('course_ratings','clubhouse_score','numeric'),
('course_ratings','is_mock','boolean'),
('course_ratings','title','text'),
('course_ratings','is_review_of_week','boolean'),
('course_ratings','review_of_week_week','text'),
('course_ratings','verdict','text'),
('course_ratings','share_to_feed','boolean'),
('course_ratings','tee_label','text'),
('course_shortlists','id','uuid'),
('course_shortlists','user_id','uuid'),
('course_shortlists','course_id','uuid'),
('course_shortlists','created_at','timestamp with time zone'),
('course_shortlists','list_key','text'),
('course_top100_memberships','id','uuid'),
('course_top100_memberships','course_id','uuid'),
('course_top100_memberships','list_id','uuid'),
('course_top100_memberships','rank','integer'),
('course_top100_memberships','added_at','timestamp with time zone'),
('course_top100_memberships','updated_at','timestamp with time zone'),
('follows','id','uuid'),
('follows','follower_actor_type','text'),
('follows','follower_actor_id','uuid'),
('follows','following_actor_type','text'),
('follows','following_actor_id','uuid'),
('follows','follower_user_id','uuid'),
('follows','created_at','timestamp with time zone'),
('gam_course_legends','id','uuid'),
('gam_course_legends','user_id','uuid'),
('gam_course_legends','course_id','uuid'),
('gam_course_legends','category','text'),
('gam_course_legends','rank','integer'),
('gam_course_legends','value','numeric'),
('gam_course_legends','attained_at','timestamp with time zone'),
('gam_course_legends','trigger_whs_score_id','uuid'),
('gam_course_legends','is_current','boolean'),
('gam_course_legends','updated_at','timestamp with time zone'),
('gam_round_net','whs_score_id','uuid'),
('gam_round_net','user_id','uuid'),
('gam_round_net','course_id','uuid'),
('gam_round_net','play_date','date'),
('gam_round_net','gross_score','integer'),
('gam_round_net','course_handicap','integer'),
('gam_round_net','net_score','integer'),
('gam_round_stats','whs_score_id','uuid'),
('gam_round_stats','user_id','uuid'),
('gam_round_stats','play_date','date'),
('gam_round_stats','course_id','uuid'),
('gam_round_stats','course_name','text'),
('gam_round_stats','course_par','integer'),
('gam_round_stats','course_rating','numeric'),
('gam_round_stats','slope_rating','integer'),
('gam_round_stats','gross_score','integer'),
('gam_round_stats','nett_score','integer'),
('gam_round_stats','stableford_points','integer'),
('gam_round_stats','score_diff','numeric'),
('gam_round_stats','hcp_at_time','numeric'),
('gam_round_stats','holes_played','integer'),
('gam_round_stats','pcc','numeric'),
('gam_round_stats','is_competition','boolean'),
('gam_round_stats','tee_marker','text'),
('gam_round_stats','birdies','integer'),
('gam_round_stats','eagles','integer'),
('gam_round_stats','albatrosses','integer'),
('gam_round_stats','holes_in_one','integer'),
('gam_round_stats','pars','integer'),
('gam_round_stats','bogeys','integer'),
('gam_round_stats','double_bogeys','integer'),
('gam_round_stats','triple_plus','integer'),
('gam_round_stats','longest_par_or_better_run','integer'),
('gam_round_stats','longest_birdie_run','integer'),
('gam_round_stats','beat_par','boolean'),
('gam_round_stats','sub_70','boolean'),
('gam_round_stats','sub_80','boolean'),
('gam_round_stats','sub_90','boolean'),
('gam_round_stats','sub_100','boolean'),
('gam_round_stats','clean_card','boolean'),
('gam_round_stats','is_counter','boolean'),
('gam_round_stats','delta_index','numeric'),
('gam_round_stats','evaluator_version','integer'),
('gam_round_stats','created_at','timestamp with time zone'),
('gam_round_stats','updated_at','timestamp with time zone'),
('gam_round_stats','hole_detail_present','boolean'),
('gam_round_stats','counter_settled','boolean'),
('top100_lists','id','uuid'),
('top100_lists','slug','text'),
('top100_lists','name','text'),
('top100_lists','short_label','text'),
('top100_lists','description','text'),
('top100_lists','is_active','boolean'),
('top100_lists','sort_order','integer'),
('top100_lists','created_at','timestamp with time zone'),
('top100_lists','updated_at','timestamp with time zone'),
('user_follows','id','uuid'),
('user_follows','follower_id','uuid'),
('user_follows','following_id','uuid'),
('user_follows','created_at','timestamp with time zone'),
('user_follows','follower_actor_type','text'),
('user_follows','follower_actor_id','uuid'),
('user_friends','id','uuid'),
('user_friends','user_id','uuid'),
('user_friends','friend_id','uuid'),
('user_friends','status','text'),
('user_friends','created_at','timestamp with time zone'),
('user_friends','updated_at','timestamp with time zone'),
('user_surface_last_seen','user_id','uuid'),
('user_surface_last_seen','surface_key','text'),
('user_surface_last_seen','last_seen_at','timestamp with time zone'),
('user_surface_last_seen','updated_at','timestamp with time zone'),
/* WIDE TABLES - the declared subset. eg_handicap_index is DOUBLE PRECISION in
   production while manual_handicap_index is NUMERIC; the fixture claimed
   numeric for both, which is exactly the kind of quiet difference that changes
   a comparison's result without changing a line of SQL. */
('user_profiles','id','uuid'),
('user_profiles','display_name','text'),
('user_profiles','profile_photo_url','text'),
('user_profiles','eg_handicap_index','double precision'),
('user_profiles','manual_handicap_index','numeric'),
('user_profiles','primary_club_id','uuid'),
('golf_courses','id','uuid'),
('golf_courses','name','text'),
('golf_courses','country','text'),
('golf_courses','sub_country','text'),
('golf_courses','region','text'),
('golf_courses','thumbnail_image','text'),
('golf_courses','club_id','uuid');
