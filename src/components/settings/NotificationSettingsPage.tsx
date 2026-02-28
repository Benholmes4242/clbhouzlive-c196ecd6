import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SettingsSection, SettingsToggleRow, SettingsSkeleton } from './ui';

interface NotificationPreferences {
  new_follower: boolean;
  post_likes: boolean;
  post_comments: boolean;
  post_shares: boolean;
  tagged_in_post: boolean;
  course_activity: boolean;
  golf_news: boolean;
}

const defaultPrefs: NotificationPreferences = {
  new_follower: true,
  post_likes: true,
  post_comments: true,
  post_shares: true,
  tagged_in_post: true,
  course_activity: false,
  golf_news: false,
};

/**
 * NotificationSettingsPage - Detail screen for in-app notification preferences (Light theme)
 */
export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [preferences, setPreferences] = React.useState<NotificationPreferences>(defaultPrefs);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        const prefs = data.notification_preferences as any;
        setPreferences({
          new_follower: prefs.new_follower ?? true,
          post_likes: prefs.post_likes ?? true,
          post_comments: prefs.post_comments ?? true,
          post_shares: prefs.post_shares ?? true,
          tagged_in_post: prefs.tagged_in_post ?? true,
          course_activity: prefs.course_activity ?? false,
          golf_news: prefs.golf_news ?? false,
        });
      }
    } catch (err) {
      console.error('[NotificationSettings] load error:', err);
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;
    
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_preferences: newPrefs as any })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Settings saved');
    } catch (err) {
      console.error('[NotificationSettings] update error:', err);
      setPreferences(preferences); // Rollback
      toast.error("Couldn't save");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-[#F8FAFC]">
        <DetailHeader title="In-app notifications" onBack={() => navigate('/settings')} />
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
          <SettingsSkeleton sections={[{ title: 'Notifications', rows: 7 }]} />
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
      <DetailHeader title="In-app notifications" onBack={() => navigate('/settings')} />
      
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-28 space-y-6">
        {/* Info note */}
        <div 
          className="flex items-start gap-3 p-4 rounded-[14px] border border-[rgba(31,36,40,0.06)] bg-[#FAFAFB]"
        >
          <Info className="w-4 h-4 text-[#97A1AA] mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-[#5E666D] leading-relaxed">
            Preferences are saved. Push notifications are coming later.
          </p>
        </div>

        <SettingsSection title="Activity">
          <SettingsToggleRow
            title="New followers"
            subtitle="When someone follows you"
            checked={preferences.new_follower}
            onCheckedChange={(v) => updatePreference('new_follower', v)}
            disabled={isSaving}
            isFirst
          />
          <SettingsToggleRow
            title="Likes on your posts"
            subtitle="When someone likes your posts"
            checked={preferences.post_likes}
            onCheckedChange={(v) => updatePreference('post_likes', v)}
            disabled={isSaving}
          />
          <SettingsToggleRow
            title="Comments on your posts"
            subtitle="When someone comments on your posts"
            checked={preferences.post_comments}
            onCheckedChange={(v) => updatePreference('post_comments', v)}
            disabled={isSaving}
          />
          <SettingsToggleRow
            title="Shares"
            subtitle="When someone shares your posts"
            checked={preferences.post_shares}
            onCheckedChange={(v) => updatePreference('post_shares', v)}
            disabled={isSaving}
          />
          <SettingsToggleRow
            title="Tags"
            subtitle="When you're tagged in someone's post"
            checked={preferences.tagged_in_post}
            onCheckedChange={(v) => updatePreference('tagged_in_post', v)}
            disabled={isSaving}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Content">
          <SettingsToggleRow
            title="Course activity"
            subtitle="New posts and reviews at courses you follow"
            checked={preferences.course_activity}
            onCheckedChange={(v) => updatePreference('course_activity', v)}
            disabled={isSaving}
            isFirst
          />
          <SettingsToggleRow
            title="Golf news & events"
            subtitle="Major tournament updates and golf news"
            checked={preferences.golf_news}
            onCheckedChange={(v) => updatePreference('golf_news', v)}
            disabled={isSaving}
            isLast
          />
        </SettingsSection>
      </div>
    </PageRoot>
  );
}

function DetailHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header 
      className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3"
      style={{
        background: 'rgba(248,250,252,0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(31,36,40,0.06)',
        boxShadow: '0 6px 18px rgba(31,36,40,0.06)',
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
      }}
    >
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[rgba(31,36,40,0.06)] transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-[#1F2428]" />
      </button>
      <h1 className="text-lg font-semibold text-[#1F2428]">{title}</h1>
    </header>
  );
}

export default NotificationSettingsPage;
