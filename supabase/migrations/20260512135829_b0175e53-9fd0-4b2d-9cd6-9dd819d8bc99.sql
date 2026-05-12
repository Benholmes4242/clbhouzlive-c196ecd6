delete from ai_predictions
where consensus_data->'enrichmentStats'->>'dnaSource' is null
   or consensus_data->'enrichmentStats'->>'courseFitCalculated' = '0'
   or generated_at < now() - interval '6 hours';