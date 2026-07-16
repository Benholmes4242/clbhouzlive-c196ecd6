
import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Calendar, User } from 'lucide-react';

interface EmptyStateProps {
  isOwnProfile: boolean;
  displayName: string;
}

export const SignInRequiredState: React.FC = () => {
  const { t } = useTranslation('courses');
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{t('userCourses.signInTitle')}</h1>
        <p className="text-muted-foreground">
          {t('userCourses.signInBody')}
        </p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{t('userCourses.signInRequired')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('userCourses.signInRequiredBody')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const LoadingState: React.FC = () => {
  const { t } = useTranslation('courses');
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{t('userCourses.loading')}</h1>
        <p className="text-muted-foreground">
          {t('userCourses.loadingBody')}
        </p>
      </div>
    </div>
  );
};

export const UserNotFoundState: React.FC = () => {
  const { t } = useTranslation('courses');
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{t('userCourses.notFound')}</h1>
        <p className="text-muted-foreground">
          {t('userCourses.notFoundBody')}
        </p>
      </div>
    </div>
  );
};

export const EmptyTop100State: React.FC<EmptyStateProps> = ({ isOwnProfile, displayName }) => {
  const { t } = useTranslation('courses');
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
        <h3 className="text-lg font-semibold mb-2">
          {isOwnProfile
            ? t('userCourses.emptyTop100OwnTitle', { defaultValue: 'No Top 100 courses rated yet' })
            : t('userCourses.emptyTop100OtherTitle', { name: displayName.replace("'s", ''), defaultValue: "{{name}} hasn't rated any Top 100 courses yet" })}
        </h3>
        <p className="text-muted-foreground">
          {isOwnProfile
            ? t('userCourses.emptyTop100OwnBody', { defaultValue: "Explore the world's greatest golf courses and rate them to track your journey" })
            : t('userCourses.emptyTop100OtherBody', { defaultValue: 'Check back later to see their golf course journey' })}
        </p>
      </CardContent>
    </Card>
  );
};

export const EmptyRecentState: React.FC<EmptyStateProps> = ({ isOwnProfile, displayName }) => {
  const { t } = useTranslation('courses');
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          {isOwnProfile
            ? t('userCourses.emptyRecentOwnTitle', { defaultValue: 'No recent activity' })
            : t('userCourses.emptyRecentOtherTitle', { name: displayName.replace("'s", ''), defaultValue: '{{name}} has no recent activity' })}
        </h3>
        <p className="text-muted-foreground">
          {isOwnProfile
            ? t('userCourses.emptyRecentOwnBody', { defaultValue: "Play some courses in the last 30 days and they'll appear here" })
            : t('userCourses.emptyRecentOtherBody', { defaultValue: 'No courses played in the last 30 days' })}
        </p>
      </CardContent>
    </Card>
  );
};

