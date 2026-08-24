import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { A } from '@/features/courses/components/holes/analytical/tokens';


export default function LegalPage() {
  const { data, isLoading } = useLegalDocuments();
  const docs = data ?? [];

  return (
    <ManagePageShell title="Legal & policies">
      <div className="px-4 pt-4 pb-0">

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
        >
          {isLoading && (
            <div className="p-4 space-y-3">
              <Skeleton variant="dark" className="h-12 w-full rounded-lg" />
              <Skeleton variant="dark" className="h-12 w-full rounded-lg" />
            </div>
          )}


          {/* eslint-disable-next-line settled/no-not-loading-empty-check -- useLegalDocuments is ungated, so it is never disabled. */}
          {!isLoading && docs.length === 0 && (
            <div className="p-4 text-[14px]" style={{ color: A.MUTE }}>
              No legal documents are currently published.
            </div>
          )}

          {!isLoading && docs.map((doc, i) => (
            <Link
              key={doc.slug}
              to={`/legal/${doc.slug}`}
              className="flex items-center justify-between px-4 py-3"
              style={{
                                color: 'inherit',
              }}
            >
              <span className="text-[15px] font-medium text-foreground">
                {doc.title}
              </span>
              <ChevronRight size={18} style={{ color: A.MUTE, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </ManagePageShell>
  );
}
