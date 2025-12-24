import React from "react";
import { formatDistanceToNow } from "date-fns";
import { AdminListCard, StatusVariant } from "@/components/admin/mobile/AdminListCard";

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

interface GolferVerificationCardProps {
  request: GolferVerificationRequest;
  myReview?: string;
  onClick: () => void;
}

const getStatusVariant = (status: string): StatusVariant => {
  switch (status) {
    case "invited":
      return "default";
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
    case "declined":
    case "removed":
      return "error";
    default:
      return "muted";
  }
};

const getStatusLabel = (status: string, isVerified?: boolean): string => {
  if (status === "approved" && isVerified) return "Verified";
  switch (status) {
    case "invited":
      return "Invited";
    case "pending":
      return "Pending";
    case "approved":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "declined":
      return "Declined";
    case "removed":
      return "Revoked";
    default:
      return status;
  }
};

export function GolferVerificationCard({
  request,
  myReview,
  onClick,
}: GolferVerificationCardProps) {
  const profile = request.user_profile;
  const approvalCount = request.approval_count ?? 0;
  const requiredApprovals = request.required_approvals ?? 2;

  // Build metadata
  const metadata: Array<{ label: string; value: string }> = [];

  if (request.status === "pending") {
    metadata.push({
      label: "Approvals",
      value: `${approvalCount}/${requiredApprovals}`,
    });
  }

  metadata.push({
    label: "Submitted",
    value: formatDistanceToNow(new Date(request.created_at), { addSuffix: true }),
  });

  if (myReview) {
    metadata.push({
      label: "Your review",
      value: myReview === "approved" ? "Approved" : "Reviewed",
    });
  }

  return (
    <AdminListCard
      primary={profile?.display_name || profile?.username || "Unknown User"}
      secondary={profile?.username ? `@${profile.username}` : undefined}
      metadata={metadata}
      status={{
        label: getStatusLabel(request.status, profile?.is_verified_golfer),
        variant: getStatusVariant(request.status),
      }}
      onClick={onClick}
    />
  );
}
