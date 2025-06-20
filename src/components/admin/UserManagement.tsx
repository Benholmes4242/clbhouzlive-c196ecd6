
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  auth_created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  display_name: string | null;
  username: string | null;
  home_club: string | null;
  is_public: boolean | null;
  profile_created_at: string | null;
  role: 'admin' | 'moderator' | 'user' | null;
}

interface UserManagementProps {
  users: AdminUser[];
  onRoleChange: (userId: string, newRole: string) => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onRoleChange }) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [localUsers, setLocalUsers] = useState<AdminUser[]>(users);

  // Update local users when props change
  React.useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    
    try {
      // Optimistically update the local state
      setLocalUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: newRole === 'none' ? null : newRole as 'admin' | 'moderator' | 'user' } 
            : user
        )
      );

      // Handle role changes directly here instead of using the hook
      if (newRole === 'none') {
        // Remove all roles
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
      } else {
        // Upsert the new role
        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id,role' });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      // Revert the optimistic update on error
      setLocalUsers(users);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Home Club</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.display_name || '-'}</TableCell>
                <TableCell>{user.username || '-'}</TableCell>
                <TableCell>{user.home_club || '-'}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role || 'No role'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : 'Never'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role || 'none'}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={actionLoading === user.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No role</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {actionLoading === user.id && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
