import React from 'react';

const AchievementsPage: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/20" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full animate-slow-spin" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-0 py-8">
        <div className="text-center space-y-8">
          {/* Glowing header */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-30 animate-pulse" />
            <h1 className="relative text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Achievements
            </h1>
          </div>
          
          {/* Glowing subtitle */}
          <div className="relative">
            <div className="absolute inset-0 bg-muted/20 blur-2xl rounded-full" />
            <p className="relative text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
              Your journey of excellence awaits. Unlock badges, earn XP, and celebrate your milestones in the world of golf.
            </p>
          </div>
          
          {/* Coming soon badge with glow */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-lg rounded-full animate-pulse" />
            <div className="relative bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-full px-8 py-4 backdrop-blur-sm">
              <span className="text-foreground/90 font-medium">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;