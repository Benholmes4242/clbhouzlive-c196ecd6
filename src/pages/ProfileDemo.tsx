import React from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';

const ProfileDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader
        userMedia="/lovable-uploads/c61119e7-5f19-471e-85a9-5de43d1a45a0.png"
        userName="Benjamin Holmes"
        username="@benjaminholmes"
        homeClub="Sundridge Park Golf Club"
        isCurrentUser={true}
        mediaType="image"
        onEditProfile={() => console.log('Edit profile clicked')}
      />
      
      {/* Demo content below the header */}
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Profile Content</h2>
        <p className="text-muted-foreground">
          This is a demo of the new Profile Header with dynamic blur and liquid glass card.
          The header features adaptive aspect ratios, responsive sizing, and performance optimizations.
        </p>
      </div>
    </div>
  );
};

export default ProfileDemo;