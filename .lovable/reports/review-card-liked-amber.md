# Review card: liked thumb amber

- ReviewBottomSheet.tsx footer ReactionAction: reactedColor INK -> A.AMBER (shared courseled `tokens` A.AMBER, the same token ReactionAction's default liked state uses). Unliked stays MUTE; count follows glyph.
- Course name destination: unchanged (CourseNameLink -> course page), per ruling.
- Tests: no existing assertion encoded the liked colour, so none rewritten. Added in reviewCardRedesign.test.tsx: "liked uses the shared amber like token; unliked stays MUTE".
- Suite: before 9,076; after 9,077 (2,235 / 2,255 / 2,272 / 2,315), +1 = the added test. No failures. Typecheck clean.
- Note: shard 1 was run twice because the first run's summary lines were lost to output filtering; the counted run passed 2,235/2,235. No failure was seen.
