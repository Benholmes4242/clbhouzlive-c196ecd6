import React from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowUpDown, 
  ChevronDown, 
  Eye, 
  MoreHorizontal, 
  Pencil, 
  Shield, 
  ShieldCheck, 
  Trash2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { AdminTeamMember } from '@/hooks/admin/useAdminTeamDetails';
import { cn } from '@/lib/utils';

interface AdminTeamTableProps {
  members: AdminTeamMember[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRowClick: (userId: string) => void;
  onEditRole: (member: AdminTeamMember) => void;
  onExtendAccess: (member: AdminTeamMember) => void;
  onRevokeAccess: (member: AdminTeamMember) => void;
}

export function AdminTeamTable({
  members,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
  onEditRole,
  onExtendAccess,
  onRevokeAccess,
}: AdminTeamTableProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: 'active' | 'expiring' | 'expired', expiresAt: string | null) => {
    if (status === 'expired') {
      return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />Expired</Badge>;
    }
    if (status === 'expiring' && expiresAt) {
      const days = differenceInDays(new Date(expiresAt), new Date());
      return (
        <Badge className="gap-1 bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
          <Clock className="h-3 w-3" />
          {days}d left
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-green-500/20 text-green-700 border-green-500/30">
        Active
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    if (role === 'full') {
      return (
        <Badge variant="default" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Full
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Shield className="h-3 w-3" />
        Limited
      </Badge>
    );
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className={cn(
        "ml-1 h-3 w-3",
        sortField === field && "text-primary"
      )} />
    </Button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader field="name">Admin</SortHeader>
            </TableHead>
            <TableHead>
              <SortHeader field="role">Role</SortHeader>
            </TableHead>
            <TableHead>
              <SortHeader field="status">Status</SortHeader>
            </TableHead>
            <TableHead>
              <SortHeader field="granted_at">Granted</SortHeader>
            </TableHead>
            <TableHead>
              <SortHeader field="expires_at">Expires</SortHeader>
            </TableHead>
            <TableHead>
              <SortHeader field="last_active">Last Active</SortHeader>
            </TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No admin team members found
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow 
                key={member.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(member.user_id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(member.role)}</TableCell>
                <TableCell>{getStatusBadge(member.status, member.expires_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.granted_at ? format(new Date(member.granted_at), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell className={cn(
                  "text-sm",
                  member.status === 'expired' && 'text-destructive',
                  member.status === 'expiring' && 'text-yellow-600'
                )}>
                  {member.expires_at ? format(new Date(member.expires_at), 'MMM d, yyyy') : 'Never'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.last_active 
                    ? formatDistanceToNow(new Date(member.last_active), { addSuffix: true })
                    : 'Never'
                  }
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => onRowClick(member.user_id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditRole(member)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onExtendAccess(member)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Extend Access
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onRevokeAccess(member)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
