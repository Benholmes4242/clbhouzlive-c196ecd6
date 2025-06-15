
import React from "react";

interface EGAppIntegrationProps {
  egAppConnected: boolean | null;
  handicapIndex: number | null;
  recentRounds: any;
}

const EGAppIntegration: React.FC<EGAppIntegrationProps> = ({
  egAppConnected,
  handicapIndex,
  recentRounds
}) => (
  <div className="mt-8 px-2">
    <h2 className="text-lg font-semibold mb-2">EG (England Golf) App</h2>
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
