
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EGAppIntegrationProps {
  egAppConnected: boolean | null;
  handicapIndex: number | null;
  recentRounds: any;
  userId?: string;
  isOwnProfile?: boolean;
  egVisible?: boolean;
  onVisibilityToggle?: (checked: boolean) => void;
}

const EGAppIntegration: React.FC<EGAppIntegrationProps> = ({
  egAppConnected,
  handicapIndex,
  recentRounds,
  userId,
  isOwnProfile,
  egVisible = true,
  onVisibilityToggle
}) => (
  <div className="mt-8 px-2">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-semibold">EG (England Golf) App</h2>
      {isOwnProfile && onVisibilityToggle && (
        <div className="flex items-center space-x-2">
          <Label htmlFor="eg-visibility" className="text-sm">
            Show on public profile
          </Label>
          <Switch
            id="eg-visibility"
            checked={egVisible}
            onCheckedChange={onVisibilityToggle}
          />
        </div>
      )}
    </div>
    <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground">
      <span>Connect your England Golf app to display your Handicap Index and recent rounds here.</span>
    </div>
    {egAppConnected && (
      <div>
        <div className="mt-2">Handicap Index: <span className="font-bold">{handicapIndex}</span></div>
        <div className="mt-1 text-muted-foreground">
          Recent Rounds: {(recentRounds && Array.isArray(recentRounds)) ?
            recentRounds.slice(0, 3).map((r, i) =>
              <div key={i}>{JSON.stringify(r)}</div>
            ) : "N/A"}
        </div>
      </div>
    )}
  </div>
);

export default EGAppIntegration;
