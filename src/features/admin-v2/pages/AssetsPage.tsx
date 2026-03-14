import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Flag, BookOpen, ArrowRight } from 'lucide-react';
import { AdminPageHeader } from '../components/ui';

const ASSET_SECTIONS = [
  { path: '/admin-v2/assets/logos',         icon: Image,    label: 'Logos',         description: 'Club and organization logos' },
  { path: '/admin-v2/assets/college-logos', icon: BookOpen, label: 'College Logos', description: 'US college golf program logos' },
  { path: '/admin-v2/assets/flags',         icon: Flag,     label: 'Country Flags', description: 'Country flag images' },
];

export default function AssetsPage() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <AdminPageHeader title="Asset Manager" description="Logos, flags, and media files" />
      <div className="space-y-3">
        {ASSET_SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.path}
              onClick={() => navigate(section.path)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all active:scale-[0.99] text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-foreground">{section.label}</p>
                <p className="text-[12px] text-muted-foreground">{section.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
