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
  isActive?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  analyst: 'Analyst',
};

export function BusinessCommandCard({ membership, userId, index = 0, isActive = false }: BusinessCommandCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: stats, isLoading: statsLoading } = useBusinessStats7d(membership.business.id);

  const { business, role } = membership;
  const canDelete = role === 'owner';

  // Format stat display - show "—" for zero/empty with fixed width
  const formatStat = (value: number | undefined) => {
    if (value === undefined || value === 0) return '—';
    return value.toLocaleString();
  };

  const formatFollowers = (value: number | undefined) => {
    if (value === undefined || value === 0) return '—';
    return value >= 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or dropdown
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/business/${business.id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
      >
        {/* Business Row - flat on background */}
        <div 
          onClick={handleRowClick}
          className="flex items-start gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          {/* Logo */}
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-11 w-11 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-base font-semibold flex-shrink-0">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name & Meta */}
          <div className="flex-1 min-w-0">
            {/* Business name row */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate text-[15px]">{business.name}</span>
              {business.is_verified && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>
            
            {/* Role + Category + Active pill */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground/80">{ROLE_LABELS[role]}</span>
              {business.category && (
                <>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground/80">{business.category}</span>
                </>
              )}
              {isActive && (
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600">
                  Active
                </span>
              )}
            </div>

            {/* Location */}
            {business.location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{business.location}</span>
              </div>
            )}
          </div>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-1.5 -mr-1.5 hover:bg-muted/60 rounded-sq-xs transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5 text-muted-foreground/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-52 rounded-sq-sm shadow-lg shadow-black/10 border-border/50"
            >
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}`);
                }}
                className="gap-2.5 cursor-pointer py-2"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/edit`);
                }}
                className="gap-2.5 cursor-pointer py-2"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/insights`);
                }}
                className="gap-2.5 cursor-pointer py-2"
              >
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Insights
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="gap-2.5 cursor-pointer py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete business profile
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hairline divider above metrics */}
        <div className="h-px bg-border/20" />

        {/* Metrics Strip - flat, inline */}
        <div className="px-4 py-3.5">
          <div className="grid grid-cols-3 text-center">
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-semibold text-foreground tabular-nums min-w-[2ch]">
                {statsLoading ? <span className="opacity-0">—</span> : formatStat(stats?.visits)}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Visits</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-semibold text-foreground tabular-nums min-w-[2ch]">
                {statsLoading ? <span className="opacity-0">—</span> : formatFollowers(stats?.followersGained)}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Followers</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-semibold text-foreground tabular-nums min-w-[2ch]">
                {statsLoading ? <span className="opacity-0">—</span> : formatStat(stats?.impressions)}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Impressions</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2.5">
            Last 7 days
          </p>
        </div>

        {/* Hairline divider below metrics */}
        <div className="h-px bg-border/20" />

        {/* Actions Row - flat buttons with refined styling */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/business/${business.id}/edit`);
            }}
            className="gap-1.5 h-9 flex-1 border-border/40 hover:border-border/60 active:scale-[0.98] transition-all"
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
            className="gap-1.5 h-9 flex-1 border-border/40 hover:border-border/60 active:scale-[0.98] transition-all"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Insights
          </Button>
        </div>

        {/* Bottom divider for section separation */}
        <div className="h-px bg-border/30" />
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
