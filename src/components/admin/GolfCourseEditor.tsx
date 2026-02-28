import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { X, ExternalLink, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePageDraft } from '@/hooks/usePageDraft';
import CourseImageUpload from './golf-courses/CourseImageUpload';
import CourseReviewsSection from './golf-courses/CourseReviewsSection';
import { GolfCourse, CourseRating, GolfCourseEditorProps } from './golf-courses/types';

// Define the primary countries that have regional Top 100 lists (sorted alphabetically)
const primaryCountryOptions = [
  'Africa',
  'Asia',
  'Britain & Ireland',
  'Caribbean',
  'Central and South America',
  'Continental Europe',
  'Middle East',
  'Oceania',
  'Rest of World',
  'USA'
];

// Map primary countries to their sub-countries (all sorted alphabetically)
const subCountryOptions: Record<string, string[]> = {
  'Africa': [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 
    'Cape Verde', 'Central African Republic', 'Chad', 'Democratic Republic of Congo', 
    'Djibouti', 'Egypt', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Ivory Coast', 
    'Kenya', 'Lesotho', 'Libya', 'Madagascar', 'Malawi', 'Mauritius', 'Mayotte', 
    'Morocco', 'Mozambique', 'Namibia', 'Nigeria', 'Rwanda', 'Saint Helena, Ascension, Tristan Dukana', 
    'Senegal', 'Seychelles', 'Sierra Leone', 'South Africa', 'Sudan', 'Swaziland', 
    'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
  ],
  'Britain & Ireland': [
    'England', 'Ireland', 'Isle of Man', 'Northern Ireland', 'Scotland', 'Wales'
  ],
  'Caribbean': [
    'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Cayman Islands',
    'Cuba', 'Curaçao', 'Dominican Republic', 'Grenada', 'Guadeloupe', 'Haiti', 
    'Jamaica', 'Martinique', 'Puerto Rico', 'St Kitts and Nevis', 'St Lucia', 
    'St Martin', 'St Vincent and the Grenadines', 'Trinidad and Tobago', 
    'Turks and Caicos Islands', 'Virgin Islands'
  ],
  'Central and South America': [
    'Argentina', 'Belize', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Costa Rica',
    'Ecuador', 'El Salvador', 'Falkland Islands', 'French Guiana', 'Guatemala', 
    'Guyana', 'Honduras', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Suriname', 
    'Uruguay', 'Venezuela'
  ],
  'USA': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 
    'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 
    'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming'
  ],
  'Continental Europe': [
    'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 
    'Cyprus', 'Czech Republic', 'Denmark', 'England', 'Estonia', 'Faroe Islands', 'Finland', 
    'France', 'Germany', 'Greece', 'Greenland', 'Hungary', 'Iceland', 'Ireland', 'Italy', 
    'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Montenegro', 'Netherlands', 
    'Northern Ireland', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'Scotland', 
    'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'Wales'
  ],
  'Asia': [
    'Afghanistan', 'Armenia', 'Azerbaijan', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia',
    'China', 'Georgia', 'Hong Kong', 'India', 'Indonesia', 'Japan', 'Kazakhstan',
    'Kyrgyzstan', 'Laos', 'Malaysia', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea',
    'Pakistan', 'Philippines', 'Singapore', 'South Korea', 'Sri Lanka', 'Taiwan',
    'Thailand', 'Uzbekistan', 'Vietnam'
  ],
  'Middle East': [
    'Bahrain', 'Iran', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman', 
    'Qatar', 'Saudi Arabia', 'United Arab Emirates'
  ],
  'Oceania': [
    'Australia', 'Cook Islands', 'Fiji', 'French Polynesia', 'Guam', 'New Caledonia', 
    'New Zealand', 'Norfolk Island', 'Northern Mariana Islands', 'Papua New Guinea', 
    'Samoa', 'Vanuatu'
  ],
  'Rest of World': [
    'Puerto Rico'
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

type DraftFormShape = {
  name: string;
  region: string;
  description: string;
  website_url: string;
  latitude: string;
  longitude: string;
  selectedCountry: string;
  selectedSubCountry: string;
  courseImageUrl: string | null;
  activeTab: string;
  regionalRankingRegion: string;
  regionalRank: string;
  globalRank: string;
};

const GolfCourseEditor: React.FC<GolfCourseEditorProps> = ({ course, isCreating, onClose }) => {
  
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();
  
  // Draft persistence setup
  const draftKey = `admin:golf-course:${isCreating ? 'new' : course?.id}:${user?.id ?? 'anon'}`;
  const initialDraft: DraftFormShape = {
    name: '',
    region: '',
    description: '',
    website_url: '',
    latitude: '',
    longitude: '',
    selectedCountry: '',
    selectedSubCountry: '',
    courseImageUrl: null,
    activeTab: 'details',
    regionalRankingRegion: '',
    regionalRank: '',
    globalRank: '',
  };
  
  const { value: draft, save: saveDraft, clear: clearDraft, loadedOnce } = usePageDraft<DraftFormShape>({
    key: draftKey,
    initial: initialDraft,
  });

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSubCountry, setSelectedSubCountry] = useState('');
  const [courseImageUrl, setCourseImageUrl] = useState<string | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // State for tracking last saved info
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    course?.updated_at ? new Date(course.updated_at) : null
  );
  const [lastSavedBy, setLastSavedBy] = useState<string | null>(null);
  
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

  // Initialize form with course data or draft - only run ONCE when loadedOnce becomes true
  useEffect(() => {
    if (!loadedOnce || isFormInitialized) return;
    
    console.log('=== EDITOR: Initializing form (one-time) ===');
    console.log('course:', course);
    console.log('isCreating:', isCreating);
    
    if (course && !isCreating) {
      console.log('=== EDITOR: Initializing form with course data ===');
      
      // Set all state synchronously in the correct order
      const countryValue = course.country || '';
      const subCountryValue = course.sub_country || '';
      
      setSelectedCountry(countryValue);
      setSelectedSubCountry(subCountryValue);
      // Only set course image from DB if we don't have a draft value (preserve uploaded images)
      setCourseImageUrl(draft.courseImageUrl || course.thumbnail_image || null);
      
      // Set Top 100s values - prioritize draft over database
      if (draft.regionalRank || course.regional_rank) {
        setRegionalRank(draft.regionalRank || (course.regional_rank ? course.regional_rank.toString() : ''));
        // Map country to regional ranking region
        if (draft.regionalRankingRegion) {
          setRegionalRankingRegion(draft.regionalRankingRegion);
        } else if (course.country === 'Britain & Ireland') {
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
      
      if (draft.globalRank || course.global_rank) {
        setGlobalRank(draft.globalRank || (course.global_rank ? course.global_rank.toString() : ''));
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
      
    } else if (isCreating && draft && (draft.name || draft.selectedCountry)) {
      console.log('=== EDITOR: Restoring from draft ===');
      
      // Restore from draft
      setSelectedCountry(draft.selectedCountry);
      setSelectedSubCountry(draft.selectedSubCountry);
      setCourseImageUrl(draft.courseImageUrl);
      setActiveTab(draft.activeTab || 'details');
      setRegionalRankingRegion(draft.regionalRankingRegion);
      setRegionalRank(draft.regionalRank);
      setGlobalRank(draft.globalRank);
      
      reset({
        name: draft.name,
        region: draft.region,
        description: draft.description,
        website_url: draft.website_url,
        latitude: draft.latitude,
        longitude: draft.longitude,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedOnce]);

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
      
      
      // Auto-determine continent based on country/region
      let continent: "North America" | "South America" | "Europe" | "Asia" | "Africa" | "Oceania" | null = null;
      if (selectedCountry === 'USA' || selectedCountry === 'Caribbean') {
        continent = 'North America';
      } else if (selectedCountry === 'Central and South America') {
        continent = 'South America';
      } else if (selectedCountry === 'Britain & Ireland' || selectedCountry === 'Continental Europe') {
        continent = 'Europe';
      } else if (selectedCountry === 'Asia' || selectedCountry === 'Middle East') {
        continent = 'Asia';
      } else if (selectedCountry === 'Africa') {
        continent = 'Africa';
      } else if (selectedCountry === 'Oceania') {
        continent = 'Oceania';
      } else if (selectedCountry === 'Rest of World') {
        // Puerto Rico and other Rest of World territories default to North America
        continent = 'North America';
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
    onSuccess: (savedCourse) => {
      // Clear draft on successful save
      clearDraft();
      
      // Update last saved info
      setLastSavedAt(new Date(savedCourse.updated_at || Date.now()));
      setLastSavedBy(
        user?.user_metadata?.full_name || 
        user?.user_metadata?.display_name || 
        user?.email || 
        'Admin'
      );
      
      toast.success("Success", { description: isCreating ? "Golf course created successfully" : "Golf course updated successfully" });
      // Force refetch of golf courses data
      queryClient.invalidateQueries({ queryKey: ['admin-golf-courses'] });
      queryClient.refetchQueries({ queryKey: ['admin-golf-courses'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Save mutation error:', error);
      toast.error("Error", { description: `Failed to ${isCreating ? 'create' : 'update'} golf course: ${error.message}` });
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
      toast.success("Success", { description: "Golf course deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['admin-golf-courses'] });
      onClose();
    },
    onError: (error) => {
      toast.error("Error", { description: `Failed to delete golf course: ${error.message}` });
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
      toast.success("Success", { description: "Review deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['course-ratings', course?.id] });
      // Invalidate exploration stats for map updates
      queryClient.invalidateQueries({ queryKey: ['user-exploration-status'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-leaderboard'] });
    },
    onError: (error) => {
      toast.error("Error", { description: `Failed to delete review: ${error.message}` });
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
      toast.error("Error", { description: "Please enter a golf course name" });
      return;
    }

    if (!selectedCountry || selectedCountry.trim() === '') {
      toast.error("Error", { description: "Please select a country/region" });
      return;
    }

    if (!selectedSubCountry || selectedSubCountry.trim() === '') {
      toast.error("Error", { description: "Please select a sub-country" });
      return;
    }

    // Validate Top 100s rankings - only if regional ranking region is selected
    if (regionalRankingRegion && !regionalRank) {
      toast.error("Error", { description: "Please select a rank for the regional Top 100" });
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
        clearDraft();
        onClose();
      }
    } else {
      clearDraft();
      onClose();
    }
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    const newAvailableSubCountries = subCountryOptions[value] || [];
    const newSubCountry = selectedSubCountry && !newAvailableSubCountries.includes(selectedSubCountry) ? '' : selectedSubCountry;
    if (newSubCountry !== selectedSubCountry) {
      setSelectedSubCountry(newSubCountry);
    }
    
    // Save to draft
    saveDraft({ selectedCountry: value, selectedSubCountry: newSubCountry });
  };

  const handleRegionalRankingRegionChange = (value: string) => {
    setRegionalRankingRegion(value);
    const newRank = value ? regionalRank : '';
    if (!value) {
      setRegionalRank(newRank);
    }
    
    // Save to draft
    saveDraft({ regionalRankingRegion: value, regionalRank: newRank });
  };

  const availableSubCountries = selectedCountry ? subCountryOptions[selectedCountry] || [] : [];


  const handleImageChange = (imageUrl: string | null) => {
    console.log('=== EDITOR: Image changed to:', imageUrl);
    setCourseImageUrl(imageUrl);
    
    // Save to draft
    saveDraft({ courseImageUrl: imageUrl });
  };

  // Don't render the form until it's fully initialized
  if (!isFormInitialized) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col h-screen w-full bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {isCreating ? "Add New Golf Club" : "Edit Golf Course"}
            </h1>
            {!isCreating && course && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>ID: {course.id.slice(0, 8)}...</span>
                <span>•</span>
                {lastSavedAt && (
                  <>
                    <span>Last saved {formatDistanceToNow(lastSavedAt)} ago</span>
                    <span>•</span>
                  </>
                )}
                <span>by {lastSavedBy || 'Admin'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="submit" 
              form="course-form"
              disabled={saveMutation.isPending}
              variant="secondary"
              className="text-muted-foreground"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCloseModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
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
              <form id="course-form" onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col pb-20">
                 <div className="flex-1 p-4">
                   <Tabs value={activeTab} onValueChange={(value) => {
                     setActiveTab(value);
                     saveDraft({ activeTab: value });
                   }} className="h-full">
                     <TabsContent value="details" className="mt-0 h-full">
                      <div className="grid grid-cols-3 gap-6 h-full">
                        {/* Left Column - Main Fields */}
                        <div className="col-span-2 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-1">
                              Golf Course Name <span className="text-red-500">*</span>
                            </Label>
                             <Input
                              id="name"
                              {...register('name', { 
                                required: 'Golf course name is required',
                                onChange: (e) => saveDraft({ name: e.target.value })
                              })}
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
                               {...register('website_url', {
                                 onChange: (e) => saveDraft({ website_url: e.target.value })
                               })}
                               placeholder="www.example.com"
                             />
                           </div>

                           <div className="space-y-2">
                             <Label htmlFor="description">Description</Label>
                             <Textarea
                               id="description"
                               {...register('description', {
                                 onChange: (e) => saveDraft({ description: e.target.value })
                               })}
                               placeholder="Short overview of the club... (Markdown supported)"
                               rows={4}
                             />
                           </div>

                          <div className="space-y-3">
                            <h3 className="font-medium">Quick actions</h3>
                            <div className="flex gap-3">
                              {!isCreating && course && (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex items-center gap-2"
                                  asChild
                                >
                                  <a 
                                    href={`/courses/${course.id}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open public page
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Meta Info */}
                        <div className="space-y-4">
                          <div className="space-y-4">
                            <h3 className="font-medium">Primary Location</h3>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-body-sm text-muted-foreground">Region</Label>
                                <div className="px-3 py-2 bg-muted/30 rounded-md text-body-md">
                                  {selectedCountry || 'Not selected'}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-body-sm text-muted-foreground">Sub-country</Label>
                                <div className="px-3 py-2 bg-muted/30 rounded-md text-body-md">
                                  {selectedSubCountry || 'Not selected'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-medium">Map & Coordinates</h3>
                            <div className="space-y-3">
                               <div className="space-y-2">
                                 <Label htmlFor="latitude" className="text-body-sm">Latitude</Label>
                                 <Input
                                   id="latitude"
                                   {...register('latitude', {
                                     onChange: (e) => saveDraft({ latitude: e.target.value })
                                   })}
                                   placeholder="Latitude"
                                 />
                               </div>
                               <div className="space-y-2">
                                 <Label htmlFor="longitude" className="text-body-sm">Longitude</Label>
                                 <Input
                                   id="longitude"
                                   {...register('longitude', {
                                     onChange: (e) => saveDraft({ longitude: e.target.value })
                                   })}
                                   placeholder="Longitude"
                                 />
                               </div>
                              <div className="h-32 bg-muted/30 rounded-md flex items-center justify-center text-body-md text-muted-foreground">
                                Map preview
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-medium">Top 100 Rankings</h3>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-body-sm text-muted-foreground">Rankings Overview</Label>
                                <div className="flex flex-wrap gap-2">
                                  {globalRank ? (
                                    <div className="px-3 py-1.5 bg-muted/50 text-muted-foreground rounded-md text-meta">
                                      #{globalRank} Global
                                    </div>
                                  ) : null}
                                  {regionalRank && regionalRankingRegion ? (
                                    <div className="px-3 py-1.5 bg-muted/50 text-muted-foreground rounded-md text-sm">
                                      #{regionalRank} {regionalRankingRegion}
                                    </div>
                                  ) : null}
                                  {!globalRank && !regionalRank && (
                                    <div className="px-3 py-1.5 bg-muted/30 text-muted-foreground rounded-md text-sm">
                                      No rankings set
                                    </div>
                                  )}
                                </div>
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-sm text-muted-foreground"
                  onClick={() => setActiveTab('rankings')}
                >
                  Edit rankings <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="location" className="mt-0">
                      <div className="space-y-4">
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
                               onValueChange={(value) => {
                                 setSelectedSubCountry(value);
                                 saveDraft({ selectedSubCountry: value });
                               }}
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
                               {...register('region', {
                                 onChange: (e) => saveDraft({ region: e.target.value })
                               })}
                               placeholder="e.g. Ayrshire, California, etc."
                             />
                           </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="rankings" className="mt-0">
                      <div className="space-y-4">
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
                               <Select value={globalRank} onValueChange={(value) => {
                                 setGlobalRank(value);
                                 saveDraft({ globalRank: value });
                               }}>
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
                                 onValueChange={(value) => {
                                   setRegionalRank(value);
                                   saveDraft({ regionalRank: value });
                                 }}
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
                      <div className="space-y-4">
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
                        <div className="space-y-4">
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
                      variant="secondary"
                      className="text-muted-foreground"
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
        </div>

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
