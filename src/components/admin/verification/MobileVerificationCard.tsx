import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Globe, 
  Building2, 
  Mail, 
  Users, 
  ChevronDown,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface VerificationRequest {
  id: string;
  business_id: string;
  requested_by: string;
  status: string;
  website: string | null;
  note: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  requires_domain_check: boolean;
  domain: string | null;
  domain_confirmed: boolean;
  domain_confirmed_at: string | null;
  approval_count: number;
  required_approvals: number;
  proof_method: string | null;
  proof_value: string | null;
  proof_metadata: Record<string, unknown> | null;
  business: {
    id: string;
    name: string;
    slug: string | null;
    category: string | null;
    location: string | null;
    website: string | null;
    logo_url: string | null;
    is_verified: boolean;
    is_system_account: boolean;
  } | null;
}

interface MobileVerificationCardProps {
  request: VerificationRequest;
  approvalCount: number;
  hasAlreadyReviewed: boolean;
  myReview?: string;
  onApprove: () => void;
  onReject: () => void;
  onRequestDomainCheck?: () => void;
  onRevoke?: () => void;
  processing: boolean;
  showActions: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Pending</Badge>;
    case 'approved':
      return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Approved</Badge>;
    case 'rejected':
      return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">Rejected</Badge>;
    case 'revoked':
      return <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-xs">Revoked</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Unknown</Badge>;
  }
};

const getProofLabel = (method: string | null) => {
  switch (method) {
    case 'official_website':
      return 'Website';
    case 'business_email':
      return 'Email';
    case 'registered_business':
      return 'Registry';
    case 'creator_business':
      return 'Contact';
    case 'golf_course':
      return 'Course';
    default:
      return 'Proof';
  }
};

export const MobileVerificationCard: React.FC<MobileVerificationCardProps> = ({
  request,
  approvalCount,
  hasAlreadyReviewed,
  myReview,
  onApprove,
  onReject,
  onRequestDomainCheck,
  onRevoke,
  processing,
  showActions,
}) => {
  const [proofExpanded, setProofExpanded] = useState(false);
  const business = request.business;
  const requiredApprovals = request.required_approvals ?? 2;

  const handleWebsiteClick = (url: string | null) => {
    if (!url) return;
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(fullUrl);
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Invalid URL
    }
  };

  return (
    <Card className="p-4 space-y-3">
      {/* SECTION A: Identity & Status */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base leading-tight truncate">
              {business?.name || 'Unknown Business'}
            </h3>
            {business?.category && (
              <p className="text-xs text-muted-foreground mt-0.5">{business.category}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {getStatusBadge(request.status)}
            {business?.is_verified && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                <CheckCircle className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>

        {/* Approval Progress */}
        {request.status === 'pending' && (
          <div className="flex items-center gap-2 text-xs">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {approvalCount} of {requiredApprovals} approvals
            </span>
            {hasAlreadyReviewed && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-600 border-emerald-200">
                You {myReview === 'approved' ? 'approved' : 'reviewed'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* SECTION B: Meta (Compact Rows) */}
      <div className="space-y-1.5">
        {business?.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{business.location}</span>
          </div>
        )}
        {(request.website || business?.website) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <button 
              onClick={() => handleWebsiteClick(request.website || business?.website)} 
              className="hover:text-primary hover:underline truncate text-left"
            >
              {request.website || business?.website}
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* View Profile Link */}
      {business?.slug && (
        <Link 
          to={`/business/${business.slug}`} 
          target="_blank" 
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View Profile <ExternalLink className="h-3 w-3" />
        </Link>
      )}

      {/* SECTION C: Proof (Expandable) */}
      {request.proof_method && request.proof_value && (
        <Collapsible open={proofExpanded} onOpenChange={setProofExpanded}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-sq-sm border border-blue-200 dark:border-blue-900 text-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Proof provided</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0">
                  {getProofLabel(request.proof_method)}
                </Badge>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-blue-600 transition-transform",
                proofExpanded && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-sq-sm border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
                {request.proof_method === 'official_website' && (
                  <>
                    <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium block">Website verification</span>
                      <button 
                        onClick={() => handleWebsiteClick(request.proof_value)} 
                        className="hover:underline truncate block text-left mt-0.5"
                      >
                        {request.proof_value}
                      </button>
                    </div>
                  </>
                )}
                {request.proof_method === 'business_email' && (
                  <>
                    <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium block">Business email</span>
                      <span className="break-all mt-0.5 block">{request.proof_value}</span>
                    </div>
                  </>
                )}
                {request.proof_method === 'registered_business' && (
                  <>
                    <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium block">Business registry</span>
                      <span className="mt-0.5 block">
                        {(request.proof_metadata as Record<string, string>)?.registry?.replace('_', ' ') || 'Registry'}: {request.proof_value}
                      </span>
                    </div>
                  </>
                )}
                {request.proof_method === 'creator_business' && (
                  <>
                    <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium block">Creator contact</span>
                      <span className="break-all mt-0.5 block">{request.proof_value}</span>
                    </div>
                  </>
                )}
                {request.proof_method === 'golf_course' && (
                  <>
                    <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium block">Golf course</span>
                      <button 
                        onClick={() => handleWebsiteClick(request.proof_value)} 
                        className="hover:underline truncate block text-left mt-0.5"
                      >
                        {request.proof_value}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Domain verification status */}
      {request.requires_domain_check && !(business?.is_verified && request.status === 'approved') && (
        <div className={cn(
          "rounded-sq-sm p-2.5 text-xs border",
          request.domain_confirmed 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' 
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
        )}>
          <div className="flex items-center gap-2">
            {request.domain_confirmed ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Domain verified: @{request.domain}</span>
              </>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-400">Awaiting domain verification</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rejection reason */}
      {request.admin_note && request.status === 'rejected' && (
        <div className="bg-red-50 dark:bg-red-950/20 rounded-sq-sm p-2.5 text-xs border border-red-200 dark:border-red-900">
          <p className="text-[10px] font-medium text-red-600 mb-1">Rejection reason</p>
          <p className="text-red-700 dark:text-red-400">{request.admin_note}</p>
        </div>
      )}
    </Card>
  );
};

// Sticky action bar for mobile
interface MobileActionBarProps {
  request: VerificationRequest | null;
  approvalCount: number;
  hasAlreadyReviewed: boolean;
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRequestDomainCheck?: () => void;
  showActions: boolean;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  request,
  approvalCount,
  hasAlreadyReviewed,
  processing,
  onApprove,
  onReject,
  onRequestDomainCheck,
  showActions,
}) => {
  if (!request || !showActions || request.status !== 'pending') {
    return null;
  }

  const canApprove = !hasAlreadyReviewed && !(request.requires_domain_check && !request.domain_confirmed);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-30 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] md:hidden">
      <div className="space-y-2">
        {/* Primary actions */}
        <div className="flex gap-2">
          <Button 
            onClick={onApprove} 
            disabled={processing || !canApprove} 
            className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            size="sm"
          >
            <CheckCircle className="h-4 w-4" />
            {hasAlreadyReviewed ? 'Already Reviewed' : 'Approve'}
          </Button>
          <Button 
            onClick={onReject}
            disabled={processing || hasAlreadyReviewed}
            variant="outline"
            className="flex-1 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            size="sm"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
        
        {/* Secondary actions */}
        {!request.requires_domain_check && onRequestDomainCheck && (
          <Button 
            onClick={onRequestDomainCheck}
            disabled={processing}
            variant="outline"
            className="w-full gap-1.5"
            size="sm"
          >
            <Mail className="h-4 w-4" />
            Request Domain Check
          </Button>
        )}
      </div>
    </div>
  );
};
