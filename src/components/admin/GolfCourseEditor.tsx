import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { X, ExternalLink, Copy } from 'lucide-react';
import CourseImageUpload from './golf-courses/CourseImageUpload';
import CourseReviewsSection from './golf-courses/CourseReviewsSection';
import { GolfCourse, CourseRating, GolfCourseEditorProps } from './golf-courses/types';

// Define the primary countries that have regional Top 100 lists
const primaryCountryOptions = [
  'Britain & Ireland',
  'USA', 
  'Continental Europe'
];

// Map primary countries to their sub-countries
const subCountryOptions: Record<string, string[]> = {
  'Britain & Ireland': [
    'England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Isle of Man'
  ],
  'USA': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming', 'District of Columbia'
  ],
  'Continental Europe': [
    'Austria', 'Belgium', 'Bulgaria', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 
    'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 
    'Netherlands', 'Norway', 'Poland', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 
    'Sweden', 'Switzerland', 'Turkey', 'Ireland', 'Northern Ireland', 'Scotland', 'England', 'Wales'
  ]
};

// Regional Top 100 options
const regionalTop100Options = [
  'Great Britain and Ireland',
  'USA',
  'Continental Europe'
];

// Generate rank options 1-100
const rankOptions = Array.from({ length: 100 }, (_, i) => (i + 1).toString());

const GolfCourseEditor: React.FC<GolfCourseEditorProps> = ({ course, isCreating, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSubCountry, setSelectedSubCountry] = useState('');
  const [courseImageUrl, setCourseImageUrl] = useState<string | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // New state for Top 100s section
  const [regionalRankingRegion, setRegionalRankingRegion] = useState('');
  const [regionalRank, setRegionalRank] = useState('');
  const [globalRank, setGlobalRank] = useState('');

  // Fetch course ratings/reviews
  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['course-ratings', course?.id],
    queryFn: async () => {
      if (!course?.id) return [];
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', course.id)
        .order('review_date', { ascending: false });

      if (error) throw error;
      
      const ratingsWithProfiles = await Promise.all(
        (data || []).map(async (rating) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, display_name')
            .eq('id', rating.user_id)
            .single();
          
          return {
            ...rating,
            user_profile: profile
          };
        })
      );
      
      return ratingsWithProfiles as CourseRating[];
    },
    enabled: !isCreating && !!course?.id,
  });

  // Initialize form with course data
  useEffect(() => {
    console.log('=== EDITOR: UseEffect triggered ===');
    console.log('course:', course);
    console.log('isCreating:', isCreating);
    
    if (course && !isCreating) {
      console.log('=== EDITOR: Initializing form with course data ===');
      console.log('Course data:', course);
      console.log('Course sub_country value:', course.sub_country);
      
      // Set all state synchronously in the correct order
      const countryValue = course.country || '';
      const subCountryValue = course.sub_country || '';
      
      console.log('About to set selectedCountry to:', countryValue);
      console.log('About to set selectedSubCountry to:', subCountryValue);
      
      setSelectedCountry(countryValue);
      setSelectedSubCountry(subCountryValue);
      setCourseImageUrl(course.thumbnail_image || null);
      
      // Set Top 100s values
      if (course.regional_rank) {
        setRegionalRank(course.regional_rank.toString());
        // Map country to regional ranking region
        if (course.country === 'Britain & Ireland') {
          setRegionalRankingRegion('Great Britain and Ireland');
        } else if (course.country === 'USA') {
          setRegionalRankingRegion('USA');
        } else if (course.country === 'Continental Europe') {
          setRegionalRankingRegion('Continental Europe');
        }
      } else {
        setRegionalRankingRegion('');
        setRegionalRank('');
      }
      
      if (course.global_rank) {
        setGlobalRank(course.global_rank.toString());
      } else {
        setGlobalRank('');
      }
      
      // Reset form with course data
      reset({
        name: course.name,
        region: course.region || '',
        description: course.description || '',
        website_url: course.website_url || '',
        latitude: course.latitude || '',
        longitude: course.longitude || '',
      });
      
      setIsFormInitialized(true);
      
    } else {
      console.log('=== EDITOR: Resetting form for new course ===');
      reset({
        name: '',
        region: '',
        description: '',
        website_url: '',
        latitude: '',
        longitude: '',
      });
      setSelectedCountry('');
      setSelectedSubCountry('');
      setCourseImageUrl(null);
      setRegionalRankingRegion('');
      setRegionalRank('');
      setGlobalRank('');
      setIsFormInitialized(true);
    }
  }, [course?.id, isCreating, reset]);

  // Save course mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('=== EDITOR: Saving course ===');
      console.log('Form data:', data);
      console.log('Selected country:', selectedCountry);
      console.log('Selected sub-country:', selectedSubCountry);
      console.log('Course image URL:', courseImageUrl);
      console.log('Regional ranking region:', regionalRankingRegion);
      console.log('Regional rank:', regionalRank);
      console.log('Global rank:', globalRank);
      
      
      // Auto-determine continent based on country
      let continent: "North America" | "South America" | "Europe" | "Asia" | "Africa" | "Oceania" | null = null;
      if (selectedCountry === 'USA') {
        continent = 'North America';
      } else if (selectedCountry === 'Britain & Ireland' || selectedCountry === 'Continental Europe') {
        continent = 'Europe';
      }
      
      const courseData = {
        name: data.name,
        country: selectedCountry,
        sub_country: selectedSubCountry,
        region: data.region || null,
        continent: continent,
        global_rank: globalRank ? parseInt(globalRank) : null,
        regional_rank: regionalRank ? parseInt(regionalRank) : null,
        country_rank: null, // Removed from UI
        description: data.description || null,
        thumbnail_image: courseImageUrl || null,
        website_url: data.website_url || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      };

      console.log('=== EDITOR: Final course data to save ===');
      console.log('courseData:', courseData);

      if (isCreating) {
        const { data: result, error } = await supabase
          .from('golf_courses')
          .insert(courseData)
          .select()
          .single();
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Course created successfully:', result);
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('golf_courses')
          .update(courseData)
          .eq('id', course!.id)
          .select()
          .single();
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Course updated successfully:', result);
        return result;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isCreating ? "Golf course created successfully" : "Golf course updated successfully",
      });
      // Force refetch of golf courses data
      queryClient.invalidateQueries({ queryKey: ['admin-golf-courses'] });
      queryClient.refetchQueries({ queryKey: ['admin-golf-courses'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Save mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to ${isCreating ? 'create' : 'update'} golf course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      if (!course?.id) throw new Error('No course ID provided');
      
      const { error } = await supabase
        .from('golf_courses')
        .delete()
        .eq('id', course.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Golf course deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-golf-courses'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete golf course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('course_ratings')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['course-ratings', course?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete review: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    console.log('=== EDITOR: Form submitted ===');
    console.log('Form data:', data);
    console.log('Current selectedCountry:', selectedCountry);
    console.log('Current selectedSubCountry:', selectedSubCountry);
    console.log('Current courseImageUrl:', courseImageUrl);
    
    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter a golf course name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCountry || selectedCountry.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a country/region",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSubCountry || selectedSubCountry.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a sub-country",
        variant: "destructive",
      });
      return;
    }

    // Validate Top 100s rankings - only if regional ranking region is selected
    if (regionalRankingRegion && !regionalRank) {
      toast({
        title: "Error",
        description: "Please select a rank for the regional Top 100",
        variant: "destructive",
      });
      return;
    }

    // All validation passed, proceed with save
    saveMutation.mutate(data);
  };

  const handleDeleteReview = (reviewId: string) => {
    deleteReviewMutation.mutate(reviewId);
  };

  const handleDeleteCourse = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteCourse = () => {
    deleteCourseMutation.mutate();
    setShowDeleteDialog(false);
  };

  const handleCloseModal = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    const newAvailableSubCountries = subCountryOptions[value] || [];
    if (selectedSubCountry && !newAvailableSubCountries.includes(selectedSubCountry)) {
      setSelectedSubCountry('');
    }
  };

  const handleRegionalRankingRegionChange = (value: string) => {
    setRegionalRankingRegion(value);
    if (!value) {
      setRegionalRank('');
    }
  };

  const availableSubCountries = selectedCountry ? subCountryOptions[selectedCountry] || [] : [];


  const handleImageChange = (imageUrl: string | null) => {
    console.log('=== EDITOR: Image changed to:', imageUrl);
    setCourseImageUrl(imageUrl);
  };

  // Don't render the form until it's fully initialized
  if (!isFormInitialized) {
    return null;
  }

  return (
    <>
      <Dialog open={true} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Edit Golf Course</h1>
              {!isCreating && course && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>ID: {course.id.slice(0, 8)}...</span>
                  <span>•</span>
                  <span>Last saved 2m ago</span>
                  <span>•</span>
                  <span>by Ben</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="submit" 
                form="course-form"
                disabled={saveMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex h-[calc(95vh-80px)]">
            {/* Left Sidebar Navigation */}
            <div className="w-48 border-r bg-muted/20">
              <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="h-full">
                <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 gap-1">
                  <TabsTrigger value="details" className="w-full justify-start text-left bg-muted/50 data-[state=active]:bg-background">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="location" className="w-full justify-start text-left bg-muted/50 data-[state=active]:bg-background">
                    Location
                  </TabsTrigger>
                  <TabsTrigger value="rankings" className="w-full justify-start text-left bg-muted/50 data-[state=active]:bg-background">
                    Rankings
                  </TabsTrigger>
                  <TabsTrigger value="media" className="w-full justify-start text-left bg-muted/50 data-[state=active]:bg-background">
                    Media
                  </TabsTrigger>
                  {!isCreating && (
                    <>
                      <TabsTrigger value="reviews" className="w-full justify-start text-left bg-muted/50 data-[state=active]:bg-background">
                        Reviews
                      </TabsTrigger>
                      <TabsTrigger value="history" className="w-full justify-start text-left bg-muted/50 data-[state=active]:bg-background">
                        History
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              </Tabs>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
              <form id="course-form" onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="flex-1 p-6">
                  <Tabs value={activeTab} className="h-full">
                    <TabsContent value="details" className="mt-0 h-full">
                      <div className="grid grid-cols-3 gap-8 h-full">
                        {/* Left Column - Main Fields */}
                        <div className="col-span-2 space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-1">
                              Golf Course Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="name"
                              {...register('name', { required: 'Golf course name is required' })}
                              placeholder="e.g., Royal County Down Golf Club"
                              className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                              <p className="text-sm text-red-500">{String(errors.name.message)}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="website_url">Website URL</Label>
                            <Input
                              id="website_url"
                              {...register('website_url')}
                              placeholder="www.example.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              {...register('description')}
                              placeholder="Short overview of the club... (Markdown supported)"
                              rows={6}
                            />
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-medium">Quick actions</h3>
                            <div className="flex gap-3">
                              <Button type="button" variant="outline" size="sm" className="flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Open public page
                              </Button>
                              <Button type="button" variant="outline" size="sm" className="flex items-center gap-2">
                                <Copy className="h-4 w-4" />
                                Duplicate course
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Meta Info */}
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <h3 className="font-medium">Primary Location</h3>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Region</Label>
                                <div className="px-3 py-2 bg-muted/30 rounded-md text-sm">
                                  {selectedCountry || 'Not selected'}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Sub-country</Label>
                                <div className="px-3 py-2 bg-muted/30 rounded-md text-sm">
                                  {selectedSubCountry || 'Not selected'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-medium">Map & Coordinates</h3>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="latitude" className="text-sm">Latitude</Label>
                                <Input
                                  id="latitude"
                                  {...register('latitude')}
                                  placeholder="Latitude"
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="longitude" className="text-sm">Longitude</Label>
                                <Input
                                  id="longitude"
                                  {...register('longitude')}
                                  placeholder="Longitude"
                                  className="text-sm"
                                />
                              </div>
                              <div className="h-32 bg-muted/30 rounded-md flex items-center justify-center text-sm text-muted-foreground">
                                Map preview
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-medium">Top 100 Rankings</h3>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Worldwide</Label>
                                <Select value={globalRank} onValueChange={setGlobalRank}>
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Rank (1-100)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {rankOptions.map((rank) => (
                                      <SelectItem key={rank} value={rank}>
                                        {rank}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Regional</Label>
                                <div className="flex gap-2">
                                  <Select value={regionalRankingRegion} onValueChange={handleRegionalRankingRegionChange} disabled>
                                    <SelectTrigger className="flex-1 text-sm">
                                      <SelectValue placeholder="GB & Ireland" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {regionalTop100Options.map((region) => (
                                        <SelectItem key={region} value={region}>
                                          {region}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select 
                                    value={regionalRank} 
                                    onValueChange={setRegionalRank}
                                    disabled={!regionalRankingRegion}
                                  >
                                    <SelectTrigger className="w-20 text-sm">
                                      <SelectValue placeholder="Rank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {rankOptions.map((rank) => (
                                        <SelectItem key={rank} value={rank}>
                                          {rank}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="location" className="mt-0">
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Location Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="country" className="flex items-center gap-1">
                              Country / Region (Primary) <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCountry} onValueChange={handleCountryChange}>
                              <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select primary region" />
                              </SelectTrigger>
                              <SelectContent>
                                {primaryCountryOptions.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="sub_country" className="flex items-center gap-1">
                              Sub-Country <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={selectedSubCountry} 
                              onValueChange={setSelectedSubCountry}
                              disabled={!selectedCountry}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={selectedCountry ? "Select sub-country" : "Select primary region first"} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSubCountries.map((subCountry) => (
                                  <SelectItem key={subCountry} value={subCountry}>
                                    {subCountry}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="region">Local Area / County / State</Label>
                            <Input
                              id="region"
                              {...register('region')}
                              placeholder="e.g. Ayrshire, California, etc."
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="rankings" className="mt-0">
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Top 100 Rankings</h2>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="font-medium">Worldwide Top 100</h3>
                            <div className="flex gap-2">
                              <Select value="Worldwide" disabled>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Worldwide" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Worldwide">Worldwide</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select value={globalRank} onValueChange={setGlobalRank}>
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Rank" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rankOptions.map((rank) => (
                                    <SelectItem key={rank} value={rank}>
                                      {rank}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-medium">Regional Top 100</h3>
                            <div className="flex gap-2">
                              <Select value={regionalRankingRegion} onValueChange={handleRegionalRankingRegionChange}>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                  {regionalTop100Options.map((region) => (
                                    <SelectItem key={region} value={region}>
                                      {region}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select 
                                value={regionalRank} 
                                onValueChange={setRegionalRank}
                                disabled={!regionalRankingRegion}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Rank" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rankOptions.map((rank) => (
                                    <SelectItem key={rank} value={rank}>
                                      {rank}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="media" className="mt-0">
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Course Media</h2>
                        <CourseImageUpload
                          currentImageUrl={courseImageUrl}
                          onImageChange={handleImageChange}
                        />
                      </div>
                    </TabsContent>

                    {!isCreating && (
                      <TabsContent value="reviews" className="mt-0">
                        <CourseReviewsSection
                          ratings={ratings}
                          ratingsLoading={ratingsLoading}
                          onDeleteReview={handleDeleteReview}
                        />
                      </TabsContent>
                    )}

                    {!isCreating && (
                      <TabsContent value="history" className="mt-0">
                        <div className="space-y-6">
                          <h2 className="text-lg font-semibold">Course History</h2>
                          <p className="text-muted-foreground">Course change history will be displayed here.</p>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-between items-center">
                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={saveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saveMutation.isPending ? 'Saving...' : 'Save & close'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                  </div>
                  
                  {!isCreating && course && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={handleDeleteCourse}
                      disabled={deleteCourseMutation.isPending}
                    >
                      {deleteCourseMutation.isPending ? 'Deleting...' : 'Delete course'}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Golf Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{course?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCourse} className="bg-red-600 hover:bg-red-700">
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GolfCourseEditor;
