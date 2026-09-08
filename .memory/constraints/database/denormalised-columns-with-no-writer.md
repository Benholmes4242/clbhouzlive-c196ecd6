---
name: Denormalised columns with no writer
description: A denormalised copy with no writer can hold a DIFFERENT QUANTITY from the one it is displayed as — two live instances in two days
type: constraint
---

Never read a denormalised copy of data that has an authoritative table behind it, unless a writer keeps the copy in step and you can name that writer.

**Why (the lesson is not about ranks):** such a column does not merely go stale — it can hold a different QUANTITY from the one it is rendered as, so the display is wrong in kind, not only out of date. Two instances in two days:

1. `tour_season_rankings` holding one line of scraped footnote text (Race to Dubai).
2. `golf_courses.global_rank / regional_rank / usa_rank`. Nothing wrote them. On a US course `regional_rank` held that course's **USA** rank while the hero rendered it as a **regional** badge — and the figure itself was wrong: Cypress Point column 1 vs list #2, Pine Valley column 2 vs list #1. Every US course page had been showing a rank that disagreed with the list it claimed to come from, and the top two in the country were swapped.

**Rules:**
- One reader, one source. The course Top 100 badge reads `course_top100_memberships` joined to active `top100_lists` (`useCourseTop100Standing`), never the course columns.
- Stop reading the columns first; drop them only once nothing references them.
- Before deleting a duplicate rendering of a figure, check whether it was the only place drift would have been noticed.
- Public-facing badges read anonymous-safe tables so a signed-out visitor on a shared link sees them (`get_top100_course_insights` requires a session and cannot serve this).

**Thin samples:** a label derived from a thin sample is withheld, not shown. Under 5 ratings the course score renders without its tier word — a tier is a verdict two ratings cannot support. Apply that reasoning wherever a label is derived from a sample.
