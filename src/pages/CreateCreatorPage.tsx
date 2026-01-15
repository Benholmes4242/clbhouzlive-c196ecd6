import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageRoot } from '@/components/layout/PageRoot';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  User, 
  X,
  Loader2,
  ExternalLink,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { uploadCreatorImage } from '@/hooks/useCreatorImageUpload';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/superellipse.css';

type Step = 'intro' | 'cover' | 'avatar' | 'name' | 'bio' | 'location' | 'complete';

const STEPS: Step[] = ['intro', 'cover', 'avatar', 'name', 'bio', 'location', 'complete'];
const PROGRESS_STEPS: Step[] = ['cover', 'avatar', 'name', 'bio', 'location'];

export default function CreateCreatorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  
  // Form data
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  
  // Created page data
  const [createdPage, setCreatedPage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const currentProgressIndex = PROGRESS_STEPS.indexOf(currentStep);
  
  const goNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };
  
  const goBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };
  
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };
  
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };
  
  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };
  
  const handleCreatePage = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      setCurrentStep('name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const tempId = crypto.randomUUID();
      
      // Upload images
      let avatarUrl: string | null = null;
      let coverUrl: string | null = null;
      
      if (avatarFile) {
        avatarUrl = await uploadCreatorImage(avatarFile, 'avatar', tempId);
      }
      
      if (coverFile) {
        coverUrl = await uploadCreatorImage(coverFile, 'cover', tempId);
      }
      
      // Create the page via RPC
      const { data, error } = await supabase.rpc('create_creator_page', {
        p_display_name: displayName.trim(),
        p_slug: username.trim() || null,
        p_bio: bio.trim() || null,
        p_avatar_url: avatarUrl,
      });
      
      if (error) throw error;
      
      // Parse result
      let result: { page_id: string; slug: string } | null = null;
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch {
          result = null;
        }
      } else {
        result = data as { page_id: string; slug: string } | null;
      }
      
      // Update with cover and location if needed
      if (result?.page_id && (coverUrl || city || country)) {
        await supabase
          .from('creator_pages')
          .update({
            cover_url: coverUrl,
            location_city: city.trim() || null,
            location_country: country.trim() || null,
          })
          .eq('id', result.page_id);
      }
      
      // Fetch the created page for display
      if (result?.page_id) {
        const { data: pageData } = await supabase
          .from('creator_pages')
          .select('*')
          .eq('id', result.page_id)
          .single();
        
        setCreatedPage(pageData);
      }
      
      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['my-creators'] });
      
      setCurrentStep('complete');
      toast.success('Creator page created!');
      
    } catch (err: any) {
      console.error('Error creating page:', err);
      toast.error(err.message || 'Failed to create creator page');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }
  
  const slideVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };
  
  return (
    <PageRoot className="min-h-screen bg-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {/* Step: Intro */}
          {currentStep === 'intro' && (
            <motion.div
              key="intro"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col items-center justify-center px-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              
              <h1 className="text-2xl font-bold text-[#1e293b] mb-3">
                Create Your Creator Page
              </h1>
              
              <p className="text-[#64748b] mb-8 max-w-xs">
                Build your creator identity and share content with your audience.
              </p>
              
              <Button
                onClick={goNext}
                className="w-full max-w-xs h-12 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium"
              >
                Get Started
              </Button>
              
              <button
                onClick={() => navigate(-1)}
                className="mt-4 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                Maybe later
              </button>
            </motion.div>
          )}
          
          {/* Step: Cover Image */}
          {currentStep === 'cover' && (
            <motion.div
              key="cover"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <StepHeader
                onBack={goBack}
                onSkip={goNext}
                showBack
                showSkip
              />
              
              <StepProgress current={currentProgressIndex} total={PROGRESS_STEPS.length} />
              
              <div className="flex-1 flex flex-col px-6">
                <h1 className="text-2xl font-bold text-[#1e293b] text-center mb-2">
                  Add a cover image
                </h1>
                <p className="text-[#64748b] text-center mb-8">
                  This appears at the top of your creator page.
                </p>
                
                <div 
                  className={cn(
                    "relative w-full aspect-[3/1] rounded-xl overflow-hidden cursor-pointer transition-colors",
                    coverPreview 
                      ? "bg-muted" 
                      : "bg-[#f1f5f9] border-2 border-dashed border-[#e2e8f0] hover:border-[#cbd5e1]"
                  )}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); clearCover(); }}
                        className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-[#94a3b8] mb-2" />
                      <span className="text-sm text-[#64748b]">Upload cover image</span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-[#94a3b8] text-center mt-3">
                  Recommended: 1500 × 500px
                </p>
                
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverSelect}
                />
              </div>
              
              <div className="p-6">
                <Button
                  onClick={goNext}
                  className="w-full h-12 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step: Avatar */}
          {currentStep === 'avatar' && (
            <motion.div
              key="avatar"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <StepHeader
                onBack={goBack}
                onSkip={goNext}
                showBack
                showSkip
              />
              
              <StepProgress current={currentProgressIndex} total={PROGRESS_STEPS.length} />
              
              <div className="flex-1 flex flex-col items-center px-6">
                <h1 className="text-2xl font-bold text-[#1e293b] text-center mb-2">
                  Add a profile photo
                </h1>
                <p className="text-[#64748b] text-center mb-8">
                  Choose a photo that represents your creator identity.
                </p>
                
                <div 
                  className={cn(
                    "relative w-32 h-32 clbhouz-squircle overflow-hidden cursor-pointer transition-colors",
                    avatarPreview 
                      ? "bg-muted" 
                      : "bg-[#f1f5f9]"
                  )}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {/* Dashed border overlay for empty state */}
                  {!avatarPreview && (
                    <div className="absolute inset-0 clbhouz-squircle border-2 border-dashed border-[#e2e8f0] hover:border-[#cbd5e1] transition-colors pointer-events-none" />
                  )}
                  {avatarPreview ? (
                    <>
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); clearAvatar(); }}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors z-10"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-[#94a3b8]" />
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-[#94a3b8] mt-3">120 × 120px minimum</p>
                
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-4 px-5 py-2.5 bg-[#f1f5f9] rounded-full text-sm font-medium text-[#1e293b] hover:bg-[#e2e8f0] transition-colors"
                >
                  {avatarPreview ? 'Change photo' : 'Upload photo'}
                </button>
                
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>
              
              <div className="p-6">
                <Button
                  onClick={goNext}
                  className="w-full h-12 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step: Name & Username */}
          {currentStep === 'name' && (
            <motion.div
              key="name"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <StepHeader
                onBack={goBack}
                onSkip={goNext}
                showBack
                showSkip={false}
              />
              
              <StepProgress current={currentProgressIndex} total={PROGRESS_STEPS.length} />
              
              <div className="flex-1 flex flex-col px-6">
                <h1 className="text-2xl font-bold text-[#1e293b] text-center mb-2">
                  What should we call you?
                </h1>
                <p className="text-[#64748b] text-center mb-8">
                  Choose a name for your creator page.
                </p>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-sm font-medium text-[#1e293b]">
                      Display Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your creator name"
                      className="h-12 rounded-xl border-[#e2e8f0]"
                      maxLength={50}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-[#1e293b]">
                      Username / URL
                    </Label>
                    <div className="flex items-center">
                      <span className="text-sm text-[#64748b] mr-1">@</span>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="your-username"
                        className="h-12 rounded-xl border-[#e2e8f0]"
                        maxLength={30}
                      />
                    </div>
                    <p className="text-xs text-[#94a3b8]">
                      Leave blank to auto-generate from your display name
                    </p>
                  </div>
                  
                  {(username || displayName) && (
                    <p className="text-xs text-[#64748b] text-center">
                      Your page will be at: <span className="font-medium">clbhouz.com/creator/{username || displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}</span>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <Button
                  onClick={goNext}
                  disabled={!displayName.trim()}
                  className="w-full h-12 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium disabled:opacity-50"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step: Bio */}
          {currentStep === 'bio' && (
            <motion.div
              key="bio"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <StepHeader
                onBack={goBack}
                onSkip={goNext}
                showBack
                showSkip
              />
              
              <StepProgress current={currentProgressIndex} total={PROGRESS_STEPS.length} />
              
              <div className="flex-1 flex flex-col px-6">
                <h1 className="text-2xl font-bold text-[#1e293b] text-center mb-2">
                  Tell us about yourself
                </h1>
                <p className="text-[#64748b] text-center mb-8">
                  Share what you create and what your audience can expect.
                </p>
                
                <div className="space-y-2">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share what you create and what your audience can expect from your content..."
                    className="min-h-[140px] rounded-xl border-[#e2e8f0] resize-none"
                    maxLength={300}
                  />
                  <p className="text-xs text-[#94a3b8] text-right">
                    {bio.length} / 300
                  </p>
                </div>
              </div>
              
              <div className="p-6">
                <Button
                  onClick={goNext}
                  className="w-full h-12 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step: Location */}
          {currentStep === 'location' && (
            <motion.div
              key="location"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <StepHeader
                onBack={goBack}
                onSkip={handleCreatePage}
                showBack
                showSkip
              />
              
              <StepProgress current={currentProgressIndex} total={PROGRESS_STEPS.length} />
              
              <div className="flex-1 flex flex-col px-6">
                <h1 className="text-2xl font-bold text-[#1e293b] text-center mb-2">
                  Where are you based?
                </h1>
                <p className="text-[#64748b] text-center mb-8">
                  This helps fans find local creators.
                </p>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-[#1e293b]">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., London"
                      className="h-12 rounded-xl border-[#e2e8f0]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-[#1e293b]">
                      Country
                    </Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., United Kingdom"
                      className="h-12 rounded-xl border-[#e2e8f0]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <Button
                  onClick={handleCreatePage}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Page'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step: Complete */}
          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col items-center justify-center px-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-[#1e293b] mb-3">
                Your creator page is ready!
              </h1>
              
              {/* Preview card */}
              {createdPage && (
                <div className="w-full max-w-sm bg-[#f8fafc] rounded-xl overflow-hidden border border-[#e2e8f0] mb-8">
                  {/* Cover */}
                  <div className="h-20 bg-gradient-to-br from-slate-300 to-slate-400">
                    {createdPage.cover_url && (
                      <img 
                        src={createdPage.cover_url} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    )}
                  </div>
                  
                  {/* Avatar & info */}
                  <div className="px-4 pb-4 -mt-6">
                    <div className="flex items-end gap-3">
                      <div className="w-14 h-14 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden">
                        {createdPage.avatar_url ? (
                          <img 
                            src={createdPage.avatar_url} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="font-semibold text-[#1e293b] truncate">
                          {createdPage.display_name}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          @{createdPage.slug}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="w-full max-w-xs space-y-3">
                <Button
                  onClick={() => navigate(`/creator/${createdPage?.slug}`)}
                  className="w-full h-12 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View my page
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/creators/manage')}
                  className="w-full h-12 rounded-full border-[#e2e8f0] text-[#1e293b] font-medium"
                >
                  Go to Creator Studio
                </Button>
                
                <button
                  onClick={() => {
                    if (createdPage?.slug) {
                      navigator.clipboard.writeText(`${window.location.origin}/creator/${createdPage.slug}`);
                      toast.success('Link copied!');
                    }
                  }}
                  className="flex items-center justify-center gap-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors mx-auto mt-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share your page
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageRoot>
  );
}

// Step Progress Component
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i === current ? "bg-[#1e293b]" : "bg-[#e2e8f0]"
          )}
        />
      ))}
    </div>
  );
}

// Step Header Component
function StepHeader({ 
  onBack,
  onSkip,
  showBack = true,
  showSkip = true,
}: { 
  onBack?: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  showSkip?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-4 pb-2">
      {showBack ? (
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      ) : <div className="w-12" />}
      
      {showSkip ? (
        <button 
          onClick={onSkip} 
          className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
        >
          Skip
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : <div className="w-12" />}
    </div>
  );
}