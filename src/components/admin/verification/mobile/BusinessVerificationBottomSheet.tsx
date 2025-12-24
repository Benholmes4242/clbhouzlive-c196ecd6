import React, { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, Globe, Building2, Mail, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AdminBottomSheet } from "@/components/admin/mobile/AdminBottomSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VerificationRequest {
  id: string;
  business_id: string;
  requested_by: string;
  status: string;
  website: string | null;
  note: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  requires_domain_check: boolean;
  domain: string | null;
  domain_confirmed: boolean;
  domain_confirmed_at: string | null;
  approval_count: number;
  required_approvals: number;
  proof_method: string | null;
  proof_value: string | null;
  business: {
    id: string;
    name: string;
    slug: string | null;
    category: string | null;
    location: string | null;
    website: string | null;
    logo_url: string | null;
    is_verified: boolean;
    is_system_account?: boolean;
  } | null;
}

interface BusinessVerificationBottomSheetProps {
  request: VerificationRequest | null;
  open: boolean;
  onClose: () => void;
  myReview?: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onRequestDomainCheck: (domain: string) => void;
  onRevoke?: (reason: string) => void;
  processing: boolean;
}

export function BusinessVerificationBottomSheet({
  request,
  open,
  onClose,
  myReview,
  onApprove,
  onReject,
  onRequestDomainCheck,
  onRevoke,
  processing,
}: BusinessVerificationBottomSheetProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showRevokeInput, setShowRevokeInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);

  if (!request) return null;

  const business = request.business;
  const hasAlreadyReviewed = !!myReview;
  const approvalCount = request.approval_count ?? 0;
  const requiredApprovals = request.required_approvals ?? 2;
  const isPending = request.status === "pending";
  const isApproved = request.status === "approved";
  const domainBlocked = request.requires_domain_check && !request.domain_confirmed;

  const handleClose = () => {
    setShowRejectInput(false);
    setShowDomainInput(false);
    setShowRevokeInput(false);
    setRejectReason("");
    setDomainInput("");
    setRevokeReason("");
    onClose();
  };

  const handleWebsiteClick = (url: string | null) => {
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const handleStartDomainCheck = () => {
    const website = request.website || business?.website || "";
    try {
      const url = new URL(website.startsWith("http") ? website : `https://${website}`);
      setDomainInput(url.hostname.replace("www.", ""));
    } catch {
      setDomainInput("");
    }
    setShowDomainInput(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case "approved":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      case "revoked":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Revoked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Actions based on state
  const renderActions = () => {
    // Reject input mode
    if (showRejectInput) {
      return (
        <div className="space-y-3">
          <Label>Reason for rejection</Label>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this request is being rejected..."
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRejectInput(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onReject(rejectReason);
                handleClose();
              }}
              disabled={processing || !rejectReason.trim()}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      );
    }

    // Domain check input mode
    if (showDomainInput) {
      return (
        <div className="space-y-3">
          <Label>Domain to verify</Label>
          <Input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="example.com"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDomainInput(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onRequestDomainCheck(domainInput);
                handleClose();
              }}
              disabled={processing || !domainInput.trim()}
            >
              Send Email
            </Button>
          </div>
        </div>
      );
    }

    // Revoke input mode
    if (showRevokeInput && onRevoke) {
      return (
        <div className="space-y-3">
          <Label>Reason for revoking</Label>
          <Textarea
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Explain why verification is being revoked..."
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRevokeInput(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onRevoke(revokeReason);
                handleClose();
              }}
              disabled={processing}
            >
              Confirm Revoke
            </Button>
          </div>
        </div>
      );
    }

    // Standard actions based on status
    if (isPending) {
      return (
        <div className="space-y-2">
          <Button
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setConfirmApprove(true)}
            disabled={processing || hasAlreadyReviewed || domainBlocked}
          >
            <CheckCircle className="h-4 w-4" />
            {hasAlreadyReviewed ? "Already Reviewed" : "Approve"}
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setShowRejectInput(true)}
            disabled={processing || hasAlreadyReviewed}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          {!request.requires_domain_check && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleStartDomainCheck}
              disabled={processing}
            >
              <Mail className="h-4 w-4" />
              Request Domain Check
            </Button>
          )}
        </div>
      );
    }

    if (isApproved && onRevoke) {
      return (
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setShowRevokeInput(true)}
          disabled={processing}
        >
          <AlertTriangle className="h-4 w-4" />
          Revoke Verification
        </Button>
      );
    }

    return null;
  };

  return (
    <>
      <AdminBottomSheet
        open={open}
        onClose={handleClose}
        title={business?.name || "Unknown Business"}
        subtitle={getStatusBadge(request.status) as unknown as string}
        actions={renderActions()}
      >
        <div className="space-y-4">
          {/* Business Info Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Business Info
            </h3>
            <div className="rounded-lg border p-3 space-y-2">
              {business?.category && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{business.category}</span>
                </div>
              )}
              {business?.location && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{business.location}</span>
                </div>
              )}
              {(request.website || business?.website) && (
                <button
                  onClick={() => handleWebsiteClick(request.website || business?.website)}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  <span className="truncate">{request.website || business?.website}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </button>
              )}
              {business?.slug && (
                <Link
                  to={`/business/${business.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  View Profile
                </Link>
              )}
            </div>
          </div>

          {/* Approval Progress */}
          {isPending && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Approval Progress
              </h3>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {approvalCount === 0
                      ? `Awaiting review (0 of ${requiredApprovals})`
                      : `${approvalCount} of ${requiredApprovals} approvals`}
                  </span>
                </div>
                {hasAlreadyReviewed && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    You {myReview === "approved" ? "approved" : "reviewed"}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Domain Status */}
          {request.requires_domain_check && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Domain Verification
              </h3>
              <div
                className={`rounded-lg border p-3 ${
                  request.domain_confirmed
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  {request.domain_confirmed ? (
                    <>
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Domain verified: @{request.domain}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-700 dark:text-amber-400">
                        Awaiting: @{request.domain}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Note from requester */}
          {request.note && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Note from Requester
              </h3>
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                {request.note}
              </div>
            </div>
          )}

          {/* Admin note / Rejection reason */}
          {request.admin_note && request.status === "rejected" && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Rejection Reason
              </h3>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {request.admin_note}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Timeline
            </h3>
            <div className="rounded-lg border p-3 text-xs text-muted-foreground space-y-1">
              <p>Submitted: {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}</p>
              {request.reviewed_at && (
                <p>Reviewed: {format(new Date(request.reviewed_at), "MMM d, yyyy h:mm a")}</p>
              )}
              {request.domain_confirmed_at && (
                <p>
                  Domain confirmed:{" "}
                  {format(new Date(request.domain_confirmed_at), "MMM d, yyyy h:mm a")}
                </p>
              )}
            </div>
          </div>
        </div>
      </AdminBottomSheet>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will submit your approval for {business?.name}. The business will
              be verified once all required approvals are received.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmApprove(false);
                onApprove();
                handleClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
