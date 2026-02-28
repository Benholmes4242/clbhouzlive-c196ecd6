import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Upload, RefreshCw, Image as ImageIcon, Check, X, Wand2, Download, Grid, List } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CollegeMedia {
  id: string;
  normalized_name: string;
  college_name: string;
  short_name: string | null;
  logo_url: string | null;
}

interface CollegeLogosTabProps {
  colleges: CollegeMedia[];
  isLoading: boolean;
  onRefresh: () => void;
}

const TOP_20_COLLEGES = [
  'georgia', 'oklahomastate', 'texas', 'wakeforest', 'florida',
  'alabama', 'georgiatech', 'stanford', 'floridastate', 'sandiegostate',
  'northcarolina', 'southerncalifornia', 'louisianastate', 'virginia',
  'texastech', 'tennessee', 'ucla', 'clemson', 'california', 'duke'
];

export const CollegeLogosTab: React.FC<CollegeLogosTabProps> = ({
  colleges,
  isLoading,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [uploadingCollege, setUploadingCollege] = useState<string | null>(null);
  const [previewCollege, setPreviewCollege] = useState<CollegeMedia | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<CollegeMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredColleges = colleges.filter(college =>
    college.college_name.toLowerCase().includes(search.toLowerCase()) ||
    college.normalized_name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: colleges.length,
    withLogos: colleges.filter(c => c.logo_url).length,
    withoutLogos: colleges.filter(c => !c.logo_url).length,
  };

  // Upload mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async ({ normalized_name, file }: { normalized_name: string; file: File }) => {
      setUploadingCollege(normalized_name);

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
    onSuccess: () => {
      toast.success('Logo updated');
      onRefresh();
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
      return response.data;
    },
    onSuccess: (data) => {
      if (data.successful && data.successful > 0) {
        toast.success(`Fetched ${data.successful} logos from Wikipedia`);
        onRefresh();
      } else {
        toast.info(data.message || 'No logos fetched');
      }
    },
    onError: (error) => {
      toast.error(`Fetch failed: ${error.message}`);
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
      toast.error('File too large', { description: 'Max 5MB' });
      return;
    }

    uploadLogoMutation.mutate({
      normalized_name: selectedCollege.normalized_name,
      file,
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadClick = (college: CollegeMedia) => {
    setSelectedCollege(college);
    fileInputRef.current?.click();
  };

  const handleFetchTop20 = () => {
    const missingLogos = TOP_20_COLLEGES.filter(name =>
      !colleges.find(c => c.normalized_name === name && c.logo_url)
    );
    if (missingLogos.length === 0) {
      toast.info('All top 20 colleges already have logos');
      return;
    }
    fetchLogosMutation.mutate({ normalized_names: missingLogos });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Auto-fetch Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-4 w-4 text-primary" />
            Wikipedia Logo Fetcher
          </CardTitle>
          <CardDescription>
            Automatically fetch college logos from Wikipedia athletics pages
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              onClick={() => fetchLogosMutation.mutate({ limit: 10 })}
              disabled={fetchLogosMutation.isPending}
              className="gap-2"
            >
              Fetch Next 10 Missing
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchLogosMutation.mutate({ limit: 50 })}
              disabled={fetchLogosMutation.isPending}
              className="gap-2"
            >
              Fetch Next 50
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Badge variant="outline">Total: {stats.total}</Badge>
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 gap-1">
            <Check className="h-3 w-3" />
            With Logo: {stats.withLogos}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <X className="h-3 w-3" />
            Missing: {stats.withoutLogos}
          </Badge>
        </div>
        <div className="flex-1" />
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colleges..."
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
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* College List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredColleges.map((college) => (
            <Card key={college.id} className="p-3 group">
              <div
                className="aspect-square bg-muted rounded overflow-hidden mb-2 flex items-center justify-center cursor-pointer"
                onClick={() => college.logo_url && setPreviewCollege(college)}
              >
                {college.logo_url ? (
                  <img
                    src={college.logo_url}
                    alt={college.normalized_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium truncate">{college.college_name}</p>
              <p className="text-xs text-muted-foreground truncate mb-2">{college.normalized_name}</p>
              <Button
                variant={college.logo_url ? "outline" : "default"}
                size="sm"
                className="w-full"
                onClick={() => handleUploadClick(college)}
                disabled={uploadingCollege === college.normalized_name}
              >
                {uploadingCollege === college.normalized_name ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-3 w-3 mr-1" />
                    {college.logo_url ? 'Replace' : 'Upload'}
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {filteredColleges.map((college) => (
                <div
                  key={college.id}
                  className="p-3 flex items-center gap-3 hover:bg-muted/50"
                >
                  <div
                    className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                    onClick={() => college.logo_url && setPreviewCollege(college)}
                  >
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
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{college.college_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {college.normalized_name}
                      {college.short_name && ` • ${college.short_name}`}
                    </div>
                  </div>
                  {college.logo_url ? (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 shrink-0 gap-1">
                      <Check className="h-3 w-3" />
                      Logo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground shrink-0">
                      Missing
                    </Badge>
                  )}
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
          </ScrollArea>
        </Card>
      )}

      {filteredColleges.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No colleges found matching "{search}"
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewCollege} onOpenChange={() => setPreviewCollege(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{previewCollege?.college_name}</DialogTitle>
          </DialogHeader>
          {previewCollege?.logo_url && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-64 bg-muted rounded flex items-center justify-center p-4">
                <img
                  src={previewCollege.logo_url}
                  alt={previewCollege.normalized_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <Button onClick={() => window.open(previewCollege.logo_url!, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
