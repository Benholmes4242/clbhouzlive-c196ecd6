/**
 * WebsitePills - Render websites as tappable pills
 * Used under About section on profile page
 */
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface WebsitePillsProps {
  websites: string[];
}

const formatUrlForDisplay = (url: string): string => {
  if (!url) return '';
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  }
};

const ensureHttps = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export const WebsitePills: React.FC<WebsitePillsProps> = ({ websites }) => {
  if (!websites || websites.length === 0) return null;

  const validWebsites = websites.filter(w => w && w.trim());
  if (validWebsites.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {validWebsites.map((website, index) => (
        <a
          key={index}
          href={ensureHttps(website)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-full transition-colors"
          style={{
            background: '#F0F0F0',
            border: '1px solid #E0E0E0'
          }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {formatUrlForDisplay(website)}
        </a>
      ))}
    </div>
  );
};
