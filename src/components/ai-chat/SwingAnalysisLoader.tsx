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
          return prev === analysisSteps.length - 1 ? analysisSteps.length : analysisSteps.length - 1;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isAnalyzing, analysisSteps.length]);

  if (!isVisible) return null;

  const displayText = currentStep < analysisSteps.length 
    ? analysisSteps[currentStep]
    : currentStep % 2 === 0 
      ? "Finalizing details..." 
      : "Almost done...";

  return (
    <div className="rounded-2xl overflow-hidden border border-black/[0.06] bg-white animate-pulse">
      {/* Video skeleton */}
      <div className="h-40 bg-black/10" />
      
      {/* Content skeleton */}
      <div className="px-4 sm:px-5 py-4 space-y-3">
        {/* Header lines */}
        <div className="h-3 rounded bg-black/10 w-2/3" />
        <div className="h-3 rounded bg-black/10 w-1/2" />
        
        {/* Status text */}
        <div className="flex items-center gap-2 pt-2">
          <div className="h-5 w-5 rounded-full border-2 border-[#2A9D8F] border-t-transparent animate-spin" />
          <span className="text-[13px] text-gray-600">{displayText}</span>
        </div>
        
        {/* Button skeleton */}
        <div className="h-9 rounded-full bg-black/10 w-24" />
      </div>
    </div>
  );
};
