import React from 'react';
import { useNearbyTestTools } from '../hooks/useNearbyTestTools';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NearbyTestToolsPanel() {
  const {
    isAllowedTester,
    spawnTestGolferNearMe,
    setTestGolferOpenToPlay,
    makeTestGolferStale,
    blockTestGolfer,
    unblockTestGolfer,
  } = useNearbyTestTools();

  if (!isAllowedTester) return null;

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader>
        <CardTitle className="text-warning flex items-center gap-2">
          <span>🧪</span>
          Nearby Test Tools
        </CardTitle>
        <CardDescription>
          Internal testing controls for Nearby Golfers feature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={spawnTestGolferNearMe}
            variant="outline"
            className="w-full"
          >
            📍 Spawn Test Golfer Near Me
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setTestGolferOpenToPlay(true)}
              variant="outline"
              size="sm"
            >
              🟢 Set Open to Play
            </Button>
            <Button
              onClick={() => setTestGolferOpenToPlay(false)}
              variant="outline"
              size="sm"
            >
              ⚪ Clear Open to Play
            </Button>
          </div>

          <Button
            onClick={makeTestGolferStale}
            variant="outline"
            className="w-full"
          >
            ⏰ Make Stale (10+ mins ago)
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={blockTestGolfer}
              variant="outline"
              size="sm"
            >
              🚫 Block Test Golfer
            </Button>
            <Button
              onClick={unblockTestGolfer}
              variant="outline"
              size="sm"
            >
              ✅ Unblock Test Golfer
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Test User ID: <code className="bg-muted px-1 py-0.5 rounded">00000000-0000-0000-0000-000000000001</code>
        </p>
      </CardContent>
    </Card>
  );
}
