import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, Users, User } from 'lucide-react';

interface EngagementPromptsProps {
  isNewUser: boolean;
  isInactiveUser: boolean;
  onCreatePost: () => void;
  onTagCourse: () => void;
  onCompleteProfile: () => void;
  onFollowCreators: () => void;
}

const EngagementPrompts: React.FC<EngagementPromptsProps> = ({
  isNewUser,
  isInactiveUser,
  onCreatePost,
  onTagCourse,
  onCompleteProfile,
  onFollowCreators
}) => {
  // Don't show prompts if user is not new or inactive
  if (!isNewUser && !isInactiveUser) {
    return null;
  }

  const prompts = [];

  // First-time post prompt for new users
  if (isNewUser) {
    prompts.push(
      <div
        key="first-post"
        className="bg-gradient-to-br from-background to-muted/50 border border-border rounded-xl p-5 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Post your first golf moment! 🏌️
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Share a swing, a course, or a funny shot to get started.
            </p>
            <Button 
              onClick={onCreatePost}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
            >
              Create a Moment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Course engagement prompt
  if (isNewUser || isInactiveUser) {
    prompts.push(
      <div
        key="course-engagement"
        className="bg-gradient-to-br from-background to-emerald-50/50 border border-border rounded-xl p-5 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Which top 100 courses have you rated? ⛳
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Tag courses you've rated to connect with fellow golfers.
            </p>
            <Button 
              onClick={onTagCourse}
              variant="outline"
              className="rounded-full px-6 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Tag a Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Additional prompts for new users
  if (isNewUser) {
    const additionalPrompts = [
      {
        key: "complete-profile",
        icon: <User className="w-6 h-6 text-blue-600" />,
        bgColor: "bg-blue-100",
        accentColor: "text-blue-700",
        borderColor: "border-blue-200",
        hoverColor: "hover:bg-blue-50",
        title: "Complete your profile",
        description: "Add your handicap, favorite courses, and more.",
        buttonText: "Complete Profile",
        action: onCompleteProfile
      },
      {
        key: "follow-creators",
        icon: <Users className="w-6 h-6 text-purple-600" />,
        bgColor: "bg-purple-100",
        accentColor: "text-purple-700",
        borderColor: "border-purple-200",
        hoverColor: "hover:bg-purple-50",
        title: "Follow 3 creators to get started",
        description: "Discover amazing golf content from top creators.",
        buttonText: "Find Creators",
        action: onFollowCreators
      }
    ];

    // Add one random additional prompt
    const randomPrompt = additionalPrompts[Math.floor(Math.random() * additionalPrompts.length)];
    prompts.push(
      <div
        key={randomPrompt.key}
        className={`bg-gradient-to-br from-background to-${randomPrompt.bgColor.split('-')[1]}-50/50 border ${randomPrompt.borderColor} rounded-xl p-5 shadow-sm`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${randomPrompt.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
            {randomPrompt.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {randomPrompt.title}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {randomPrompt.description}
            </p>
            <Button 
              onClick={randomPrompt.action}
              variant="outline"
              className={`rounded-full px-6 ${randomPrompt.borderColor} ${randomPrompt.accentColor} ${randomPrompt.hoverColor}`}
            >
              {randomPrompt.buttonText}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {prompts}
    </div>
  );
};

export default EngagementPrompts;