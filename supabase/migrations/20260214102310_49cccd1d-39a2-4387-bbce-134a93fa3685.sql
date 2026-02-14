-- Enable Realtime for sr_leaderboards and sr_tournaments
ALTER PUBLICATION supabase_realtime ADD TABLE sr_leaderboards;
ALTER PUBLICATION supabase_realtime ADD TABLE sr_tournaments;