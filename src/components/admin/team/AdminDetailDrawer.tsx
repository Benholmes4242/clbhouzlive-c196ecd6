import React, { useState } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  CalendarIcon,
  Clock,
  Copy,
  Loader2,
  Shield,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useAdminDetails, useAdminTeamActions, type AdminDetailData } from '@/hooks/admin/useAdminTeamDetails';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface AdminDetailDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdminRevoked?: () => void;
}

export function AdminDetailDrawer({ userId, open, onOpenChange, onAdminRevoked }: AdminDetailDrawerProps) {
  const queryClient = useQueryClient();
  const { data: admin, isLoading, error } = useAdminDetails(userId);
  const { loading: actionLoading, updateRole, extendAccess, revokeAccess } = useAdminTeamActions();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (!admin) return;
    const result = await updateRole(admin.user_id, newRole as 'full' | 'limited');
    if (result.success) {
      toast.success('Role updated', { description: `Admin role changed to ${newRole}` });
      queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-detail', userId] });
    } else {
      toast.error('Error', { description: 'Failed to update role' });
    }
  };

  const handleExtendAccess = async () => {
    if (!admin || !selectedDate) return;
    const result = await extendAccess(admin.user_id, selectedDate.toISOString());
    if (result.success) {
      toast.success('Access extended', { description: `Access extended to ${format(selectedDate, 'PPP')}` });
      queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-detail', userId] });
      setSelectedDate(undefined);
      setDatePickerOpen(false);
    } else {
      toast.error('Error', { description: 'Failed to extend access' });
    }
  };

  const handleRevokeAccess = async () => {
    if (!admin) return;
    const result = await revokeAccess(admin.user_id, admin.email);
    if (result.success) {
      toast.success('Access revoked', { description: `${admin.email} has been removed from the team` });
      onOpenChange(false);
      onAdminRevoked?.();
    } else {
      toast.error('Error', { description: 'Failed to revoke access' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied', { description: `${label} copied to clipboard` });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: 'active' | 'expiring' | 'expired', expiresAt: string | null) => {
    if (status === 'expired') {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (status === 'expiring' && expiresAt) {
      const days = differenceInDays(new Date(expiresAt), new Date());
      return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Expires in {days}d</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'full') {
      return (
        <Badge variant="default" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Full Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Shield className="h-3 w-3" />
        Limited Admin
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    if (action.includes('invite')) return <User className="h-3 w-3" />;
    if (action.includes('role')) return <Shield className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <SheetTitle>Admin Details</SheetTitle>
              <SheetDescription>View and manage admin access</SheetDescription>
            </SheetHeader>

            {isLoading && <AdminDetailSkeleton />}

            {error && (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load admin details</p>
              </div>
            )}

            {admin && (
              <>
                {/* Header Section */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={admin.avatar_url || undefined} alt={`${admin.first_name} ${admin.last_name}`} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {getInitials(admin.first_name, admin.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold truncate">
                      {admin.first_name} {admin.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">{admin.email}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getRoleBadge(admin.role)}
                      {getStatusBadge(admin.status, admin.expires_at)}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Access Info */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Access Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Granted</span>
                      <span>{admin.granted_at ? format(new Date(admin.granted_at), 'PPP') : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires</span>
                      <span className={cn(
                        admin.status === 'expired' && 'text-destructive',
                        admin.status === 'expiring' && 'text-yellow-600'
                      )}>
                        {admin.expires_at 
                          ? `${format(new Date(admin.expires_at), 'PPP')} (${formatDistanceToNow(new Date(admin.expires_at), { addSuffix: true })})`
                          : 'Never'
                        }
                      </span>
                    </div>
                    {admin.granted_by_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Granted by</span>
                        <span>{admin.granted_by_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div>
                  <h4 className="font-medium mb-3">Recent Activity</h4>
                  {admin.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    <div className="space-y-2">
                      {admin.recentActivity.map((event) => (
                        <div key={event.id} className="flex items-start gap-3 text-sm p-2 rounded-lg bg-muted/50">
                          <div className="mt-0.5 text-muted-foreground">
                            {getActionIcon(event.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.action.replace(/_/g, ' ')}</p>
                            {event.target_email && (
                              <p className="text-xs text-muted-foreground truncate">Target: {event.target_email}</p>
                            )}
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
                        value={admin.role}
                        onValueChange={handleRoleChange}
                        disabled={!!actionLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Admin</SelectItem>
                          <SelectItem value="limited">Limited Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Extend Access</label>
                      <div className="flex gap-2">
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                              disabled={!!actionLoading}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : "Select new expiry date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        {selectedDate && (
                          <Button onClick={handleExtendAccess} disabled={!!actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                          </Button>
                        )}
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full text-destructive hover:text-destructive" 
                          disabled={!!actionLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Revoke Access
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke Admin Access</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <strong>{admin.email}</strong> from the admin team. They will no longer have access to the admin panel.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRevokeAccess}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revoke Access'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>

                <Separator />

                {/* Account Info */}
                <div className="space-y-3">
                  <h4 className="font-medium">Account Information</h4>
                  <div className="grid gap-2 text-sm">
                    <InfoRow
                      label="User ID"
                      value={admin.user_id}
                      onCopy={() => copyToClipboard(admin.user_id, 'User ID')}
                    />
                    <InfoRow
                      label="Admin Profile ID"
                      value={admin.id}
                      onCopy={() => copyToClipboard(admin.id, 'Profile ID')}
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

function AdminDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-24 rounded-lg" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
