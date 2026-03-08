import { useParams } from 'react-router-dom';
import { CreatorSection } from '@/components/creator-mode/CreatorSection';
import PageRoot from '@/components/layout/PageRoot';

export default function CreatorTestPage() {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return (
      <PageRoot>
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Missing userId parameter
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot>
      <div className="max-w-lg mx-auto py-6 space-y-4">
        <h1 className="text-lg font-bold text-foreground px-3">Creator Section Test</h1>
        <CreatorSection userId={userId} isOwnProfile />
      </div>
    </PageRoot>
  );
}
