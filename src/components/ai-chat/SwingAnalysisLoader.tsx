import { useState, useEffect } from 'react';

interface SwingAnalysisLoaderProps {
  isAnalyzing: boolean;
}

export const SwingAnalysisLoader = ({ isAnalyzing }: SwingAnalysisLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const analysisSteps = [
    "Setting stance...",
    "Checking grip...",
    "Analyzing takeaway...",
    "Measuring backswing...",
    "Evaluating top of swing...",
    "Tracking downswing...",
    "Inspecting impact...",
    "Reviewing follow-through...",
    "Balancing finish...",
    "Examining swing plane...",
    "Checking tempo...",
    "Analyzing body rotation...",
    "Reviewing weight transfer...",
    "Checking clubface position...",
    "Measuring swing speed...",
    "Evaluating consistency...",
    "Comparing to pros...",
    "Identifying improvements...",
    "Generating insights...",
    "Compiling results..."
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      setIsVisible(false);
      setCurrentStep(0);
      return;
    }

    setIsVisible(true);
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= analysisSteps.length - 1) {
          // Keep cycling through "Finalizing details..." and "Almost done..."
          return prev === analysisSteps.length - 1 ? analysisSteps.length : analysisSteps.length - 1;
        }
        return prev + 1;
      });
    }, 1500); // 1.5 seconds per step

    return () => clearInterval(interval);
  }, [isAnalyzing, analysisSteps.length]);

  if (!isVisible) return null;

  const displayText = currentStep < analysisSteps.length 
    ? analysisSteps[currentStep]
    : currentStep % 2 === 0 
      ? "Finalizing details..." 
      : "Almost done...";

  return (
    <div className="flex items-center space-x-3 py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-muted-foreground/50"></div>
      <div className="text-sm text-muted-foreground animate-fade-in">
        {displayText}
      </div>
    </div>
  );
};
