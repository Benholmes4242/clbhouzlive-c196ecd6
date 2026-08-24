# Global Avatar Ring Rule

This rule applies to **every single place a user avatar is rendered** across Clbhouz.

## The Rule

### Users WITH an Achievement Ring
- Display **only** their coloured Achievement Ring
- **No grey ring** should ever appear for these users
- The Achievement Ring sits directly on the avatar (1px)

### Users WITHOUT an Achievement Ring  
- **Always** display the 1px grey ring (#D1D5DB)
- They should never appear without the grey ring anywhere in the UI

## Implementation

All avatars MUST use the `<SquircleAvatar
                          >` component from `@/components/ui/SquircleAvatar.tsx`.

```tsx
// The hairline ring defaults to DARK_HAIRLINE (white @ 22%). Never pass a
// surface-based ring colour: clbhouz is dark-only. `ringColor` is an override
// for achievement or accent rings only.
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// User with achievement ring (shows colored ring, no grey)
<SquircleAvatar 
  src={user.avatarUrl}
  ringColor={tierColor}  // e.g., "#8CE06A"
  size="md"
/>

// User without achievement ring (shows grey ring)
<SquircleAvatar 
  src={user.avatarUrl}
  ringColor={null}  // or omit the prop
  size="md"
/>
```

## Logic

```tsx
hasAchievementRing
  ? showAchievementRing()   // coloured ring ONLY (1px)
  : showGreyRing();         // grey ring ONLY (1px)
```

## Where This Applies

- Profile pages
- Leaderboards  
- Reviews
- Course check-ins
- Search results
- Suggested friends
- Comments & replies
- Notifications
- Clubhouse feed
- Moments creator
- **Any future components using user avatars**

## Deprecated Components

Do NOT use:
- Custom border/ring implementations
- The SVG-based `Squircle` component for avatars

## Ring Colors

Achievement ring colors come from the **Global Achievement & Milestone System**:
```tsx
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';

const tierColor = getRingColorForTotalPlayed(totalPlayed);
```
