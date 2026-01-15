
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
  role?: string;
  temp_admin_expires?: string;
}

interface AdminInvitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export const useAdminTeam = () => {
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('id, user_id, first_name, last_name, email, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin profiles:', error);
      } else {
        setAdminProfiles(data || []);
      }
    } catch (error) {
      console.error('Error fetching admin profiles:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('id, email, status, created_at, expires_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
      } else {
        setInvitations(data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const fetchTeamData = async () => {
    setLoading(true);
    await Promise.all([fetchAdminProfiles(), fetchInvitations()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  return {
    adminProfiles,
    invitations,
    loading,
    refetch: fetchTeamData
  };
};
