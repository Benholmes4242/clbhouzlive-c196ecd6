/**
 * Cron job name -> plain name and one sentence on what it does (BRIEF_HEALTH).
 * Unknown names fall back to the job name with - and _ as spaces, first letter
 * capitalised, and no description.
 */
export interface JobName { name: string; what?: string }

const JOBS: Record<string, JobName> = {
  'auto-map-tournament-venues': { name: 'Tournament venue matching', what: 'Links tour event venues to clbhouz course pages so venues show photos and details.' },
  'backfill-video-metadata': { name: 'Video details backfill', what: 'Fills in missing dimensions, length and preview image for videos in members\' posts.' },
  'capture-leaderboard-snapshot': { name: 'Leaderboard snapshot', what: 'Saves each member\'s daily rank by number of Top 100 courses rated.' },
  'capture-tee-set-history': { name: 'Tee set history', what: 'Saves a dated copy of each course\'s tee sets, ratings and slopes.' },
  'cleanup_open_to_play_every_5_min': { name: 'Open to play clean-up', what: 'Switches off members\' "open to play" status once the time they set has passed.' },
  'cleanup_site_gate_attempts': { name: 'Site gate clean-up', what: 'Clears failed site access-code attempts older than a day, lifting any lockouts.' },
  'cleanup-review-videos-hourly': { name: 'Review video clean-up', what: 'Deletes course review videos still not attached to a review a day after upload.' },
  'cleanup-unverified-profiles': { name: 'Unverified profile clean-up', what: 'Deletes the profiles of sign-ups who still have not confirmed their email after seven days.' },
  'create-round-posts': { name: 'Round posts', what: 'Creates a round post for each newly analysed 18-hole round, unless the member opted out.' },
  'daily-multi-tour-schedule-sync': { name: 'Tour schedules', what: 'Refreshes all six tours\' schedules, closes finished events and fills in missing results and winners.' },
  'echo-engine-health-daily': { name: 'Echo engine check', what: 'Sends each of Echo\'s four AI engines a test question and records whether it answered.' },
  'friend_content_nightly': { name: 'Friend rivalries', what: 'Recalculates each member\'s rivals among friends, plus a featured friend round, overnight.' },
  'gam-course-mapping-orchestrator-6h': { name: 'Course matching', what: 'Matches up to 25 unmatched England Golf course names to clbhouz courses, using AI last.' },
  'gam-dispatcher-1m': { name: 'Achievement notifications', what: 'Turns new achievement, crown and streak alerts into push notifications, respecting quiet hours.' },
  'gam-evaluator-1m': { name: 'Round analysis', what: 'Analyses newly synced rounds, updating each member\'s stats, streaks, badges and course crowns.' },
  'gam-streaks-at-risk-friday': { name: 'Streaks at risk', what: 'Warns members on a playing streak that they have no counting round logged this week.' },
  'gam-streaks-weekly': { name: 'Weekly streaks', what: 'Closes the week: keeps, freezes or breaks each member\'s playing streak and tops up freezes monthly.' },
  'gam-weekly-digest-sunday': { name: 'Sunday digest', what: 'Sends members a Sunday "your week in golf" push covering rounds, crowns and rivals.' },
  'generate-predictions-friday-catchup': { name: 'Predictions catch-up', what: 'Retries predictions for tour events starting today or tomorrow that still do not have them.' },
  'generate-predictions-weekly': { name: 'Weekly predictions', what: 'Generates winner predictions for every tour event starting in the next two days.' },
  'leaderboard-snapshots-daily': { name: 'Daily leaderboard snapshots', what: 'Saves a daily copy of the Top 100, country, course and handicap leaderboards for rank changes.' },
  'leaderboard-snapshots-prune': { name: 'Leaderboard snapshot tidy-up', what: 'Keeps one leaderboard snapshot a month after 90 days and deletes any older than two years.' },
  'onboarding-nudge-sequence': { name: 'Onboarding nudges', what: 'Nudges members 2 to 30 days old to connect a handicap, set a club or pick a username.' },
  'pickem-generate': { name: 'Pick em: new week', what: 'Creates this week\'s set of yes or no Pick em questions.' },
  'pickem-settle': { name: 'Pick em: results', what: 'Marks this week\'s Pick em questions right or wrong once the outcome is known.' },
  'process-ended-seasons-daily': { name: 'Ended seasons', what: 'Records final XP ranks and reward tiers when a points season ends, for the recap pop-up.' },
  'process-push-queue': { name: 'Push sending', what: 'Sends queued push notifications to members\' phones, skipping any types they have muted.' },
  'prune-cron-run-details': { name: 'Job history tidy-up', what: 'Deletes scheduled job run history older than seven days.' },
  'prune-sr-sync-log': { name: 'Tour sync log tidy-up', what: 'Deletes tour data sync log entries older than 30 days.' },
  'publish-scheduled-posts': { name: 'Scheduled posts', what: 'Publishes members\' scheduled posts when their time arrives, failing any from suspended members.' },
  'purge-push-queue-history': { name: 'Push history tidy-up', what: 'Deletes sent or failed push notifications more than 14 days old.' },
  'record-system-state': { name: 'Health recorder', what: 'Records the day\'s state of each of the six systems for the Health page history.' },
  'refresh-college-season-stats-daily': { name: 'College season stats', what: 'Totals this season\'s PGA Tour wins, earnings and stats by the college each player attended.' },
  'refresh-college-weekly-movers-monday': { name: 'College weekly movers', what: 'Works out which colleges\' tour players gained most in earnings and wins this week.' },
  'refresh-course-mood-blurbs-monthly': { name: 'Course mood blurbs', what: 'Rewrites the expired AI "why this course" lines used on the Courses page.' },
  'refresh-course-tee-sets': { name: 'Tee sets', what: 'Rebuilds each course\'s tee sets, ratings and slopes from members\' synced rounds.' },
  'refresh-discover-feats': { name: 'Discover feats', what: 'Rebuilds the regional lists of members\' standout feats, such as aces, eagles and birdie hauls.' },
  'refresh-eagle-leaders': { name: 'Eagle leaders', what: 'Ranks members by the number of eagles they have made.' },
  'refresh-hardest-holes': { name: 'Hardest holes', what: 'Recalculates the holes members score furthest over par on.' },
  'refresh-hero-stories': { name: 'Hero stories', what: 'Ranks recent member course records, aces, albatrosses, eagles and birdie hauls into featured stories.' },
  'refresh-latest-records': { name: 'Latest records', what: 'Rebuilds the list of the 12 newest course records set by members.' },
  'refresh-legendary-leaders': { name: 'Legendary leaders', what: 'Ranks members by the holes in one and albatrosses they have made.' },
  'refresh-page-path-map': { name: 'Screen map', what: 'Matches each page address members visit to its app screen for the admin Screens analytics.' },
  'refresh-toughest-courses': { name: 'Toughest courses', what: 'Finds the ten courses members score worst and best on, among those with 30+ rounds.' },
  'refresh-watch-editorial-picks-weekly': { name: 'Watch editorial picks', what: 'Asks AI to write blurbs for the Watch, Clip and Video of the Week picks.' },
  'refresh-whs-handicap-distribution': { name: 'Handicap distribution', what: 'Recalculates how members\' handicap indexes are spread, for the percentile shown on profiles.' },
  'score-predictions-daily': { name: 'Prediction scoring', what: 'Grades pre-tournament predictions for every finished tournament against the final leaderboard.' },
  'scrape-tour-rankings-euro-daily': { name: 'DP World rankings', what: 'Fetches the latest Race to Dubai standings from the DP World Tour\'s own feed.' },
  'select-review-of-week': { name: 'Review of the week', what: 'Picks the most detailed course review of the last 30 days as review of the week.' },
  'snapshot-friend-leaderboard-daily': { name: 'Friends leaderboard snapshot', what: 'Saves each member\'s friends handicap leaderboard ranks daily so rank changes can be shown.' },
  'snapshot-player-statistics': { name: 'Monthly player stats snapshot', what: 'Saves a copy of tour players\' season statistics for the long-term record.' },
  'snapshot-season-rankings': { name: 'Season rankings snapshot', what: 'Saves a dated copy of the Race to Dubai standings so movement can be shown.' },
  'sweep-orphaned-processing-posts': { name: 'Stuck post sweep', what: 'Tidies up posts left stuck "processing" when an upload never finished.' },
  'sync-player-stats-champ-2026': { name: 'Player stats: Champions', what: 'Fetches the 2026 season player statistics for the Champions Tour.' },
  'sync-player-stats-euro-2026': { name: 'Player stats: DP World', what: 'Fetches the 2026 season player statistics for the DP World Tour.' },
  'sync-player-stats-liv-2026': { name: 'Player stats: LIV', what: 'Fetches the 2026 season player statistics for LIV Golf.' },
  'sync-player-stats-lpga-2026': { name: 'Player stats: LPGA', what: 'Fetches the 2026 season player statistics for the LPGA Tour.' },
  'sync-player-stats-pga-2026': { name: 'Player stats: PGA Tour', what: 'Fetches the 2026 season player statistics for the PGA Tour.' },
  'sync-player-stats-pgad-2026': { name: 'Player stats: Korn Ferry', what: 'Fetches the 2026 season player statistics for the Korn Ferry Tour.' },
  'sync-whs-due-every-6h': { name: 'England Golf sync', what: 'Fetches new rounds, handicap indexes and friends from England Golf for members due a refresh.' },
  'sync-world-rankings-weekly': { name: 'World rankings', what: 'Fetches the latest Official World Golf Ranking.' },
  'top100-daily-editorial': { name: 'Leaderboard headlines', what: 'Writes the day\'s headline lines for the Top 100, Global, Courses and Handicap leaderboards.' },
  'tour-sunday-push': { name: 'Sunday tour push', what: 'Sends members a Sunday push about the tour events being decided that day.' },
  'tour-thursday-push': { name: 'Thursday tour push', what: 'Sends members a Thursday push about the tour events starting that week.' },
  'tourhub-sync-enrich-daily': { name: 'Old SlashGolf tour feed', what: 'Copies SlashGolf results and rankings into old tables that nothing in the app reads.' },
  'tourhub-sync-every-5min': { name: 'Old ESPN tour feed', what: 'Fetches ESPN tour events and leaderboards into a table that no longer exists.' },
  'tournament-live-sync': { name: 'Live tournament sync', what: 'Updates live leaderboards, tee times and scorecards every minute for events in play.' },
  'validate-predictions-daily': { name: 'Prediction checks', what: 'Checks predicted players for withdrawals and swaps in an alternate for anyone who pulled out.' },
  'validate-predictions-pre-start': { name: 'Pre-start prediction checks', what: 'Repeats the withdrawal check in the three hours before an event\'s start date.' },
  'verification-document-orphan-purge': { name: 'Verification file clean-up', what: 'Deletes verification files over a week old that belong to no verification request.' },
  'verification-document-retention-purge': { name: 'Verification file retention', what: 'Deletes verification files 90 days after approval or 30 days after rejection.' },
  'video-perf-rollups-retention': { name: 'Video stats tidy-up', what: 'Deletes video playback statistics older than 90 days.' },
  'weather-backfill-rounds-daily': { name: 'Round weather', what: 'Adds the weather on the day to up to 200 recent rounds that lack it.' },
  'weekly-handicap-snapshot': { name: 'Weekly handicap snapshot', what: 'Copies every member\'s current handicap index into the handicap history table once a week.' },
};

export function jobName(raw: string): JobName {
  const known = JOBS[raw];
  if (known) return known;
  const s = raw.replace(/[-_]+/g, ' ').trim();
  return { name: s ? s[0].toUpperCase() + s.slice(1) : raw };
}

export const plainJobName = (raw: string): string => jobName(raw).name;
