/**
 * HomeOnCourseStrip — Phase 2 IA reframe.
 * Wraps the existing OnCourseNowStrip with a Home-module amber eyebrow.
 * Renders null when logged out or no active friends.
 */
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNetworkActivity } from '@/hooks/useNetworkActivity';
import { OnCourseNowStrip } from '@/components/loop-tab/OnCourseNowStrip';

const AMBER = '#F7931E';
const INK_FAINT = 'rgba(15,23,42,0.55)';

export function HomeOnCourseStrip() {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  // Auth gate — strip is a personalised signal, not a logged-out surface.
  if (!userId) return null;

  // Mirror the OnCourseNowStrip empty-state guard to avoid rendering a lone eyebrow.
  const { data, isLoading } = useNetworkActivity(userId);
  const activeCount = (data?.friends ?? []).filter(f => f.last_activity !== null).length;
  if (!isLoading && activeCount === 0) return null;

  return (
    <section style={{ padding: '0 0' }}>
      {/* Eyebrow row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: INK_FAINT,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            On Course Now · Friends
          </span>
        </div>
        {activeCount > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: AMBER,
              background: 'rgba(247,147,30,0.10)',
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            {activeCount} live
          </span>
        )}
      </div>
      <OnCourseNowStrip userId={userId} hideHeader />
    </section>
  );
}

export default HomeOnCourseStrip;
