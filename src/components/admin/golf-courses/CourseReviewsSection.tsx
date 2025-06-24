
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Star, User, Calendar, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CourseRating {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  user_id: string;
  user_profile?: {
    username: string | null;
    display_name: string | null;
  } | null;
}

interface CourseReviewsSectionProps {
  ratings: CourseRating[] | undefined;
  ratingsLoading: boolean;
  onDeleteReview: (reviewId: string) => void;
}

const CourseReviewsSection: React.FC<CourseReviewsSectionProps> = ({
  ratings,
  ratingsLoading,
  onDeleteReview,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Course Reviews</h3>
      
      {ratingsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : ratings && ratings.length > 0 ? (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <Card key={rating.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {rating.user_profile?.display_name || 
                         rating.user_profile?.username || 
                         'Anonymous User'}
                      </span>
                      <div className="flex items-center gap-1">
                        {renderStars(rating.rating)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(rating.review_date)}</span>
                      </div>
                    </div>
                    {rating.review && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {rating.review}
                      </p>
                    )}
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          Delete Review
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this review? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteReview(rating.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Review
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">This course hasn't received any reviews from users.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseReviewsSection;
