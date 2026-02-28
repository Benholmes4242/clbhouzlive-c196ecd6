import React from 'react';
import { format } from 'date-fns';
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
  Building2,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldX,
  Trash2,
  Users,
  Pencil,
} from 'lucide-react';
import { useBusinessDetails, useBusinessActions } from '@/hooks/admin/useBusinessDetails';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BusinessDetailDrawerProps {
  businessId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBusinessDeleted?: () => void;
}

export function BusinessDetailDrawer({ businessId, open, onOpenChange, onBusinessDeleted }: BusinessDetailDrawerProps) {
  
  const navigate = useNavigate();
  const { data: business, isLoading, error } = useBusinessDetails(businessId);
  const { loading: actionLoading, verifyBusiness, unverifyBusiness, deleteBusiness } = useBusinessActions();

  const handleVerify = async () => {
    if (!business) return;
    const result = await verifyBusiness(business.id);
    if (result.success) {
      toast.success('Business verified', { description: `${business.name} is now verified` });
    } else {
      toast.error('Error', { description: 'Failed to verify business' });
    }
  };

  const handleUnverify = async () => {
    if (!business) return;
    const result = await unverifyBusiness(business.id);
    if (result.success) {
      toast.success('Verification removed', { description: `${business.name} verification has been removed` });
    } else {
      toast.error('Error', { description: 'Failed to remove verification' });
    }
  };

  const handleDelete = async () => {
    if (!business) return;
    const result = await deleteBusiness(business.id);
    if (result.success) {
      toast.success('Business deleted', { description: `${business.name} has been deleted` });
      onOpenChange(false);
      onBusinessDeleted?.();
    } else {
      toast.error('Error', { description: 'Failed to delete business' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied', { description: `${label} copied to clipboard` });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatAddress = () => {
    if (!business) return null;
    const parts = [
      business.address_line1,
      business.address_line2,
      business.city,
      business.region,
      business.postcode,
      business.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : business.location;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <SheetTitle>Business Details</SheetTitle>
              <SheetDescription>View and manage business information</SheetDescription>
            </SheetHeader>

            {isLoading && <BusinessDetailSkeleton />}

            {error && (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load business details</p>
              </div>
            )}

            {business && (
              <>
                {/* Header Section */}
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {business.logo_url ? (
                      <img src={business.logo_url} alt={business.name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{business.name}</h3>
                      {business.is_verified && (
                        <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                    {business.category && (
                      <Badge variant="secondary" className="text-xs">
                        {business.category}
                      </Badge>
                    )}
                    {business.slug && (
                      <p className="text-sm text-muted-foreground">@{business.slug}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Contact Information</h4>
                  <div className="grid gap-2 text-sm">
                    {business.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${business.email}`} className="text-primary hover:underline">
                          {business.email}
                        </a>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${business.phone}`} className="hover:underline">
                          {business.phone}
                        </a>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {business.website}
                        </a>
                      </div>
                    )}
                    {formatAddress() && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{formatAddress()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Followers" value={business.stats.followersCount} icon={<Users className="h-4 w-4" />} />
                  <StatCard label="Posts" value={business.stats.postsCount} icon={<FileText className="h-4 w-4" />} />
                  <StatCard label="Reviews" value={business.stats.reviewsCount} icon={<FileText className="h-4 w-4" />} />
                </div>

                {/* Description */}
                {business.description && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{business.description}</p>
                    </div>
                  </>
                )}

                {/* Team Members */}
                {business.teamMembers.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-3">Team Members ({business.teamMembers.length})</h4>
                      <div className="space-y-2">
                        {business.teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.profile_photo_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {member.display_name ? getInitials(member.display_name) : '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.display_name || member.username || 'Unknown'}
                              </p>
                              {member.username && (
                                <p className="text-xs text-muted-foreground">@{member.username}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Admin Actions */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {business.is_verified ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUnverify}
                          disabled={!!actionLoading}
                          className="text-orange-600"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <ShieldX className="h-4 w-4 mr-1" />
                          )}
                          Unverify
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleVerify}
                          disabled={!!actionLoading}
                          className="text-emerald-600"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 mr-1" />
                          )}
                          Verify
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/business/${business.slug || business.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Public
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/business/${business.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive" disabled={!!actionLoading}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Business</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{business.name}</strong> and all associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
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
                  <h4 className="font-medium text-sm">Account Information</h4>
                  <div className="grid gap-2 text-sm">
                    <InfoRow
                      label="Business ID"
                      value={business.id}
                      onCopy={() => copyToClipboard(business.id, 'Business ID')}
                    />
                    <InfoRow
                      label="Created"
                      value={format(new Date(business.created_at), 'PPP')}
                    />
                    {business.updated_at && (
                      <InfoRow
                        label="Last Updated"
                        value={format(new Date(business.updated_at), 'PPP')}
                      />
                    )}
                    <InfoRow
                      label="Verification"
                      value={business.is_verified ? 'Verified' : 'Not verified'}
                    />
                    {business.latestVerification && (
                      <InfoRow
                        label="Last Request"
                        value={`${business.latestVerification.status} - ${format(new Date(business.latestVerification.created_at), 'PP')}`}
                      />
                    )}
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

function BusinessDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
