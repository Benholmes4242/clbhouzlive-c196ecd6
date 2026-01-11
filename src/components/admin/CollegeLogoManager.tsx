import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Upload, ExternalLink, AlertCircle, RefreshCw, Image as ImageIcon, Wand2, Download, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CollegeLogoSource {
  id: string;
  normalized_name: string;
  source: string;
  source_page_url: string | null;
  suggested_url: string | null;
  found_page_url: string | null;
  found_image_url: string | null;
  confidence: number | null;
  status: string;
  last_error: string | null;
  college_media: {
    college_name: string;
    short_name: string | null;
    logo_url: string | null;
  };
}

interface Stats {
  pending: number;
  matched: number;
  downloaded: number;
  uploaded: number;
  failed: number;
  total: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  matched: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  downloaded: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  uploaded: 'bg-green-500/20 text-green-700 dark:text-green-300',
  failed: 'bg-destructive/20 text-destructive',
};

export default function CollegeLogoManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingCollege, setEditingCollege] = useState<CollegeLogoSource | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [importingColleges, setImportingColleges] = useState<Set<string>>(new Set());
  const [matchingColleges, setMatchingColleges] = useState<Set<string>>(new Set());

  // Fetch colleges with mapping status
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['college-logos', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '100');

      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('import-college-logos', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data as { colleges: CollegeLogoSource[]; stats: Stats; total: number };
    },
  });

  // Auto-match single mutation
  const autoMatchSingleMutation = useMutation({
    mutationFn: async (normalized_name: string) => {
      setMatchingColleges(prev => new Set(prev).add(normalized_name));
      
      const response = await supabase.functions.invoke('import-college-logos', {
        method: 'POST',
        body: {
          action: 'auto-match-single',
          normalized_name,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'matched') {
        toast.success(`Found logo for ${data.normalized_name} (${Math.round(data.confidence * 100)}% confidence)`);
      } else {
        toast.warning(`No confident match found for ${data.normalized_name}`);
      }
      queryClient.invalidateQueries({ queryKey: ['college-logos'] });
    },
    onError: (error) => {
      toast.error(`Auto-match failed: ${error.message}`);
    },
    onSettled: (_, __, normalized_name) => {
      setMatchingColleges(prev => {
        const next = new Set(prev);
        next.delete(normalized_name);
        return next;
      });
    },
  });

  // Auto-match batch mutation
  const autoMatchBatchMutation = useMutation({
    mutationFn: async (limit: number) => {
      const response = await supabase.functions.invoke('import-college-logos', {
        method: 'POST',
        body: {
          action: 'auto-match-batch',
          limit,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Auto-matched ${data.matched} of ${data.processed} colleges`);
      queryClient.invalidateQueries({ queryKey: ['college-logos'] });
    },
    onError: (error) => {
      toast.error(`Batch auto-match failed: ${error.message}`);
    },
  });

  // Import matched batch mutation
  const importMatchedBatchMutation = useMutation({
    mutationFn: async (limit: number) => {
      const response = await supabase.functions.invoke('import-college-logos', {
        method: 'POST',
        body: {
          action: 'import-matched-batch',
          limit,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} logos to R2`);
      queryClient.invalidateQueries({ queryKey: ['college-logos'] });
    },
    onError: (error) => {
      toast.error(`Batch import failed: ${error.message}`);
    },
  });

  // Import single logo mutation
  const importLogoMutation = useMutation({
    mutationFn: async ({ normalized_name, image_url }: { normalized_name: string; image_url: string }) => {
      setImportingColleges(prev => new Set(prev).add(normalized_name));
      
      const response = await supabase.functions.invoke('import-college-logos', {
        method: 'POST',
        body: {
          action: 'import-single',
          normalized_name,
          image_url,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Imported logo for ${data.normalized_name}`);
      queryClient.invalidateQueries({ queryKey: ['college-logos'] });
      setEditingCollege(null);
      setImageUrl('');
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
    onSettled: (_, __, variables) => {
      setImportingColleges(prev => {
        const next = new Set(prev);
        next.delete(variables.normalized_name);
        return next;
      });
    },
  });

  const handleImport = (college: CollegeLogoSource) => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    importLogoMutation.mutate({
      normalized_name: college.normalized_name,
      image_url: imageUrl.trim(),
    });
  };

  const handleImportMatched = (college: CollegeLogoSource) => {
    if (!college.found_image_url) {
      toast.error('No matched image URL');
      return;
    }
    importLogoMutation.mutate({
      normalized_name: college.normalized_name,
      image_url: college.found_image_url,
    });
  };

  const stats = data?.stats;
  const colleges = data?.colleges || [];

  const isBatchProcessing = autoMatchBatchMutation.isPending || importMatchedBatchMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          College Logo Manager
        </CardTitle>
        <CardDescription>
          Auto-match logos with Perplexity AI and import to R2
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Batch Action Buttons */}
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          <Button
            variant="default"
            size="sm"
            onClick={() => autoMatchBatchMutation.mutate(10)}
            disabled={isBatchProcessing || (stats?.pending ?? 0) === 0}
          >
            {autoMatchBatchMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Auto-match Pending (10)
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => importMatchedBatchMutation.mutate(10)}
            disabled={isBatchProcessing || (stats?.matched ?? 0) === 0}
          >
            {importMatchedBatchMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Import Matched (10)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              autoMatchBatchMutation.mutate(50);
            }}
            disabled={isBatchProcessing || (stats?.pending ?? 0) === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Auto-match (50)
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer" onClick={() => setStatusFilter(null)}>
              All: {stats.total}
            </Badge>
            <Badge 
              className={`cursor-pointer ${statusFilter === 'pending' ? 'ring-2 ring-primary' : ''} ${statusColors.pending}`}
              onClick={() => setStatusFilter(statusFilter === 'pending' ? null : 'pending')}
            >
              Pending: {stats.pending}
            </Badge>
            <Badge 
              className={`cursor-pointer ${statusFilter === 'matched' ? 'ring-2 ring-primary' : ''} ${statusColors.matched}`}
              onClick={() => setStatusFilter(statusFilter === 'matched' ? null : 'matched')}
            >
              Matched: {stats.matched}
            </Badge>
            <Badge 
              className={`cursor-pointer ${statusFilter === 'uploaded' ? 'ring-2 ring-primary' : ''} ${statusColors.uploaded}`}
              onClick={() => setStatusFilter(statusFilter === 'uploaded' ? null : 'uploaded')}
            >
              Uploaded: {stats.uploaded}
            </Badge>
            <Badge 
              className={`cursor-pointer ${statusFilter === 'failed' ? 'ring-2 ring-primary' : ''} ${statusColors.failed}`}
              onClick={() => setStatusFilter(statusFilter === 'failed' ? null : 'failed')}
            >
              Failed: {stats.failed}
            </Badge>
          </div>
        )}

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
        <ScrollArea className="h-[500px] border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y">
              {colleges.map((college) => (
                <div
                  key={college.id}
                  className="p-3 flex items-center gap-3 hover:bg-muted/50"
                >
                  {/* Logo preview */}
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {college.college_media?.logo_url ? (
                      <img
                        src={college.college_media.logo_url}
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
                      {college.college_media?.college_name || college.normalized_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {college.normalized_name}
                      {college.college_media?.short_name && ` • ${college.college_media.short_name}`}
                    </div>
                    {college.confidence !== null && college.confidence > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {Math.round(college.confidence * 100)}% confidence
                      </div>
                    )}
                    {college.last_error && (
                      <div className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {college.last_error}
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <Badge className={statusColors[college.status] || ''}>
                    {college.status}
                  </Badge>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {college.found_page_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Open SportsLogos page"
                        onClick={() => window.open(college.found_page_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Auto-match button for pending/failed */}
                    {(college.status === 'pending' || college.status === 'failed') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => autoMatchSingleMutation.mutate(college.normalized_name)}
                        disabled={matchingColleges.has(college.normalized_name)}
                      >
                        {matchingColleges.has(college.normalized_name) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-1" />
                            Match
                          </>
                        )}
                      </Button>
                    )}

                    {/* Import button for matched */}
                    {college.status === 'matched' && college.found_image_url && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleImportMatched(college)}
                        disabled={importingColleges.has(college.normalized_name)}
                      >
                        {importingColleges.has(college.normalized_name) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Import
                          </>
                        )}
                      </Button>
                    )}

                    {/* Manual add/replace button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCollege(college);
                        setImageUrl(college.found_image_url || '');
                      }}
                      disabled={importingColleges.has(college.normalized_name)}
                    >
                      {college.college_media?.logo_url ? 'Replace' : 'Manual'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Edit/Import Dialog */}
        <Dialog open={!!editingCollege} onOpenChange={(open) => !open && setEditingCollege(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCollege?.college_media?.college_name || editingCollege?.normalized_name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current logo */}
              {editingCollege?.college_media?.logo_url && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Current:</span>
                  <img
                    src={editingCollege.college_media.logo_url}
                    alt="Current logo"
                    className="h-12 w-12 object-contain bg-muted rounded"
                  />
                </div>
              )}

              {/* Found URL info */}
              {editingCollege?.found_image_url && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    AI-Discovered URL ({Math.round((editingCollege.confidence || 0) * 100)}% confidence)
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {editingCollege.found_image_url}
                  </div>
                  {editingCollege.found_page_url && (
                    <a
                      href={editingCollege.found_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View source page
                    </a>
                  )}
                </div>
              )}

              {/* Image URL input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo Image URL</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a direct link to a PNG/JPG/SVG logo image. The image will be downloaded and uploaded to R2.
                </p>
              </div>

              {/* Preview */}
              {imageUrl && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Preview:</span>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-12 w-12 object-contain bg-muted rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCollege(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => editingCollege && handleImport(editingCollege)}
                disabled={!imageUrl.trim() || importLogoMutation.isPending}
              >
                {importLogoMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Logo
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
