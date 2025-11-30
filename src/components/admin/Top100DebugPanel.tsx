import React from 'react';
import { useTop100Debug } from '@/context/Top100DebugContext';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

const Top100DebugPanel: React.FC = () => {
  const { state, setState } = useTop100Debug();

  const update = (patch: Partial<typeof state>) =>
    setState({ ...state, ...patch });

  return (
    <Card className="p-4 space-y-4 border-border/60">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Top 100 Debug (local only)</h3>
          <p className="text-xs text-muted-foreground">
            Overrides Top 100 UI for this device only. Does not touch real data.
          </p>
        </div>
        <Switch
          checked={state.enabled}
          onCheckedChange={(value) => update({ enabled: value })}
        />
      </div>

      {state.enabled && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">My journey preset</label>
            <Select
              value={state.myPreset}
              onValueChange={(value) =>
                update({ myPreset: value as any })
              }
            >
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real">Real data</SelectItem>
                <SelectItem value="none">0 courses</SelectItem>
                <SelectItem value="5">5 courses</SelectItem>
                <SelectItem value="20">20 courses</SelectItem>
                <SelectItem value="50">50 courses</SelectItem>
                <SelectItem value="100">100 courses</SelectItem>
                <SelectItem value="200">200 courses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Friends preset</label>
            <Select
              value={state.friendsPreset}
              onValueChange={(value) =>
                update({ friendsPreset: value as any })
              }
            >
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real">Real data</SelectItem>
                <SelectItem value="none">No friends</SelectItem>
                <SelectItem value="low">Friends around 10–20</SelectItem>
                <SelectItem value="mid">Friends around 40–60</SelectItem>
                <SelectItem value="high">Friends 100–400</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Top100DebugPanel;
