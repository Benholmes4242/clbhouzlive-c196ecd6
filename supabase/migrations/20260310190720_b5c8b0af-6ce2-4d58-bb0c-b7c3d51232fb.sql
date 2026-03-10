UPDATE tournament_result_meta
SET 
  winner_name = 'Akshay Bhatia',
  winner_photo_url = 'https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev/PGA%20Tour/Akshay%20Bhatia.webp',
  podium_rows = '[{"position":2,"label":"2","players":[{"name":"Daniel Berger","photoUrl":"https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev/PGA%20Tour/Daniel%20Berger.webp","score":"-15"}],"isTied":false},{"position":3,"label":"T3","players":[{"name":"Cameron Young","photoUrl":"https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev/PGA%20Tour/Cameron%20Young.webp","score":"-12"},{"name":"Ludvig Aberg","photoUrl":"https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev/PGA%20Tour/Ludvig%20Aberg.webp","score":"-12"}],"isTied":true}]'::jsonb
WHERE tournament_name ILIKE '%Arnold Palmer%';