import React from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';

const ProfileDemo = () => {
  const sampleUserData = {
    userMedia: "/lovable-uploads/c61119e7-5f19-471e-85a9-5de43d1a45a0.png",
    userName: "Benjamin Holmes",
    username: "@benjaminholmes",
    homeClub: "Sundridge Park Golf Club",
    isCurrentUser: true,
    mediaType: "image" as const
  };

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader
        userMedia={sampleUserData.userMedia}
        userName={sampleUserData.userName}
        username={sampleUserData.username}
        homeClub={sampleUserData.homeClub}
        isCurrentUser={sampleUserData.isCurrentUser}
        mediaType={sampleUserData.mediaType}
        onEditProfile={() => console.log('Edit profile clicked')}
      />
      
      {/* Demo content below the header */}
      <div className="p-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Profile Header Demo</h2>
            <p className="text-muted-foreground leading-relaxed">
              This profile header showcases the dynamic blur + liquid glass adaptive card design. 
              The header features a blurred background generated from the user's media, with a centered 
              frosted-glass card that adapts its aspect ratio based on the uploaded content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Key Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Dynamic blur background from user media</li>
                <li>• Adaptive aspect ratio (4:5 to 16:9)</li>
                <li>• Responsive sizing across all devices</li>
                <li>• Performance optimized with IntersectionObserver</li>
                <li>• Accessibility support (prefers-reduced-motion)</li>
                <li>• Liquid glass effects with backdrop blur</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Performance</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Lazy loading for media content</li>
                <li>• GPU-accelerated animations</li>
                <li>• Optimized for mobile and tablet</li>
                <li>• Graceful fallbacks for low-end devices</li>
                <li>• Video compression and poster images</li>
                <li>• Edge caching ready</li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-muted/50 border">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Implementation Notes</h3>
            <p className="text-muted-foreground">
              The component automatically detects media dimensions and adapts the card aspect ratio. 
              Videos include autoplay with respect for user preferences, and the blur background 
              shows live motion for dynamic content. The design maintains readability with proper 
              text shadows and frosted glass backgrounds for UI elements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDemo;