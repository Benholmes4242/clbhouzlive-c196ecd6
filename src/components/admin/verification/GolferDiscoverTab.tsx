import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  MoreHorizontal, 
  UserPlus, 
  ExternalLink, 
  Trophy, 
  Users, 
  Link as LinkIcon,
  Eye,
  XCircle,
  RefreshCw
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
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

interface GolferCandidate {
  user_id: string;
  candidate_state: string;
  profile_completeness_score: number;
  has_external_links: boolean;
  mentions_30d: number;
  unique_mentioners_30d: number;
  course_tags_30d: number;
  top100_course_tags_30d: number;
  followers_count: number;
  last_computed_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    is_verified_golfer: boolean;
  };
}

// Fixed interface for profile fetching
interface ProfileData {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    is_verified_golfer: boolean;
  };

const GolferDiscoverTab = () => {
  const queryClient = useQueryClient();
  const [dismissUserId, setDismissUserId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  const [isRecomputing, setIsRecomputing] = useState(false);

  // Fetch notable candidates
  const { data: candidates, isLoading, refetch } = useQuery({
    queryKey: ['admin-golfer-discover-candidates'],
    queryFn: async () => {
      // First get the signals
      const { data: signals, error: signalsError } = await supabase
        .from('golfer_eligibility_signals')
        .select('*')
        .in('candidate_state', ['notable_candidate', 'high_confidence_candidate'])
        .order('candidate_state', { ascending: false })
        .order('top100_course_tags_30d', { ascending: false });

      if (signalsError) throw signalsError;
      if (!signals || signals.length === 0) return [];

      // Get dismissed user IDs
      const { data: dismissed } = await supabase
        .from('golfer_candidate_overrides')
        .select('user_id')
        .eq('action', 'dismiss');

      const dismissedIds = new Set(dismissed?.map(d => d.user_id) || []);

      // Get already invited user IDs
      const { data: invited } = await supabase
        .from('golfer_verification_invites')
        .select('user_id')
        .eq('status', 'active');

      const invitedIds = new Set(invited?.map(i => i.user_id) || []);

      // Get already with pending request
      const { data: pending } = await supabase
        .from('golfer_verification_requests')
        .select('user_id')
        .eq('status', 'pending');

      const pendingIds = new Set(pending?.map(p => p.user_id) || []);

      // Filter out dismissed, invited, and pending
      const filteredSignals = signals.filter(s => 
        !dismissedIds.has(s.user_id) && 
        !invitedIds.has(s.user_id) &&
        !pendingIds.has(s.user_id)
      );

      // Fetch profiles for remaining
      const userIds = filteredSignals.map(s => s.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, is_verified_golfer')
        .in('id', userIds)
        .eq('is_verified_golfer', false);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return filteredSignals
        .filter(s => profileMap.has(s.user_id))
        .map(s => ({
          ...s,
          profile: profileMap.get(s.user_id)
        })) as GolferCandidate[];
    },
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('invite_golfer_from_discover', {
        p_user_id: userId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Golfer invited to verification');
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-discover-candidates'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('dismiss_golfer_candidate', {
        p_user_id: userId,
        p_reason: reason || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Candidate dismissed');
      setDismissUserId(null);
      setDismissReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-discover-candidates'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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

  const getReasonChips = (candidate: GolferCandidate) => {
    const chips = [];
    if (candidate.top100_course_tags_30d >= 3) {
      chips.push({ label: 'Top 100 activity', icon: Trophy, color: 'bg-amber-500/10 text-amber-600' });
    }
    if (candidate.unique_mentioners_30d >= 3) {
      chips.push({ label: 'Mentioned by others', icon: Users, color: 'bg-blue-500/10 text-blue-600' });
    }
    if (candidate.has_external_links) {
      chips.push({ label: 'External links', icon: LinkIcon, color: 'bg-emerald-500/10 text-emerald-600' });
    }
    if (candidate.followers_count >= 10) {
      chips.push({ label: `${candidate.followers_count} followers`, icon: Users, color: 'bg-purple-500/10 text-purple-600' });
    }
    if (candidate.course_tags_30d >= 5) {
      chips.push({ label: `${candidate.course_tags_30d} courses rated`, icon: Trophy, color: 'bg-orange-500/10 text-orange-600' });
    }
    return chips;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Notable golfers who may qualify for verification. Invite them to request verification.
        </p>
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

      {candidates && candidates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No notable candidates found.</p>
            <p className="text-sm mt-1">Run "Recompute" to scan for new candidates.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {candidates?.map((candidate) => (
          <Card key={candidate.user_id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={candidate.profile?.profile_photo_url || ''} />
                    <AvatarFallback>
                      {candidate.profile?.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {candidate.profile?.display_name || 'Unknown'}
                      </span>
                      {candidate.candidate_state === 'high_confidence_candidate' && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
                          High confidence
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground truncate block">
                      @{candidate.profile?.username || 'unknown'}
                    </span>
                    {/* Reason chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {getReasonChips(candidate).map((chip, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className={`${chip.color} text-xs font-normal`}
                        >
                          <chip.icon className="h-3 w-3 mr-1" />
                          {chip.label}
                        </Badge>
                      ))}
                    </div>
                    {/* Meta line */}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Computed {new Date(candidate.last_computed_at).toLocaleDateString()} • 
                      Top 100: {candidate.top100_course_tags_30d} • 
                      Profile: {candidate.profile_completeness_score}%
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    asChild 
                    variant="ghost" 
                    size="sm"
                  >
                    <Link to={`/profile/${candidate.profile?.username}`} target="_blank">
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
        ))}
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
            <AlertDialogAction
              onClick={() => {
                if (dismissUserId) {
                  dismissMutation.mutate({ userId: dismissUserId, reason: dismissReason });
                }
              }}
            >
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GolferDiscoverTab;
