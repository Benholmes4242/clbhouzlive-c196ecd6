import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Loader2, Sun, Moon, Search, Grid, List, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Logo {
  id: string;
  file_name: string;
  file_url: string;
  category: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

interface BrandLogosTabProps {
  logos: Logo[];
  isLoading: boolean;
  onRefresh: () => void;
}

const CATEGORIES = {
  app_logo_light: 'App Logo - Light Mode',
  app_logo_dark: 'App Logo - Dark Mode',
  handicap_bodies: 'Official Golf Handicap & Regulatory Bodies',
  golf_courses: 'Golf Courses',
  universities: 'Universities',
  golf_tours: 'Golf Tours'
};

export const BrandLogosTab: React.FC<BrandLogosTabProps> = ({
  logos,
  isLoading,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<Logo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLogos = logos.filter(logo => {
    const matchesSearch = logo.file_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || logo.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCategory) {
      toast.error('Please select a file and category');
      return;
    }
    setPendingUpload(file);
  };

  const handleSaveLogo = async () => {
    if (!pendingUpload || !selectedCategory) return;

    setUploading(true);
    try {
      const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
      const uploadResult = await uploadToCloudflareR2(pendingUpload, 'clbhouz-club-logos', pendingUpload.name);

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const { error: dbError } = await supabase
        .from('logos')
        .insert({
          file_name: pendingUpload.name,
          file_url: uploadResult.publicUrl,
          category: selectedCategory,
          file_size: pendingUpload.size,
          mime_type: pendingUpload.type,
        });

      if (dbError) throw dbError;

      toast.success('Logo updated');
      onRefresh();
      setPendingUpload(null);
      setSelectedCategory('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast.error("Couldn't upload logo", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async (logo: Logo) => {
    try {
      const { error } = await supabase.from('logos').delete().eq('id', logo.id);
      if (error) throw error;
      toast.success('Logo deleted successfully');
      onRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete logo: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Upload New Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="logo-file">Logo File</Label>
              <Input
                ref={fileInputRef}
                id="logo-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading || !selectedCategory}
              />
            </div>
            {pendingUpload && (
              <div className="flex items-end gap-2">
                <Button onClick={handleSaveLogo} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  {uploading ? 'Uploading...' : 'Save Logo'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setPendingUpload(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {pendingUpload && (
            <div className="p-4 border rounded bg-muted/50 flex items-center gap-4">
              <div className="w-16 h-16 border rounded bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={URL.createObjectURL(pendingUpload)}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div>
                <p className="font-medium">{pendingUpload.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(pendingUpload.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Logo Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredLogos.map((logo) => (
            <Card key={logo.id} className="p-3 group">
              <div 
                className="aspect-square bg-muted rounded overflow-hidden mb-2 cursor-pointer"
                onClick={() => setPreviewLogo(logo)}
              >
                <img
                  src={logo.file_url}
                  alt={logo.file_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground truncate mb-1">{logo.file_name}</p>
              <Badge variant="outline" className="text-[10px] mb-2">
                {CATEGORIES[logo.category as keyof typeof CATEGORIES] || logo.category}
              </Badge>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(logo.file_url, '_blank')}
                >
                  <Download className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Logo</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{logo.file_name}"?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteLogo(logo)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredLogos.map((logo) => (
              <div key={logo.id} className="p-3 flex items-center gap-4 hover:bg-muted/50">
                <div 
                  className="w-12 h-12 bg-muted rounded overflow-hidden shrink-0 cursor-pointer"
                  onClick={() => setPreviewLogo(logo)}
                >
                  <img src={logo.file_url} alt={logo.file_name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{logo.file_name}</p>
                  <Badge variant="outline" className="text-xs">
                    {CATEGORIES[logo.category as keyof typeof CATEGORIES] || logo.category}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(logo.file_url, '_blank')}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Logo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{logo.file_name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteLogo(logo)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filteredLogos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No logos found
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewLogo} onOpenChange={() => setPreviewLogo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewLogo?.file_name}</DialogTitle>
          </DialogHeader>
          {previewLogo && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-h-[400px] bg-muted rounded flex items-center justify-center p-4">
                <img
                  src={previewLogo.file_url}
                  alt={previewLogo.file_name}
                  className="max-w-full max-h-[360px] object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => window.open(previewLogo.file_url, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
