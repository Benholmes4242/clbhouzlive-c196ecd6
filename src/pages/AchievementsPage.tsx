import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const AchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();

  useEffect(() => {
    // Redirect to profile page with achievements tab active
    navigate('/profile?tab=achievements', { replace: true });
  }, [navigate]);

  return null; // This component just redirects
};

export default AchievementsPage;