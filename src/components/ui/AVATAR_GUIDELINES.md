# 🎯 Avatar Component Guidelines

## ✅ THE ONLY ALLOWED COMPONENT FOR USER AVATARS

**ALL user avatars across the entire application MUST use:**

```tsx
import { Squircle } from '@/components/ui/squircle';

<Squircle width={48} height={48}>
  <img 
    src={user.avatar} 
    alt={user.name} 
    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
  />
</Squircle>
```

## 🚫 FORBIDDEN Components for User Avatars

The following components are **FORBIDDEN** for user avatars:

- ❌ `<Avatar>` from `@/components/ui/avatar`
- ❌ `<OptimizedAvatar>` from `@/components/ui/optimized-avatar`
- ❌ `<AvatarSquircle>` from `@/components/ui/AvatarSquircle`
- ❌ Any `<img>` with `rounded-full` className
- ❌ Any custom `border-radius` styles

## Why?

All user avatars must use the **superellipse squircle shape (n=5)** for visual consistency with Apple's design language. This is a non-negotiable design requirement.

The `<Squircle>` component is the **single source of truth** for this geometry.

## Common Sizes

```tsx
// Extra small (28px) - for inline mentions, small lists
<Squircle width={28} height={28}>...</Squircle>

// Small (40px) - for compact lists, comments
<Squircle width={40} height={40}>...</Squircle>

// Medium (56px) - default for most user avatars
<Squircle width={56} height={56}>...</Squircle>

// Large (80px) - for profile headers, featured users
<Squircle width={80} height={80}>...</Squircle>

// Extra large (112px) - for large profile views
<Squircle width={112} height={112}>...</Squircle>
```

## With Fallback Content

```tsx
<Squircle width={48} height={48}>
  {user.avatar ? (
    <img 
      src={user.avatar} 
      alt={user.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  ) : (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--primary)',
      color: 'white',
      fontSize: '20px',
      fontWeight: 600
    }}>
      {user.name[0].toUpperCase()}
    </div>
  )}
</Squircle>
```

## Enforcement

- All deprecated components will log **console.error** warnings in development
- Code reviews should reject any new user avatars not using `<Squircle>`
- Visual QA should flag any circular or non-squircle user avatars

## Questions?

See `src/components/ui/squircle.tsx` for the implementation details.
