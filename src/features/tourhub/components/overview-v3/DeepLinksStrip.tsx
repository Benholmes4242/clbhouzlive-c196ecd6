/**
 * DeepLinksStrip — Simple navigation strip at bottom of overview
 * Provides direct access to full data pages
 */

import { useNavigate } from 'react-router-dom';

const LINKS = [
  { label: 'Full Rankings', path: '/tourhub?tab=leaderboards' },
  { label: 'Full Schedule', path: '/tourhub?tab=schedule' },
  { label: 'All Players', path: '/tourhub?tab=players' },
];

export function DeepLinksStrip() {
  const navigate = useNavigate();

  return (
    <section className="px-4" style={{ paddingTop: '40px' }}>
      <div className="flex flex-col gap-2">
        {LINKS.map(link => (
          <button
            key={link.label}
            onClick={() => navigate(link.path)}
            className="bg-white border border-gray-200 rounded-xl px-5 py-3 text-left text-sm font-medium text-gray-700 active:bg-gray-50 transition-colors"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
          >
            {link.label} →
          </button>
        ))}
      </div>
    </section>
  );
}
