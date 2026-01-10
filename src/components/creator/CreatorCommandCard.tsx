import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MoreHorizontal, Eye, Pencil, BarChart3, Sparkles, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import type { CreatorMembership, CreatorRole } from '@/hooks/useMyCreators';

interface CreatorCommandCardProps {
  membership: CreatorMembership;
  index?: number;
  isActive?: boolean;
}

// Access level labels for UI
const ACCESS_LABELS: Record<CreatorRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  analyst: 'Analyst',
};

export function CreatorCommandCard({ membership, index = 0, isActive = false }: CreatorCommandCardProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { creatorPage, role } = membership;
  
  const canManage = role === 'owner' || role === 'admin';
  const canEdit = role === 'owner' || role === 'admin' || role === 'editor';

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/creator/${creatorPage.slug}`);
  };

  const handleManageTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    requestAnimationFrame(() => {
      navigate(`/creator/${creatorPage.slug}/team`);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
      className="bg-white"
    >
      {/* Creator Row */}
      <div 
        onClick={handleRowClick}
        className="flex items-start gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        {/* Avatar */}
        {creatorPage.avatar_url ? (
          <img
            src={creatorPage.avatar_url}
            alt={creatorPage.display_name}
            className="h-11 w-11 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-base font-semibold flex-shrink-0">
            {creatorPage.display_name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name & Meta */}
        <div className="flex-1 min-w-0">
          {/* Creator name row */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate text-[15px]">{creatorPage.display_name}</span>
            {creatorPage.is_verified && (
              <VerifiedBadge size="sm" />
            )}
          </div>
          
          {/* Slug + Access level + Active pill */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground/80">@{creatorPage.slug}</span>
            <span className="text-xs text-muted-foreground/50">•</span>
            <span className="text-xs text-muted-foreground/80">{ACCESS_LABELS[role]}</span>
            {isActive && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600">
                Active
              </span>
            )}
          </div>
          
          {/* Creator type pill */}
          <div className="flex items-center gap-1 mt-1">
            <Sparkles className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground/60">Creator</span>
          </div>
        </div>

        {/* Three-dot menu */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
                navigate(`/creator/${creatorPage.slug}`);
              }}
              className="gap-2.5 cursor-pointer py-2"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
              View page
            </DropdownMenuItem>
            
            {canEdit && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/creator/${creatorPage.slug}/edit`);
                }}
                className="gap-2.5 cursor-pointer py-2"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Edit page
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/creator/${creatorPage.slug}/insights`);
              }}
              className="gap-2.5 cursor-pointer py-2"
            >
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Insights
            </DropdownMenuItem>
            
            {canManage && (
              <>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem 
                  onClick={handleManageTeam}
                  className="gap-2.5 cursor-pointer py-2"
                  disabled
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Manage team
                  <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hairline divider */}
      <div className="h-px bg-border/20" />

      {/* Metrics Strip - placeholder for now */}
      <div className="px-4 py-3.5">
        <div className="grid grid-cols-3 text-center">
          <div className="flex flex-col items-center justify-center">
            <p className="text-lg font-semibold text-foreground tabular-nums">-</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Views (7d)</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-lg font-semibold text-foreground tabular-nums">-</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Followers</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-lg font-semibold text-foreground tabular-nums">-</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Posts</p>
          </div>
        </div>
      </div>

      {/* Hairline divider */}
      <div className="h-px bg-border/20" />

      {/* Actions Row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/creator/${creatorPage.slug}/edit`);
            }}
            className="h-9 flex-1 text-xs whitespace-nowrap border-border/40 hover:border-border/60 active:scale-[0.98] transition-all"
          >
            Edit page
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/creator/${creatorPage.slug}/insights`);
          }}
          className="h-9 flex-1 text-xs whitespace-nowrap border-border/40 hover:border-border/60 active:scale-[0.98] transition-all"
        >
          Insights
        </Button>
      </div>
    </motion.div>
  );
}
