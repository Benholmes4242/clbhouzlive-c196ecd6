import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MoreHorizontal, Eye, Pencil, BarChart3, Trash2, 
  CheckCircle2, MapPin
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

  // Format stat display - show "—" for zero/empty
  const formatStat = (value: number | undefined) => {
    if (value === undefined || value === 0) return '—';
    return value.toLocaleString();
  };

  const formatFollowers = (value: number | undefined) => {
    if (value === undefined || value === 0) return '—';
    return value >= 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or dropdown
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/business/${business.id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
        onClick={handleCardClick}
        className={cn(
          "rounded-sq-lg bg-card border border-border/50",
          "shadow-sm hover:shadow-md transition-all duration-200",
          "p-5 cursor-pointer",
          "active:scale-[0.995]"
        )}
      >
        {/* Header Row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Logo - larger */}
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-14 w-14 rounded-full object-cover flex-shrink-0 ring-2 ring-border/30"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl font-semibold flex-shrink-0 ring-2 ring-border/30">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground truncate text-[15px]">{business.name}</span>
              {business.is_verified && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <span>{ROLE_LABELS[role]}</span>
              {business.category && (
                <>
                  <span>·</span>
                  <span>{business.category}</span>
                </>
              )}
            </div>

            {business.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{business.location}</span>
              </div>
            )}
          </div>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-2 -mr-2 -mt-1 hover:bg-muted rounded-sq-sm transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-sq-md">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}`);
                }}
                className="gap-2 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/edit`);
                }}
                className="gap-2 cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/insights`);
                }}
                className="gap-2 cursor-pointer"
              >
                <BarChart3 className="h-4 w-4" />
                Insights
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete business profile
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 -mx-5 mb-4" />

        {/* KPI Strip - Premium Layout */}
        <div className="mb-4">
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <div className="h-6 w-10 mx-auto bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-14 mx-auto bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {formatStat(stats?.visits)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Visits</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {formatFollowers(stats?.followersGained)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {formatStat(stats?.impressions)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Impressions</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 text-center mt-2">
                Last 7 days
              </p>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 -mx-5 mb-4" />

        {/* Actions Row - 2 buttons only */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/business/${business.id}/edit`);
            }}
            className="gap-1.5 h-9 flex-1"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit profile
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/business/${business.id}/insights`);
            }}
            className="gap-1.5 h-9 flex-1"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Insights
          </Button>
        </div>
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
