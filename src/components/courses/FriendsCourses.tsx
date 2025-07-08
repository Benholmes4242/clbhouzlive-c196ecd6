
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Users, Globe } from 'lucide-react';

const FriendsCourses = () => {
  const navigate = useNavigate();

  // Automatically redirect to Top 100 Explorer
  useEffect(() => {
    navigate('/top100-explorer');
  }, [navigate]);

  return null; // No need to render anything since we're redirecting
};

export default FriendsCourses;
