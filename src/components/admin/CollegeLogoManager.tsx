import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Upload, RefreshCw, Image as ImageIcon, Check, X, Wand2, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CollegeMedia {
  id: string;
  normalized_name: string;
  college_name: string;
  short_name: string | null;
  logo_url: string | null;
}

interface FetchResult {
  success: boolean;
  message?: string;
  processed?: number;
  successful?: number;
  failed?: number;
  results?: Array<{
    normalized_name: string;
    success: boolean;
    logo_url?: string;
    error?: string;
  }>;
  error?: string;
}

// Top 20 colleges by player count
const TOP_20_COLLEGES = [
  'georgia', 'oklahomastate', 'texas', 'wakeforest', 'florida',
  'alabama', 'georgiatech', 'stanford', 'floridastate', 'sandiegostate',
  'northcarolina', 'southerncalifornia', 'louisianastate', 'virginia',
  'texastech', 'tennessee', 'ucla', 'clemson', 'california', 'duke'
];

export default function CollegeLogoManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [uploadingCollege, setUploadingCollege] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCollege, setSelectedCollege] = useState<CollegeMedia | null>(null);
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);

  // Fetch all colleges
  const { data: colleges, isLoading, refetch } = useQuery({
    queryKey: ['college-media', search],
    queryFn: async () => {
      let query = supabase
        .from('college_media')
        .select('*')
        .order('college_name');

      if (search) {
        query = query.or(`college_name.ilike.%${search}%,normalized_name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data as CollegeMedia[];
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async ({ normalized_name, file }: { normalized_name: string; file: File }) => {
      setUploadingCollege(normalized_name);

      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await supabase.functions.invoke('upload-college-logo', {
        body: {
          normalized_name,
          file_data: base64,
          file_name: file.name,
          content_type: file.type,
        },
      });

      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error || 'Upload failed');
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Logo uploaded for ${data.normalized_name}`);
      queryClient.invalidateQueries({ queryKey: ['college-media'] });
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
    onSettled: () => {
      setUploadingCollege(null);
      setSelectedCollege(null);
    },
  });

  // Fetch logos from Wikipedia mutation
  const fetchLogosMutation = useMutation({
    mutationFn: async (params: { normalized_names?: string[]; limit?: number }) => {
      const response = await supabase.functions.invoke('fetch-college-logos', {
        body: params,
      });

      if (response.error) throw response.error;
      return response.data as FetchResult;
    },
    onSuccess: (data) => {
      setFetchResult(data);
      if (data.successful && data.successful > 0) {
        toast.success(`Fetched ${data.successful} logos from Wikipedia`);
        queryClient.invalidateQueries({ queryKey: ['college-media'] });
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.info(data.message || 'No logos fetched');
      }
    },
    onError: (error) => {
      toast.error(`Fetch failed: ${error.message}`);
      setFetchResult({ success: false, error: error.message });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCollege) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    uploadLogoMutation.mutate({
      normalized_name: selectedCollege.normalized_name,
      file,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = (college: CollegeMedia) => {
    setSelectedCollege(college);
    fileInputRef.current?.click();
  };

  const handleFetchTop20 = () => {
    // Filter to only colleges that don't have logos yet
    const missingLogos = TOP_20_COLLEGES.filter(name => 
      !colleges?.find(c => c.normalized_name === name && c.logo_url)
    );
    
    if (missingLogos.length === 0) {
      toast.info('All top 20 colleges already have logos');
      return;
    }
    
    fetchLogosMutation.mutate({ normalized_names: missingLogos });
  };

  const handleFetchNext = (count: number) => {
    fetchLogosMutation.mutate({ limit: count });
  };

  const stats = {
    total: colleges?.length || 0,
    withLogos: colleges?.filter(c => c.logo_url).length || 0,
    withoutLogos: colleges?.filter(c => !c.logo_url).length || 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          College Logo Manager
        </CardTitle>
        <CardDescription>
          Upload PNG logos for each college - files are stored in R2
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Auto-fetch section */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Wikipedia Logo Fetcher</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Automatically fetch college logos from Wikipedia athletics pages and upload to CDN.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleFetchTop20}
              disabled={fetchLogosMutation.isPending}
              className="gap-2"
            >
              {fetchLogosMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Fetch Top 20 Colleges
            </Button>
            <Button
              variant="outline"
              onClick={() => handleFetchNext(10)}
              disabled={fetchLogosMutation.isPending}
              className="gap-2"
            >
              {fetchLogosMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Fetch Next 10 Missing
            </Button>
            <Button
              variant="outline"
              onClick={() => handleFetchNext(50)}
              disabled={fetchLogosMutation.isPending}
              className="gap-2"
            >
              Fetch Next 50
            </Button>
          </div>

          {/* Fetch results */}
          {fetchResult && (
            <div className="mt-3 p-3 bg-background rounded-md border text-sm">
              {fetchResult.success ? (
                <div className="space-y-2">
                  <div className="font-medium text-green-600 dark:text-green-400">
                    {fetchResult.message}
                  </div>
                  {fetchResult.results && fetchResult.results.length > 0 && (
                    <ScrollArea className="max-h-40">
                      <div className="space-y-1">
                        {fetchResult.results.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {r.success ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <X className="h-3 w-3 text-red-500" />
                            )}
                            <span className="font-mono">{r.normalized_name}</span>
                            {r.error && (
                              <span className="text-muted-foreground truncate">
                                - {r.error}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              ) : (
                <div className="text-red-600 dark:text-red-400">
                  Error: {fetchResult.error}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            Total: {stats.total}
          </Badge>
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">
            <Check className="h-3 w-3 mr-1" />
            With Logo: {stats.withLogos}
          </Badge>
          <Badge className="bg-muted text-muted-foreground">
            <X className="h-3 w-3 mr-1" />
            Missing: {stats.withoutLogos}
          </Badge>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search colleges..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* College List */}
        <ScrollArea className="h-[600px] border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y">
              {colleges?.map((college) => (
                <div
                  key={college.id}
                  className="p-3 flex items-center gap-3 hover:bg-muted/50"
                >
                  {/* Logo preview */}
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {college.logo_url ? (
                      <img
                        src={college.logo_url}
                        alt={college.normalized_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* College info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {college.college_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {college.normalized_name}
                      {college.short_name && ` • ${college.short_name}`}
                    </div>
                  </div>

                  {/* Status */}
                  {college.logo_url ? (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 shrink-0">
                      <Check className="h-3 w-3 mr-1" />
                      Logo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground shrink-0">
                      Missing
                    </Badge>
                  )}

                  {/* Upload button */}
                  <Button
                    variant={college.logo_url ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleUploadClick(college)}
                    disabled={uploadingCollege === college.normalized_name}
                    className="shrink-0"
                  >
                    {uploadingCollege === college.normalized_name ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        {college.logo_url ? 'Replace' : 'Upload'}
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
