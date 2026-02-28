import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BadgeCheck,
  Calendar,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Star,
  Trash2,
  UserMinus,
  Users,
  Zap,
} from 'lucide-react';
import { useUserDetails, useUserActions, type UserDetailData } from '@/hooks/admin/useUserDetails';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UserDetailDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeleted?: () => void;
}

export function UserDetailDrawer({ userId, open, onOpenChange, onUserDeleted }: UserDetailDrawerProps) {
  
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useUserDetails(userId);
  const { loading: actionLoading, changeRole, deleteUser, resetPassword } = useUserActions();

  const handleRoleChange = async (newRole: string) => {
    if (!user) return;
    const result = await changeRole(user.id, newRole);
    if (result.success) {
      toast.success('Role updated', { description: `User role changed to ${newRole}` });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', userId] });
    } else {
      toast.error('Failed to update role');
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    const result = await resetPassword(user.id, user.email);
    if (result.success) {
      toast.success('Success', { description: `Password reset email sent to ${user.email}` });
    } else {
      toast.error('Failed to send reset email');
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    const result = await deleteUser(user.id, user.email);
    if (result.success) {
      toast.success('User deleted', { description: `${user.email} has been deleted` });
      onOpenChange(false);
      onUserDeleted?.();
    } else {
      toast.error('Failed to delete user');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied', { description: `${label} copied to clipboard` });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
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

  const getEventIcon = (eventName: string) => {
    if (eventName.includes('post')) return <FileText className="h-3 w-3" />;
    if (eventName.includes('comment')) return <MessageSquare className="h-3 w-3" />;
    if (eventName.includes('follow')) return <Users className="h-3 w-3" />;
    if (eventName.includes('rating') || eventName.includes('review')) return <Star className="h-3 w-3" />;
    return <Zap className="h-3 w-3" />;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <SheetTitle>User Details</SheetTitle>
              <SheetDescription>View and manage user information</SheetDescription>
            </SheetHeader>

            {isLoading && <UserDetailSkeleton />}

            {error && (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load user details</p>
              </div>
            )}

            {user && (
              <>
                {/* Header Section */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.email} />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.display_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {user.display_name || user.email}
                      </h3>
                      {user.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    {user.username && (
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    )}
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1">
                      {user.role || 'No role'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Posts" value={user.stats.postsCount} icon={<FileText className="h-4 w-4" />} />
                  <StatCard label="Reviews" value={user.stats.reviewsCount} icon={<Star className="h-4 w-4" />} />
                  <StatCard label="Followers" value={user.stats.followersCount} icon={<Users className="h-4 w-4" />} />
                  <StatCard label="XP" value={user.stats.xp} icon={<Zap className="h-4 w-4" />} />
                </div>

                <Separator />

                {/* Activity Timeline */}
                <div>
                  <h4 className="font-medium mb-3">Recent Activity</h4>
                  {user.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    <div className="space-y-2">
                      {user.recentActivity.map((event) => (
                        <div key={event.id} className="flex items-start gap-3 text-sm p-2 rounded-lg bg-muted/50">
                          <div className="mt-0.5 text-muted-foreground">
                            {getEventIcon(event.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.name.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Admin Actions */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Change Role</label>
                      <Select
                        value={user.role || 'none'}
                        onValueChange={handleRoleChange}
                        disabled={!!actionLoading}
                      >
                        <SelectTrigger className="w-full">
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
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetPassword}
                        disabled={!!actionLoading}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Reset Password
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/golfer/${user.username || user.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-orange-600" disabled={!!actionLoading}>
                            <UserMinus className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Suspend User</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will suspend <strong>{user.email}</strong>. They will not be able to log in.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-orange-600 hover:bg-orange-700">
                              Suspend
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive" disabled={!!actionLoading}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{user.email}</strong> and all their data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteUser}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Account Info */}
                <div className="space-y-3">
                  <h4 className="font-medium">Account Information</h4>
                  <div className="grid gap-2 text-sm">
                    <InfoRow
                      label="User ID"
                      value={user.id}
                      onCopy={() => copyToClipboard(user.id, 'User ID')}
                    />
                    <InfoRow
                      label="Created"
                      value={format(new Date(user.created_at), 'PPP')}
                    />
                    {user.home_club && (
                      <InfoRow label="Home Club" value={user.home_club} />
                    )}
                    <InfoRow
                      label="Visibility"
                      value={user.is_public ? 'Public' : 'Private'}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
      </div>
      <div className="text-lg font-semibold">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function InfoRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono text-xs truncate max-w-[180px]">{value}</span>
        {onCopy && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopy}>
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
