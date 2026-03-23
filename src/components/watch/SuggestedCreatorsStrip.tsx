import { useNavigate } from 'react-router-dom';
import { SuggestedCreatorsShelf } from '@/components/shared/SuggestedCreatorsShelf';

interface SuggestedCreatorsStripProps {
  userId: string | undefined;
}

export default function SuggestedCreatorsStrip({ userId }: SuggestedCreatorsStripProps) {
  const navigate = useNavigate();

  return (
    <SuggestedCreatorsShelf
      userId={userId}
      title="People to follow"
      showViewAll={true}
      onViewAll={() => navigate('/golfers')}
    />
  );
}
