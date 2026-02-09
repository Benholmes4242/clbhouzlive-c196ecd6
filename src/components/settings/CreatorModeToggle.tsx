import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, TrendingUp, Pin, Sparkles, ExternalLink, EyeOff, BarChart3, ChevronRight } from 'lucide-react';
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
    // Store previous values for rollback
    const previousEnabled = enabled;
    const previousCreatorOnly = isCreatorOnly;
    
    setIsUpdating(true);
    setEnabled(checked);

    // Optimistic cache updates for instant UI feedback
    const optimisticUpdate = (old: any) => old ? { ...old, is_creator: checked, ...((!checked && isCreatorOnly) ? { creator_only: false } : {}) } : old;
    queryClient.setQueryData(['profile', userId], optimisticUpdate);
    queryClient.setQueryData(['user-profile', userId], optimisticUpdate);
    queryClient.setQueryData(['creator-features', userId], optimisticUpdate);

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

      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['creator-features', userId] });

      toast.success(checked ? 'Creator Mode enabled' : 'Creator Mode disabled');
    } catch (err) {
      console.error('[CreatorModeToggle] error:', err);
      
      // Rollback optimistic updates on error
      setEnabled(previousEnabled);
      setIsCreatorOnly(previousCreatorOnly);
      const rollbackUpdate = (old: any) => old ? { ...old, is_creator: previousEnabled, creator_only: previousCreatorOnly } : old;
      queryClient.setQueryData(['profile', userId], rollbackUpdate);
      queryClient.setQueryData(['user-profile', userId], rollbackUpdate);
      queryClient.setQueryData(['creator-features', userId], rollbackUpdate);
      
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
    const previousValue = isCreatorOnly;
    setIsUpdating(true);
    setIsCreatorOnly(checked);

    // Optimistic cache updates
    const optimisticUpdate = (old: any) => old ? { ...old, creator_only: checked } : old;
    queryClient.setQueryData(['profile', userId], optimisticUpdate);
    queryClient.setQueryData(['user-profile', userId], optimisticUpdate);
    queryClient.setQueryData(['creator-features', userId], optimisticUpdate);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ creator_only: checked })
        .eq('id', userId);

      if (error) throw error;

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['creator-features', userId] });

      toast.success(checked ? 'Creator-only mode enabled' : 'Personal profile restored');
    } catch (err) {
      console.error('[CreatorModeToggle] creator_only error:', err);
      
      // Rollback optimistic updates
      setIsCreatorOnly(previousValue);
      const rollbackUpdate = (old: any) => old ? { ...old, creator_only: previousValue } : old;
      queryClient.setQueryData(['profile', userId], rollbackUpdate);
      queryClient.setQueryData(['user-profile', userId], rollbackUpdate);
      queryClient.setQueryData(['creator-features', userId], rollbackUpdate);
      
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
                    Hide profile
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Hide profile from non-followers
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

        {/* View Creator Insights - only show when Creator Mode is ON */}
        {enabled && (
          <button
            onClick={() => navigate('/insights')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">View Creator Insights</p>
                <p className="text-xs text-muted-foreground">See your content performance & analytics</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* View Profile button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => navigate(`/profile/${userId}`)}
        >
          <ExternalLink className="h-4 w-4" />
          View Profile
        </Button>

        {/* Explainer */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Creator Mode is designed for golfers who create and share content regularly. 
          {isCreatorOnly 
            ? ' Your profile is hidden from non-followers.'
            : ' This adds publishing tools like pinned posts and featured videos.'
          }
        </p>
      </div>

      {/* Creator-only confirmation modal */}
      <AlertDialog open={showCreatorOnlyConfirm} onOpenChange={setShowCreatorOnlyConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground font-bold text-lg">
              <EyeOff className="h-5 w-5" />
              Hide your personal profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm space-y-2">
              <span className="block">Your profile will be hidden from non-followers.</span>
              <span className="block text-muted-foreground/60 text-xs italic">You can switch back at any time from Settings.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowCreatorOnlyConfirm(false)}
              className="bg-transparent border border-border text-foreground min-h-[48px] rounded-full active:scale-[0.97] transition-transform"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => updateCreatorOnly(true)}
              disabled={isUpdating}
              className="bg-[#334E3D] text-white hover:bg-[#334E3D]/90 min-h-[48px] rounded-full active:scale-[0.97] transition-transform"
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
