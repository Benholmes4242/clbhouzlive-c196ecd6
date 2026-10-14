/**
 * Cron job name -> plain name and one sentence on what it does (BRIEF_HEALTH).
 * Unknown names fall back to the job name with - and _ as spaces, first letter
 * capitalised, and no description.
 */
export interface JobName { name: string; what?: string }

const JOBS: Record<string, JobName> = {
  'auto-map-tournament-venues': { name: 'Tournament venue matching', what: 'Links tour events to their course pages so venues show photos and details.' },
  'backfill-video-metadata': { name: 'Video details backfill', what: 'Fills in missing length, size and thumbnail details for uploaded videos.' },
  'capture-leaderboard-snapshot': { name: 'Leaderboard snapshot', what: 'Saves the current member leaderboards so position changes can be shown.' },
  'capture-tee-set-history': { name: 'Tee set history', what: 'Records course tee ratings and slopes so changes over time are kept.' },
  'cleanup_open_to_play_every_5_min': { name: 'Open to play clean-up', what: 'Clears expired "open to play" posts once their time has passed.' },
  'cleanup_site_gate_attempts': { name: 'Site gate clean-up', what: 'Deletes old site access attempts so the gate log stays small.' },
  'cleanup-review-videos-hourly': { name: 'Review video clean-up', what: 'Removes review videos that were uploaded but never attached to a review.' },
  'cleanup-unverified-profiles': { name: 'Unverified profile clean-up', what: 'Removes sign-ups that never confirmed their account.' },
  'create-round-posts': { name: 'Round posts', what: 'Turns newly analysed rounds into posts in the clubhouse feed.' },
  'daily-multi-tour-schedule-sync': { name: 'Tour schedules', what: 'Refreshes the season schedule for every tour shown in Tour Hub.' },
  'echo-engine-health-daily': { name: 'Echo engine check', what: 'Asks each Echo answer engine a test question and records whether it replied.' },
  'friend_content_nightly': { name: 'Friends content', what: 'Rebuilds the content each member sees from the people they follow.' },
  'gam-course-mapping-orchestrator-6h': { name: 'Course matching', what: 'Matches England Golf course names on new rounds to clbhouz course pages.' },
  'gam-dispatcher-1m': { name: 'Achievement notifications', what: 'Sends members the notifications for achievements they have just earned.' },
  'gam-evaluator-1m': { name: 'Round analysis', what: 'Scores newly synced rounds and works out the achievements they unlock.' },
  'gam-streaks-at-risk-friday': { name: 'Streaks at risk', what: 'Reminds members whose playing streak ends if they do not post a round this week.' },
  'gam-streaks-weekly': { name: 'Weekly streaks', what: 'Updates every member\'s weekly playing streak.' },
  'gam-weekly-digest-sunday': { name: 'Sunday digest', what: 'Sends each member a summary of their golf week.' },
  'generate-predictions-friday-catchup': { name: 'Predictions catch-up', what: 'Generates tournament predictions for any event the weekly run missed.' },
  'generate-predictions-weekly': { name: 'Weekly predictions', what: 'Generates the predictions for this week\'s tournaments.' },
  'leaderboard-snapshots-daily': { name: 'Daily leaderboard snapshots', what: 'Saves a daily copy of the member leaderboards.' },
  'leaderboard-snapshots-prune': { name: 'Leaderboard snapshot tidy-up', what: 'Deletes leaderboard snapshots that are past their keep period.' },
  'onboarding-nudge-sequence': { name: 'Onboarding nudges', what: 'Sends new members the next message in their welcome sequence.' },
  'pickem-generate': { name: 'Pick em: new week', what: 'Opens the new week of Pick em with this week\'s field.' },
  'pickem-settle': { name: 'Pick em: results', what: 'Scores members\' Pick em entries once results are in.' },
  'process-ended-seasons-daily': { name: 'Ended seasons', what: 'Closes finished seasons and records their final standings.' },
  'process-push-queue': { name: 'Push sending', what: 'Sends the push notifications waiting in the queue.' },
  'prune-cron-run-details': { name: 'Job history tidy-up', what: 'Deletes scheduled job run history older than seven days.' },
  'prune-sr-sync-log': { name: 'Tour sync log tidy-up', what: 'Deletes old entries from the tour data sync log.' },
  'publish-scheduled-posts': { name: 'Scheduled posts', what: 'Publishes posts whose scheduled time has arrived.' },
  'purge-push-queue-history': { name: 'Push history tidy-up', what: 'Deletes sent push notifications from the queue history.' },
  'record-system-state': { name: 'Health recorder', what: 'Records the state of each system once a day for the Health history.' },
  'refresh-college-season-stats-daily': { name: 'College season stats', what: 'Recalculates college golf season statistics.' },
  'refresh-college-weekly-movers-monday': { name: 'College weekly movers', what: 'Works out the college players who moved most in the rankings this week.' },
  'refresh-course-mood-blurbs-monthly': { name: 'Course mood blurbs', what: 'Rewrites the short mood line shown on each course from its recent reviews.' },
  'refresh-course-tee-sets': { name: 'Tee sets', what: 'Refreshes the tee sets, ratings and slopes held for each course.' },
  'refresh-discover-feats': { name: 'Discover feats', what: 'Rebuilds the list of recent member feats shown on Discover.' },
  'refresh-eagle-leaders': { name: 'Eagle leaders', what: 'Recalculates which members have made the most eagles.' },
  'refresh-hardest-holes': { name: 'Hardest holes', what: 'Recalculates the hardest holes from members\' hole by hole scores.' },
  'refresh-hero-stories': { name: 'Hero stories', what: 'Picks the stories shown at the top of the app.' },
  'refresh-latest-records': { name: 'Latest records', what: 'Rebuilds the list of the newest course and member records.' },
  'refresh-legendary-leaders': { name: 'Legendary leaders', what: 'Recalculates the members with the rarest achievements.' },
  'refresh-page-path-map': { name: 'Screen map', what: 'Rebuilds the map of app screens used by the Analytics Screens lens.' },
  'refresh-toughest-courses': { name: 'Toughest courses', what: 'Recalculates which courses members score worst on.' },
  'refresh-watch-editorial-picks-weekly': { name: 'Watch editorial picks', what: 'Chooses this week\'s editor picks for Watch.' },
  'refresh-whs-handicap-distribution': { name: 'Handicap distribution', what: 'Recalculates how members\' handicap indexes are spread.' },
  'score-predictions-daily': { name: 'Prediction scoring', what: 'Scores tournament predictions against the results so far.' },
  'scrape-tour-rankings-euro-daily': { name: 'DP World rankings', what: 'Fetches the latest DP World Tour rankings.' },
  'select-review-of-week': { name: 'Review of the week', what: 'Picks the course review featured as review of the week.' },
  'snapshot-friend-leaderboard-daily': { name: 'Friends leaderboard snapshot', what: 'Saves a daily copy of each member\'s friends leaderboard.' },
  'snapshot-player-statistics': { name: 'Monthly player stats snapshot', what: 'Saves a monthly copy of tour player statistics for the long-term record.' },
  'snapshot-season-rankings': { name: 'Season rankings snapshot', what: 'Saves a copy of the season rankings so movement can be shown.' },
  'sweep-orphaned-processing-posts': { name: 'Stuck post sweep', what: 'Finds posts left processing after a failed upload and clears them.' },
  'sync-player-stats-champ-2026': { name: 'Player stats: Champions', what: 'Fetches this season\'s Champions Tour player statistics.' },
  'sync-player-stats-euro-2026': { name: 'Player stats: DP World', what: 'Fetches this season\'s DP World Tour player statistics.' },
  'sync-player-stats-liv-2026': { name: 'Player stats: LIV', what: 'Fetches this season\'s LIV Golf player statistics.' },
  'sync-player-stats-lpga-2026': { name: 'Player stats: LPGA', what: 'Fetches this season\'s LPGA player statistics.' },
  'sync-player-stats-pga-2026': { name: 'Player stats: PGA Tour', what: 'Fetches this season\'s PGA Tour player statistics.' },
  'sync-player-stats-pgad-2026': { name: 'Player stats: Korn Ferry', what: 'Fetches this season\'s Korn Ferry Tour player statistics.' },
  'sync-whs-due-every-6h': { name: 'England Golf sync', what: 'Fetches new rounds and handicap indexes from England Golf for connected members.' },
  'sync-world-rankings-weekly': { name: 'World rankings', what: 'Fetches the latest official world golf rankings.' },
  'top100-daily-editorial': { name: 'Top 100 editorial', what: 'Writes the daily editorial line for the Top 100 courses.' },
  'tour-sunday-push': { name: 'Sunday tour push', what: 'Sends the Sunday final-round tour notification.' },
  'tour-thursday-push': { name: 'Thursday tour push', what: 'Sends the Thursday first-round tour notification.' },
  'tourhub-sync-enrich-daily': { name: 'Tour Hub enrich', what: 'Adds player and course detail to this week\'s tour events.' },
  'tourhub-sync-every-5min': { name: 'Tour Hub sync', what: 'Refreshes tour leaderboards and events for Tour Hub.' },
  'tournament-live-sync': { name: 'Live tournament sync', what: 'Updates live scores for tournaments in progress.' },
  'validate-predictions-daily': { name: 'Prediction checks', what: 'Checks that predicted players are still in the field.' },
  'validate-predictions-pre-start': { name: 'Pre-start prediction checks', what: 'Checks predictions against the final field just before an event starts.' },
  'verification-document-orphan-purge': { name: 'Verification file clean-up', what: 'Deletes uploaded verification files that belong to no request.' },
  'verification-document-retention-purge': { name: 'Verification file retention', what: 'Deletes verification files once their keep period has ended.' },
  'video-perf-rollups-retention': { name: 'Video stats tidy-up', what: 'Deletes old video playback statistics.' },
  'weather-backfill-rounds-daily': { name: 'Round weather', what: 'Adds the weather on the day to recently played rounds.' },
  'weekly-handicap-snapshot': { name: 'Weekly handicap snapshot', what: 'Saves each member\'s handicap index once a week for their trend chart.' },
};

export function jobName(raw: string): JobName {
  const known = JOBS[raw];
  if (known) return known;
  const s = raw.replace(/[-_]+/g, ' ').trim();
  return { name: s ? s[0].toUpperCase() + s.slice(1) : raw };
}

export const plainJobName = (raw: string): string => jobName(raw).name;
