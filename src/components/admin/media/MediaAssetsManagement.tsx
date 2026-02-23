import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { RefreshCw, Image, Building2, MapPin, Search, ExternalLink, CheckCircle, XCircle, AlertCircle, Newspaper, FileText, Upload, User, Users } from 'lucide-react';
import PlayersAssetTab from '@/features/admin/components/assets/PlayersAssetTab';
import { format } from 'date-fns';

type AssetKind = 'headshot' | 'logo' | 'venue';
type ProviderStatus = 'available' | 'unavailable' | 'unknown';

interface MediaAsset {
  id: string;
  kind: AssetKind;
  sport: string;
  league: string;
  provider: string;
  title: string | null;
  description: string | null;
  copyright: string | null;
  refs: Record<string, any>;
  links: Record<string, string>;
  updated_at: string;
  last_seen_at: string;
}

interface ProviderAvailability {
  id: string;
  sport: string;
  league: string;
  provider: string;
  asset_type: string;
  status: ProviderStatus;
  last_checked_at: string;
  http_status: number | null;
  error_message: string | null;
}

const LEAGUES = [
  { value: 'all', label: 'All Leagues' },
  { value: 'pga', label: 'PGA Tour' },
  { value: 'lpga', label: 'LPGA' },
  { value: 'dpwt', label: 'DP World Tour' },
  { value: 'korn_ferry', label: 'Korn Ferry Tour' },
];

const PROVIDERS = [
  { value: 'all', label: 'All Providers' },
  { value: 'ap', label: 'Associated Press' },
  { value: 'getty', label: 'Getty Images' },
];

export default function MediaAssetsManagement() {
  const [activeTab, setActiveTab] = useState<'headshots' | 'logos' | 'venues' | 'availability' | 'news' | 'analysis' | 'upload' | 'players'>('headshots');
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Search for players
  const { data: playerResults, isLoading: playersLoading } = useQuery({
    queryKey: ['player-search', playerSearch],
    queryFn: async () => {
      if (!playerSearch || playerSearch.length < 2) return [];
      const { data, error } = await supabase
        .from('sr_players')
        .select('id, first_name, last_name, full_name, photo_url, pga_tour_id')
        .ilike('full_name', `%${playerSearch}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: playerSearch.length >= 2,
  });

  // Upload mutation
  const uploadHeadshotMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedPlayerId) throw new Error('No player selected');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('playerId', selectedPlayerId);

      const response = await fetch(
        `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/upload-player-headshot`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Headshot uploaded successfully!`, {
        description: `Photo URL: ${data.publicUrl}`,
      });
      setSelectedPlayerId('');
      setPlayerSearch('');
      setUploadPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['player-search'] });
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!selectedPlayerId) {
      toast.error('Please select a player');
      return;
    }
    uploadHeadshotMutation.mutate(file);
  };

  // sr_media_assets table has been dropped — headshots are now served from R2 via getPlayerHeadshotUrl().
  const assets: MediaAsset[] = [];
  const assetsLoading = false;

  // Fetch availability map
  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['sr-media-availability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_media_provider_availability')
        .select('*')
        .eq('sport', 'golf')
        .order('league', { ascending: true });
      if (error) throw error;
      return data as ProviderAvailability[];
    },
  });

  // Fetch editorial items
  const { data: editorialItems, isLoading: editorialLoading } = useQuery({
    queryKey: ['sr-editorial-items', activeTab, leagueFilter, providerFilter],
    queryFn: async () => {
      if (activeTab !== 'news' && activeTab !== 'analysis') return [];
      
      let query = supabase
        .from('sr_editorial_items')
        .select('*')
        .eq('type', activeTab)
        .order('created', { ascending: false })
        .limit(100);
      
      if (leagueFilter !== 'all') {
        query = query.eq('league', leagueFilter);
      }
      if (providerFilter !== 'all') {
        query = query.eq('provider', providerFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'news' || activeTab === 'analysis',
  });

  // sr_media_assets table has been dropped — counts are no longer available
  const assetCounts = { headshots: 0, logos: 0, venues: 0, news: 0, analysis: 0 };

  // sportradar-media-sync edge function has been deleted — sync is no longer available
  const syncMutation = { isPending: false, mutate: (_action: string) => { toast.info('Media sync has been decommissioned. Headshots are now served from R2.'); } };

  const getStatusIcon = (status: ProviderStatus) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSmallestImageUrl = (links: Record<string, string>) => {
    // Prefer smallest sizes for thumbnails
    const preferredOrder = ['h100', 'h150', 'h250', 'h500', 'h1000', 'original'];
    for (const size of preferredOrder) {
      if (links[size]) return links[size];
    }
    return Object.values(links)[0] || null;
  };

  const renderEditorialContent = (type: 'news' | 'analysis') => {
    if (editorialLoading) {
      return <div className="text-center py-8 text-muted-foreground">Loading {type}...</div>;
    }

    if (!editorialItems || editorialItems.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {type} items found. Try syncing from Sportradar.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => syncMutation.mutate(`pull_${type}`)}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => syncMutation.mutate(`pull_${type}`)}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        </div>
        {editorialItems.map((item: any) => (
          <Card key={item.id}>
            <CardHeader className="py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{item.title || 'Untitled'}</CardTitle>
                  {item.byline && <CardDescription className="text-xs mt-1">{item.byline}</CardDescription>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{item.provider}</Badge>
                  <Badge variant="secondary" className="uppercase">{item.league}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {item.dateline && <p className="text-xs text-muted-foreground mb-2">{item.dateline}</p>}
              <p className="text-sm line-clamp-3">{item.content_long?.substring(0, 300)}...</p>
              {item.created && (
                <p className="text-xs text-muted-foreground mt-2">
                  Published: {format(new Date(item.created), 'MMM d, yyyy HH:mm')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderAssetTable = () => {
    if (assetsLoading) {
      return <div className="text-center py-8 text-muted-foreground">Loading assets...</div>;
    }

    if (!assets || assets.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No assets found. Try syncing data from Sportradar.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Preview</TableHead>
            <TableHead>Title / Name</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>League</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-24">Links</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell>
                {getSmallestImageUrl(asset.links) ? (
                  <img
                    src={getSmallestImageUrl(asset.links)!}
                    alt={asset.title || 'Asset'}
                    className="h-10 w-10 object-cover rounded bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                    <Image className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">{asset.title || 'Untitled'}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{asset.id}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{asset.provider}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="uppercase">{asset.league}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(asset.updated_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Select>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue placeholder="Open" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(asset.links).map(([size, url]) => (
                      <SelectItem key={size} value={size}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                          {size} <ExternalLink className="h-3 w-3" />
                        </a>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderAvailabilityMap = () => {
    if (availabilityLoading) {
      return <div className="text-center py-8 text-muted-foreground">Loading availability...</div>;
    }

    if (!availability || availability.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No availability data. Click "Check Availability" to scan all providers.
        </div>
      );
    }

    // Group by league
    const byLeague = availability.reduce((acc, item) => {
      if (!acc[item.league]) acc[item.league] = [];
      acc[item.league].push(item);
      return acc;
    }, {} as Record<string, ProviderAvailability[]>);

    return (
      <div className="space-y-4">
        {Object.entries(byLeague).map(([league, items]) => (
          <Card key={league}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm uppercase">{league}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Last Checked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="capitalize">{item.provider}</TableCell>
                      <TableCell className="capitalize">{item.asset_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.http_status ? (
                          <Badge variant={item.http_status === 200 ? 'default' : 'destructive'}>
                            {item.http_status}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.last_checked_at ? format(new Date(item.last_checked_at), 'MMM d, HH:mm') : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Sportradar Media</h2>
          <p className="text-muted-foreground">Browse and sync images from Sportradar Media APIs</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate('check_availability')}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Check Availability
          </Button>
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate('sync_player_photos')}
            disabled={syncMutation.isPending}
          >
            <Image className="h-4 w-4 mr-2" />
            Sync Player Headshots
          </Button>
          <Button
            onClick={() => syncMutation.mutate('pull_all')}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync All Media
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Image className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assetCounts?.headshots || 0}</p>
                <p className="text-xs text-muted-foreground">Headshots</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assetCounts?.logos || 0}</p>
                <p className="text-xs text-muted-foreground">Logos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assetCounts?.venues || 0}</p>
                <p className="text-xs text-muted-foreground">Venues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {availability?.filter(a => a.status === 'available').length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Available Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">Player Photos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="headshots" className="gap-2">
            <Image className="h-4 w-4" />
            Headshots
          </TabsTrigger>
          <TabsTrigger value="logos" className="gap-2">
            <Building2 className="h-4 w-4" />
            Logos
          </TabsTrigger>
          <TabsTrigger value="venues" className="gap-2">
            <MapPin className="h-4 w-4" />
            Venues
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="news" className="gap-2">
            <Newspaper className="h-4 w-4" />
            News
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <FileText className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Headshot
          </TabsTrigger>
          <TabsTrigger value="players" className="gap-2">
            <Users className="h-4 w-4" />
            Players
          </TabsTrigger>
        </TabsList>

        {/* Filters for asset and editorial tabs */}
        {activeTab !== 'availability' && activeTab !== 'upload' && activeTab !== 'players' && (
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAGUES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <TabsContent value="headshots" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {renderAssetTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logos" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {renderAssetTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venues" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {renderAssetTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          {renderAvailabilityMap()}
        </TabsContent>

        <TabsContent value="news" className="mt-4">
          {renderEditorialContent('news')}
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          {renderEditorialContent('analysis')}
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Player Headshot
              </CardTitle>
              <CardDescription>
                Upload a custom headshot for a player. This will be stored in R2 and used across the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Player Search */}
              <div className="space-y-2">
                <Label htmlFor="player-search">Search Player</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="player-search"
                    placeholder="Search by player name..."
                    value={playerSearch}
                    onChange={(e) => {
                      setPlayerSearch(e.target.value);
                      setSelectedPlayerId('');
                    }}
                    className="pl-9"
                  />
                </div>
                
                {/* Player Results */}
                {playerSearch.length >= 2 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-auto">
                    {playersLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Searching...</div>
                    ) : playerResults && playerResults.length > 0 ? (
                      playerResults.map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlayerId(player.id);
                            setPlayerSearch(player.full_name);
                          }}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left ${
                            selectedPlayerId === player.id ? 'bg-primary/10' : ''
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {player.photo_url ? (
                              <img src={player.photo_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{player.full_name}</div>
                            <div className="text-xs text-muted-foreground">ID: {player.id}</div>
                          </div>
                          {selectedPlayerId === player.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">No players found</div>
                    )}
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="headshot-file">Headshot Image</Label>
                <Input
                  ref={fileInputRef}
                  id="headshot-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Preview */}
              {uploadPreview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-2 border-dashed">
                    <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedPlayerId || !fileInputRef.current?.files?.[0] || uploadHeadshotMutation.isPending}
                className="w-full"
              >
                {uploadHeadshotMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Headshot
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="mt-4">
          <PlayersAssetTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
