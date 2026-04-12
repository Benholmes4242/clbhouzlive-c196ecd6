UPDATE ai_predictions
SET predictions = '[
  {
    "rank": 1,
    "concern": "",
    "country": "UNITED STATES",
    "reasons": ["World No.1 and defending champion", "Dominant Augusta record with two Green Jackets", "Elite strokes gained across all categories"],
    "photoUrl": null,
    "playerId": "9a9b484c-8026-40b8-ab4b-e9fa95464231",
    "pgaTourId": "46046",
    "modelVotes": [{"rank": 1, "model": "claude", "winProbability": 18.5}, {"rank": 1, "model": "gemini", "winProbability": 17.0}],
    "playerName": "Scottie Scheffler",
    "isDarkHorse": false,
    "worldRanking": 1,
    "consensusScore": 900,
    "courseFitScore": 95,
    "winProbability": 17.8
  },
  {
    "rank": 2,
    "concern": "",
    "country": "NORTHERN IRELAND",
    "reasons": ["Four-time major champion with elite ball-striking", "Consistently contends at Augusta National", "Peak form heading into Masters week"],
    "photoUrl": null,
    "playerId": "300bff22-d7aa-4370-a69d-cb008f0dbc4f",
    "pgaTourId": "28237",
    "modelVotes": [{"rank": 2, "model": "claude", "winProbability": 12.0}, {"rank": 2, "model": "gemini", "winProbability": 11.5}],
    "playerName": "Rory McIlroy",
    "isDarkHorse": false,
    "worldRanking": 3,
    "consensusScore": 750,
    "courseFitScore": 88,
    "winProbability": 11.8
  },
  {
    "rank": 3,
    "concern": "",
    "country": "AUSTRALIA",
    "reasons": ["Explosive ball-striker with Augusta-suited game", "Strong recent form on PGA Tour", "Fearless competitor in major championship settings"],
    "photoUrl": null,
    "playerId": "52495c7b-0232-4f62-ab51-05b3e3a5b603",
    "pgaTourId": "55182",
    "modelVotes": [{"rank": 3, "model": "claude", "winProbability": 8.5}, {"rank": 3, "model": "gemini", "winProbability": 7.0}],
    "playerName": "Min Woo Lee",
    "isDarkHorse": false,
    "worldRanking": 15,
    "consensusScore": 600,
    "courseFitScore": 82,
    "winProbability": 7.8
  }
]'::jsonb
WHERE tournament_id = '2c5df93e-af44-4f2f-9602-be24d7717dd0';