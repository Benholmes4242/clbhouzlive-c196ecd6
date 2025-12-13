import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  MoreHorizontal, 
  UserPlus, 
  Trophy, 
  Users, 
  Link as LinkIcon,
  Eye,
  XCircle,
  RefreshCw,
  Search,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  useAdminDiscoverNotableGolfers,
  useAdminInviteGolferVerification,
  useAdminDismissGolferCandidate,
  useAdminDiscoverRealtime,
  getReasonChips,
  type DiscoverFilters,
  type DiscoverGolferRow,
} from '@/hooks/useAdminDiscoverGolfers';

const GolferDiscoverTab = () => {
  const [filters, setFilters] = useState<DiscoverFilters>({
    state: 'all',
    sort: 'confidence',
  });
  const [searchInput, setSearchInput] = useState('');
  const [dismissUserId, setDismissUserId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  const [isRecomputing, setIsRecomputing] = useState(false);

  // Apply search with debounce effect handled by setting filters
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setFilters(f => ({ ...f, search: value }));
  };

  const { data: candidates, isLoading, refetch } = useAdminDiscoverNotableGolfers(filters);
  const inviteMutation = useAdminInviteGolferVerification();
  const dismissMutation = useAdminDismissGolferCandidate();

  // Subscribe to realtime updates
  useAdminDiscoverRealtime();

  // Recompute signals
  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      const { data, error } = await supabase.functions.invoke('compute-golfer-eligibility-signals');
      if (error) throw error;
      toast.success(`Signals recomputed. Processed ${data?.processed || 0} profiles.`);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to recompute: ${error.message}`);
    } finally {
      setIsRecomputing(false);
    }
  };

  const handleDismiss = () => {
    if (dismissUserId) {
      dismissMutation.mutate({ userId: dismissUserId, reason: dismissReason });
      setDismissUserId(null);
      setDismissReason('');
    }
  };

  const renderChip = (chip: { label: string; kind: 'neutral' | 'strong' }, index: number) => {
    const baseClass = 'text-xs font-normal';
    const colorClass = chip.kind === 'strong' 
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      : 'bg-muted text-muted-foreground';

    // Choose icon based on label
    let Icon = Sparkles;
    if (chip.label.includes('Top 100')) Icon = Trophy;
    else if (chip.label.includes('followers') || chip.label.includes('Mentioned')) Icon = Users;
    else if (chip.label.includes('External') || chip.label.includes('links')) Icon = LinkIcon;
    else if (chip.label.includes('Complete')) Icon = CheckCircle;

    return (
      <Badge key={index} variant="secondary" className={`${baseClass} ${colorClass}`}>
        <Icon className="h-3 w-3 mr-1" />
        {chip.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Notable golfers who may qualify for verification. Invite them to request verification.
          </p>
          {candidates && candidates.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecompute}
          disabled={isRecomputing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRecomputing ? 'animate-spin' : ''}`} />
          Recompute
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or username..."
                className="pl-9"
              />
            </div>
          </div>

          {/* State filter */}
          <div className="w-[180px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Confidence</Label>
            <Select
              value={filters.state}
              onValueChange={(v) => setFilters(f => ({ ...f, state: v as DiscoverFilters['state'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All candidates</SelectItem>
                <SelectItem value="high_confidence_candidate">High confidence</SelectItem>
                <SelectItem value="notable_candidate">Notable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="w-[160px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Sort by</Label>
            <Select
              value={filters.sort || 'confidence'}
              onValueChange={(v) => setFilters(f => ({ ...f, sort: v as DiscoverFilters['sort'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="top100">Top 100 activity</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="recent">Recently computed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Has links toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="hasLinks"
              checked={filters.hasLinks || false}
              onCheckedChange={(checked) => setFilters(f => ({ ...f, hasLinks: checked || undefined }))}
            />
            <Label htmlFor="hasLinks" className="text-sm cursor-pointer">Has links</Label>
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {candidates && candidates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No notable candidates found.</p>
            <p className="text-sm mt-1">Run "Recompute" to scan for new candidates, or adjust filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Candidate list */}
      <div className="space-y-3">
        {candidates?.map((candidate) => {
          const chips = getReasonChips(candidate);

          return (
            <Card key={candidate.user_id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Avatar + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={candidate.profile_photo_url || ''} />
                      <AvatarFallback>
                        {candidate.display_name?.charAt(0) || candidate.username?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {candidate.display_name || candidate.username || 'Unknown'}
                        </span>
                        {candidate.candidate_state === 'high_confidence_candidate' && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                            High confidence
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground truncate block">
                        @{candidate.username || 'unknown'}
                      </span>
                      {/* Reason chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {chips.map((chip, i) => renderChip(chip, i))}
                      </div>
                      {/* Meta line */}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Computed {new Date(candidate.last_computed_at).toLocaleDateString()} •
                        Top 100: {candidate.top100_course_tags_30d} •
                        Followers: {candidate.followers_count} •
                        Profile: {candidate.profile_completeness_score}%
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/${candidate.username}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => inviteMutation.mutate(candidate.user_id)}
                      disabled={inviteMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Invite
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDismissUserId(candidate.user_id)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dismiss Dialog */}
      <AlertDialog open={!!dismissUserId} onOpenChange={() => setDismissUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss candidate</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the candidate from the Discover list. You can optionally add a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Reason (optional)"
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismiss}>
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GolferDiscoverTab;
