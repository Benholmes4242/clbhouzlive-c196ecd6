
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CountryFlag from '@/components/ui/country-flag';
import { countryToFlagCode } from '@/utils/countryFlags';
import { toast } from 'sonner';

const CountryFlagsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  

  const flagEntries = Object.entries(countryToFlagCode);

  const filteredFlags = flagEntries.filter(([country, code]) =>
    country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = async (text: string, type: 'country' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      toast.success(`${type === 'country' ? 'Country name' : 'Flag code'} copied successfully`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Country Flags Database</h2>
        <p className="text-muted-foreground">
          View all available country flags and their corresponding codes used in the system
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by country name or flag code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{flagEntries.length}</div>
            <p className="text-muted-foreground">Total Countries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {new Set(Object.values(countryToFlagCode)).size}
            </div>
            <p className="text-muted-foreground">Unique Flag Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{filteredFlags.length}</div>
            <p className="text-muted-foreground">Filtered Results</p>
          </CardContent>
        </Card>
      </div>

      {/* Flags Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Country Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFlags.map(([country, code]) => (
              <div
                key={country}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <CountryFlag country={country} size="lg" />
                  <div className="flex-1">
                    <div className="font-medium">{country}</div>
                    <Badge variant="secondary" className="text-xs">
                      {code}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(country, 'country')}
                      className="flex-1"
                    >
                      {copiedCode === country ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Copy Country
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(code, 'code')}
                      className="flex-1"
                    >
                      {copiedCode === code ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Copy Code
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredFlags.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No flags found matching "{searchTerm}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Using CountryFlag Component:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              {`<CountryFlag country="USA" size="md" />`}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Available Sizes:</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CountryFlag country="USA" size="sm" />
                <span className="text-sm">sm (w-4 h-3)</span>
              </div>
              <div className="flex items-center gap-2">
                <CountryFlag country="USA" size="md" />
                <span className="text-sm">md (w-6 h-4)</span>
              </div>
              <div className="flex items-center gap-2">
                <CountryFlag country="USA" size="lg" />
                <span className="text-sm">lg (w-8 h-6)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Getting Flag Code Programmatically:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              {`import { getFlagCode } from '@/utils/countryFlags';
const flagCode = getFlagCode('USA'); // Returns 'US'`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CountryFlagsManagement;
