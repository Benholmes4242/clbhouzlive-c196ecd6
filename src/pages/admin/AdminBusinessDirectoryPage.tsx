import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, MapPin, ExternalLink, Shield, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BUSINESS_CATEGORIES } from '@/types/profile';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

interface Business {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  location: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
}

const AdminBusinessDirectoryPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-businesses', search, selectedCategory, page],
    queryFn: async () => {
      let query = supabase
        .from('business_accounts')
        .select('id, name, slug, category, location, logo_url, is_verified, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { businesses: data as Business[], total: count ?? 0 };
    },
  });

  const { businesses = [], total = 0 } = data ?? {};
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Business Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all business profiles on clbhouz
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {total} business{total !== 1 ? 'es' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-sq-sm border bg-background text-sm"
        >
          <option value="">All categories</option>
          {BUSINESS_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Business list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No businesses found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="flex items-center gap-4 p-4 rounded-sq-md border bg-background hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/business/${business.id}`)}
            >
              {/* Logo */}
              <div className="h-12 w-12 rounded-sq-sm bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{business.name}</span>
                  {business.is_verified && (
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                  {business.category && <span>{business.category}</span>}
                  {business.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {business.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminBusinessDirectoryPage;
