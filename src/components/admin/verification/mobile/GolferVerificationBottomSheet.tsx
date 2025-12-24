import React, { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, Users, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface GolferVerificationRequest {
  id: string;
  user_id: string;
  status: string;
  invited_by: string;
  requested_at: string | null;
  reviewed_at: string | null;
  note: string | null;
  admin_note: string | null;
  evidence_url: string | null;
  approval_count: number;
  required_approvals: number;
  created_at: string;
  user_profile: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    is_verified_golfer: boolean;
  } | null;
}

interface GolferVerificationBottomSheetProps {
  request: GolferVerificationRequest | null;
  open: boolean;
  onClose: () => void;
  myReview?: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onRemove?: (note: string) => void;
  onReinvite?: () => void;
  processing: boolean;
}

export function GolferVerificationBottomSheet({
  request,
  open,
  onClose,
  myReview,
  onApprove,
  onReject,
  onRemove,
  onReinvite,
  processing,
}: GolferVerificationBottomSheetProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showRemoveInput, setShowRemoveInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [removeNote, setRemoveNote] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);

  if (!request) return null;

  const profile = request.user_profile;
  const hasAlreadyReviewed = !!myReview;
  const approvalCount = request.approval_count ?? 0;
  const requiredApprovals = request.required_approvals ?? 2;
  const isPending = request.status === "pending";
  const isApproved = request.status === "approved";
  const isDeclinedOrRejected = request.status === "declined" || request.status === "rejected";

  const handleClose = () => {
    setShowRejectInput(false);
    setShowRemoveInput(false);
    setRejectReason("");
    setRemoveNote("");
    onClose();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "invited":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Invited</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case "approved":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      case "declined":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Declined</Badge>;
      case "removed":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Revoked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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

    // Remove input mode
    if (showRemoveInput && onRemove) {
      return (
        <div className="space-y-3">
          <Label>Note (optional)</Label>
          <Textarea
            value={removeNote}
            onChange={(e) => setRemoveNote(e.target.value)}
            placeholder="Explain why verification is being removed..."
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRemoveInput(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onRemove(removeNote);
                handleClose();
              }}
              disabled={processing}
            >
              Confirm Remove
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
            disabled={processing || hasAlreadyReviewed}
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
        </div>
      );
    }

    if (isApproved && onRemove) {
      return (
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setShowRemoveInput(true)}
          disabled={processing}
        >
          <AlertTriangle className="h-4 w-4" />
          Remove Verification
        </Button>
      );
    }

    if (isDeclinedOrRejected && onReinvite) {
      return (
        <Button
          className="w-full gap-2"
          onClick={() => {
            onReinvite();
            handleClose();
          }}
          disabled={processing}
        >
          Re-invite
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
        title={profile?.display_name || profile?.username || "Unknown User"}
        subtitle={profile?.username ? `@${profile.username}` : undefined}
        actions={renderActions()}
      >
        <div className="space-y-4">
          {/* Profile Header */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.profile_photo_url || undefined} />
              <AvatarFallback>
                {(profile?.display_name || profile?.username || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {profile?.display_name || profile?.username || "Unknown User"}
                </span>
                {getStatusBadge(request.status)}
              </div>
              {profile?.username && (
                <Link
                  to={`/${profile.username}`}
                  target="_blank"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View Profile <ExternalLink className="h-3 w-3" />
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

          {/* Evidence URL */}
          {request.evidence_url && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Evidence Provided
              </h3>
              <a
                href={request.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border p-3 text-sm text-primary hover:bg-accent transition-colors"
              >
                <LinkIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{request.evidence_url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}

          {/* Note from golfer */}
          {request.note && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Note from Golfer
              </h3>
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                {request.note}
              </div>
            </div>
          )}

          {/* Admin note / Rejection reason */}
          {request.admin_note && (request.status === "rejected" || request.status === "removed") && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {request.status === "rejected" ? "Rejection Reason" : "Removal Note"}
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
              <p>Created: {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}</p>
              {request.requested_at && (
                <p>Requested: {format(new Date(request.requested_at), "MMM d, yyyy h:mm a")}</p>
              )}
              {request.reviewed_at && (
                <p>Reviewed: {format(new Date(request.reviewed_at), "MMM d, yyyy h:mm a")}</p>
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
              This will submit your approval for{" "}
              {profile?.display_name || profile?.username || "this golfer"}. They will be
              verified once all required approvals are received.
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
