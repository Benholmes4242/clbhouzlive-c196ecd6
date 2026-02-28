import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Copy, Check, Grid, List } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { countryToFlagCode } from '@/utils/countryFlags';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CountryFlagsTabProps {
  flagCount: number;
}

export const CountryFlagsTab: React.FC<CountryFlagsTabProps> = ({ flagCount }) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewCountry, setPreviewCountry] = useState<{ country: string; code: string } | null>(null);

  const flagEntries = Object.entries(countryToFlagCode);

  const filteredFlags = useMemo(() => {
    return flagEntries.filter(([country, code]) =>
      country.toLowerCase().includes(search.toLowerCase()) ||
      code.toLowerCase().includes(search.toLowerCase())
    );
  }, [flagEntries, search]);

  const copyToClipboard = async (text: string, type: 'country' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{flagEntries.length}</div>
          <p className="text-xs text-muted-foreground">Total Countries</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {new Set(Object.values(countryToFlagCode)).size}
          </div>
          <p className="text-xs text-muted-foreground">Unique Flag Codes</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{filteredFlags.length}</div>
          <p className="text-xs text-muted-foreground">Filtered Results</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by country or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Flags Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFlags.map(([country, code]) => (
            <Card
              key={country}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setPreviewCountry({ country, code })}
            >
              <div className="flex items-center gap-3 mb-3">
                <CountryFlag country={country} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{country}</div>
                  <Badge variant="secondary" className="text-xs">{code}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(country, 'country'); }}
                  className="flex-1"
                >
                  {copiedCode === country ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(code, 'code'); }}
                  className="flex-1"
                >
                  {copiedCode === code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredFlags.map(([country, code]) => (
              <div
                key={country}
                className="p-3 flex items-center gap-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => setPreviewCountry({ country, code })}
              >
                <CountryFlag country={country} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{country}</div>
                </div>
                <Badge variant="secondary">{code}</Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(country, 'country'); }}
                  >
                    {copiedCode === country ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy Name
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(code, 'code'); }}
                  >
                    {copiedCode === code ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy Code
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filteredFlags.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No flags found matching "{search}"
        </div>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Using CountryFlag Component:</h4>
            <div className="bg-muted p-3 rounded font-mono text-xs">
              {`<CountryFlag country="USA" size="md" />`}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Available Sizes:</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CountryFlag country="USA" size="sm" />
                <span className="text-muted-foreground">sm</span>
              </div>
              <div className="flex items-center gap-2">
                <CountryFlag country="USA" size="md" />
                <span className="text-muted-foreground">md</span>
              </div>
              <div className="flex items-center gap-2">
                <CountryFlag country="USA" size="lg" />
                <span className="text-muted-foreground">lg</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewCountry} onOpenChange={() => setPreviewCountry(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{previewCountry?.country}</DialogTitle>
          </DialogHeader>
          {previewCountry && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-24 flex items-center justify-center">
                <CountryFlag country={previewCountry.country} size="lg" className="!w-24 !h-16" />
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">{previewCountry.code}</Badge>
              <div className="flex gap-2">
                <Button onClick={() => copyToClipboard(previewCountry.country, 'country')}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Country
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(previewCountry.code, 'code')}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
