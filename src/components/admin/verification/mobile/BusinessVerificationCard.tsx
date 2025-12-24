import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Building2, Globe, CheckCircle, Mail, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminListCard, StatusVariant } from "@/components/admin/mobile/AdminListCard";

interface VerificationRequest {
  id: string;
  business_id: string;
  requested_by: string;
  status: string;
  website: string | null;
  note: string | null;
  admin_note: string | null;
  created_at: string;
  requires_domain_check: boolean;
  domain: string | null;
  domain_confirmed: boolean;
  approval_count: number;
  required_approvals: number;
  business: {
    id: string;
    name: string;
    slug: string | null;
    category: string | null;
    location: string | null;
    website: string | null;
    is_verified: boolean;
  } | null;
}

interface BusinessVerificationCardProps {
  request: VerificationRequest;
  myReview?: string;
  onClick: () => void;
  // Bulk selection props
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

const getStatusVariant = (status: string): StatusVariant => {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
    case "revoked":
      return "error";
    default:
      return "muted";
  }
};

const getStatusLabel = (status: string, isVerified?: boolean): string => {
  if (status === "approved" && isVerified) return "Verified";
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "revoked":
      return "Revoked";
    default:
      return status;
  }
};

export function BusinessVerificationCard({
  request,
  myReview,
  onClick,
  selectMode = false,
  selected = false,
  onSelect,
  selectable = true,
}: BusinessVerificationCardProps) {
  const business = request.business;
  const approvalCount = request.approval_count ?? 0;
  const requiredApprovals = request.required_approvals ?? 2;

  // Build secondary info
  const secondaryParts: string[] = [];
  if (business?.category) secondaryParts.push(business.category);
  if (business?.location) secondaryParts.push(business.location);

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

  if (request.requires_domain_check && !request.domain_confirmed) {
    metadata.push({
      label: "Domain",
      value: `Awaiting @${request.domain}`,
    });
  }

  if (myReview) {
    metadata.push({
      label: "Your review",
      value: myReview === "approved" ? "Approved" : "Reviewed",
    });
  }

  return (
    <AdminListCard
      primary={business?.name || "Unknown Business"}
      secondary={secondaryParts.join(" · ") || undefined}
      metadata={metadata}
      status={{
        label: getStatusLabel(request.status, business?.is_verified),
        variant: getStatusVariant(request.status),
      }}
      onClick={onClick}
      selectMode={selectMode}
      selected={selected}
      onSelect={onSelect}
      selectable={selectable}
    />
  );
}
