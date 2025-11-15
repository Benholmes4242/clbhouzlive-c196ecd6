import React from 'react';
import AvatarSquircle from './AvatarSquircle';

/**
 * AvatarSquircle Component Stories
 * 
 * The canonical user avatar component using iOS-style squircle (superellipse n=5).
 * This is the single source of truth for all user avatars in the app.
 */

export default {
  title: 'UI/AvatarSquircle',
  component: AvatarSquircle,
};

// Sample user images for demos
const sampleUserImages = {
  male: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  female: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=200&h=200&fit=crop&crop=face',
};

// Story: Size Variants
export const SizeVariants = () => (
  <div className="flex flex-col gap-8 p-8 bg-background">
    <div>
      <h3 className="text-lg font-semibold mb-4">Size Variants</h3>
      <div className="flex items-end gap-6">
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="xs" 
            src={sampleUserImages.male}
            alt="Extra Small"
          />
          <span className="text-xs text-muted-foreground">xs (28px)</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="sm" 
            src={sampleUserImages.female}
            alt="Small"
          />
          <span className="text-xs text-muted-foreground">sm (40px)</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="md" 
            src={sampleUserImages.golf}
            alt="Medium"
          />
          <span className="text-xs text-muted-foreground">md (56px)</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={sampleUserImages.male}
            alt="Large"
          />
          <span className="text-xs text-muted-foreground">lg (80px)</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="xl" 
            src={sampleUserImages.female}
            alt="Extra Large"
          />
          <span className="text-xs text-muted-foreground">xl (112px)</span>
        </div>
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold mb-4">Custom Pixel Sizes</h3>
      <div className="flex items-end gap-6">
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size={64} 
            src={sampleUserImages.golf}
            alt="64px"
          />
          <span className="text-xs text-muted-foreground">64px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size={96} 
            src={sampleUserImages.male}
            alt="96px"
          />
          <span className="text-xs text-muted-foreground">96px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size={128} 
            src={sampleUserImages.female}
            alt="128px"
          />
          <span className="text-xs text-muted-foreground">128px</span>
        </div>
      </div>
    </div>
  </div>
);

// Story: With and Without Rings
export const WithRings = () => (
  <div className="flex flex-col gap-8 p-8 bg-background">
    <div>
      <h3 className="text-lg font-semibold mb-4">Ring Variants</h3>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={sampleUserImages.male}
            alt="No Ring"
          />
          <span className="text-xs text-muted-foreground">No ring</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={sampleUserImages.female}
            alt="Story Ring"
            ringColor="rgba(255,255,255,0.28)"
            ringWidth={2}
          />
          <span className="text-xs text-muted-foreground">Story ring</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={sampleUserImages.golf}
            alt="Active Ring"
            ringColor="rgba(59, 130, 246, 0.8)"
            ringWidth={3}
          />
          <span className="text-xs text-muted-foreground">Active ring</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={sampleUserImages.male}
            alt="Success Ring"
            ringColor="rgba(34, 197, 94, 0.8)"
            ringWidth={3}
          />
          <span className="text-xs text-muted-foreground">Success ring</span>
        </div>
      </div>
    </div>
  </div>
);

// Story: Fallback States
export const FallbackStates = () => (
  <div className="flex flex-col gap-8 p-8 bg-background">
    <div>
      <h3 className="text-lg font-semibold mb-4">Fallback / Initials</h3>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={null}
            alt="John Doe"
            fallback="JD"
          />
          <span className="text-xs text-muted-foreground">Initials: JD</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            alt="Sarah Wilson"
            fallback="SW"
          />
          <span className="text-xs text-muted-foreground">Initials: SW</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src=""
            alt="Mike Johnson"
            fallback="M"
          />
          <span className="text-xs text-muted-foreground">Single letter: M</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            alt=""
          />
          <span className="text-xs text-muted-foreground">Default: ?</span>
        </div>
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold mb-4">Broken Image → Fallback</h3>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src="https://invalid-url-that-will-fail.com/avatar.jpg"
            alt="Failed Load"
            fallback="FL"
          />
          <span className="text-xs text-muted-foreground">Image error</span>
        </div>
      </div>
    </div>
  </div>
);

// Story: Loading States
export const LoadingStates = () => {
  const [slowImageLoaded, setSlowImageLoaded] = React.useState(false);
  
  return (
    <div className="flex flex-col gap-8 p-8 bg-background">
      <div>
        <h3 className="text-lg font-semibold mb-4">Image Loading</h3>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <AvatarSquircle 
              size="lg" 
              src={sampleUserImages.male}
              alt="Instant Load"
              priority
              onLoad={() => console.log('Image loaded!')}
            />
            <span className="text-xs text-muted-foreground">Priority load</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AvatarSquircle 
              size="lg" 
              src={sampleUserImages.female + '&delay=2000'}
              alt="Slow Load"
              fallback="SL"
              onLoad={() => setSlowImageLoaded(true)}
            />
            <span className="text-xs text-muted-foreground">
              {slowImageLoaded ? 'Loaded' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Story: With Status Badges
export const WithBadges = () => (
  <div className="flex flex-col gap-8 p-8 bg-background">
    <div>
      <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={sampleUserImages.male}
            alt="Online"
          >
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
              style={{ transform: 'translate(25%, 25%)' }}
            />
          </AvatarSquircle>
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={sampleUserImages.female}
            alt="Away"
          >
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-500 rounded-full border-2 border-background"
              style={{ transform: 'translate(25%, 25%)' }}
            />
          </AvatarSquircle>
          <span className="text-xs text-muted-foreground">Away</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSquircle 
            size="lg" 
            src={sampleUserImages.golf}
            alt="Verified"
          >
            <div 
              className="absolute top-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center"
              style={{ transform: 'translate(25%, -25%)' }}
            >
              <span className="text-white text-xs">✓</span>
            </div>
          </AvatarSquircle>
          <span className="text-xs text-muted-foreground">Verified</span>
        </div>
      </div>
    </div>
  </div>
);

// Story: Real-World Usage Examples
export const RealWorldExamples = () => (
  <div className="flex flex-col gap-8 p-8 bg-background">
    <div>
      <h3 className="text-lg font-semibold mb-4">Profile Header</h3>
      <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
        <AvatarSquircle 
          size="xl" 
          src={sampleUserImages.male}
          alt="Tiger Woods"
          ringColor="rgba(255,255,255,0.28)"
          ringWidth={2}
        />
        <div>
          <h4 className="text-xl font-bold">Tiger Woods</h4>
          <p className="text-sm text-muted-foreground">@tigerwoods</p>
          <p className="text-sm mt-1">Professional Golfer • 15 Majors</p>
        </div>
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold mb-4">Notification Item</h3>
      <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
        <AvatarSquircle 
          size="md" 
          src={sampleUserImages.female}
          alt="Sarah Wilson"
        />
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-semibold">Sarah Wilson</span> started following you
          </p>
          <p className="text-xs text-muted-foreground">2 hours ago</p>
        </div>
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold mb-4">Comment Thread</h3>
      <div className="space-y-3">
        {[
          { name: 'John Doe', comment: 'Great shot! What club did you use?', img: sampleUserImages.male },
          { name: 'Mike Johnson', comment: 'Incredible control on that approach!', img: sampleUserImages.golf },
          { name: 'Sarah W.', comment: 'Love the swing tempo 🏌️', img: sampleUserImages.female },
        ].map((item, i) => (
          <div key={i} className="flex gap-3 p-3 border border-border rounded-lg">
            <AvatarSquircle 
              size="sm" 
              src={item.img}
              alt={item.name}
            />
            <div>
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Story: All Variants Grid
export const AllVariants = () => (
  <div className="p-8 bg-background">
    <h3 className="text-xl font-bold mb-6">Complete AvatarSquircle Showcase</h3>
    <div className="space-y-8">
      <SizeVariants />
      <WithRings />
      <FallbackStates />
      <WithBadges />
    </div>
  </div>
);
