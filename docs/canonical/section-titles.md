# Section Headers — Canonical Component

## `SectionHeader` (`@/components/ui/SectionHeader`)

- **paddingX defaults to `0`** — every callsite must pass it explicitly.
- **Dark / Handicap callsites** must always pass `paddingX` (commonly `16` or `20`) so the eyebrow aligns with the content beneath it.
- Use `surface="dark"` for charcoal backgrounds; eyebrow/title colours map automatically to `--hcp-*` tokens.
- Use `meta` for right-aligned non-interactive text (e.g. dates, counts). Do not overload `action` for static text.
