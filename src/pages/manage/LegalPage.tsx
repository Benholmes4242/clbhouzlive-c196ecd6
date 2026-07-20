import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';

const INK_55 = '#64748B';

export default function LegalPage() {
  const { data, isLoading } = useLegalDocuments();
  const docs = data ?? [];

  return (
    <ManagePageShell title="Legal & policies">
      <div className="px-4 pt-4 pb-0">

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}
        >
          {isLoading && (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          )}


          {!isLoading && docs.length === 0 && (
            <div className="p-4 text-[14px]" style={{ color: INK_55 }}>
              No legal documents are currently published.
            </div>
          )}

          {!isLoading && docs.map((doc, i) => (
            <Link
              key={doc.slug}
              to={`/legal/${doc.slug}`}
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderTop: i === 0 ? 'none' : '1px solid rgba(15,23,42,0.06)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span className="text-[15px] font-medium text-foreground">
                {doc.title}
              </span>
              <ChevronRight size={18} style={{ color: INK_55, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </ManagePageShell>
  );
}
