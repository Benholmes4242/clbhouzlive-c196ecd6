import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy, Globe } from 'lucide-react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { TopTenEditor } from './courses/TopTenEditor';
import { CoursesPlayedGrid } from './courses/CoursesPlayedGrid';

interface ProfileCoursesTabProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ProfileCoursesTab: React.FC<ProfileCoursesTabProps> = ({
  userId,
  isOwnProfile,
}) => {
  const navigate = useNavigate();
  const { totalCoursesPlayed, countriesPlayed, top100Progress, isLoading } =
    useUserCourseSummary(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Golf Journey Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Golf Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Courses Played */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totalCoursesPlayed}</div>
            </div>
            <div className="text-sm text-muted-foreground">Courses Played</div>
          </div>

          {/* Countries Played */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{countriesPlayed}</div>
            </div>
            <div className="text-sm text-muted-foreground">Countries Played</div>
          </div>

          {/* Top 100 Progress Cards */}
          {top100Progress.slice(0, 2).map((progress) => (
            <div
              key={progress.listSlug}
              onClick={() => navigate(`/top100/${progress.listSlug}`)}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 cursor-pointer hover:bg-card/70 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">
                  {progress.played}/{progress.total}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {progress.listName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 Editor */}
      <TopTenEditor userId={userId} isOwnProfile={isOwnProfile} />

      {/* Courses Played Grid */}
      <CoursesPlayedGrid userId={userId} />
    </div>
  );
};
