
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Clock, CheckCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InviteTeamMemberDialog from './InviteTeamMemberDialog';
import EditAdminProfileDialog from './EditAdminProfileDialog';
import AdminRoleDropdown from './AdminRoleDropdown';
import { useAdminTeam } from '@/hooks/useAdminTeam';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const TeamManagement = () => {
  const { adminProfiles, invitations, loading, refetch } = useAdminTeam();
  const { user } = useSupabaseSession();
  const [editingProfile, setEditingProfile] = useState<any>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Team Management</h2>
            <p className="text-muted-foreground">Manage your admin team members and their permissions</p>
          </div>
          <InviteTeamMemberDialog />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading team members...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Team Management</h2>
          <p className="text-muted-foreground">Manage your admin team members and their permissions</p>
        </div>
        <InviteTeamMemberDialog />
      </div>

      {/* Active Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Active Team Members ({adminProfiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active team members yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {adminProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{profile.first_name} {profile.last_name}</div>
                      <div className="text-sm text-muted-foreground">{profile.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <AdminRoleDropdown 
                      profile={profile}
                      currentUserId={user?.id || ''}
                      onRoleChanged={refetch}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProfile(profile)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invitations ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground">
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Dialog */}
      {editingProfile && (
        <EditAdminProfileDialog
          open={!!editingProfile}
          onOpenChange={(open) => !open && setEditingProfile(null)}
          profile={editingProfile}
          currentUserId={user?.id || ''}
          onProfileUpdated={() => {
            refetch();
            setEditingProfile(null);
          }}
        />
      )}
    </div>
  );
};

export default TeamManagement;
