
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Edit3 } from "lucide-react";

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
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [manualHandicap, setManualHandicap] = useState(handicapIndex?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleConnectEGApp = () => {
    // Placeholder for EG app connection logic
    console.log('Connect to EG App - to be implemented');
  };

  const handleSaveManualHandicap = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const handicapValue = manualHandicap ? parseFloat(manualHandicap) : null;
      
      await supabase
        .from('user_profiles')
        .update({ 
          eg_handicap_index: handicapValue,
          eg_app_connected: false // Mark as manual entry
        })
        .eq('id', userId);
      
      setIsEditing(false);
      // Trigger parent component refresh if available
      window.location.reload();
    } catch (error) {
      console.error('Error updating handicap:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 px-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Handicap Index</h2>
        {isOwnProfile && onVisibilityToggle && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="eg-visibility"
              checked={egVisible}
              onCheckedChange={onVisibilityToggle}
            />
            <Label
              htmlFor="eg-visibility"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Show this section on my public profile
            </Label>
          </div>
        )}
      </div>

      {isOwnProfile ? (
        <div className="space-y-4">
          {!egAppConnected && !isEditing && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleConnectEGApp}
                  className="flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Connect EG App
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Manual Entry
                </Button>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg px-4 py-3">
                <Label htmlFor="manual-handicap" className="text-body-sm font-medium">
                  Handicap Index
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="manual-handicap"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 12.5"
                    value={manualHandicap}
                    onChange={(e) => setManualHandicap(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSaveManualHandicap}
                    disabled={saving}
                    size="sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {(egAppConnected || (!isEditing && handicapIndex !== null)) && (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">{handicapIndex}</div>
                    {egAppConnected && (
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <Link2 className="w-3 h-3" />
                        Connected to EG App
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {egAppConnected && (
                <div className="text-muted-foreground text-sm">
                  Recent Rounds: {(recentRounds && Array.isArray(recentRounds)) ?
                    recentRounds.slice(0, 3).map((r, i) =>
                      <div key={i}>{JSON.stringify(r)}</div>
                    ) : "N/A"}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Public view for other users
        <div>
          {handicapIndex !== null ? (
            <div className="bg-muted rounded-lg px-4 py-3">
              <div className="text-lg font-bold">{handicapIndex}</div>
              {egAppConnected && (
                <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Link2 className="w-3 h-3" />
                  Connected to EG App
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground">
              <span>No handicap information available.</span>
            </div>
          )}
          
          {egAppConnected && recentRounds && (
            <div className="mt-2 text-muted-foreground text-sm">
              Recent Rounds: {Array.isArray(recentRounds) ?
                recentRounds.slice(0, 3).map((r, i) =>
                  <div key={i}>{JSON.stringify(r)}</div>
                ) : "N/A"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EGAppIntegration;
