import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, LifeBuoy } from 'lucide-react';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useHelpArticles, type HelpArticle } from '@/hooks/useHelpArticles';

const INK = '#0F172A';
const INK_55 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const CARD_BORDER = 'rgba(15,23,42,0.07)';

function AccordionRow({
  article,
  expanded,
  onToggle,
  caption,
  isFirst,
}: {
  article: HelpArticle;
  expanded: boolean;
  onToggle: () => void;
  caption?: string;
  isFirst?: boolean;
}) {
  return (
    <div style={{ borderTop: isFirst ? 'none' : `0.5px solid ${HAIR}` }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 text-left min-h-[52px]"
      >
        <div className="flex-1 pr-4 min-w-0">
          {caption && (
            <div
              className="text-[10px] font-semibold uppercase tracking-[1.4px] mb-1"
              style={{ color: INK_55 }}
            >
              {caption}
            </div>
          )}
          <span className="text-[15px] font-medium" style={{ color: INK }}>
            {article.question}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          style={{ color: INK_55 }}
        />
      </button>
      {expanded && (
        <p
          className="text-[14px] px-4 pb-4 leading-[1.6] whitespace-pre-wrap"
          style={{ color: INK_55 }}
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
      <div
        className="flex items-center gap-2 h-11 px-3 rounded-xl"
        style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
      >
        <Search size={16} style={{ color: INK_55 }} className="shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles"
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#94A3B8]"
          style={{ color: INK }}
        />
      </div>
    </div>
  );

  return (
    <ManagePageShell title="Help centre" belowTitle={searchBar}>
      <div className="px-4 pt-2 pb-0 space-y-6">
        {isLoading && (
          <div className="text-[13px]" style={{ color: INK_55 }}>Loading articles...</div>
        )}

        {!isLoading && searching && matches.length === 0 && (
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            <p className="text-[14px]" style={{ color: INK_55 }}>
              No articles match that. Try different words, or contact support below.
            </p>
          </div>
        )}

        {!isLoading && searching && matches.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            {matches.map((a, i) => (
              <AccordionRow
                key={a.id}
                article={a}
                caption={a.category}
                expanded={expanded === a.id}
                onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
                isFirst={i === 0}
              />
            ))}
          </div>
        )}

        {!isLoading && !searching && data && (
          <div className="space-y-6">
            {categoryOrder.map((cat) => (
              <section key={cat}>
                <h3
                  className="text-[11px] font-semibold uppercase tracking-[1.6px] mb-2 px-1"
                  style={{ color: INK_55 }}
                >
                  {cat}
                </h3>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
                >
                  {data.grouped[cat].map((a, i) => (
                    <AccordionRow
                      key={a.id}
                      article={a}
                      expanded={expanded === a.id}
                      onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
                      isFirst={i === 0}
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
          style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <LifeBuoy size={16} style={{ color: INK }} />
            <h4 className="text-[15px] font-semibold" style={{ color: INK }}>
              Still need help?
            </h4>
          </div>
          <p className="text-[13.5px] leading-relaxed mb-3" style={{ color: INK_55 }}>
            Can't find what you need? Our team is here to help.
          </p>
          <button
            type="button"
            onClick={() => navigate('/manage/contact')}
            className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold text-white"
            style={{ background: INK }}
          >
            Contact support
          </button>
          <button
            type="button"
            onClick={() => navigate('/manage/requests')}
            className="w-full min-h-[44px] mt-2 text-[14px] font-semibold"
            style={{ color: INK }}
          >
            View my requests
          </button>
        </div>
      </div>
    </ManagePageShell>
  );
}
