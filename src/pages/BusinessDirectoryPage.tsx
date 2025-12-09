import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessDirectory } from '@/hooks/useBusinessDirectory';
import { getProfileDisplayName } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Search, CheckCircle2, ChevronLeft } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '@/types/profile';

const BusinessDirectoryPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBusinessDirectory({
    search,
    category,
    location,
    page,
    pageSize: 20,
  });

  const { businesses = [], total = 0 } = data ?? {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-muted rounded-sq-sm transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Golf Businesses & Clubs</h1>
              <p className="text-sm text-muted-foreground">
                Discover clubs, brands, coaches and more
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search businesses, clubs, brands…"
              className="pl-9"
            />
          </div>

          <Select
            value={category || 'all'}
            onValueChange={val => { setPage(1); setCategory(val === 'all' ? undefined : val); }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {BUSINESS_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative min-w-[140px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={location}
              onChange={e => { setPage(1); setLocation(e.target.value); }}
              placeholder="Location"
              className="pl-9"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-sq-md border bg-card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No businesses found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map(biz => {
              const name = getProfileDisplayName(biz);
              return (
                <button
                  key={biz.id}
                  className="rounded-sq-md border bg-card p-4 text-left hover:border-foreground/40 transition-colors"
                  onClick={() => navigate(`/profile/${biz.username || biz.id}`)}
                >
                  <div className="flex items-center gap-3">
                    {biz.profile_photo_url ? (
                      <img
                        src={biz.profile_photo_url}
                        alt={name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium truncate">{name}</span>
                        {biz.is_business_verified && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        @{biz.username}
                      </div>
                      {biz.business_category && (
                        <div className="mt-1.5">
                          <span className="text-[11px] px-2 py-0.5 rounded-sq-pill bg-muted text-muted-foreground">
                            {biz.business_category}
                          </span>
                        </div>
                      )}
                      {biz.business_location && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{biz.business_location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-between items-center pt-4 text-sm border-t">
            <span className="text-muted-foreground">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDirectoryPage;
