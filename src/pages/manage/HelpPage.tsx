import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, LifeBuoy } from 'lucide-react';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useHelpArticles, type HelpArticle } from '@/hooks/useHelpArticles';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';


function AccordionRow({
  article,
  expanded,
  onToggle,
  caption,
}: {
  article: HelpArticle;
  expanded: boolean;
  onToggle: () => void;
  caption?: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 text-left min-h-[52px]"
      >
        <div className="flex-1 pr-4 min-w-0">
          {caption && (
            <div
              className="text-[10px] font-semibold uppercase tracking-[1.4px] mb-1"
              style={{ color: A.MUTE }}
            >
              {caption}
            </div>
          )}
          <span className="text-[15px] font-medium" style={{ color: A.INK }}>
            {article.question}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          style={{ color: A.MUTE }}
        />
      </button>
      {expanded && (
        <p
          className="text-[14px] px-4 pb-4 leading-[1.6] whitespace-pre-wrap"
          style={{ color: A.MUTE }}
        >
          {article.answer}
        </p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useHelpArticles();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const matches = useMemo<HelpArticle[]>(() => {
    if (!searching || !data) return [];
    return data.all.filter(
      (a) =>
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q),
    );
  }, [data, q, searching]);

  const categoryOrder = data ? Object.keys(data.grouped) : [];

  const searchBar = (
    <div className="px-4 pb-3">
      {/* FIELD CANON (lib/tokens/field.ts): was an A.PANEL slab; now a 6%
          well on the canvas. Height 44 (h-11) — stands alone, no exception. */}
      <div className={`${FIELD_PAINT_CLASS} flex items-center gap-2 h-11 px-3`}>
        <Search size={16} style={{ color: A.MUTE }} className="shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles"
          className={`${FIELD_PLACEHOLDER_CLASS} flex-1 bg-transparent text-[15px] outline-none`}
          style={{ color: A.INK }}
        />
      </div>
    </div>
  );

  return (
    <ManagePageShell title="Help centre" belowTitle={searchBar}>
      <div className="px-4 pt-2 pb-0 space-y-6">
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="dark" className="h-14 w-full rounded-xl" />
            ))}
          </div>
        )}


        {!isLoading && isError && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            <p className="text-[15px] font-medium" style={{ color: A.INK }}>Couldn't load help articles</p>
            <p className="text-[13px] mt-1 mb-3" style={{ color: A.MUTE }}>Check your connection and try again.</p>
            <button
              onClick={() => refetch()}
              className="text-[13px] font-semibold"
              style={{ color: A.INK }}
            >
              Retry
            </button>
          </div>
        )}


        {/* eslint-disable-next-line settled/no-not-loading-empty-check -- useHelpArticles is ungated, and the branch also requires an active search term. */}
        {!isLoading && searching && matches.length === 0 && (
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            <p className="text-[14px]" style={{ color: A.MUTE }}>
              No articles match that. Try different words, or contact support below.
            </p>
          </div>
        )}

        {!isLoading && searching && matches.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            {matches.map((a, i) => (
              <AccordionRow
                key={a.id}
                article={a}
                caption={a.category}
                expanded={expanded === a.id}
                onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
              />
            ))}
          </div>
        )}

        {/* eslint-disable-next-line settled/no-not-loading-empty-check -- the branch requires data to be present. */}
        {!isLoading && !searching && data && (
          <div className="space-y-6">
            {categoryOrder.map((cat) => (
              <section key={cat}>
                <h3
                  className="text-[11px] font-semibold uppercase tracking-[1.6px] mb-2 px-1"
                  style={{ color: A.MUTE }}
                >
                  {cat}
                </h3>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
                >
                  {data.grouped[cat].map((a, i) => (
                    <AccordionRow
                      key={a.id}
                      article={a}
                      expanded={expanded === a.id}
                      onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
                          />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Still need help footer */}
        <div
          className="rounded-2xl p-4 mt-2"
          style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <LifeBuoy size={16} style={{ color: A.INK }} />
            <h4 className="text-[15px] font-semibold" style={{ color: A.INK }}>
              Still need help?
            </h4>
          </div>
          <p className="text-[13.5px] leading-relaxed mb-3" style={{ color: A.MUTE }}>
            Can't find what you need? Our team is here to help.
          </p>
          <button
            type="button"
            onClick={() => navigate('/manage/contact')}
            className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold"
            style={{ background: A.INK, color: A.CANVAS }}
          >
            Contact support
          </button>
          <button
            type="button"
            onClick={() => navigate('/manage/requests')}
            className="w-full min-h-[44px] mt-2 text-[14px] font-semibold"
            style={{ color: A.INK }}
          >
            View my requests
          </button>
        </div>
      </div>
    </ManagePageShell>
  );
}
