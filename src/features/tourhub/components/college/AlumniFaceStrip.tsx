import { Link } from 'react-router-dom';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';

interface AlumniFaceStripProps {
  alumni: AlumniFace[];
  collegeName: string;
  collegeSlug: string;
  totalAlumniCount: number;
}

export function AlumniFaceStrip({ alumni, collegeName, collegeSlug, totalAlumniCount }: AlumniFaceStripProps) {
  if (!alumni.length) return null;

  return (
    <div className="relative z-10 mx-4" style={{ marginTop: -20 }}>
      <Link
        to={`/tourhub/college-golf/${collegeSlug}`}
        className="flex items-center gap-2 active:opacity-80 transition-opacity"
      >
        {/* Overlapping face circles */}
        <div className="flex" style={{ marginLeft: 4 }}>
          {alumni.slice(0, 5).map((a, i) => (
            <div
              key={a.id}
              className="rounded-full border-2 border-background overflow-hidden bg-muted"
              style={{
                width: 32,
                height: 32,
                marginLeft: i > 0 ? -8 : 0,
                zIndex: 10 - i,
                position: 'relative',
              }}
            >
              {a.photo_url ? (
                <img
                  src={a.photo_url}
                  alt={a.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">
                  {a.full_name.charAt(0)}
                </div>
              )}
            </div>
          ))}
        </div>

        <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
          {totalAlumniCount} {collegeName} alumni on tour →
        </span>
      </Link>
    </div>
  );
}
