import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/telemetry';
import type { AdminUser } from '@/hooks/useAdmin';

interface UsersTableProps {
  users: AdminUser[];
  readOnly?: boolean;
}

export function UsersTable({ users, readOnly = false }: UsersTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [localUsers, setLocalUsers] = useState<AdminUser[]>(users);
  const [searchQuery, setSearchQuery] = useState("");

  // Track page open
  useEffect(() => {
    track("admin_users_opened");
  }, []);

  // Update local users when props change
  React.useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Filter users based on search query
  const filteredUsers = localUsers.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.id?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (readOnly) return;
    
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
        // Upsert the new role
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
    if (readOnly) return;
    
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
      
      toast.success("Password reset sent");
      track("admin_password_reset", { target_user_id: userId });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error("Couldn't send reset email", { description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (readOnly) return;
    
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
      track("admin_user_deleted", { target_user_id: userId });
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

  if (localUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users Management</span>
            {readOnly && (
              <Badge variant="secondary">Read Only</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-12 text-center space-y-3">
            <div className="text-sm font-medium">No users found</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Users will appear here once they sign up for the application.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredUsers.length === 0 && searchQuery.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users Management</span>
            {readOnly && (
              <Badge variant="secondary">Read Only</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Search by email, ID, name, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <div className="p-12 text-center space-y-3">
            <div className="text-sm font-medium">No users match your search</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Try a different search term
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Users Management</span>
          {readOnly && (
            <Badge variant="secondary">Read Only</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sticky search bar on mobile */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 -mx-6 px-6 py-3 sm:mx-0 sm:px-0 sm:py-0 sm:static">
          <Input
            type="text"
            placeholder="Search by email, ID, name, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-md"
          />
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Home Club</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Sign In</TableHead>
                {!readOnly && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
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
                {!readOnly && (
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
                        <SelectContent>
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
                )}
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="rounded-lg border p-4 space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium break-all">{user.email}</div>
                <div className="text-xs text-muted-foreground break-all">ID: {user.id}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Display Name</div>
                  <div className="font-medium">{user.display_name || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Username</div>
                  <div className="font-medium">{user.username || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Home Club</div>
                  <div className="font-medium">{user.home_club || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Sign In</div>
                  <div className="font-medium">
                    {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'Never'
                    }
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>

              {!readOnly && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-9"
                    disabled={actionLoading === user.id}
                    onClick={() => handlePasswordReset(user.id, user.email)}
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Reset Password
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 text-xs h-9"
                    disabled={actionLoading === user.id}
                    onClick={() => handleDeleteUser(user.id, user.email)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              )}

              {actionLoading === user.id && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
