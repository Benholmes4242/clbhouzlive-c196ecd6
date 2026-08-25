import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessDirectory, BusinessDirectoryItem } from '@/hooks/useBusinessDirectory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Building2, MapPin, Search, ChevronLeft, Plus, Pencil } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '@/types/profile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { useHasBusinesses } from '@/hooks/useMyBusinesses';
import { PageRoot } from '@/components/layout/PageRoot';
import { useBusinessImpression } from '@/hooks/useBusinessImpression';

const DirectoryRow: React.FC<{ biz: BusinessDirectoryItem; onOpen: () => void; children: React.ReactNode }> = ({ biz, onOpen, children }) => {
  const attach = useBusinessImpression(biz.id, 'directory');
  return (
    <button
      ref={attach as any}
      key={biz.id}
      className="rounded-sq-md border bg-card p-4 text-left hover:border-foreground/40 transition-colors"
      onClick={onOpen}
    >
      {children}
    </button>
  );
};

const BusinessDirectoryPage = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { profile: currentProfile } = useProfileData();
  const { hasBusinesses, count: businessCount } = useHasBusinesses(currentProfile?.id);
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

  const handleCreateBusinessProfile = () => {
    if (!user) {
      navigate('/auth');
    } else if (hasBusinesses) {
      navigate('/businesses/manage');
    } else {
      navigate('/business/intro');
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <PageRoot className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky z-10 bg-background/95 backdrop-blur-sm border-b"
        style={{ top: 'var(--sat, env(safe-area-inset-top, 0px))' }}
      >
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-muted rounded-sq-sm transition-colors"
              aria-label="Back"
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
        {/* CTA Banner */}
        <div className="flex items-center justify-between p-4 rounded-sq-md bg-muted/50 border border-border/10">
          <div>
            <h2 className="font-medium text-foreground">
              {hasBusinesses ? 'Manage your business profiles' : 'List your golf business on clbhouz'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasBusinesses 
                ? `You have ${businessCount} business${businessCount > 1 ? 'es' : ''} on clbhouz.`
                : 'Create a free business profile to reach more golfers, showcase your venue, and appear in the clbhouz Business Directory.'}
            </p>
          </div>
          <Button onClick={handleCreateBusinessProfile} className="gap-2 flex-shrink-0">
            {hasBusinesses ? (
              <>
                <Pencil className="h-4 w-4" />
                Manage Businesses
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Business Profile
              </>
            )}
          </Button>
        </div>

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
            {businesses.map((biz: BusinessDirectoryItem) => (
              <DirectoryRow
                key={biz.id}
                biz={biz}
                onOpen={() => navigate(`/business/${biz.slug ?? biz.id}`, { state: { source: 'directory' } })}
              >
                <div className="flex items-center gap-3">
                  {biz.logo_url ? (
                    <img
                      src={biz.logo_url}
                      alt={biz.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                      {getInitials(biz.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate">{biz.name}</span>
                      {biz.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                    {biz.slug && (
                      <div className="text-xs text-muted-foreground truncate">
                        @{biz.slug}
                      </div>
                    )}
                    {biz.category && (
                      <div className="mt-1.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-sq-pill bg-muted text-muted-foreground">
                          {biz.category}
                        </span>
                      </div>
                    )}
                    {biz.location && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{biz.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </DirectoryRow>
            ))}
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
    </PageRoot>
  );
};

export default BusinessDirectoryPage;
