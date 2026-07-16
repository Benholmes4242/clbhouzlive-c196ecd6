import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const FriendsCoursesSignedOutEmpty: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('courses');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground mb-1">
        <Users className="w-4 h-4" />
      </div>
      <h2 className="text-sm font-semibold">{t('friends.signInTitle')}</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('friends.signInBody')}
      </p>
      <Button className="mt-2" size="sm" onClick={() => navigate('/auth')}>
        {t('friends.signIn')}
      </Button>
    </div>
  );
};

export default FriendsCoursesSignedOutEmpty;
