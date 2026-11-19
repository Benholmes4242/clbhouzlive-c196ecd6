# MESSAGES: AMBER GLASS FOR THE MEMBER'S OWN BUBBLES

## Files changed
- src/pages/messaging-v2/MessageBubble.tsx
  - Own bubble: background `linear-gradient(155deg, rgba(247,147,30,0.30) 0%, rgba(247,147,30,0.16) 100%)` (was #F4F6F8); edge `inset 0 0 0 1px rgba(247,147,30,0.48)` (new, box-shadow, no blur; not applied to deleted/media-only); text MSG.INK #F4F6F8 (was INK_ON_LIGHT).
  - Own reply quote: rule rgba(247,147,30,0.70) (was rgba(21,16,7,0.38)); name #FFD9A8 / 600 (was #3A2C10 / 500); snippet #E6CDAA (was #5B4718).
  - Own "edited": #E6CDAA (was rgba(245,246,247,0.55)).
  - Own action row top rule: rgba(247,147,30,0.35) (was canvas at 0.12); text follows bubble ink.
  - Reaction chip text now INK_ON_LIGHT directly; chip unchanged.
  - Header comment rewritten for amber glass.
- src/features/messaging-dark/tokens.ts — MSG.AMBER comment covers own bubbles and own scores.
- Unchanged: incoming, deleted, media-only, timestamps/ticks, ShareCards, VoiceNote, MessageImage, radii, padding, widths, sending opacity.

## Tests
- Added src/test/messagesAmberGlassBubble.test.tsx, 5 cases (a)-(e). (a) asserts the gradient on the OUT_BG source because jsdom rejects gradient backgrounds; edge and text colour are asserted on the render.
- No existing assertion encoded the white own bubble; none updated. canvasSurfaceToken.test.ts passes.

## Suite
Base 9,184. Shards sequential, logs /tmp/ag-shard-{1..4}.log: 2,251 / 2,277 / 2,296 / 2,365 = 9,189 (+5), all passing. Typecheck clean.
Not checked in a browser at 390/320.
