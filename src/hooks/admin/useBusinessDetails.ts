import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface BusinessStats {
  followersCount: number;
  postsCount: number;
  reviewsCount: number;
}

export interface TeamMember {
  id: string;
  user_profile_id: string;
  role: string;
  created_at: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
}

export interface VerificationRequest {
  id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  note: string | null;
}

export interface BusinessDetailData {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
  country: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string | null;
  stats: BusinessStats;
  teamMembers: TeamMember[];
  latestVerification: VerificationRequest | null;
}

export function useBusinessDetails(businessId: string | null) {
  return useQuery({
    queryKey: ['admin-business-details', businessId],
    queryFn: async (): Promise<BusinessDetailData | null> => {
      if (!businessId) return null;

      // Fetch business profile
      const { data: business, error: businessError } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();

      if (businessError) {
        console.error('Error fetching business:', businessError);
        throw businessError;
      }

      if (!business) return null;

      // Fetch stats, team members, and verification in parallel
      const [followersResult, teamResult, verificationResult] = await Promise.all([
        supabase
          .from('business_follows')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId),
        supabase
          .from('business_team_members')
          .select('id, user_profile_id, role, created_at')
          .eq('business_id', businessId),
        supabase
          .from('business_verification_requests')
          .select('id, status, created_at, reviewed_at, note')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      // Fetch user profiles for team members
      const teamMemberIds = (teamResult.data || []).map((m: { user_profile_id: string }) => m.user_profile_id);
      let profilesMap: Record<string, { display_name: string | null; username: string | null; profile_photo_url: string | null }> = {};
      
      if (teamMemberIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', teamMemberIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { display_name: p.display_name, username: p.username, profile_photo_url: p.profile_photo_url };
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      // Process team members
      const teamMembers: TeamMember[] = (teamResult.data || []).map((member: { id: string; user_profile_id: string; role: string; created_at: string }) => ({
        id: member.id,
        user_profile_id: member.user_profile_id,
        role: member.role,
        created_at: member.created_at,
        display_name: profilesMap[member.user_profile_id]?.display_name || null,
        username: profilesMap[member.user_profile_id]?.username || null,
        profile_photo_url: profilesMap[member.user_profile_id]?.profile_photo_url || null,
      }));

      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        category: business.category,
        description: business.description,
        email: business.email,
        phone: business.phone,
        website: business.website,
        location: business.location,
        address_line1: business.address_line1,
        address_line2: business.address_line2,
        city: business.city,
        region: business.region,
        postcode: business.postcode,
        country: business.country,
        logo_url: business.logo_url,
        cover_image_url: business.cover_image_url,
        is_verified: business.is_verified || false,
        created_at: business.created_at || new Date().toISOString(),
        updated_at: business.updated_at,
        stats: {
          followersCount: followersResult.count || 0,
          postsCount: 0, // Posts are not linked to businesses directly
          reviewsCount: 0, // Business reviews not implemented yet
        },
        teamMembers,
        latestVerification: verificationResult.data,
      };
    },
    enabled: !!businessId,
    staleTime: 30000,
  });
}

export function useBusinessActions() {
  const [loading, setLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const verifyBusiness = useCallback(async (businessId: string) => {
    setLoading(businessId);
    try {
      const { error } = await supabase
        .from('business_accounts')
        .update({ 
          is_verified: true, 
          verified_at: new Date().toISOString(),
          last_verification_action: 'approved'
        })
        .eq('id', businessId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['admin-business-details', businessId] });
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      
      return { success: true };
    } catch (error) {
      console.error('Error verifying business:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, [queryClient]);

  const unverifyBusiness = useCallback(async (businessId: string) => {
    setLoading(businessId);
    try {
      const { error } = await supabase
        .from('business_accounts')
        .update({ 
          is_verified: false,
          verified_at: null,
          last_verification_action: 'revoked'
        })
        .eq('id', businessId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['admin-business-details', businessId] });
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      
      return { success: true };
    } catch (error) {
      console.error('Error unverifying business:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, [queryClient]);

  const deleteBusiness = useCallback(async (businessId: string) => {
    setLoading(businessId);
    try {
      // Soft delete by setting is_deleted flag
      const { error } = await supabase
        .from('business_accounts')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting business:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, [queryClient]);

  return {
    loading,
    verifyBusiness,
    unverifyBusiness,
    deleteBusiness,
  };
}
