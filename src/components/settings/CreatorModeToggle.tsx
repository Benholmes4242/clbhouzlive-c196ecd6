import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, TrendingUp, Pin, Sparkles, ExternalLink, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreatorModeToggleProps {
  userId: string;
  isCreator: boolean;
  creatorOnly?: boolean;
}

/**
 * Phase 3.1: Creator Mode Toggle
 * 
 * Enables Creator Mode for golfers, unlocking:
 * - Featured video slot
 * - Pin content
 * - Creator analytics (views, reach, saves)
 * - Publishing gravity boost in Discover
 * 
 * Also includes creator-only mode toggle for hiding personal profile.
 */
export function CreatorModeToggle({ userId, isCreator, creatorOnly = false }: CreatorModeToggleProps) {
  const [enabled, setEnabled] = React.useState(isCreator);
  const [isCreatorOnly, setIsCreatorOnly] = React.useState(creatorOnly);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showCreatorOnlyConfirm, setShowCreatorOnlyConfirm] = React.useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    setEnabled(checked);

    try {
      const updates: Record<string, any> = { is_creator: checked };
      
      // If turning off creator mode, also turn off creator-only
      if (!checked && isCreatorOnly) {
        updates.creator_only = false;
        setIsCreatorOnly(false);
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });

      toast.success(checked ? 'Creator Mode enabled' : 'Creator Mode disabled');
    } catch (err) {
      console.error('[CreatorModeToggle] error:', err);
      setEnabled(!checked); // Revert on error
      toast.error('Failed to update Creator Mode');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreatorOnlyToggle = (checked: boolean) => {
    if (checked) {
      // Show confirmation modal before enabling
      setShowCreatorOnlyConfirm(true);
    } else {
      // Disable directly without confirmation
      updateCreatorOnly(false);
    }
  };

  const updateCreatorOnly = async (checked: boolean) => {
    setIsUpdating(true);
    setIsCreatorOnly(checked);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ creator_only: checked })
        .eq('id', userId);

      if (error) throw error;

      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });

      toast.success(checked ? 'Creator-only mode enabled' : 'Personal profile restored');
    } catch (err) {
      console.error('[CreatorModeToggle] creator_only error:', err);
      setIsCreatorOnly(!checked); // Revert on error
      toast.error('Failed to update creator-only mode');
    } finally {
      setIsUpdating(false);
      setShowCreatorOnlyConfirm(false);
    }
  };

  const features = [
    { icon: Video, label: 'Featured video slot' },
    { icon: Pin, label: 'Pin content to profile' },
    { icon: TrendingUp, label: 'Creator analytics' },
  ];

  return (
    <>
      <div 
        className="rounded-sq-lg p-5 space-y-4 bg-card border border-border"
      >
        {/* Header with toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: enabled ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))' }}
            >
              <Sparkles 
                className={`h-5 w-5 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} 
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Creator Mode</h3>
              <p className="text-xs text-muted-foreground">
                Unlock creator tools and analytics
              </p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>

        {/* Features list */}
        <div 
          className="pt-4 space-y-3 border-t border-border"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            What you'll unlock
          </p>
          <div className="space-y-2">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Creator-only mode toggle - only show when creator mode is enabled */}
        {enabled && (
          <div className="pt-4 space-y-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: isCreatorOnly ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))' }}
                >
                  <EyeOff 
                    className={`h-4 w-4 ${isCreatorOnly ? 'text-primary' : 'text-muted-foreground'}`} 
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="creator-only" className="text-sm font-medium text-foreground cursor-pointer">
                    Use creator page only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Hide personal profile, show only creator page
                  </p>
                </div>
              </div>
              <Switch
                id="creator-only"
                checked={isCreatorOnly}
                onCheckedChange={handleCreatorOnlyToggle}
                disabled={isUpdating}
              />
            </div>
          </div>
        )}

        {/* View Creator Page button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => navigate('/creators/manage')}
        >
          <ExternalLink className="h-4 w-4" />
          Creator Studio
        </Button>

        {/* Explainer */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Creator Mode is designed for golfers who create and share content regularly. 
          {isCreatorOnly 
            ? ' Your personal profile is hidden — people will only see your creator page.'
            : ' Your profile remains a golfer profile — this just adds publishing tools.'
          }
        </p>
      </div>

      {/* Creator-only confirmation modal */}
      <AlertDialog open={showCreatorOnlyConfirm} onOpenChange={setShowCreatorOnlyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Hide your personal profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Your personal profile will no longer be visible. Your posts and mentions will link to your creator page instead.
              </p>
              <p className="text-sm">
                You can switch back at any time from Settings.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCreatorOnlyConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => updateCreatorOnly(true)}
              disabled={isUpdating}
            >
              {isUpdating ? 'Enabling...' : 'Enable creator-only'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CreatorModeToggle;
