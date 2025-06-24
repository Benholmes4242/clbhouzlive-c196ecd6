
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface EmptyCoursesStateProps {
  searchTerm: string;
}

const EmptyCoursesState: React.FC<EmptyCoursesStateProps> = ({ searchTerm }) => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No courses found</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm 
            ? "No courses match your search criteria."
            : "No courses found in the selected region."
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyCoursesState;
