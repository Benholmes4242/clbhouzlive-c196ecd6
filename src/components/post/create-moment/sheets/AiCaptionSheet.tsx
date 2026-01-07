import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Simplified tone options (4 only, segmented control)
const TONE_OPTIONS = [
  { id: 'classic', label: 'Classic' },
  { id: 'funny', label: 'Funny' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'story', label: 'Story' },
] as const;

// Simplified moment types (6 core options)
const MOMENT_TYPE_OPTIONS = [
  { id: 'casual-round', label: 'Casual Round', icon: '⛳' },
  { id: 'tournament', label: 'Tournament', icon: '🏆' },
  { id: 'new-course', label: 'New Course', icon: '📍' },
  { id: 'golf-trip', label: 'Golf Trip', icon: '✈️' },
  { id: 'practice-range', label: 'Practice', icon: '🎯' },
  { id: 'lesson-coaching', label: 'Lesson', icon: '📚' },
] as const;

// Grouped context options with selection limits
const CONTEXT_GROUPS = {
  performance: {
    label: 'Performance',
    maxSelect: 2,
    options: ['Birdie', 'Eagle', 'Personal Best', 'Clutch Putt', 'Breaking 80', 'Breaking 90', 'Breaking 100'],
  },
  highlights: {
    label: 'Round Highlights',
    maxSelect: 3,
    options: ['Front Nine', 'Back Nine', 'Long Drive', 'Nearest the Pin', 'Fairways Hit', 'Greens in Reg'],
  },
  conditions: {
    label: 'Conditions',
    maxSelect: 1,
    options: ['Windy / Links Day', 'Sunset / Golden Hour', 'Fast Greens'],
  },
} as const;

type ToneId = typeof TONE_OPTIONS[number]['id'];
type MomentTypeId = typeof MOMENT_TYPE_OPTIONS[number]['id'];

interface GeneratedCaption {
  text: string;
  hashtags: string[];
}

interface AiCaptionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCaption: (caption: string, mode: 'replace' | 'append') => void;
  existingCaption: string;
  prefilledCourseName?: string;
}

export const AiCaptionSheet: React.FC<AiCaptionSheetProps> = ({
  isOpen,
  onClose,
  onInsertCaption,
  existingCaption,
  prefilledCourseName,
}) => {
  // Selection state
  const [selectedTone, setSelectedTone] = useState<ToneId>('classic');
  const [selectedMomentType, setSelectedMomentType] = useState<MomentTypeId>('casual-round');
  const [selectedTokens, setSelectedTokens] = useState<Record<string, string[]>>({
    performance: [],
    highlights: [],
    conditions: [],
  });
  
  // Collapsible context section
  const [contextExpanded, setContextExpanded] = useState(false);
  
  // Optional inputs
  const [courseName, setCourseName] = useState(prefilledCourseName || '');
  const [scoreText, setScoreText] = useState('');
  const [withText, setWithText] = useState('');
  const [allowEmojis, setAllowEmojis] = useState(true);
  const [shortMode, setShortMode] = useState(false);
  
  // Results state
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReplacePrompt, setShowReplacePrompt] = useState(false);

  // Toggle token selection with group limits
  const toggleToken = useCallback((group: string, token: string) => {
    setSelectedTokens(prev => {
      const currentGroup = prev[group] || [];
      const maxSelect = CONTEXT_GROUPS[group as keyof typeof CONTEXT_GROUPS]?.maxSelect || 99;
      
      if (currentGroup.includes(token)) {
        return { ...prev, [group]: currentGroup.filter(t => t !== token) };
      } else if (currentGroup.length < maxSelect) {
        return { ...prev, [group]: [...currentGroup, token] };
      }
      return prev;
    });
  }, []);

  // Get all selected tokens as flat array
  const getAllSelectedTokens = useCallback(() => {
    return Object.values(selectedTokens).flat();
  }, [selectedTokens]);

  // Generate captions
  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCaptions([]);
    setSelectedCaptionIndex(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Please sign in to use AI Caption');
        return;
      }

      const response = await supabase.functions.invoke('generate-caption', {
        body: {
          tone: selectedTone,
          momentType: MOMENT_TYPE_OPTIONS.find(m => m.id === selectedMomentType)?.label || 'Casual Round',
          tokens: getAllSelectedTokens(),
          courseName: courseName.trim() || undefined,
          scoreText: scoreText.trim() || undefined,
          withText: withText.trim() || undefined,
          allowEmojis,
          shortMode,
        },
      });

      if (response.error) {
        console.error('[AiCaptionSheet] Edge function error:', response.error);
        setError("Couldn't generate captions. Try again.");
        return;
      }

      const data = response.data;
      
      if (data.error === 'limit_reached') {
        setError('Daily caption limit reached. Try again tomorrow.');
        return;
      }
      
      if (data.error) {
        setError(data.message || "Couldn't generate captions. Try again.");
        return;
      }

      if (data.captions && Array.isArray(data.captions)) {
        setCaptions(data.captions);
      } else {
        setError('Invalid response from AI. Try again.');
      }
    } catch (err) {
      console.error('[AiCaptionSheet] Error:', err);
      setError("Couldn't generate captions. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTone, selectedMomentType, getAllSelectedTokens, courseName, scoreText, withText, allowEmojis, shortMode]);

  // Handle adding caption to post
  const handleAddToPost = useCallback(() => {
    if (selectedCaptionIndex === null || !captions[selectedCaptionIndex]) return;
    
    const selectedCaption = captions[selectedCaptionIndex];
    let fullCaption = selectedCaption.text;
    
    if (selectedCaption.hashtags && selectedCaption.hashtags.length > 0) {
      fullCaption += '\n\n' + selectedCaption.hashtags.join(' ');
    }

    if (existingCaption.trim()) {
      setShowReplacePrompt(true);
    } else {
      onInsertCaption(fullCaption, 'replace');
      onClose();
      toast.success('Caption added');
    }
  }, [selectedCaptionIndex, captions, existingCaption, onInsertCaption, onClose]);

  // Handle replace/append decision
  const handleReplaceDecision = useCallback((mode: 'replace' | 'append') => {
    if (selectedCaptionIndex === null || !captions[selectedCaptionIndex]) return;
    
    const selectedCaption = captions[selectedCaptionIndex];
    let fullCaption = selectedCaption.text;
    
    if (selectedCaption.hashtags && selectedCaption.hashtags.length > 0) {
      fullCaption += '\n\n' + selectedCaption.hashtags.join(' ');
    }

    onInsertCaption(fullCaption, mode);
    setShowReplacePrompt(false);
    onClose();
    toast.success(mode === 'replace' ? 'Caption replaced' : 'Caption added');
  }, [selectedCaptionIndex, captions, onInsertCaption, onClose]);

  if (!isOpen) return null;

  const totalContextSelected = getAllSelectedTokens().length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{ 
            background: 'var(--cm-surface-card)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div 
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--cm-border)' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: 'var(--cm-accent)' }} />
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--cm-text-primary)' }}
                >
                  AI Caption
                </h3>
              </div>
              <p 
                className="text-xs mt-0.5"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
                We'll suggest a few options for you
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--cm-surface-alt)' }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
            </button>
          </div>

          {/* Scrollable content */}
          <div 
            className="flex-1 overflow-y-auto px-4 space-y-5 pb-4"
            data-ecm-scroll-container="true"
          >
            {/* Tone Selection - Segmented Control */}
            <div>
              <label 
                className="text-xs font-medium mb-2 block"
                style={{ color: 'var(--cm-text-secondary)' }}
              >
                Tone
              </label>
              <div 
                className="flex rounded-xl p-1"
                style={{ background: 'var(--cm-surface-alt)' }}
              >
                {TONE_OPTIONS.map(tone => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150",
                    )}
                    style={{
                      background: selectedTone === tone.id ? 'var(--cm-accent-subtle)' : 'transparent',
                      color: selectedTone === tone.id ? 'var(--cm-accent)' : 'var(--cm-text-tertiary)',
                      border: selectedTone === tone.id ? '1px solid var(--cm-accent-muted)' : '1px solid transparent',
                    }}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Moment Type Selection - Grid */}
            <div>
              <label 
                className="text-xs font-medium mb-2 block"
                style={{ color: 'var(--cm-text-secondary)' }}
              >
                Moment Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MOMENT_TYPE_OPTIONS.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedMomentType(type.id)}
                    disabled={isLoading}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-center transition-all flex flex-col items-center gap-1",
                    )}
                    style={{
                      background: selectedMomentType === type.id 
                        ? 'var(--cm-accent-subtle)' 
                        : 'var(--cm-surface-alt)',
                      border: `1.5px solid ${selectedMomentType === type.id ? 'var(--cm-accent)' : 'transparent'}`,
                      color: selectedMomentType === type.id 
                        ? 'var(--cm-accent)' 
                        : 'var(--cm-text-primary)',
                    }}
                  >
                    <span className="text-base">{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Context Section */}
            <div>
              <button
                onClick={() => setContextExpanded(!contextExpanded)}
                disabled={isLoading}
                className="w-full flex items-center justify-between py-2"
              >
                <span 
                  className="text-xs font-medium flex items-center gap-2"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  Add context
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ 
                      background: 'var(--cm-surface-alt)',
                      color: 'var(--cm-text-tertiary)',
                    }}
                  >
                    optional
                  </span>
                  {totalContextSelected > 0 && (
                    <span 
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ 
                        background: 'var(--cm-accent-subtle)',
                        color: 'var(--cm-accent)',
                      }}
                    >
                      {totalContextSelected} selected
                    </span>
                  )}
                </span>
                {contextExpanded ? (
                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--cm-text-tertiary)' }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--cm-text-tertiary)' }} />
                )}
              </button>
              
              <AnimatePresence>
                {contextExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-2">
                      {Object.entries(CONTEXT_GROUPS).map(([groupKey, group]) => {
                        const currentSelection = selectedTokens[groupKey] || [];
                        const isMaxed = currentSelection.length >= group.maxSelect;
                        
                        return (
                          <div key={groupKey}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span 
                                className="text-[11px] font-medium"
                                style={{ color: 'var(--cm-text-tertiary)' }}
                              >
                                {group.label}
                              </span>
                              <span 
                                className="text-[10px]"
                                style={{ color: 'var(--cm-text-tertiary)' }}
                              >
                                {currentSelection.length}/{group.maxSelect}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {group.options.map(token => {
                                const isSelected = currentSelection.includes(token);
                                const isDisabled = isLoading || (!isSelected && isMaxed);
                                
                                return (
                                  <button
                                    key={token}
                                    onClick={() => toggleToken(groupKey, token)}
                                    disabled={isDisabled}
                                    className={cn(
                                      "px-2 py-1 rounded-full text-[11px] font-medium transition-all",
                                      isDisabled && !isSelected && "opacity-40"
                                    )}
                                    style={{
                                      background: isSelected 
                                        ? 'var(--cm-accent-subtle)' 
                                        : 'var(--cm-surface-alt)',
                                      color: isSelected 
                                        ? 'var(--cm-accent)' 
                                        : 'var(--cm-text-secondary)',
                                      border: `1px solid ${isSelected ? 'var(--cm-accent)' : 'transparent'}`,
                                    }}
                                  >
                                    {token}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Optional Inputs - Low Emphasis */}
            <div 
              className="space-y-2.5 pt-1"
              style={{ opacity: 0.85 }}
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    disabled={isLoading}
                    placeholder="Course name"
                    className="w-full px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: 'var(--cm-surface-alt)',
                      border: '1px solid var(--cm-border-subtle)',
                      color: 'var(--cm-text-primary)',
                    }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={scoreText}
                    onChange={(e) => setScoreText(e.target.value)}
                    disabled={isLoading}
                    placeholder="Score"
                    className="w-full px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: 'var(--cm-surface-alt)',
                      border: '1px solid var(--cm-border-subtle)',
                      color: 'var(--cm-text-primary)',
                    }}
                  />
                </div>
              </div>
              
              <input
                type="text"
                value={withText}
                onChange={(e) => setWithText(e.target.value)}
                disabled={isLoading}
                placeholder="Playing with..."
                className="w-full px-3 py-2 rounded-lg text-xs"
                style={{
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                  color: 'var(--cm-text-primary)',
                }}
              />

              {/* Minimal Toggles - Slate styled */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center transition-all duration-150",
                      allowEmojis ? "bg-[var(--cm-accent)]" : "bg-[var(--cm-surface-alt)] border border-[var(--cm-border)]"
                    )}
                    onClick={() => !isLoading && setAllowEmojis(!allowEmojis)}
                  >
                    {allowEmojis && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--cm-text-tertiary)' }}
                  >
                    Emojis
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center transition-all duration-150",
                      shortMode ? "bg-[var(--cm-accent)]" : "bg-[var(--cm-surface-alt)] border border-[var(--cm-border)]"
                    )}
                    onClick={() => !isLoading && setShortMode(!shortMode)}
                  >
                    {shortMode && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--cm-text-tertiary)' }}
                  >
                    Short
                  </span>
                </label>
              </div>
            </div>

            {/* Generate Button - Primary CTA (Slate to match Done) */}
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-150"
              style={{
                background: isLoading ? 'var(--cm-surface-alt)' : 'var(--cm-surface-slate)',
                color: isLoading ? 'var(--cm-text-tertiary)' : 'white',
                boxShadow: isLoading ? 'none' : 'var(--cm-shadow-button)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate captions
                </>
              )}
            </button>

            {/* Error State */}
            {error && (
              <div 
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ 
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                <p 
                  className="text-sm"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className="p-4 rounded-xl animate-pulse"
                    style={{ background: 'var(--cm-surface-alt)' }}
                  >
                    <div 
                      className="h-4 rounded w-3/4 mb-2"
                      style={{ background: 'var(--cm-border)' }}
                    />
                    <div 
                      className="h-4 rounded w-1/2"
                      style={{ background: 'var(--cm-border)' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {captions.length > 0 && !isLoading && (
              <div className="space-y-3 pb-2">
                <label 
                  className="text-xs font-medium block"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  Select a caption
                </label>
                {captions.map((caption, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCaptionIndex(index)}
                    className={cn(
                      "w-full p-4 rounded-xl text-left transition-all",
                      selectedCaptionIndex === index && "ring-2"
                    )}
                    style={{
                      background: selectedCaptionIndex === index 
                        ? 'var(--cm-accent-subtle)' 
                        : 'var(--cm-surface-alt)',
                      border: `1px solid ${selectedCaptionIndex === index ? 'var(--cm-accent)' : 'var(--cm-border-subtle)'}`,
                      '--tw-ring-color': 'var(--cm-accent)',
                    } as React.CSSProperties}
                  >
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--cm-text-primary)' }}
                    >
                      {caption.text}
                    </p>
                    {caption.hashtags && caption.hashtags.length > 0 && (
                      <p 
                        className="text-xs mt-2"
                        style={{ color: 'var(--cm-text-tertiary)' }}
                      >
                        {caption.hashtags.join(' ')}
                      </p>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          {captions.length > 0 && !isLoading && (
            <div 
              className="flex-shrink-0 p-4 flex gap-3"
              style={{ borderTop: '1px solid var(--cm-border-subtle)' }}
            >
              <button
                onClick={handleGenerate}
                className="flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"
                style={{
                  background: 'var(--cm-surface-alt)',
                  color: 'var(--cm-text-primary)',
                  border: '1px solid var(--cm-border-subtle)',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={handleAddToPost}
                disabled={selectedCaptionIndex === null}
                className="flex-1 py-2.5 rounded-xl font-medium transition-all duration-150"
                style={{
                  background: selectedCaptionIndex !== null ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                  color: selectedCaptionIndex !== null ? 'white' : 'var(--cm-text-tertiary)',
                  boxShadow: selectedCaptionIndex !== null ? 'var(--cm-shadow-button)' : 'none',
                }}
              >
                Add to Post
              </button>
            </div>
          )}

          {/* Replace/Append Prompt */}
          <AnimatePresence>
            {showReplacePrompt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="mx-4 p-5 rounded-2xl max-w-sm w-full"
                  style={{ background: 'var(--cm-surface-card)' }}
                >
                  <h4 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--cm-text-primary)' }}
                  >
                    Replace existing caption?
                  </h4>
                  <p 
                    className="text-sm mb-4"
                    style={{ color: 'var(--cm-text-secondary)' }}
                  >
                    You already have a caption. Would you like to replace it or append the new one?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReplaceDecision('append')}
                      className="flex-1 py-2.5 rounded-xl font-medium"
                      style={{
                        background: 'var(--cm-surface-alt)',
                        color: 'var(--cm-text-primary)',
                        border: '1px solid var(--cm-border-subtle)',
                      }}
                    >
                      Append
                    </button>
                    <button
                      onClick={() => handleReplaceDecision('replace')}
                      className="flex-1 py-2.5 rounded-xl font-medium"
                      style={{
                        background: 'var(--cm-surface-slate)',
                        color: 'white',
                      }}
                    >
                      Replace
                    </button>
                  </div>
                  <button
                    onClick={() => setShowReplacePrompt(false)}
                    className="w-full mt-2 py-2 text-sm"
                    style={{ color: 'var(--cm-text-tertiary)' }}
                  >
                    Cancel
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AiCaptionSheet;
