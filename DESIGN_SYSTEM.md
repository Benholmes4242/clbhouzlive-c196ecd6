# 🎨 Clbhouz Design System — Phases 0-8

**Last Updated:** Phase 8 Implementation
**Status:** ✅ Enforced & Self-Governing

---

## 📋 Overview

This document is the **single source of truth** for all UI/UX patterns in the Clbhouz application. Every component, page, modal, form, and interaction must adhere to this system.

**Why this exists:**
- Ensures visual cohesion across the entire app
- Prevents design drift over time
- Makes the codebase predictable and maintainable
- Improves accessibility and performance
- Enables faster feature development

---

## 🎨 Phase 0-7 Summary

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 0 | Foundation & Tokens | ✅ Complete |
| Phase 1 | Typography Migration | ✅ Complete |
| Phase 2 | Font Weights & Line Heights | ✅ Complete |
| Phase 3 | Spacing & Rhythm | ✅ Complete |
| Phase 4 | Motion & Micro-interactions | ✅ Complete |
| Phase 5 | Final Typography Cohesion | ✅ Complete |
| Phase 6 | Color System Cleanup | ✅ Complete |
| Phase 7 | Component Harmonization | ✅ Complete |
| Phase 8 | System Enforcement | ✅ **Active** |

---

## 🎨 Design Tokens

### Colors

All colors must use semantic tokens. **No direct hex values allowed.**

```tsx
// ✅ CORRECT
<div className="bg-surface-card text-primary border-border">

// ❌ WRONG
<div className="bg-[#FAFAFB] text-[#1F2428] border-[#D4D7DB]">
```

#### Available Color Tokens

**Backgrounds:**
- `bg-background` → Canvas (#F4F5F7)
- `bg-surface-card` → Cards (#FAFAFB)
- `bg-surface-slate` → Chrome/Headers (#3A3F46)
- `bg-surface-alt` → Inputs/Pills (#EDEFF2)

**Text:**
- `text-primary` → Primary text (#1F2428)
- `text-secondary` → Secondary text (#5E666D)
- `text-tertiary` → Tertiary/meta text (#97A1AA)
- `text-white` → White text (Hub/Clubhouse only)

**Borders:**
- `border-border` → Standard border (#D4D7DB)
- `border-subtle` → Subtle border (#E5E7EA)

**Accent:**
- `bg-primary-accent` → Primary CTA (#F7931E - Orange)
- `text-primary-accent` → Accent text

**States:**
- `bg-destructive` → Error/delete actions
- `text-destructive` → Error text

---

### Typography

All text must use semantic typography roles. **No pixel sizes or Tailwind size utilities allowed.**

```tsx
// ✅ CORRECT
<h1 className="text-display-lg font-display font-bold">
<h2 className="text-heading-lg font-semibold">
<p className="text-body-md">

// ❌ WRONG
<h1 className="text-4xl font-bold">
<h2 className="text-[28px] font-semibold">
<p className="text-sm">
```

#### Typography Scale

| Role | Size | Line Height | Use Case |
|------|------|-------------|----------|
| `text-display-xl` | 34px | 1.15 | Hero titles |
| `text-display-lg` | 28px | 1.2 | Page titles |
| `text-heading-lg` | 22px | 1.3 | Section headers |
| `text-heading-md` | 18px | 1.3 | Card titles, subheaders |
| `text-body-lg` | 16px | 1.5 | Primary body text |
| `text-body-md` | 14px | 1.4 | Secondary body, buttons |
| `text-body-sm` | 13px | 1.35 | Supporting text, labels |
| `text-meta` | 12px | 1.25 | Timestamps, fine print |

#### Font Weights

- `font-display` → Display headings only (with `font-bold`)
- `font-bold` → Major emphasis
- `font-semibold` → Headings, buttons
- `font-medium` → Body emphasis, labels
- `font-normal` → Default body text

---

### Motion

All animations and transitions must use motion tokens. **No custom durations or easings allowed.**

```tsx
// ✅ CORRECT
<div className="transition-all duration-motion-fast ease-standard">

// ❌ WRONG
<div className="transition-all duration-300 ease-out">
<div className="transition-all duration-[250ms]">
```

#### Motion Tokens

**Durations:**
- `duration-motion-ultrafast` → 100ms (instant feedback)
- `duration-motion-fast` → 180ms (buttons, pills, cards)
- `duration-motion-medium` → 320ms (modals, sheets)
- `duration-motion-slow` → 500ms (page transitions)

**Easings:**
- `ease-standard` → `cubic-bezier(0.22, 0.61, 0.36, 1)` (default)
- `ease-out-soft` → Gentle deceleration
- `ease-in-hard` → Sharp acceleration

---

### Spacing

Use Tailwind's standard spacing scale. **No arbitrary pixel values allowed.**

```tsx
// ✅ CORRECT
<div className="mt-4 mb-3 px-4 py-2 gap-2 space-y-3">

// ❌ WRONG
<div className="mt-[14px] mb-[7px] px-[18px] py-[6px] gap-[10px]">
```

#### Standard Spacing Patterns

**Card/Module Headers:**
```tsx
<div className="space-y-1"> {/* Title + subtitle group */}
  <h3 className="text-heading-md font-semibold text-primary">Title</h3>
  <p className="text-body-sm text-secondary">Description</p>
</div>
<div className="mt-4"> {/* Content below header */}
```

**Form Fields:**
```tsx
<label className="text-body-sm font-medium text-secondary mb-1">Label</label>
<Input />
<p className="text-meta text-tertiary mt-1">Helper text</p>
```

---

## 🧱 Standard Components

All new UI must use these standardized components. **No ad-hoc div styling allowed.**

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Supporting description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Card Spec:**
- `bg-surface-card`
- `border border-border-subtle`
- `rounded-xl`
- `shadow-[var(--shadow-card)]`
- Hover: `hover:-translate-y-[1px] hover:shadow-[var(--shadow-medium)]`

---

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Primary CTA</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Tertiary</Button>
<Button variant="ghost">Minimal</Button>
<Button variant="destructive">Delete</Button>
```

**Button Variants:**
- `default` → Primary accent (orange)
- `secondary` → Slate background
- `outline` → Border with surface-alt fill
- `ghost` → Transparent, hover surface-alt
- `destructive` → Error/delete actions

---

### Input

```tsx
import { Input } from '@/components/ui/input';

<Input 
  type="text" 
  placeholder="Enter text..."
  className="w-full"
/>
```

**Input Spec:**
- `bg-surface-alt`
- `border border-border`
- `rounded-lg`
- `focus:border-primary-accent focus:ring-1 focus:ring-primary-accent`
- `text-body-md`
- `placeholder:text-tertiary`

---

### Pill (Filters/Tags)

```tsx
import { Pill } from '@/components/ui/pill';

<Pill active={isActive} onClick={() => setActive(!isActive)}>
  Filter Label
</Pill>
```

**Pill Variants:**
- `default` (inactive) → `bg-surface-alt border-border text-secondary`
- `active` → `bg-surface-slate text-white`

---

### Badge

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">New</Badge>
<Badge variant="secondary">Status</Badge>
<Badge variant="outline">Category</Badge>
```

---

## 🚫 Prohibited Patterns

### ❌ Direct Colors

```tsx
// NEVER DO THIS:
<div className="bg-[#FAFAFB] text-[#1F2428] border-[#D4D7DB]" />
<div style={{ backgroundColor: '#F4F5F7' }} />
```

### ❌ Direct Font Sizes

```tsx
// NEVER DO THIS:
<h1 className="text-4xl" />
<p className="text-[16px]" />
<span className="text-sm" />
```

### ❌ Arbitrary Spacing

```tsx
// NEVER DO THIS:
<div className="mt-[14px] px-[7px] gap-[11px]" />
```

### ❌ Custom Transitions

```tsx
// NEVER DO THIS:
<div className="transition-all duration-300 ease-out" />
<div className="transition-all duration-[250ms]" />
```

### ❌ Inline Styles

```tsx
// NEVER DO THIS (except for dynamic values):
<div style={{ color: '#1F2428', fontSize: '16px' }} />
```

---

## 🔒 Phase 8 Enforcement

### Automated Checks

**1. Pre-commit Linting:**
```bash
npm run lint:design-system
```

**2. Build-time Scanning:**
```bash
npm run check:design-system
```

**3. Strict Mode (CI/CD):**
```bash
STRICT_DESIGN_SYSTEM=true npm run check:design-system
```

### Manual Review Checklist

Every PR must pass this checklist:

- [ ] ✅ Uses semantic typography tokens (no `text-sm`, `text-[16px]`)
- [ ] ✅ Uses global color tokens (no direct hex values)
- [ ] ✅ Uses motion tokens (no arbitrary durations)
- [ ] ✅ Uses standardized components (Card, Button, Input, Pill)
- [ ] ✅ Uses global spacing rhythm (no arbitrary px values)
- [ ] ✅ No inline styles (except dynamic values)
- [ ] ✅ Hub/Clubhouse use dark theme tokens only

---

## 🎯 Component Patterns

### Page Layout

```tsx
<div className="min-h-screen bg-background">
  <Header />
  
  <main className="px-4 py-6 max-w-7xl mx-auto space-y-6">
    <div className="space-y-1">
      <h1 className="text-display-lg font-display font-bold text-primary">
        Page Title
      </h1>
      <p className="text-body-md text-secondary">
        Page description
      </p>
    </div>

    <Card>
      {/* Content */}
    </Card>
  </main>
</div>
```

### Form Pattern

```tsx
<form className="space-y-4">
  <div>
    <label className="text-body-sm font-medium text-secondary mb-1 block">
      Field Label
    </label>
    <Input type="text" placeholder="Enter value..." />
    <p className="text-meta text-tertiary mt-1">Helper text</p>
  </div>

  <div className="flex gap-2 justify-end">
    <Button variant="outline">Cancel</Button>
    <Button variant="default">Submit</Button>
  </div>
</form>
```

### Filter Bar Pattern

```tsx
<div className="flex items-center gap-2 overflow-x-auto pb-2">
  {filters.map(filter => (
    <Pill
      key={filter.id}
      active={activeFilter === filter.id}
      onClick={() => setActiveFilter(filter.id)}
    >
      {filter.label}
    </Pill>
  ))}
</div>
```

---

## 🎭 Hub & Clubhouse Special Rules

Hub and Clubhouse use dark theme tokens but must follow the same system:

✅ **Allowed:**
- Dark theme tokens (`--hub-*`, `--surface-*`)
- Same typography scale
- Same motion tokens
- Same spacing rhythm

❌ **Not Allowed:**
- Overriding global light-mode tokens
- Direct hex colors
- Custom font sizes
- Custom transitions

---

## 📞 Support & Questions

**When to propose a new token:**
- You need a color/size/duration not in the system
- An existing token doesn't fit your use case

**How to propose:**
1. Document why the existing tokens don't work
2. Propose the new token with rationale
3. Get design system approval before implementing

**Questions:**
- Check this document first
- Review existing components for patterns
- Ask in team chat before creating custom patterns

---

## ✅ Quick Reference

### Do's
✅ Use semantic tokens for everything
✅ Use standardized components (Card, Button, Input, Pill)
✅ Follow global spacing rhythm
✅ Use motion tokens for all animations
✅ Keep Hub/Clubhouse aligned with system

### Don'ts
❌ No direct hex colors
❌ No pixel font sizes
❌ No `text-sm`, `text-xs`, etc.
❌ No arbitrary spacing values
❌ No custom transitions
❌ No inline styles (except dynamic values)
❌ No ad-hoc div styling

---

**This system is self-enforcing. Violations will be flagged by linting and build checks.**

**Version:** Phase 8
**Maintained by:** Design System Team
**Last Review:** Phase 8 Implementation
