-- Drop the old constraint that causes pairing merges
ALTER TABLE sr_tee_times DROP CONSTRAINT sr_tee_times_tournament_id_round_number_tee_time_tee_number_key;

-- Add new constraint using pairing_id (unique per tournament+round)
ALTER TABLE sr_tee_times ADD CONSTRAINT sr_tee_times_unique_pairing 
  UNIQUE (tournament_id, round_number, pairing_id);