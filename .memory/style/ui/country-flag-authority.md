---
name: Country Flag Authority
description: One flag system app-wide (SVG CountryFlag), three-letter code support, chip fallback, Northern Ireland renders the Irish tricolour
type: feature
---

## One system
`src/components/ui/country-flag.tsx` (`CountryFlag`) + `src/utils/countryFlags.ts` (`getFlagCode`) is the ONLY flag system. SVGs from `flagicons.lipis.dev/flags/4x3/{code}.svg`.

`src/features/tourhub/leaderboard/countryFlag.ts` (emoji path, `countryFlag()`/`countryFallback()`) is orphaned — no importers. Do not reintroduce emoji flags anywhere; they cannot render Northern Ireland and vary by platform font.

## Resolution rules
- `getFlagCode` accepts full names (any case) AND three-letter IOC/FIFA/ISO-3 codes.
- Home nations: ENG/ENGLAND -> GB-ENG, SCO -> GB-SCT, WAL -> GB-WLS.
- CountryFlag must NEVER render nothing when a country string is present. Unresolvable values, and image load failures, render a chip at exact flag dimensions (muted surface, hairline border, rounded-sm, centred three-letter code).

## Northern Ireland — editorial decision (Ben, Aug 2026)
NIR / NORTHERN IRELAND maps to **IE (Irish tricolour)**. The Ulster Banner (`gb-nir.svg`) is never rendered — no official status since 1973 and identified with one community. Do not change without Ben.
