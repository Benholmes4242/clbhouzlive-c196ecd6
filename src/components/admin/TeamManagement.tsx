import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Users } from 'lucide-react';
import InviteTeamMemberDialog from './InviteTeamMemberDialog';
import { 
  useAdminTeamList, 
  useAdminTeamActions,
  type AdminTeamMember,
  type AdminInvitation 
} from '@/hooks/admin/useAdminTeamDetails';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { 
  AdminDetailDrawer, 
  TeamStatsCards, 
  AdminTeamTable, 
  PendingInvitationsTable 
} from './team';

const TeamManagement = () => {
  
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useAdminTeamList();
  const { loading: actionLoading, resendInvite, cancelInvite, revokeAccess } = useAdminTeamActions();

  // State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sort members
  const sortedMembers = useMemo(() => {
    if (!data?.members) return [];
    
    return [...data.members].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'status':
          const statusOrder = { active: 0, expiring: 1, expired: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'granted_at':
          comparison = new Date(a.granted_at || 0).getTime() - new Date(b.granted_at || 0).getTime();
          break;
        case 'expires_at':
          const aExp = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
          const bExp = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
          comparison = aExp - bExp;
          break;
        case 'last_active':
          const aActive = a.last_active ? new Date(a.last_active).getTime() : 0;
          const bActive = b.last_active ? new Date(b.last_active).getTime() : 0;
          comparison = bActive - aActive; // Most recent first
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.members, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (userId: string) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  };

  const handleEditRole = (member: AdminTeamMember) => {
    setSelectedUserId(member.user_id);
    setDrawerOpen(true);
  };

  const handleExtendAccess = (member: AdminTeamMember) => {
    setSelectedUserId(member.user_id);
    setDrawerOpen(true);
  };

  const handleRevokeAccess = async (member: AdminTeamMember) => {
    const result = await revokeAccess(member.user_id, member.email);
    if (result.success) {
      toast.success('Access revoked', { description: `${member.email} has been removed` });
      queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
    } else {
      toast.error('Error', { description: 'Failed to revoke access' });
    }
  };

  const handleResendInvite = async (invitation: AdminInvitation) => {
    const result = await resendInvite(invitation.id);
    if (result.success) {
      toast.success('Invite resent', { description: `Invitation extended for ${invitation.email}` });
      queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
    } else {
      toast.error('Error', { description: 'Failed to resend invite' });
    }
  };

  const handleCancelInvite = async (invitation: AdminInvitation) => {
    const result = await cancelInvite(invitation.id);
    if (result.success) {
      toast.success('Invite cancelled', { description: `Invitation for ${invitation.email} has been cancelled` });
      queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
    } else {
      toast.error('Error', { description: 'Failed to cancel invite' });
    }
  };

  const handleExportCSV = () => {
    if (!data?.members) return;
    
    const headers = ['Name', 'Email', 'Role', 'Status', 'Granted Date', 'Expires Date', 'Last Active'];
    const rows = data.members.map(m => [
      `${m.first_name} ${m.last_name}`,
      m.email,
      m.role,
      m.status,
      m.granted_at || '',
      m.expires_at || 'Never',
      m.last_active || 'Never',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-team.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Export complete', { description: 'Admin team data exported to CSV' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Team Management</h2>
            <p className="text-muted-foreground">Manage your admin team members and their permissions</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Team Management</h2>
          <p className="text-muted-foreground">Manage your admin team members and their permissions</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            <p>Failed to load team data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Team Management</h2>
          <p className="text-muted-foreground">Manage your admin team members and their permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <InviteTeamMemberDialog />
        </div>
      </div>

      {/* Stats Cards */}
      {data?.stats && <TeamStatsCards stats={data.stats} />}

      {/* Admin Team Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Admin Team ({sortedMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AdminTeamTable
            members={sortedMembers}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onRowClick={handleRowClick}
            onEditRole={handleEditRole}
            onExtendAccess={handleExtendAccess}
            onRevokeAccess={handleRevokeAccess}
          />
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {data?.invitations && (
        <PendingInvitationsTable
          invitations={data.invitations}
          loading={actionLoading}
          onResendInvite={handleResendInvite}
          onCancelInvite={handleCancelInvite}
        />
      )}

      {/* Admin Detail Drawer */}
      <AdminDetailDrawer
        userId={selectedUserId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAdminRevoked={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
        }}
      />
    </div>
  );
};

export default TeamManagement;
