# Phase 8 — Design System Enforcement Guide

**Status:** ✅ Active
**Last Updated:** Phase 8 Implementation

---

## Overview

Phase 8 implements **self-enforcing guardrails** to ensure the design system (Phases 0-7) cannot regress. This prevents visual drift and maintains consistency as the codebase scales.

---

## 🛠️ Available Tools

### 1. Design System Check Script

**Purpose:** Scans the codebase for design system violations.

**Run manually:**
```bash
node scripts/design-system-check.ts
```

**Or with tsx:**
```bash
npx tsx scripts/design-system-check.ts
```

**What it detects:**
- Direct hex colors (`bg-[#FAFAFB]`, `text-[#1F2428]`)
- Direct RGBA colors (`bg-[rgba(255,255,255,0.5)]`)
- Pixel font sizes (`text-[16px]`)
- Tailwind size utilities (`text-sm`, `text-lg`, etc.)
- Arbitrary spacing (`mt-[14px]`, `px-[7px]`)
- Arbitrary durations (`duration-[300ms]`)
- Inline styles (`style="..."`)

**Output:**
- Grouped list of violations by type
- File locations and line numbers
- Suggestions for fixes

**Strict Mode:**
To make violations block the build (useful for CI/CD):
```bash
STRICT_DESIGN_SYSTEM=true node scripts/design-system-check.ts
```

---

### 2. ESLint Design System Rules

**Purpose:** Lint-time detection of design system violations.

**Configuration:** `.eslintrc.design-system.json`

**To enable (requires manual package.json edit):**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "lint:design-system": "eslint . --config .eslintrc.design-system.json"
  }
}
```

Then run:
```bash
npm run lint:design-system
```

**What it catches:**
- Direct color values in className
- Direct font sizes in className
- Arbitrary transition durations
- Inline style attributes (warns)

---

### 3. Central Component Exports

**Purpose:** Makes standard components easily discoverable and encourages their use.

**File:** `src/components/index.ts`

**Usage:**
```tsx
// ✅ Good - Import from central location
import { Card, Button, Input, Pill } from '@/components';

// ❌ Less discoverable
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
```

**Available exports:**
- Core UI: Card, Button, Input, Badge, Pill
- Forms: Label, Textarea, Select, Checkbox, RadioGroup, Switch
- Feedback: Toast, Skeleton
- Overlays: Dialog, Sheet, Popover, Tooltip
- Navigation: Tabs
- Display: Avatar, Separator, ScrollArea
- Layout: Accordion

---

## 📋 PR Review Checklist

Every pull request must pass this checklist before merging:

```markdown
### Design System Compliance (Phase 8)

- [ ] ✅ Uses semantic typography tokens (no `text-sm`, `text-[16px]`)
- [ ] ✅ Uses global color tokens (no direct hex values)
- [ ] ✅ Uses motion tokens (no arbitrary durations)
- [ ] ✅ Uses standardized components (Card, Button, Input, Pill)
- [ ] ✅ Uses global spacing rhythm (no arbitrary px values)
- [ ] ✅ No inline styles (except dynamic values)
- [ ] ✅ Hub/Clubhouse use dark theme tokens only
- [ ] ✅ Ran `node scripts/design-system-check.ts` with 0 violations
```

---

## 🚀 Quick Fix Guide

### Fix: Direct Hex Colors

**❌ Before:**
```tsx
<div className="bg-[#FAFAFB] text-[#1F2428] border-[#D4D7DB]">
```

**✅ After:**
```tsx
<div className="bg-surface-card text-primary border-border">
```

**Token Reference:**
- Backgrounds: `bg-background`, `bg-surface-card`, `bg-surface-slate`, `bg-surface-alt`
- Text: `text-primary`, `text-secondary`, `text-tertiary`
- Borders: `border-border`, `border-subtle`
- Accent: `bg-primary-accent`, `text-primary-accent`

---

### Fix: Direct Font Sizes

**❌ Before:**
```tsx
<h1 className="text-4xl">Title</h1>
<p className="text-[16px]">Body</p>
<span className="text-sm">Meta</span>
```

**✅ After:**
```tsx
<h1 className="text-display-lg font-display font-bold">Title</h1>
<p className="text-body-lg">Body</p>
<span className="text-body-sm">Meta</span>
```

**Typography Scale:**
- `text-display-xl` (34px) - Hero titles
- `text-display-lg` (28px) - Page titles
- `text-heading-lg` (22px) - Section headers
- `text-heading-md` (18px) - Card titles
- `text-body-lg` (16px) - Primary body
- `text-body-md` (14px) - Secondary body, buttons
- `text-body-sm` (13px) - Supporting text
- `text-meta` (12px) - Timestamps, fine print

---

### Fix: Arbitrary Spacing

**❌ Before:**
```tsx
<div className="mt-[14px] px-[7px] gap-[11px]">
```

**✅ After:**
```tsx
<div className="mt-4 px-2 gap-3">
```

**Use Tailwind's standard scale:**
- `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `6` = 24px, `8` = 32px

---

### Fix: Custom Transitions

**❌ Before:**
```tsx
<div className="transition-all duration-300 ease-out">
<div className="transition-all duration-[250ms]">
```

**✅ After:**
```tsx
<div className="transition-all duration-motion-fast ease-standard">
```

**Motion Tokens:**
- `duration-motion-ultrafast` (100ms) - Instant feedback
- `duration-motion-fast` (180ms) - Buttons, cards
- `duration-motion-medium` (320ms) - Modals, sheets
- `duration-motion-slow` (500ms) - Page transitions
- `ease-standard`, `ease-out-soft`, `ease-in-hard`

---

### Fix: Ad-hoc Div Styling

**❌ Before:**
```tsx
<div className="rounded-xl bg-white p-4 border border-gray-200 shadow-md">
  <h3 className="text-lg font-bold">Title</h3>
  <p className="text-sm text-gray-600">Description</p>
</div>
```

**✅ After:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
</Card>
```

---

### Fix: Filter/Tag Pills

**❌ Before:**
```tsx
<button 
  className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
  onClick={() => setActive(true)}
>
  Filter
</button>
```

**✅ After:**
```tsx
import { Pill } from '@/components';

<Pill active={isActive} onClick={() => setActive(!isActive)}>
  Filter
</Pill>
```

---

## 🎯 Integration with CI/CD

### Recommended Setup

**1. Add to `.github/workflows/ci.yml`:**
```yaml
- name: Check Design System Compliance
  run: STRICT_DESIGN_SYSTEM=true node scripts/design-system-check.ts
```

**2. Add pre-commit hook (optional):**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "node scripts/design-system-check.ts"
    }
  }
}
```

---

## 📚 Additional Resources

- **Full Documentation:** See `DESIGN_SYSTEM.md`
- **Component Reference:** See `src/components/index.ts`
- **Token Reference:** See `src/index.css` and `tailwind.config.ts`
- **Phase 0-7 Summary:** See `DESIGN_SYSTEM.md`

---

## ❓ FAQ

### Q: Can I ever use inline styles?

**A:** Only for truly dynamic values that come from props/state:
```tsx
// ✅ OK - Dynamic value
<div style={{ width: `${percentage}%` }}>

// ❌ Not OK - Should use token
<div style={{ color: '#1F2428' }}>
```

### Q: What if I need a color/size not in the system?

**A:** Propose adding it to the global tokens first:
1. Document why existing tokens don't work
2. Get design system approval
3. Add to `src/index.css` and `tailwind.config.ts`
4. Use the new token

### Q: Do Hub and Clubhouse follow these rules?

**A:** Yes, but with dark theme tokens:
- Use `--hub-*` tokens for Hub-specific styling
- Follow same typography, motion, and spacing rules
- Never override global light-mode tokens

### Q: How do I know which component to use?

**A:** Check `src/components/index.ts` for all available components, or see `DESIGN_SYSTEM.md` for patterns.

---

## ✅ Success Criteria

Phase 8 is successful when:

1. ✅ New PRs have 0 design system violations
2. ✅ Build passes design system checks in CI
3. ✅ All devs use standardized components
4. ✅ No ad-hoc styling in new code
5. ✅ Visual cohesion maintained over time
6. ✅ System becomes "self-governing"

---

**Phase 8 Status:** ✅ Active & Enforced
**Maintained by:** Design System Team
**Questions?** See `DESIGN_SYSTEM.md` or ask in team chat.
