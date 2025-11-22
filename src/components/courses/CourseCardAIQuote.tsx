import React, { useState, useEffect, useCallback, useRef } from 'react';
import { callEdgeFunctionDebounced } from '@/utils/edgeFunctionHelper';

interface CourseCardAIQuoteProps {
  courseName: string;
  country: string;
  enabled: boolean;
  mobileTextScale?: 'small' | 'normal';
}

const CourseCardAIQuote: React.FC<CourseCardAIQuoteProps> = ({ 
  courseName, 
  country, 
  enabled,
  mobileTextScale = 'normal'
}) => {
  const [courseQuote, setCourseQuote] = useState<string>('A golf experience like no other');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const generateQuote = useCallback(async () => {
    if (!enabled || !courseName) return;
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    
    try {
      const debounceKey = `quote-${courseName}-${country}`;
      
      const data = await callEdgeFunctionDebounced(
        'generate-course-quote',
        { 
          courseName,
          country 
        },
        debounceKey,
        2000, // 2 second debounce for quotes
        { 
          timeout: 8000, 
          retries: 1
        }
      );

      // Only update if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setCourseQuote(data?.quote || 'A golf experience like no other');
      }
    } catch (error) {
      // Only log error if it's not an abort
      if (!abortControllerRef.current.signal.aborted) {
        console.error('Error calling quote function:', error);
        setCourseQuote('A golf experience like no other');
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled, courseName, country]);

  useEffect(() => {
    generateQuote();
    
    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [generateQuote]);

  if (!enabled) return null;

  return (
    <div className={`text-white/90 ${mobileTextScale === 'small' ? 'text-heading-md' : 'text-heading-lg'} leading-relaxed drop-shadow-lg italic`}>
      {isLoading ? (
        <span className="animate-pulse">Generating quote...</span>
      ) : (
        courseQuote
      )}
    </div>
  );
};

export default React.memo(CourseCardAIQuote);