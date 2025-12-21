import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, TrendingUp, Pin, Sparkles, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreatorModeToggleProps {
  userId: string;
  isCreator: boolean;
}

/**
 * Phase 3.1: Creator Mode Toggle
 * 
 * Enables Creator Mode for golfers, unlocking:
 * - Featured video slot
 * - Pin content
 * - Creator analytics (views, reach, saves)
 * - Publishing gravity boost in Discover
 */
export function CreatorModeToggle({ userId, isCreator }: CreatorModeToggleProps) {
  const [enabled, setEnabled] = React.useState(isCreator);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    setEnabled(checked);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_creator: checked })
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

  const features = [
    { icon: Video, label: 'Featured video slot' },
    { icon: Pin, label: 'Pin content to profile' },
    { icon: TrendingUp, label: 'Creator analytics' },
  ];

  return (
    <div 
      className="rounded-sq-lg p-5 space-y-4"
      style={{ 
        background: 'white',
        border: '1px solid rgba(31,36,40,0.08)',
        boxShadow: '0 2px 8px rgba(31,36,40,0.04)'
      }}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: enabled ? 'rgba(247, 147, 30, 0.1)' : '#EDEFF2' }}
          >
            <Sparkles 
              className={`h-5 w-5 ${enabled ? 'text-[#F7931E]' : 'text-[#5E666D]'}`} 
            />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1F2428]">Creator Mode</h3>
            <p className="text-xs text-[#5E666D]">
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
        className="pt-4 space-y-3"
        style={{ borderTop: '1px solid rgba(31,36,40,0.06)' }}
      >
        <p className="text-xs font-medium text-[#97A1AA] uppercase tracking-wide">
          What you'll unlock
        </p>
        <div className="space-y-2">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: '#EDEFF2' }}
              >
                <Icon className="h-3.5 w-3.5 text-[#5E666D]" />
              </div>
              <span className="text-sm text-[#1F2428]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* View Creator Page button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => navigate(`/creator/${userId}`)}
      >
        <ExternalLink className="h-4 w-4" />
        View my creator page
      </Button>

      {/* Explainer */}
      <p className="text-xs text-[#97A1AA] leading-relaxed">
        Creator Mode is designed for golfers who create and share content regularly. 
        Your profile remains a golfer profile — this just adds publishing tools.
      </p>
    </div>
  );
}

export default CreatorModeToggle;
