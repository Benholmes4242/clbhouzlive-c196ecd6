
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface ManualHandicapCardProps {
  handicapIndex: number;
  homeClub: string;
  onEdit: () => void;
}

const ManualHandicapCard: React.FC<ManualHandicapCardProps> = ({
  handicapIndex,
  homeClub,
  onEdit,
}) => {
  const formatHandicap = (handicap: number) => {
    if (handicap < 0) {
      return `+${Math.abs(handicap)}`;
    }
    return handicap.toString();
  };

  return (
    <Card className="bg-white border shadow-sm">
      <CardContent className="p-4 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="absolute top-2 right-2 p-1 h-6 w-6"
        >
          <Edit className="h-3 w-3" />
        </Button>
        
        <div className="space-y-1">
          <h4 className="text-red-500 text-sm font-medium">My Handicap Index®</h4>
          <div className="text-4xl font-bold text-gray-900">
            {formatHandicap(handicapIndex)}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Home Club:</span> {homeClub}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualHandicapCard;
