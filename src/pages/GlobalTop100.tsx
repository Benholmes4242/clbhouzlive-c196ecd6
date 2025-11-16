import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';

const GlobalTop100 = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to new Top 100 Hub
    navigate('/top100', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />
      
      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="font-display text-2xl text-muted-foreground">Redirecting to Top 100...</h1>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GlobalTop100;