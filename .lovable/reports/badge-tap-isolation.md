# BRIEF_BADGE_TAP_ISOLATION
Close path: GlanceShell backdrop onClick (no document listener). The card portals to body, but React bubbles synthetic events through the component tree, so the closing click bubbled from the backdrop through ProLabel into the enclosing tile's onClick (Explore tiles open the viewer on onClick). Not a ghost click.
Fix: anchored backdrop uses swallowTap (stops pointer/touch/mouse/click; closes on click only; touch-action none). ProLabel stops every phase on the badge and wraps the open card in a stop-propagation wall. Focus returns with preventScroll.
Surfaces covered by the single ProLabel owner: Explore bylines/tiles, people rows, Courses/Top 100 cards, leaderboards, reviews, comments, profile headers.
Suite: 8,968 (2,250/2,199/2,238/2,281); delta +6, all new in memberBadgeCard.test.tsx. No tests edited.
Unchecked: real phone 10x tap run (no signed-in browser here).
