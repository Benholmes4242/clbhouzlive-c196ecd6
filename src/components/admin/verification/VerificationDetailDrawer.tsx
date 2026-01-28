import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Globe, 
  Building2, 
  User,
  Clock,
  FileText,
  History,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VerificationDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'business' | 'golfer';
  requestId: string | null;
  onApprove: () => void;
  onReject: () => void;
  processing?: boolean;
}

export function VerificationDetailDrawer({
  open,
  onOpenChange,
  type,
  requestId,
  onApprove,
  onReject,
  processing = false,
}: VerificationDetailDrawerProps) {
  // Fetch business verification request details
  const { data: businessRequest, isLoading: businessLoading } = useQuery({
    queryKey: ['business-verification-detail', requestId],
    enabled: open && type === 'business' && !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select(`
          *,
          business:business_accounts!business_id (
            id, name, slug, category, location, website, logo_url, is_verified, description
          )
        `)
        .eq('id', requestId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch golfer verification request details
  const { data: golferRequest, isLoading: golferLoading } = useQuery({
    queryKey: ['golfer-verification-detail', requestId],
    enabled: open && type === 'golfer' && !!requestId,
    queryFn: async () => {
      const { data: requestData, error: requestError } = await supabase
        .from('golfer_verification_requests')
        .select('*')
        .eq('id', requestId!)
        .single();
      if (requestError) throw requestError;

      // Fetch user profile separately
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, is_verified_golfer, bio')
        .eq('id', requestData.user_id)
        .single();

      return { ...requestData, user_profile: profile };
    },
  });

  // Fetch verification history
  const { data: history } = useQuery({
    queryKey: ['verification-history', type, requestId],
    enabled: open && !!requestId,
    queryFn: async () => {
      const entityId = type === 'business' 
        ? businessRequest?.business_id 
        : golferRequest?.user_id;
      
      if (!entityId) return [];

      const { data, error } = await supabase
        .from('verification_audit_log')
        .select('*')
        .eq('entity_type', type === 'business' ? 'business' : 'person')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) return [];
      return data;
    },
  });

  const isLoading = type === 'business' ? businessLoading : golferLoading;
  const request = type === 'business' ? businessRequest : golferRequest;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Pending' },
      invited: { className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Invited' },
      approved: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Approved' },
      rejected: { className: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Rejected' },
      declined: { className: 'bg-slate-500/10 text-slate-600 border-slate-500/20', label: 'Declined' },
      revoked: { className: 'bg-slate-500/10 text-slate-600 border-slate-500/20', label: 'Revoked' },
    };
    const variant = variants[status] || { className: '', label: status };
    return <Badge variant="secondary" className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {type === 'business' ? (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
            Verification Details
          </SheetTitle>
          <SheetDescription>
            Review the request details and take action.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !request ? (
          <div className="text-center py-12 text-muted-foreground">
            Request not found
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)] pr-4">
            <div className="space-y-6 py-4">
              {/* Profile Header */}
              {type === 'business' && businessRequest?.business && (
                <div className="flex items-start gap-4">
                  {businessRequest.business.logo_url && (
                    <img 
                      src={businessRequest.business.logo_url} 
                      alt={businessRequest.business.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{businessRequest.business.name}</h3>
                    {businessRequest.business.category && (
                      <p className="text-sm text-muted-foreground">{businessRequest.business.category}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(businessRequest.status)}
                    </div>
                  </div>
                </div>
              )}

              {type === 'golfer' && golferRequest?.user_profile && (
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={golferRequest.user_profile.profile_photo_url || undefined} />
                    <AvatarFallback>
                      {(golferRequest.user_profile.display_name || golferRequest.user_profile.username || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">
                      {golferRequest.user_profile.display_name || golferRequest.user_profile.username || 'Unknown'}
                    </h3>
                    {golferRequest.user_profile.username && (
                      <p className="text-sm text-muted-foreground">@{golferRequest.user_profile.username}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(golferRequest.status)}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Request Details */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Request Details
                </h4>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>

                  {type === 'business' && businessRequest && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Approval Progress</span>
                        <span>{businessRequest.approval_count} / {businessRequest.required_approvals}</span>
                      </div>
                      {businessRequest.website && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Website</span>
                          <a 
                            href={businessRequest.website.startsWith('http') ? businessRequest.website : `https://${businessRequest.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {businessRequest.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {businessRequest.domain && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Domain</span>
                          <span className="flex items-center gap-1">
                            @{businessRequest.domain}
                            {businessRequest.domain_confirmed && (
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {type === 'golfer' && golferRequest && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approval Progress</span>
                      <span>{golferRequest.approval_count} / {golferRequest.required_approvals}</span>
                    </div>
                  )}
                </div>

                {/* Note from requester */}
                {request.note && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Note from requester</p>
                    <p className="text-sm">{request.note}</p>
                  </div>
                )}

                {/* Evidence URL */}
                {type === 'golfer' && golferRequest?.evidence_url && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Evidence Provided</p>
                    <a 
                      href={golferRequest.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View Evidence <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Admin note (for rejected) */}
                {request.admin_note && request.status === 'rejected' && (
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-900">
                    <p className="text-xs font-medium text-red-600 mb-1">Rejection reason</p>
                    <p className="text-sm text-red-700 dark:text-red-400">{request.admin_note}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Profile Link */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Profile
                </h4>
                {type === 'business' && businessRequest?.business?.slug && (
                  <Link
                    to={`/business/${businessRequest.business.slug}`}
                    target="_blank"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View Business Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
                {type === 'golfer' && golferRequest?.user_profile?.username && (
                  <Link
                    to={`/@${golferRequest.user_profile.username}`}
                    target="_blank"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View Golfer Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>

              <Separator />

              {/* Verification History */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </h4>
                {!history || history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No previous verification attempts</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((entry: any) => (
                      <div key={entry.id} className="text-sm flex items-start gap-2">
                        <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <span className="font-medium capitalize">{entry.action}</span>
                          <span className="text-muted-foreground ml-1">
                            {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {request.status === 'pending' && (
                <>
                  <Separator />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      onClick={onApprove}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={onReject}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
