import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Building2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RequestAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  businessAvatarUrl?: string | null;
  userId: string;
}

/**
 * Modal for requesting access to an already-claimed business profile.
 */
export const RequestAccessModal: React.FC<RequestAccessModalProps> = ({
  open,
  onOpenChange,
  businessId,
  businessName,
  businessAvatarUrl,
  userId,
}) => {
  const [requestedRole, setRequestedRole] = useState<'team_member' | 'manager'>('team_member');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Get requester's profile info for the notification
      const { data: requesterProfile } = await supabase
        .from('user_profiles')
        .select('display_name, username, profile_photo_url')
        .eq('id', userId)
        .single();

      const requesterName = requesterProfile?.display_name || requesterProfile?.username || 'Someone';
      const requesterAvatarUrl = requesterProfile?.profile_photo_url || null;

      const { data: insertedRequest, error } = await supabase
        .from('business_access_requests')
        .insert({
          business_id: businessId,
          requester_user_profile_id: userId,
          requested_role: requestedRole,
          message: message.trim() || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      const requestId = insertedRequest?.id;

      // Notify business owners/managers (expanded roles)
      const { data: managers } = await supabase
        .from('business_members')
        .select('user_profile_id')
        .eq('business_id', businessId)
        .in('role', ['owner', 'admin', 'primary_manager', 'manager']);

      if (managers && managers.length > 0 && requestId) {
        const roleDisplayName = requestedRole === 'manager' ? 'Manager' : 'Team member';
        
        // Check existing notifications to avoid duplicates (idempotency)
        const { data: existingNotifications } = await supabase
          .from('notifications')
          .select('user_id')
          .eq('type', 'business_access_request')
          .eq('entity_id', businessId)
          .contains('data', { request_id: requestId });

        const existingUserIds = new Set(existingNotifications?.map(n => n.user_id) || []);
        
        const notifications = managers
          .filter(m => !existingUserIds.has(m.user_profile_id))
          .map(manager => ({
            user_id: manager.user_profile_id,
            recipient_actor_type: 'personal',
            recipient_actor_id: manager.user_profile_id,
            actor_id: userId,
            type: 'business_access_request',
            title: 'Access request',
            message: `${requesterName} requested ${roleDisplayName} access to ${businessName}`,
            entity_type: 'business',
            entity_id: businessId,
            data: { 
              business_id: businessId, 
              business_name: businessName,
              business_avatar_url: businessAvatarUrl || null,
              requester_id: userId,
              requester_name: requesterName,
              requester_avatar_url: requesterAvatarUrl,
              role_requested: roleDisplayName,
              request_id: requestId, // For idempotency
            },
          }));

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }

      setSubmitted(true);
      toast.success('Access request sent');
      
      // Close after short delay
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
        setMessage('');
        setRequestedRole('team_member');
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting access request:', error);
      if (error.code === '23505') {
        toast.error('You already have a pending request for this business');
      } else {
        toast.error("Couldn't submit request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            Request access
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{businessName}</span> already has a business profile on clbhouz.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your request has been sent to the business owners.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Role selection */}
            <div className="space-y-2">
              <Label className="text-sm">What role are you requesting?</Label>
              <RadioGroup
                value={requestedRole}
                onValueChange={(v) => setRequestedRole(v as 'team_member' | 'manager')}
                className="space-y-2"
              >
                <div className="flex items-start gap-3 p-3 border border-border rounded-sq-sm hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="team_member" id="role-team" className="mt-0.5" />
                  <div className="flex-1">
                    <label htmlFor="role-team" className="text-sm font-medium cursor-pointer">
                      Team member
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Appear as part of the team and post on behalf of the business.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border border-border rounded-sq-sm hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="manager" id="role-manager" className="mt-0.5" />
                  <div className="flex-1">
                    <label htmlFor="role-manager" className="text-sm font-medium cursor-pointer">
                      Manager
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Full access to edit the profile and manage the team.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Optional message */}
            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-sm">
                Message (optional)
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself or explain your role at the club..."
                className="min-h-[80px] resize-none rounded-sq-sm"
                maxLength={500}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send request'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};