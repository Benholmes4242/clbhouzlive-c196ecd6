import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useNearbyTestTools } from '@/features/nearby/hooks/useNearbyTestTools';
import { Button } from '@/components/ui/button';
import { SettingsSection } from './ui';

/**
 * DevNearbySettingsPage - Developer tools for Nearby feature testing (Light theme)
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
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
      <header 
        className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(248,250,252,0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(31,36,40,0.06)',
          boxShadow: '0 6px 18px rgba(31,36,40,0.06)',
          paddingTop: 'max(env(safe-area-inset-top), 12px)',
        }}
      >
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[rgba(31,36,40,0.06)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1F2428]" />
        </button>
        <h1 className="text-lg font-semibold text-[#1F2428]">Nearby Test Tools</h1>
      </header>

      <div className="max-w-md mx-auto px-4 md:px-6 py-6 pb-28 space-y-6">
        <SettingsSection title="Test Actions">
          <div className="p-4 space-y-3">
            <Button
              onClick={spawnTestGolferNearMe}
              variant="outline"
              className="w-full bg-white border-[rgba(31,36,40,0.1)] text-[#1F2428] hover:bg-[rgba(31,36,40,0.03)]"
            >
              📍 Spawn Test Golfer Near Me
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setTestGolferOpenToPlay(true)}
                variant="outline"
                size="sm"
                className="bg-white border-[rgba(31,36,40,0.1)] text-[#1F2428] hover:bg-[rgba(31,36,40,0.03)]"
              >
                🟢 Set Open to Play
              </Button>
              <Button
                onClick={() => setTestGolferOpenToPlay(false)}
                variant="outline"
                size="sm"
                className="bg-white border-[rgba(31,36,40,0.1)] text-[#1F2428] hover:bg-[rgba(31,36,40,0.03)]"
              >
                ⚪ Clear Open to Play
              </Button>
            </div>

            <Button
              onClick={makeTestGolferStale}
              variant="outline"
              className="w-full bg-white border-[rgba(31,36,40,0.1)] text-[#1F2428] hover:bg-[rgba(31,36,40,0.03)]"
            >
              ⏰ Make Stale (10+ mins ago)
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={blockTestGolfer}
                variant="outline"
                size="sm"
                className="bg-white border-[rgba(31,36,40,0.1)] text-[#1F2428] hover:bg-[rgba(31,36,40,0.03)]"
              >
                🚫 Block Test Golfer
              </Button>
              <Button
                onClick={unblockTestGolfer}
                variant="outline"
                size="sm"
                className="bg-white border-[rgba(31,36,40,0.1)] text-[#1F2428] hover:bg-[rgba(31,36,40,0.03)]"
              >
                ✅ Unblock Test Golfer
              </Button>
            </div>

            <p className="text-xs text-[#97A1AA] mt-4">
              Test User ID: <code className="bg-[#EDEFF2] px-1 py-0.5 rounded text-[#5E666D]">00000000-0000-0000-0000-000000000001</code>
            </p>
          </div>
        </SettingsSection>
      </div>
    </PageRoot>
  );
}

export default DevNearbySettingsPage;
