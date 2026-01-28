import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Plus, Search } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '@/types/profile';

export type VerificationFilter = 'all' | 'verified' | 'unverified';

export interface BusinessFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  verificationFilter: VerificationFilter;
  onVerificationChange: (value: VerificationFilter) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  onExportCsv: () => void;
  onAddBusiness?: () => void;
  disabled?: boolean;
}

export function BusinessFilters({
  searchQuery,
  onSearchChange,
  onSearch,
  verificationFilter,
  onVerificationChange,
  categoryFilter,
  onCategoryChange,
  onExportCsv,
  onAddBusiness,
  disabled,
}: BusinessFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, slug..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            disabled={disabled}
          />
        </div>
        <Button onClick={onSearch} disabled={disabled}>
          Search
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportCsv} disabled={disabled}>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          
          {onAddBusiness && (
            <Button onClick={onAddBusiness} disabled={disabled}>
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add Business</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
          <Select value={verificationFilter} onValueChange={(v) => onVerificationChange(v as VerificationFilter)} disabled={disabled}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Category:</span>
          <Select value={categoryFilter} onValueChange={onCategoryChange} disabled={disabled}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Categories</SelectItem>
              {BUSINESS_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
