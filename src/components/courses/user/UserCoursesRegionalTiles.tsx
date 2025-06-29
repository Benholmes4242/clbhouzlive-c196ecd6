
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Flag } from 'lucide-react';

interface RegionalProgress {
  played: number;
  total: number;
}

interface UserCoursesRegionalTilesProps {
  regionProgress: Record<string, RegionalProgress>;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  isLoading: boolean;
}

const UserCoursesRegionalTiles: React.FC<UserCoursesRegionalTilesProps> = ({
  regionProgress,
  activeFilter,
  onFilterChange,
  isLoading
}) => {
  const tiles = [
    {
      key: 'britain-ireland',
      label: 'Top 100 GB&I Played',
      progress: regionProgress['britain-ireland'] || { played: 0, total: 100 }
    },
    {
      key: 'europe',
      label: 'Top 100 Continental Europe Played',
      progress: regionProgress['europe'] || { played: 0, total: 100 }
    },
    {
      key: 'usa',
      label: 'Top100USA',
      progress: regionProgress['usa'] || { played: 0, total: 100 },
      isFlag: true
    },
    {
      key: 'global',
      label: 'Top 100 Worldwide Played',
      progress: regionProgress['global'] || { played: 0, total: 100 }
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 text-center">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {tiles.map((tile) => (
          <Card
            key={tile.key}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeFilter === tile.key
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onFilterChange(activeFilter === tile.key ? null : tile.key)}
          >
            <CardContent className="p-4">
              {tile.isFlag ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Flag className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {tile.label}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">
                    {tile.label}
                  </div>
                  <div className="text-2xl font-bold">
                    {tile.progress.played} / {tile.progress.total}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {activeFilter && (
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterChange(null)}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filter
          </Button>
          <span className="text-sm text-muted-foreground">
            Showing {tiles.find(t => t.key === activeFilter)?.label.replace(' Played', '')} courses
          </span>
        </div>
      )}
    </div>
  );
};

export default UserCoursesRegionalTiles;
