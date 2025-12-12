import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MoreHorizontal, Eye, Pencil, BarChart3, Trash2, 
  CheckCircle2, MapPin, Building2, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteBusinessDialog } from './DeleteBusinessDialog';
import { useBusinessStats7d } from '@/hooks/useBusinessStats7d';
import { cn } from '@/lib/utils';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';

interface BusinessCommandCardProps {
  membership: BusinessMembership;
  userId: string;
  index?: number;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  analyst: 'Analyst',
};

export function BusinessCommandCard({ membership, userId, index = 0 }: BusinessCommandCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: stats, isLoading: statsLoading } = useBusinessStats7d(membership.business.id);

  const { business, role } = membership;
  const canEdit = ['owner', 'admin'].includes(role);
  const canViewInsights = ['owner', 'admin', 'editor', 'analyst'].includes(role);
  const canDelete = role === 'owner';

  const hasActivity = stats && (stats.visits > 0 || stats.followersGained !== 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
        className={cn(
          "rounded-sq-lg bg-card border border-border/50",
          "shadow-sm hover:shadow-md transition-shadow duration-200",
          "p-5"
        )}
      >
        {/* Header Row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Logo */}
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-12 w-12 rounded-full object-cover flex-shrink-0 ring-2 ring-border/30"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold flex-shrink-0 ring-2 ring-border/30">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground truncate">{business.name}</span>
              {business.is_verified && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Business pill */}
              <span className="text-[11px] px-2 py-0.5 rounded-sq-pill bg-muted text-muted-foreground">
                Business
              </span>
              {/* Role pill */}
              <span className="text-[11px] px-2 py-0.5 rounded-sq-pill bg-primary/10 text-primary border border-primary/20">
                {ROLE_LABELS[role]}
              </span>
            </div>

            {business.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{business.location}</span>
              </div>
            )}
          </div>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 -mr-2 -mt-1 hover:bg-muted rounded-sq-sm transition-colors">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-sq-md">
              <DropdownMenuItem 
                onClick={() => navigate(`/business/${business.id}`)}
                className="gap-2 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                View profile
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem 
                  onClick={() => navigate(`/business/${business.id}/edit`)}
                  className="gap-2 cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                  Edit business
                </DropdownMenuItem>
              )}
              {canViewInsights && (
                <DropdownMenuItem 
                  onClick={() => navigate(`/business/${business.id}/insights`)}
                  className="gap-2 cursor-pointer"
                >
                  <BarChart3 className="h-4 w-4" />
                  Insights
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete business
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Performance Snapshot */}
        <div className="rounded-sq-md bg-muted/50 px-4 py-3 mb-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Last 7 days
          </p>
          {statsLoading ? (
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
          ) : hasActivity ? (
            <div className="flex items-center gap-4 text-sm text-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{stats.visits.toLocaleString()}</span>
                <span className="text-muted-foreground">visits</span>
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {stats.followersGained >= 0 ? '+' : ''}{stats.followersGained.toLocaleString()}
                </span>
                <span className="text-muted-foreground">followers</span>
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No activity yet — share your profile to get started.
            </p>
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/business/${business.id}`)}
            className="gap-1.5 h-9 flex-1 min-w-[120px]"
          >
            <Eye className="h-4 w-4" />
            View profile
          </Button>
          
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/business/${business.id}/edit`)}
              className="gap-1.5 h-9 flex-1 min-w-[100px]"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>

        {/* Insights CTA - slightly stronger emphasis */}
        {canViewInsights && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/business/${business.id}/insights`)}
            className="gap-1.5 h-9 w-full mt-2"
          >
            <BarChart3 className="h-4 w-4" />
            View Insights
          </Button>
        )}
      </motion.div>

      <DeleteBusinessDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        businessId={business.id}
        businessName={business.name}
        userId={userId}
      />
    </>
  );
}
