
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Trash2, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
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

interface Logo {
  id: string;
  file_name: string;
  file_url: string;
  category: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

const LogosManagement = () => {
  
  const { theme } = useTheme();
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);

  const categories = {
    app_logo_light: 'App Logo - Light Mode',
    app_logo_dark: 'App Logo - Dark Mode',
    handicap_bodies: 'Official Golf Handicap & Regulatory Bodies',
    golf_courses: 'Golf Courses',
    universities: 'Universities',
    golf_tours: 'Golf Tours'
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('logos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogos(data || []);
    } catch (error: any) {
      console.error('Error fetching logos:', error);
      toast.error("Failed to fetch logos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCategory) {
      toast.error("Please select a file and category");
      return;
    }
    setPendingUpload(file);
  };

  const handleSaveLogo = async () => {
    if (!pendingUpload || !selectedCategory) return;

    setUploading(true);
    try {
      const fileExt = pendingUpload.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${selectedCategory}/${fileName}`;

      // Upload to Cloudflare R2 instead of Supabase storage
      const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
      const uploadResult = await uploadToCloudflareR2(pendingUpload, 'clbhouz-club-logos', pendingUpload.name);

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const publicUrl = uploadResult.publicUrl;

      // Save to database
      const { error: dbError } = await supabase
        .from('logos')
        .insert({
          file_name: pendingUpload.name,
          file_url: publicUrl,
          category: selectedCategory,
          file_size: pendingUpload.size,
          mime_type: pendingUpload.type,
        });

      if (dbError) throw dbError;

      toast.success("Logo uploaded and set as active successfully");

      fetchLogos();
      setPendingUpload(null);
      setSelectedCategory('');
      
      // Clear the file input
      const fileInput = document.getElementById('logo-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async (logo: Logo) => {
    try {
      // Note: R2 deletion can be implemented later if needed
      // For now, just remove from database as most platforms don't delete media files

      // Delete from database
      const { error } = await supabase
        .from('logos')
        .delete()
        .eq('id', logo.id);

      if (error) throw error;

      toast.success("Logo deleted successfully");

      fetchLogos();
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast.error("Failed to delete logo");
    }
  };

  const getLogosByCategory = (category: string) => {
    return logos.filter(logo => logo.category === category);
  };

  const getCurrentAppLogo = () => {
    const lightLogos = getLogosByCategory('app_logo_light');
    const darkLogos = getLogosByCategory('app_logo_dark');
    
    if (theme === 'dark') {
      return darkLogos.length > 0 ? darkLogos[0] : lightLogos[0];
    } else if (theme === 'light') {
      return lightLogos.length > 0 ? lightLogos[0] : null;
    } else {
      // System theme - check if user prefers dark
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark && darkLogos.length > 0 ? darkLogos[0] : lightLogos[0];
    }
  };

  const AppLogoPreview = () => {
    const lightLogos = getLogosByCategory('app_logo_light');
    const darkLogos = getLogosByCategory('app_logo_dark');
    const currentLogo = getCurrentAppLogo();
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            App Logos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Active Logo Preview */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">Current Active Logo</span>
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            <div className="mx-auto w-48 h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-sq-sm border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
              {currentLogo ? (
                <img
                  src={currentLogo.file_url}
                  alt="Current app logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-sm">No logo uploaded</span>
              )}
            </div>
          </div>

          {/* Light and Dark Mode Logos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Mode Logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span className="font-medium">Light Mode Logo</span>
                <span className="text-xs text-muted-foreground">({lightLogos.length})</span>
              </div>
              <div className="bg-white border rounded-sq-sm p-4 min-h-[120px] flex items-center justify-center">
                {lightLogos.length > 0 ? (
                  <div className="text-center space-y-2">
                    <img
                      src={lightLogos[0].file_url}
                      alt="Light mode logo"
                      className="max-h-16 max-w-full object-contain mx-auto"
                    />
                    <p className="text-xs text-gray-600">{lightLogos[0].file_name}</p>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">No light mode logo</span>
                )}
              </div>
            </div>

            {/* Dark Mode Logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span className="font-medium">Dark Mode Logo</span>
                <span className="text-xs text-muted-foreground">({darkLogos.length})</span>
              </div>
              <div className="bg-gray-900 border rounded-sq-sm p-4 min-h-[120px] flex items-center justify-center">
                {darkLogos.length > 0 ? (
                  <div className="text-center space-y-2">
                    <img
                      src={darkLogos[0].file_url}
                      alt="Dark mode logo"
                      className="max-h-16 max-w-full object-contain mx-auto"
                    />
                    <p className="text-xs text-gray-300">{darkLogos[0].file_name}</p>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">No dark mode logo</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LogoGrid = ({ category }: { category: string }) => {
    const categoryLogos = getLogosByCategory(category);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categoryLogos.map((logo) => (
          <Card key={logo.id} className="p-3">
            <div className="aspect-square bg-gray-50 rounded-sq-sm overflow-hidden mb-2">
              <img
                src={logo.file_url}
                alt={logo.file_name}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs text-gray-600 truncate mb-2">{logo.file_name}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Logo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{logo.file_name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteLogo(logo)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Logos Management</h2>
        <p className="text-muted-foreground">Manage app logos and uploaded logos across different categories</p>
      </div>

      {/* App Logo Preview */}
      <AppLogoPreview />

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="logo-file">Logo File</Label>
              <Input
                id="logo-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading || !selectedCategory}
              />
            </div>
          </div>
          
          {/* Preview and Save Section */}
          {pendingUpload && (
            <div className="space-y-4 p-4 border rounded-sq-sm bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Preview:</span>
                <span className="text-sm text-muted-foreground">{pendingUpload.name}</span>
              </div>
              <div className="flex justify-center">
                <div className="w-32 h-24 border rounded-sq-sm overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(pendingUpload)}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleSaveLogo}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Save Logo
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setPendingUpload(null);
                    const fileInput = document.getElementById('logo-file') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {uploading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Uploading logo...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo Tabs */}
      <Tabs defaultValue="app_logo_light" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="app_logo_light" className="text-xs">
            <Sun className="w-3 h-3 mr-1" />
            Light Logo
          </TabsTrigger>
          <TabsTrigger value="app_logo_dark" className="text-xs">
            <Moon className="w-3 h-3 mr-1" />
            Dark Logo
          </TabsTrigger>
          <TabsTrigger value="handicap_bodies" className="text-xs">
            Handicap Bodies
          </TabsTrigger>
          <TabsTrigger value="golf_courses" className="text-xs">
            Golf Courses
          </TabsTrigger>
          <TabsTrigger value="universities" className="text-xs">
            Universities
          </TabsTrigger>
          <TabsTrigger value="golf_tours" className="text-xs">
            Golf Tours
          </TabsTrigger>
        </TabsList>
        
        {Object.entries(categories).map(([key, label]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{label}</h3>
              <span className="text-sm text-muted-foreground">
                {getLogosByCategory(key).length} logos
              </span>
            </div>
            <LogoGrid category={key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LogosManagement;
