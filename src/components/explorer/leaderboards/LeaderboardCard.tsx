import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import LeaderboardUserItem from './LeaderboardUserItem';

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  country: string;
  countryFlag: string;
  coursesPlayed: number;
  totalCourses: number;
  avgRating: number;
  mediaUploaded: number;
  globalRank?: number;
}

interface LeaderboardCardProps {
  title: string;
  region: string;
  subtitle: string;
  users: LeaderboardUser[];
  onViewFullLeaderboard: () => void;
  isGlobal?: boolean;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  title,
  region,
  subtitle,
  users,
  onViewFullLeaderboard,
  isGlobal = false
}) => {
  const topUsers = users.slice(0, 5);

  const getFlagComponent = () => {
    if (isGlobal) {
      return <Earth className="h-6 w-6 text-primary" />;
    }
    
    const flagMappings: Record<string, string> = {
      'britain-ireland': 'United Kingdom',
      'usa': 'United States',
      'europe': 'European Union'
    };
    
    const country = flagMappings[region] || region;
    return <CountryFlag country={country} size="lg" className="w-8 h-6" />;
  };

  return (
    <Card className="min-w-0 h-[520px] bg-gradient-to-br from-card to-card/80 border-2 hover:border-primary/20 transition-all duration-300">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-3 text-xl">
            {getFlagComponent()}
            {title}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="w-fit text-xs bg-muted">
          {subtitle}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* User List */}
        <div className="space-y-1">
          {topUsers.map((user, index) => (
            <LeaderboardUserItem
              key={user.id}
              user={user}
              rank={index + 1}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 mt-4">
          <Button 
            variant="link" 
            className="w-full text-primary hover:text-primary/80 p-0 h-auto font-medium"
            onClick={onViewFullLeaderboard}
          >
            View Full Leaderboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardCard;