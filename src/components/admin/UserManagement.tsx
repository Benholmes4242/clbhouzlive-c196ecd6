
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AdminUser } from '@/hooks/useAdmin';

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
            ? { ...user, role: newRole === 'none' ? null : newRole as 'admin' | 'moderator' | 'user' | 'limited_admin' } 
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
        // Upsert the new role - fix the TypeScript error by ensuring proper typing
        const roleData = { 
          user_id: userId, 
          role: newRole as 'admin' | 'moderator' | 'user' | 'limited_admin'
        };
        await supabase
          .from('user_roles')
          .upsert(roleData, { onConflict: 'user_id,role' });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      // Revert the optimistic update on error
      setLocalUsers(users);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePasswordReset = async (userId: string, userEmail: string) => {
    setActionLoading(userId);
    
    try {
      // Use secure admin operations endpoint
      const { data, error } = await supabase.functions.invoke('secure-admin-operations', {
        body: {
          action: 'reset_password',
          targetUserId: userId,
          targetEmail: userEmail,
          reason: 'Admin requested password reset'
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast.success("Success", { description: `Password reset email sent to ${userEmail}` });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error("Error", { description: `Failed to send password reset: ${error.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    setActionLoading(userId);
    
    try {
      // Use secure admin operations endpoint with additional verification
      const { data, error } = await supabase.functions.invoke('secure-admin-operations', {
        body: {
          action: 'delete_user',
          targetUserId: userId,
          targetEmail: userEmail,
          reason: 'Admin requested user deletion'
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Remove user from local state only after successful deletion
      setLocalUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast.success("User deleted");
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error("Couldn't delete user", { description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'limited_admin': return 'default';
      case 'moderator': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'limited_admin': return 'Limited Admin';
      case 'admin': return 'Admin';
      case 'moderator': return 'Moderator';
      case 'user': return 'User';
      default: return 'No role';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile: Card layout */}
        <div className="block md:hidden space-y-3">
          {localUsers.map((user) => (
            <div key={user.id} className="border border-border rounded-sq-sm p-3 space-y-2">
              {/* Row 1: Name + Role */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{user.display_name || user.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <Badge variant={getRoleBadgeVariant(user.role)} className="shrink-0">
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
              
              {/* Row 2: Meta info */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                {user.username && <div>@{user.username}</div>}
                {user.home_club && <div>{user.home_club}</div>}
                <div>
                  Last sign in: {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : 'Never'
                  }
                </div>
              </div>
              
              {/* Row 3: Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Select
                  value={user.role || 'none'}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={actionLoading === user.id}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="none">No role</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="limited_admin">Limited Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === user.id}
                        className="flex-1 text-blue-600 hover:text-blue-600"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Reset Password
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Send Password Reset</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will send a password reset email to <strong>{user.email}</strong>. 
                          The user will receive an email with instructions to reset their password.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handlePasswordReset(user.id, user.email)}
                          className="w-full sm:w-auto"
                        >
                          Send Reset Email
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === user.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the user <strong>{user.email}</strong>? 
                          This action cannot be undone and will permanently remove the user and all their data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  {actionLoading === user.id && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden md:block">
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
                      {getRoleDisplayName(user.role)}
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
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          <SelectItem value="none">No role</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="limited_admin">Limited Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === user.id}
                            className="text-blue-600 hover:text-blue-600"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Send Password Reset</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will send a password reset email to <strong>{user.email}</strong>. 
                              The user will receive an email with instructions to reset their password.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePasswordReset(user.id, user.email)}
                            >
                              Send Reset Email
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === user.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the user <strong>{user.email}</strong>? 
                              This action cannot be undone and will permanently remove the user and all their data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      {actionLoading === user.id && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
