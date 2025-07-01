
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = {
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
      toast({
        title: "Error",
        description: "Failed to fetch logos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a file and category",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${selectedCategory}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('logos')
        .insert({
          file_name: file.name,
          file_url: data.publicUrl,
          category: selectedCategory,
          file_size: file.size,
          mime_type: file.type,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });

      fetchLogos();
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async (logo: Logo) => {
    try {
      // Delete from storage
      const urlParts = logo.file_url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      await supabase.storage
        .from('logos')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('logos')
        .delete()
        .eq('id', logo.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Logo deleted successfully",
      });

      fetchLogos();
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast({
        title: "Error",
        description: "Failed to delete logo",
        variant: "destructive",
      });
    }
  };

  const getLogosByCategory = (category: string) => {
    return logos.filter(logo => logo.category === category);
  };

  const LogoGrid = ({ category }: { category: string }) => {
    const categoryLogos = getLogosByCategory(category);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categoryLogos.map((logo) => (
          <Card key={logo.id} className="p-3">
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
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
        <p className="text-muted-foreground">Manage uploaded logos across different categories</p>
      </div>

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
                onChange={handleFileUpload}
                disabled={uploading || !selectedCategory}
              />
            </div>
          </div>
          {uploading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Uploading logo...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo Tabs */}
      <Tabs defaultValue="handicap_bodies" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="handicap_bodies" className="text-xs">
            Official Golf Handicap & Regulatory Bodies
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
