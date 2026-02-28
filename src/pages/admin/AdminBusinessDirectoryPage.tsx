import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, MoreHorizontal, ShieldCheck, ChevronUp, ChevronDown, ArrowUpDown, ExternalLink, Pencil, Trash2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { BusinessFilters, type VerificationFilter } from '@/components/admin/business/BusinessFilters';
import { BusinessDetailDrawer } from '@/components/admin/business/BusinessDetailDrawer';
import { useBusinessActions } from '@/hooks/admin/useBusinessDetails';
import { toast } from 'sonner';

const PAGE_SIZE = 25;

interface Business {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  location: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string | null;
}

type SortField = 'name' | 'category' | 'created_at' | 'is_verified';
type SortDirection = 'asc' | 'desc';

const AdminBusinessDirectoryPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { verifyBusiness, unverifyBusiness, deleteBusiness, loading: actionLoading } = useBusinessActions();

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Detail drawer
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-businesses', appliedSearch, verificationFilter, categoryFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('business_accounts')
        .select('id, name, slug, category, location, logo_url, is_verified, created_at, updated_at', { count: 'exact' })
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (appliedSearch) {
        query = query.or(`name.ilike.%${appliedSearch}%,slug.ilike.%${appliedSearch}%`);
      }

      if (verificationFilter !== 'all') {
        query = query.eq('is_verified', verificationFilter === 'verified');
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { businesses: data as Business[], total: count ?? 0 };
    },
  });

  const { businesses = [], total = 0 } = data ?? {};

  // Client-side sorting
  const sortedBusinesses = useMemo(() => {
    const sorted = [...businesses];
    sorted.sort((a, b) => {
      let aVal: string | boolean | null = null;
      let bVal: string | boolean | null = null;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'category':
          aVal = a.category || 'zzz';
          bVal = b.category || 'zzz';
          break;
        case 'created_at':
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        case 'is_verified':
          aVal = a.is_verified ? 'a' : 'b';
          bVal = b.is_verified ? 'a' : 'b';
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
    return sorted;
  }, [businesses, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = useCallback(() => {
    setAppliedSearch(searchQuery);
    setPage(0);
  }, [searchQuery]);

  const handleRowClick = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setDrawerOpen(true);
  };

  const handleQuickVerify = async (e: React.MouseEvent, business: Business) => {
    e.stopPropagation();
    const result = business.is_verified 
      ? await unverifyBusiness(business.id)
      : await verifyBusiness(business.id);
    
    if (result.success) {
      toast.success(business.is_verified ? 'Unverified' : 'Verified', { 
        description: `${business.name} ${business.is_verified ? 'verification removed' : 'is now verified'}` 
      });
    } else {
      toast.error('Action failed');
    }
  };

  const handleQuickDelete = async (e: React.MouseEvent, business: Business) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${business.name}?`)) return;
    
    const result = await deleteBusiness(business.id);
    if (result.success) {
      toast.success('Deleted', { description: `${business.name} has been deleted` });
    } else {
      toast.error('Failed to delete');
    }
  };

  const exportCsv = () => {
    const headers = ['name', 'slug', 'category', 'location', 'verified', 'created_at', 'id'];
    const lines = [headers.join(',')];
    sortedBusinesses.forEach((b) => {
      const vals = [
        b.name,
        b.slug || '',
        b.category || '',
        b.location || '',
        b.is_verified ? 'Yes' : 'No',
        b.created_at,
        b.id,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses_page_${page + 1}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Business Directory</h1>
            <p className="text-muted-foreground text-sm">
              Manage all business profiles ({total} total)
            </p>
          </div>
        </div>

        {/* Filters */}
        <BusinessFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          verificationFilter={verificationFilter}
          onVerificationChange={setVerificationFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onExportCsv={exportCsv}
          onAddBusiness={() => navigate('/admin/business/new')}
          disabled={isLoading}
        />

        {/* Error state */}
        {error && (
          <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
            <p className="text-sm text-destructive">Failed to load businesses. Please try again.</p>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="name">Business</SortableHeader>
                  <SortableHeader field="category">Category</SortableHeader>
                  <TableHead>Location</TableHead>
                  <SortableHeader field="is_verified">Verified</SortableHeader>
                  <SortableHeader field="created_at">Created</SortableHeader>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><Skeleton className="h-4 w-32" /></div></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedBusinesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No businesses found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedBusinesses.map((business) => (
                    <TableRow
                      key={business.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(business.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {business.logo_url ? (
                              <img src={business.logo_url} alt={business.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate flex items-center gap-1.5">
                              {business.name}
                              {business.is_verified && (
                                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              )}
                            </div>
                            {business.slug && (
                              <div className="text-xs text-muted-foreground">@{business.slug}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {business.category ? (
                          <Badge variant="secondary" className="text-xs">
                            {business.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {business.location ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{business.location}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {business.is_verified ? (
                          <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                            Verified
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(business.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => handleRowClick(business.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/business/${business.slug || business.id}`, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Public Page
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/business/${business.id}/edit`)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => handleQuickVerify(e as any, business)}
                              className={business.is_verified ? 'text-orange-600' : 'text-emerald-600'}
                            >
                              {business.is_verified ? (
                                <>
                                  <ShieldX className="h-4 w-4 mr-2" />
                                  Remove Verification
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Verify
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => handleQuickDelete(e as any, business)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {maxPage + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage || isLoading}
            >
              Next
            </Button>
          </div>
        )}

        {/* Detail Drawer */}
        <BusinessDetailDrawer
          businessId={selectedBusinessId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onBusinessDeleted={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
          }}
        />
      </div>
    </div>
  );
};

export default AdminBusinessDirectoryPage;
