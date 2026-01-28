import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, MoreHorizontal, Search, Trash2, UserMinus, UserPlus } from 'lucide-react';

export type StatusFilter = 'all' | 'active' | 'inactive';
export type RoleFilter = 'all' | 'admin' | 'limited_admin' | 'moderator' | 'user' | 'none';
export type VerifiedFilter = 'all' | 'yes' | 'no';

export interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  roleFilter: RoleFilter;
  onRoleChange: (value: RoleFilter) => void;
  verifiedFilter: VerifiedFilter;
  onVerifiedChange: (value: VerifiedFilter) => void;
  selectedCount: number;
  onExportCsv: () => void;
  onBulkDelete?: () => void;
  onBulkSuspend?: () => void;
  onBulkGrantRole?: () => void;
  disabled?: boolean;
}

export function UserFilters({
  searchQuery,
  onSearchChange,
  onSearch,
  statusFilter,
  onStatusChange,
  roleFilter,
  onRoleChange,
  verifiedFilter,
  onVerifiedChange,
  selectedCount,
  onExportCsv,
  onBulkDelete,
  onBulkSuspend,
  onBulkGrantRole,
  disabled,
}: UserFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, username, name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            disabled={disabled}
          />
        </div>
        <Button onClick={onSearch} disabled={disabled}>
          Search
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportCsv} disabled={disabled}>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          
          {selectedCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  Bulk ({selectedCount})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                {onBulkGrantRole && (
                  <DropdownMenuItem onClick={onBulkGrantRole}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Grant Role
                  </DropdownMenuItem>
                )}
                {onBulkSuspend && (
                  <DropdownMenuItem onClick={onBulkSuspend} className="text-orange-600">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Suspend Selected
                  </DropdownMenuItem>
                )}
                {onBulkDelete && (
                  <DropdownMenuItem onClick={onBulkDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
          <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as StatusFilter)} disabled={disabled}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Role:</span>
          <Select value={roleFilter} onValueChange={(v) => onRoleChange(v as RoleFilter)} disabled={disabled}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="limited_admin">Limited Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="none">No Role</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Verified:</span>
          <Select value={verifiedFilter} onValueChange={(v) => onVerifiedChange(v as VerifiedFilter)} disabled={disabled}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
