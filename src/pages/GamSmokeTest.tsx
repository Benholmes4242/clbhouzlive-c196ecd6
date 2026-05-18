import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PageRoot from '@/components/layout/PageRoot';

/**
 * Temporary smoke-test route — remove before merging file 00.
 * Mounted inside PageRoot dark so .hcp-dark tokens resolve.
 */
export default function GamSmokeTest() {
  const { user } = useSupabaseSession();
  const { data, isLoading, error } = useUserAchievements(user?.id);
  return (
    <PageRoot dark hasBottomNav={false}>
      <div style={{ padding: 20, color: 'var(--hcp-t-100)', fontFamily: 'Geist, sans-serif' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Gam smoke test</h1>
        <p>User: {user?.id ?? '(not signed in)'}</p>
        <p>Loading: {String(isLoading)}</p>
        <p>Error: {error?.message ?? 'none'}</p>
        <p>Count: {data?.length ?? 0} (expected: 31)</p>
        <pre
          style={{
            background: '#111',
            color: '#eee',
            padding: 12,
            fontSize: 11,
            maxHeight: 400,
            overflow: 'auto',
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          {JSON.stringify(data?.slice(0, 3), null, 2)}
        </pre>
      </div>
    </PageRoot>
  );
}
