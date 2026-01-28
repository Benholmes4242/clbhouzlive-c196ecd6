import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Clock, 
  Loader2, 
  MoreHorizontal, 
  RefreshCw, 
  X,
} from 'lucide-react';
import type { AdminInvitation } from '@/hooks/admin/useAdminTeamDetails';

interface PendingInvitationsTableProps {
  invitations: AdminInvitation[];
  loading: string | null;
  onResendInvite: (invitation: AdminInvitation) => void;
  onCancelInvite: (invitation: AdminInvitation) => void;
}

export function PendingInvitationsTable({
  invitations,
  loading,
  onResendInvite,
  onCancelInvite,
}: PendingInvitationsTableProps) {
  if (invitations.length === 0) {
    return null;
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5" />
          Pending Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              const expired = isExpired(invitation.expires_at);
              
              return (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invitation.role === 'full' ? 'Full Admin' : 'Limited Admin'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invitation.invited_by_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className={expired ? 'text-destructive' : 'text-muted-foreground'}>
                    <div className="text-sm">
                      {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                      {expired && (
                        <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          disabled={loading === invitation.id}
                        >
                          {loading === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => onResendInvite(invitation)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onCancelInvite(invitation)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
