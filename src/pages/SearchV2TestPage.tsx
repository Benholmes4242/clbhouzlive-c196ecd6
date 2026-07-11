import { useNavigate } from 'react-router-dom';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';

export default function SearchV2TestPage() {
  const navigate = useNavigate();
  return (
    <SearchOverlayV2
      isOpen
      onClose={() => navigate(-1)}
    />
  );
}
