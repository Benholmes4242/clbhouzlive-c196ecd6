import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, ShieldOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerificationCleanSlateToolProps {
  className?: string;
}

/**
 * Phase 4.3: Verification Clean Slate Tool (admin-only)
 * 
 * Deletes all verification requests, reviews, and resets verified flags.
 * Must be logged, require confirmation, and never touch unrelated user data.
 */
export function VerificationCleanSlateTool({ className }: VerificationCleanSlateToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmations, setConfirmations] = useState({
    businessRequests: false,
    golferRequests: false,
    notifications: false,
    resetFlags: false,
    understand: false,
  });
  const [results, setResults] = useState<{
    businessRequestsDeleted?: number;
    golferRequestsDeleted?: number;
    notificationsDeleted?: number;
    businessFlagsReset?: number;
    golferFlagsReset?: number;
  } | null>(null);

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const handleReset = async () => {
    if (!allConfirmed) return;

    setIsProcessing(true);
    setResults(null);

    try {
      const results: any = {};

      // 1. Delete business verification reviews first (foreign key constraint)
      const { error: reviewsError } = await supabase
        .from('business_verification_reviews')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (reviewsError) console.warn('Reviews deletion warning:', reviewsError);

      // 2. Delete business verification requests
      if (confirmations.businessRequests) {
        const { data: businessReqs, error: businessReqsError } = await supabase
          .from('business_verification_requests')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select('id');
        if (businessReqsError) throw businessReqsError;
        results.businessRequestsDeleted = businessReqs?.length || 0;
      }

      // 3. Delete golfer verification reviews
      const { error: golferReviewsError } = await supabase
        .from('golfer_verification_reviews')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (golferReviewsError) console.warn('Golfer reviews deletion warning:', golferReviewsError);

      // 4. Delete golfer verification requests
      if (confirmations.golferRequests) {
        const { data: golferReqs, error: golferReqsError } = await supabase
          .from('golfer_verification_requests')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select('id');
        if (golferReqsError) console.warn('Golfer requests warning:', golferReqsError);
        results.golferRequestsDeleted = golferReqs?.length || 0;

        // Also delete golfer verification invites
        await supabase
          .from('golfer_verification_invites')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // 5. Delete verification-related notifications
      if (confirmations.notifications) {
        const { data: notifs, error: notifsError } = await supabase
          .from('notifications')
          .delete()
          .or('type.like.%verification%,type.like.%verified%')
          .select('id');
        if (notifsError) console.warn('Notifications warning:', notifsError);
        results.notificationsDeleted = notifs?.length || 0;
      }

      // 6. Reset business verified flags
      if (confirmations.resetFlags) {
        const { data: businesses, error: businessFlagsError } = await supabase
          .from('business_accounts')
          .update({ 
            is_verified: false, 
            verified_at: null, 
            verified_by: null,
            verification_cooldown_until: null,
            last_verification_action: null
          })
          .eq('is_verified', true)
          .select('id');
        if (businessFlagsError) console.warn('Business flags warning:', businessFlagsError);
        results.businessFlagsReset = businesses?.length || 0;

        // Reset golfer verified flags on user_profiles
        const { data: golfers, error: golferFlagsError } = await supabase
          .from('user_profiles')
          .update({ 
            is_verified_golfer: false,
            verified_golfer_at: null
          })
          .eq('is_verified_golfer', true)
          .select('id');
        if (golferFlagsError) console.warn('Golfer flags warning:', golferFlagsError);
        results.golferFlagsReset = golfers?.length || 0;
      }

      setResults(results);
      toast.success('Verification data has been reset');

      // Log the action
      console.log('[VerificationCleanSlateTool] Reset completed:', results);

    } catch (error) {
      console.error('[VerificationCleanSlateTool] error:', error);
      toast.error('Failed to reset verification data');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return (
      <div className={className}>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-sq-md transition-colors w-full"
        >
          <ShieldOff className="h-4 w-4" />
          Verification Clean Slate Tool
        </button>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{ 
        background: 'white',
        border: '1px solid rgba(220, 38, 38, 0.2)',
        borderRadius: '18px',
        padding: '20px'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1F2428]">Verification Clean Slate</h3>
          <p className="text-xs text-[#97A1AA]">Reset all verification data (destructive)</p>
        </div>
      </div>

      {/* Warning */}
      <div 
        className="p-3 rounded-sq-sm mb-4 text-sm"
        style={{ background: 'rgba(220, 38, 38, 0.05)' }}
      >
        <p className="text-red-700 font-medium mb-1">⚠️ This action is irreversible</p>
        <p className="text-red-600 text-xs">
          This will permanently delete verification requests, reviews, and reset all verified status flags.
          Use only for testing or complete system resets.
        </p>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 mb-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={confirmations.businessRequests}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, businessRequests: !!checked }))
            }
          />
          <span className="text-sm text-[#1F2428]">
            Delete all business verification requests and reviews
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={confirmations.golferRequests}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, golferRequests: !!checked }))
            }
          />
          <span className="text-sm text-[#1F2428]">
            Delete all golfer verification requests, invites, and reviews
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={confirmations.notifications}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, notifications: !!checked }))
            }
          />
          <span className="text-sm text-[#1F2428]">
            Delete all verification-related notifications
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={confirmations.resetFlags}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, resetFlags: !!checked }))
            }
          />
          <span className="text-sm text-[#1F2428]">
            Reset all verified flags (businesses and golfers will lose verification)
          </span>
        </label>

        <div className="pt-2 border-t" style={{ borderColor: 'rgba(31,36,40,0.08)' }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={confirmations.understand}
              onCheckedChange={(checked) => 
                setConfirmations(prev => ({ ...prev, understand: !!checked }))
              }
            />
            <span className="text-sm text-red-600 font-medium">
              I understand this action cannot be undone
            </span>
          </label>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div 
          className="p-3 rounded-sq-sm mb-4 text-sm space-y-1"
          style={{ background: 'rgba(52, 199, 89, 0.05)' }}
        >
          <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
            <CheckCircle className="h-4 w-4" />
            Reset completed
          </div>
          {results.businessRequestsDeleted !== undefined && (
            <p className="text-emerald-600 text-xs">• {results.businessRequestsDeleted} business requests deleted</p>
          )}
          {results.golferRequestsDeleted !== undefined && (
            <p className="text-emerald-600 text-xs">• {results.golferRequestsDeleted} golfer requests deleted</p>
          )}
          {results.notificationsDeleted !== undefined && (
            <p className="text-emerald-600 text-xs">• {results.notificationsDeleted} notifications deleted</p>
          )}
          {results.businessFlagsReset !== undefined && (
            <p className="text-emerald-600 text-xs">• {results.businessFlagsReset} business verified flags reset</p>
          )}
          {results.golferFlagsReset !== undefined && (
            <p className="text-emerald-600 text-xs">• {results.golferFlagsReset} golfer verified flags reset</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setConfirmations({
              businessRequests: false,
              golferRequests: false,
              notifications: false,
              resetFlags: false,
              understand: false,
            });
            setResults(null);
          }}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleReset}
          disabled={!allConfirmed || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Reset All
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default VerificationCleanSlateTool;
