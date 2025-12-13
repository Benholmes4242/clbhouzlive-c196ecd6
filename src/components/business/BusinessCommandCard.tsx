import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MoreHorizontal, Eye, Pencil, BarChart3, Trash2, 
  CheckCircle2, MapPin, ChevronRight
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
          className="flex items-start gap-4 px-4 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          {/* Logo */}
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-12 w-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold flex-shrink-0">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name & Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-foreground truncate">{business.name}</span>
              {business.is_verified && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <span>{ROLE_LABELS[role]}</span>
              {business.category && (
                <>
                  <span>•</span>
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
                className="p-2 -mr-2 hover:bg-muted rounded-sq-sm transition-colors"
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

        {/* Hairline divider */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Metrics Strip - flat, inline */}
        <div className="px-4 py-4">
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <div className="h-5 w-10 mx-auto bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-12 mx-auto bg-muted rounded animate-pulse" />
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
              <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                Last 7 days
              </p>
            </>
          )}
        </div>

        {/* Hairline divider */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Actions Row - flat buttons */}
        <div className="flex items-center gap-3 px-4 py-4">
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

        {/* Bottom divider for section separation */}
        <div className="h-px bg-border/40" />
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
