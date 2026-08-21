---
name: Country Flag Authority
description: One flag system app-wide (SVG CountryFlag), three-letter code support, chip fallback, Northern Ireland renders GB-NIR
type: feature
---

## One system
`src/components/ui/country-flag.tsx` (`CountryFlag`) + `src/utils/countryFlags.ts` (`getFlagCode`) is the ONLY flag system. SVGs from `flagicons.lipis.dev/flags/4x3/{code}.svg`.

`src/features/tourhub/leaderboard/countryFlag.ts` (emoji path, `countryFlag()`/`countryFallback()`) is orphaned — no importers. Do not reintroduce emoji flags anywhere; they cannot render Northern Ireland and vary by platform font.

## Resolution rules
- `getFlagCode` accepts full names (any case) AND three-letter IOC/FIFA/ISO-3 codes.
- Home nations: ENG/ENGLAND -> GB-ENG, SCO -> GB-SCT, WAL -> GB-WLS, NIR/NORTHERN IRELAND -> GB-NIR. All four are ordinary map entries.
- CountryFlag must NEVER render nothing when a country string is present. Unresolvable values, and image load failures, render a chip at exact flag dimensions (muted surface, hairline border, rounded-sm, centred three-letter code).

## Northern Ireland — decision (Ben, Aug 2026, supersedes earlier tricolour call)
NIR / NORTHERN IRELAND maps to **GB-NIR** (`gb-nir.svg`, HTTP 200). `sr_players.country` carries "Northern Ireland" as a nationality distinct from Ireland and the UK, as every golf body records it; a Union Flag or tricolour would contradict the field it is drawn from. No special case, no branch in the view layer — handled exactly like ENG/SCO/WLS.

Never infer a flag from tour, Ryder Cup team, Olympic representation, or birthplace. `country` is the only input; ambiguous/absent values are a DATA question, reported, never resolved in the view.

## Chip fallback is a safety net
Not a design element. Every firing is a missing map entry worth reporting. As of Aug 2026 it fires on 0 of 2,271 non-null `sr_players.country` rows.
