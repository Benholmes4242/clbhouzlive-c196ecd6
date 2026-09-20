# Season race fallback and featured-role cap

## Build

1. Add an explicit race-standings fallback when neither the points chart nor measured movement qualifies. It will show the points category's top five with position, player, points, and category-approved leader gap.
2. Give that fallback the strongest visual weight after the lead and place it second in page order.
3. Restrict appearance reservations and reported appearance counts to featured roles only: lead subject, one-number feature, and duel. Race rows and tied-list membership will not affect the two-role cap.
4. Select the strongest eligible tied category without reserving its members, allowing the three-way wins tie to render even when the leader appears in it.
5. Update all six locales, focused selection tests, and verify the live PGA module order plus featured-role appearance counts.

## Expected PGA result

Lead; top-five points race; Zach Johnson putting number; Potgieter-McIlroy driving-distance duel; three-way wins tie.
