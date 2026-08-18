/**
 * BusinessEmptyState — BRIEF_BUSINESS_EMPTY_STATE_V3.
 *
 * This SUPERSEDES V1/V2. The photographic hero, the dark stat block, the four
 * example miniatures and the sticky CTA are all gone. Recorded so it is not
 * revisited:
 *
 *   1. This is a SETTINGS page. It lives inside ManagePageShell next to every
 *      other /manage/* surface, so it reads as one of them.
 *   2. A LIST carries all ten BUSINESS_CATEGORIES. Four photographed examples
 *      left six categories out, which told a university or a retailer the
 *      platform was not for them.
 *   3. The examples needed assets that represent no real business, so every one
 *      had to carry an EXAMPLE tag and no figures — the sign the approach was
 *      wrong.
 *
 * WHAT SURVIVES: the live figures from get_platform_reach() with their 30-day
 * deltas, and "counted live as they happen" (business insights read a live view
 * over business_profile_events — NOT a daily rollup).
 *
 * HONESTY RULES THAT STILL BIND:
 *   - Nothing claims a number it cannot show.
 *   - NOTHING implies verified businesses rank higher in discovery. Nothing
 *     boosts is_verified in search or the directory, and that claim was removed
 *     in Verification Phase 1. It does not come back.
 *
 * The badge is the real one — VerifiedBadge, lucide BadgeCheck in amber. It is
 * the ONE place amber appears on this page.
 */
import { useTranslation } from 'react-i18next';
import { usePlatformReach } from '@/hooks/usePlatformReach';
import { BUSINESS_CATEGORIES } from '@/types/profile';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SF_STACK,
  INK,
  INK_45,
  INK_60,
  HAIR,
  GREEN,
  ManageCard,
} from '@/components/manage/ui';
import {
  Intro,
  Group,
  Row,
  RowList,
  GroupHeader,
  Footnote,
  FilledButton,
} from '@/components/business/verification/manageRows';

interface BusinessEmptyStateProps {
  onCreate: () => void;
}

/** Grouped figures, tolerant of a malformed language tag. */
function fmt(n: number, locale: string): string {
  try {
    return n.toLocaleString(locale);
  } catch {
    return n.toLocaleString('en');
  }
}

/**
 * A total, with its 30-day movement beside it in GREEN. A zero or missing delta
 * renders NOTHING: a flat month reads as "no news", never as "stalled".
 */
function Figure({
  total,
  delta,
  locale,
}: {
  total: number;
  delta: number;
  locale: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 8,
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      <span style={{ fontSize: 15.5, fontWeight: 400, color: INK }}>{fmt(total, locale)}</span>
      {delta > 0 && (
        <span style={{ fontSize: 13.5, fontWeight: 400, color: GREEN }}>
          +{fmt(delta, locale)}
        </span>
      )}
    </span>
  );
}

export function BusinessEmptyState({ onCreate }: BusinessEmptyStateProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const { data: reach, isLoading } = usePlatformReach();

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* §1.3 NO LARGE HEADING — the title is ManagePageShell's, at 18/600. */}
      <Intro>
        A business profile puts you where golfers already are — searchable, followable, and
        reviewable by members who track their rounds here.
      </Intro>

      {/* ─────────────── ON CLBHOUZ TODAY — live, never typed ─────────────── */}
      <Group header="On clbhouz today" footnote="Green figures are the last 30 days.">
        {isLoading || !reach ? (
          <div className="px-[14px] py-4 space-y-3">
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        ) : (
          <RowList>
            {/* The course count LEADS — it is the impressive one. */}
            <Row
              label="Courses"
              value={<Figure total={reach.coursesTotal} delta={reach.coursesDelta} locale={locale} />}
            />
            <Row
              label="Rounds tracked"
              value={<Figure total={reach.roundsTotal} delta={reach.roundsDelta} locale={locale} />}
            />
            <Row
              label="Course reviews"
              value={<Figure total={reach.reviewsTotal} delta={reach.reviewsDelta} locale={locale} />}
            />
          </RowList>
        )}
      </Group>

      {/* ─────────────────────────── WHAT YOU GET ─────────────────────────── */}
      <Group header="What you get">
        <RowList>
          <Row
            label="A profile golfers can find"
            sub="You appear in search and the directory, alongside the courses golfers already browse."
          />
          <Row
            label="Reviews from real golfers"
            sub="Reviews come from members with tracked rounds — not anonymous accounts."
          />
          {/* §4.2 — the insights read a LIVE view over business_profile_events. */}
          <Row
            label="Your reach, counted"
            sub="Views, follows and engagement, counted live as they happen."
          />
        </RowList>
      </Group>

      {/* ─── WHO IT'S FOR — all ten categories, verbatim. This replaces the
              photographs, and it is the group that keeps every kind of golf
              business in the room. ─── */}
      <section style={{ marginBottom: 20 }}>
        <GroupHeader>Who it's for</GroupHeader>
        <ManageCard padding={14}>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_CATEGORIES.map((category) => (
              <span
                key={category}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 32,
                  padding: '6px 11px',
                  borderRadius: 999,
                  border: `1px solid ${HAIR}`,
                  fontFamily: SF_STACK,
                  fontSize: 13.5,
                  fontWeight: 400,
                  color: INK_60,
                  letterSpacing: '-0.005em',
                }}
              >
                {category}
              </span>
            ))}
          </div>
        </ManageCard>
        <Footnote>Any golf business. You pick your category when you create the profile.</Footnote>
      </section>

      {/* ──────────────────────────── VERIFICATION ──────────────────────────── */}
      <section style={{ marginBottom: 20 }}>
        <GroupHeader>Verification</GroupHeader>
        <ManageCard padding={0}>
          {/* NO DISCOVERY CLAIM. Nothing boosts is_verified in search or the
              directory, so the row says what verification IS and nothing more. */}
          <Row
            label="Verified businesses carry a badge"
            sub="Free, reviewed by a person, and available once your profile exists."
          />
        </ManageCard>
        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: SF_STACK,
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.45,
            color: INK_45,
            margin: '8px 4px 0',
          }}
        >
          <VerifiedBadge size="sm" />
          <span>This is the badge.</span>
        </p>
      </section>

      {/* ─────────────────────────── BEFORE YOU START ─────────────────────────── */}
      <Group header="Before you start">
        <RowList>
          <Row label="Cost" value="Free" />
          <Row label="Time" value="About a minute" />
          <Row label="You'll need" value="A name and a category" />
        </RowList>
      </Group>

      {/* §2.3 ONE filled button, at the foot, NOT sticky. */}
      <div style={{ marginTop: 8, paddingBottom: 8 }}>
        <FilledButton onClick={onCreate}>Create Business Profile</FilledButton>
      </div>
    </div>
  );
}

export default BusinessEmptyState;
