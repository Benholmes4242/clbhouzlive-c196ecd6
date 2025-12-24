import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useNearbyTestTools } from '@/features/nearby/hooks/useNearbyTestTools';
import { Button } from '@/components/ui/button';
import { SettingsSection } from './ui';

/**
 * DevNearbySettingsPage - Developer tools for Nearby feature testing
 * Only accessible to authorized testers
 */
export function DevNearbySettingsPage() {
  const navigate = useNavigate();
  const {
    isAllowedTester,
    spawnTestGolferNearMe,
    setTestGolferOpenToPlay,
    makeTestGolferStale,
    blockTestGolfer,
    unblockTestGolfer,
  } = useNearbyTestTools();

  React.useEffect(() => {
    if (!isAllowedTester) {
      navigate('/settings', { replace: true });
    }
  }, [isAllowedTester]);

  if (!isAllowedTester) return null;

  return (
    <PageRoot className="min-h-screen bg-[#0A0A0A]">
      <header 
        className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3 border-b border-white/5"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          paddingTop: 'max(env(safe-area-inset-top), 12px)',
        }}
      >
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Nearby Test Tools</h1>
      </header>

      <div className="max-w-md mx-auto px-4 md:px-6 py-6 pb-28 space-y-6">
        <SettingsSection title="Test Actions">
          <div className="p-4 space-y-3">
            <Button
              onClick={spawnTestGolferNearMe}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              📍 Spawn Test Golfer Near Me
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setTestGolferOpenToPlay(true)}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                🟢 Set Open to Play
              </Button>
              <Button
                onClick={() => setTestGolferOpenToPlay(false)}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                ⚪ Clear Open to Play
              </Button>
            </div>

            <Button
              onClick={makeTestGolferStale}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              ⏰ Make Stale (10+ mins ago)
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={blockTestGolfer}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                🚫 Block Test Golfer
              </Button>
              <Button
                onClick={unblockTestGolfer}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                ✅ Unblock Test Golfer
              </Button>
            </div>

            <p className="text-xs text-white/40 mt-4">
              Test User ID: <code className="bg-white/10 px-1 py-0.5 rounded text-white/60">00000000-0000-0000-0000-000000000001</code>
            </p>
          </div>
        </SettingsSection>
      </div>
    </PageRoot>
  );
}

export default DevNearbySettingsPage;
