-- Update ~35 colleges to have negative deltas for realistic "Falling" demo
-- These are the smaller colleges that will show as declining this week

UPDATE college_weekly_movers SET 
  earnings_delta = -earnings_delta * 1.5,
  wins_delta = CASE WHEN wins_delta > 0 THEN -1 ELSE wins_delta END,
  cuts_delta = CASE WHEN cuts_delta > 0 THEN -cuts_delta ELSE cuts_delta END,
  top10_delta = CASE WHEN top10_delta > 0 THEN -top10_delta ELSE top10_delta END,
  earnings_rank_change = -ABS(earnings_rank_change)
WHERE normalized_name IN (
  'oakland', 'jacksonville', 'dublinbusiness', 'centralcarolina', 'fresnostate',
  'northflorida', 'boisestate', 'sanfrancisco', 'coloradostate', 'luther',
  'torino', 'koreanationalsports', 'southcarolina', 'winthrop', 'barry',
  'virginiatech', 'northtexas', 'arizona', 'missouriwesternstate', 'auburn',
  'missouri', 'floridaatlantic', 'tennessee', 'colorado', 'oregonstate',
  'drake', 'augusta', 'vcu', 'campbell', 'malone',
  'stetson', 'easttennesseestate', 'mississippistate', 'olemiss', 'uab'
);