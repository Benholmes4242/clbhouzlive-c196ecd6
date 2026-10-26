import { createRoot } from 'react-dom/client';
import './index.css';
import { HolePhotoBatchPath } from '@/components/course-media-tab/HolePhotoFastPaths';
const q = new URLSearchParams(location.search); const n = Number(q.get('n') ?? 12); const admin = q.get('admin') === '1';
const photos = Array.from({ length: n }, (_, i) => ({ url: `https://picsum.photos/seed/g${i}/800/600`, createdAt: '2026-09-01T00:00:00Z', ownerName: admin ? 'Thomas Holmes' : undefined, exif: { captureDay: null, capturedAt: null, latitude: null, longitude: null } }));
createRoot(document.getElementById('root')!).render(<HolePhotoBatchPath adminMode={admin} photos={photos} knownHoles={Array.from({ length: 18 }, (_, i) => i + 1)} existingHoleTags={[9]} onTag={async () => { await new Promise(r => setTimeout(r, 200)); return { status: 'approved' } as never; }} onClose={() => {}} />);
