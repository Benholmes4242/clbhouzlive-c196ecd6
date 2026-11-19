# MESSAGING AVATARS: HAIRLINE EVERYWHERE

## Files changed
- src/pages/messaging-v2/MessageBubble.tsx — 28px incoming sender avatar: before default 2px grey ring; after `hairlineRing` (1px traced overlay). Size, slot and last-of-run rule unchanged.
- src/pages/messaging-v2/NewConversationSheet.tsx — fourball 34px faces: before no hairline, wrapper `border: '2px solid #1E1E23'`; after `hairlineRing` on each face, wrapper `boxShadow: '0 0 0 1.5px #1E1E23'`. -8 overlap, size, order unchanged.
- SquircleAvatar.tsx, other surfaces, bubble colours and unread treatment untouched.
- New src/test/messagingHairlineAvatars.test.tsx, 3 cases (a)-(c). No tests edited or deleted.

## Suite
Base 9,181 (actual last full pass; the brief's 9,176 omitted five WAGR cases). Shards sequential, logs /tmp/mh-shard-{1..4}.log: 2,274 / 2,254 / 2,301 / 2,355 = 9,184 (+3), all passing.
