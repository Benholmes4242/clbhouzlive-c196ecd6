import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useLegalDocument } from '@/hooks/useLegalDocuments';
import LegalBodyRenderer from '@/components/legal/LegalBodyRenderer';
import { formatDayMonthLongYearGB } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';

const INK_55 = '#64748B';

function formatEffective(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return formatDayMonthLongYearGB(d);
  } catch { return null; }
}

interface Props {
  /** Optional override; when omitted the slug comes from the URL. */
  slug?: string;
}

const LegalDocumentPage: React.FC<Props> = ({ slug: slugProp }) => {
  const params = useParams<{ slug: string }>();
  const slug = slugProp ?? params.slug;
  // SETTLED IS NOT "NOT LOADING": the document query is gated on slug.
  const { data, isLoading: fetching, isFetched, isError } = useLegalDocument(slug);
  const isLoading = !isFetched || fetching;

  const title = data?.title ?? (isLoading ? 'Loading…' : 'Not found');
  const effective = formatEffective(data?.effective_date ?? null);

  return (
    <ManagePageShell title={title}>
      <div className="px-4 pt-4 pb-16">
        <div
          className="rounded-2xl p-5"
          style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}
        >
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/3 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-11/12 rounded" />
            </div>
          )}

          {/* eslint-disable-next-line settled/no-not-loading-empty-check -- isLoading is derived as !isFetched || fetching above. */}
          {!isLoading && (isError || !data) && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                Document not available
              </div>
              <div style={{ color: INK_55, fontSize: 14, marginBottom: 14 }}>
                The document you are looking for is not published or does not exist.
              </div>
              <Link
                to="/manage/legal"
                style={{
                  fontSize: 13, fontWeight: 600, color: '#0F172A',
                  textDecoration: 'underline',
                }}
              >
                Back to Legal &amp; policies
              </Link>
            </div>
          )}

          {!isLoading && data && (
            <>
              {effective && (
                <div style={{ color: INK_55, fontSize: 12, marginBottom: 16 }}>
                  Last updated: {effective}
                </div>
              )}
              <LegalBodyRenderer body={data.body} />
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(15,23,42,0.06)', color: INK_55, fontSize: 12 }}>
                Operated by CLBHOUZ LTD. Contact: support@clbhouz.co.uk
              </div>
            </>
          )}
        </div>
      </div>
    </ManagePageShell>
  );
};

export default LegalDocumentPage;
