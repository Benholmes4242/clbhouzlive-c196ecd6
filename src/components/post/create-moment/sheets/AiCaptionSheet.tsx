import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tone options
const TONE_OPTIONS = [
  { id: 'classic', label: 'Classic' },
  { id: 'funny', label: 'Funny' },
  { id: 'hype', label: 'Hype' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'story', label: 'Story' },
];

// Moment type options
const MOMENT_TYPE_OPTIONS = [
  { id: 'casual-round', label: 'Casual Round' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'practice-range', label: 'Practice / Range' },
  { id: 'new-course', label: 'New Course' },
  { id: 'golf-trip', label: 'Golf Trip / Travel' },
  { id: 'lesson-coaching', label: 'Lesson / Coaching' },
  { id: 'matchplay', label: 'Matchplay / Team Day' },
  { id: 'sunset', label: 'Sunset / Golden Hour' },
];

// Context tokens
const CONTEXT_TOKENS = [
  'Birdie', 'Eagle', 'Par', 'Bogey', 'Double',
  'PB / Personal Best', 'Clutch Putt', 'Back Nine', 'Front Nine',
  'Fairways Hit', 'Greens in Reg', 'Up & Down', 'Bunker Save',
  'Long Drive', 'Nearest the Pin', 'New Clubs / New Driver',
  'Playing Partners', 'Windy / Links Day', 'Fast Greens',
];

interface CaptionResult {
  text: string;
  hashtags: string[];
}

interface AiCaptionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCaption: (caption: string, mode: 'replace' | 'append') => void;
  existingCaption: string;
  courseName?: string;
}

export const AiCaptionSheet: React.FC<AiCaptionSheetProps> = ({
  isOpen,
  onClose,
  onInsertCaption,
  existingCaption,
  courseName,
}) => {
  // Selection state
  const [selectedTone, setSelectedTone] = useState('classic');
  const [selectedMomentType, setSelectedMomentType] = useState('casual-round');
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  
  // Optional inputs
  const [scoreText, setScoreText] = useState('');
  const [withText, setWithText] = useState('');
  const [allowEmojis, setAllowEmojis] = useState(true);
  const [shortMode, setShortMode] = useState(false);
  
  // Results state
  const [captions, setCaptions] = useState<CaptionResult[]>([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  
  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const toggleToken = (token: string) => {
    setSelectedTokens(prev => 
      prev.includes(token) 
        ? prev.filter(t => t !== token)
        : [...prev, token]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setCaptions([]);
    setSelectedCaptionIndex(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to use AI Caption');
        return;
      }

      const response = await supabase.functions.invoke('generate-caption', {
        body: {
          tone: selectedTone,
          momentType: MOMENT_TYPE_OPTIONS.find(m => m.id === selectedMomentType)?.label || selectedMomentType,
          tokens: selectedTokens,
          courseName,
          scoreText: scoreText || undefined,
          withText: withText || undefined,
          allowEmojis,
          shortMode,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate captions');
      }

      const data = response.data;
      
      if (data.error === 'limit_reached') {
        setError('Daily caption limit reached. Try again tomorrow.');
        setRemaining(0);
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setCaptions(data.captions || []);
      setRemaining(data.remaining ?? null);
    } catch (err) {
      console.error('[AiCaptionSheet] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate captions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCaption = () => {
    if (selectedCaptionIndex === null || !captions[selectedCaptionIndex]) return;
    
    const caption = captions[selectedCaptionIndex];
    const fullCaption = caption.hashtags.length > 0
      ? `${caption.text}\n\n${caption.hashtags.join(' ')}`
      : caption.text;

    // If existing caption, show confirm modal
    if (existingCaption.trim()) {
      setShowConfirmModal(true);
    } else {
      onInsertCaption(fullCaption, 'replace');
      onClose();
    }
  };

  const handleConfirmReplace = () => {
    if (selectedCaptionIndex === null || !captions[selectedCaptionIndex]) return;
    const caption = captions[selectedCaptionIndex];
    const fullCaption = caption.hashtags.length > 0
      ? `${caption.text}\n\n${caption.hashtags.join(' ')}`
      : caption.text;
    onInsertCaption(fullCaption, 'replace');
    setShowConfirmModal(false);
    onClose();
  };

  const handleConfirmAppend = () => {
    if (selectedCaptionIndex === null || !captions[selectedCaptionIndex]) return;
    const caption = captions[selectedCaptionIndex];
    const fullCaption = caption.hashtags.length > 0
      ? `${caption.text}\n\n${caption.hashtags.join(' ')}`
      : caption.text;
    onInsertCaption(fullCaption, 'append');
    setShowConfirmModal(false);
    onClose();
  };

  const selectedCaption = selectedCaptionIndex !== null ? captions[selectedCaptionIndex] : null;

  if (!isOpen) return null;

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
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: 'var(--cm-accent)' }} />
              <div>
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--cm-text-primary)' }}
                >
                  AI Caption
                </h3>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--cm-text-tertiary)' }}
                >
                  Generate a caption that matches your moment
                </p>
              </div>
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
            className="flex-1 overflow-y-auto px-4 pb-4"
            data-ecm-scroll-container="true"
          >
            {/* Tone Selection */}
            <div className="mb-4">
              <label 
                className="text-xs font-medium mb-2 block"
                style={{ color: 'var(--cm-text-secondary)' }}
              >
                Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {TONE_OPTIONS.map(tone => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: selectedTone === tone.id 
                        ? 'var(--cm-accent)' 
                        : 'var(--cm-surface-alt)',
                      color: selectedTone === tone.id 
                        ? 'white' 
                        : 'var(--cm-text-primary)',
                      opacity: isGenerating ? 0.5 : 1,
                    }}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Moment Type Selection */}
            <div className="mb-4">
              <label 
                className="text-xs font-medium mb-2 block"
                style={{ color: 'var(--cm-text-secondary)' }}
              >
                Moment Type
              </label>
              <div className="flex flex-wrap gap-2">
                {MOMENT_TYPE_OPTIONS.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedMomentType(type.id)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: selectedMomentType === type.id 
                        ? 'var(--cm-accent)' 
                        : 'var(--cm-surface-alt)',
                      color: selectedMomentType === type.id 
                        ? 'white' 
                        : 'var(--cm-text-primary)',
                      opacity: isGenerating ? 0.5 : 1,
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context Tokens */}
            <div className="mb-4">
              <label 
                className="text-xs font-medium mb-2 block"
                style={{ color: 'var(--cm-text-secondary)' }}
              >
                Context (optional, multi-select)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONTEXT_TOKENS.map(token => (
                  <button
                    key={token}
                    onClick={() => toggleToken(token)}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: selectedTokens.includes(token) 
                        ? 'var(--cm-accent-subtle)' 
                        : 'var(--cm-surface-alt)',
                      color: selectedTokens.includes(token) 
                        ? 'var(--cm-accent)' 
                        : 'var(--cm-text-secondary)',
                      border: selectedTokens.includes(token) 
                        ? '1px solid var(--cm-accent)' 
                        : '1px solid transparent',
                      opacity: isGenerating ? 0.5 : 1,
                    }}
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional inputs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label 
                  className="text-xs font-medium mb-1 block"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  Score (optional)
                </label>
                <input
                  type="text"
                  value={scoreText}
                  onChange={(e) => setScoreText(e.target.value)}
                  placeholder="e.g. 74 (+2)"
                  disabled={isGenerating}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--cm-surface-alt)',
                    color: 'var(--cm-text-primary)',
                    border: '1px solid var(--cm-border-subtle)',
                  }}
                />
              </div>
              <div>
                <label 
                  className="text-xs font-medium mb-1 block"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  With (optional)
                </label>
                <input
                  type="text"
                  value={withText}
                  onChange={(e) => setWithText(e.target.value)}
                  placeholder="e.g. Sunday roll-up"
                  disabled={isGenerating}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--cm-surface-alt)',
                    color: 'var(--cm-text-primary)',
                    border: '1px solid var(--cm-border-subtle)',
                  }}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEmojis}
                  onChange={(e) => setAllowEmojis(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded"
                />
                <span 
                  className="text-sm"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  Emojis
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shortMode}
                  onChange={(e) => setShortMode(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded"
                />
                <span 
                  className="text-sm"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  Short captions
                </span>
              </label>
            </div>

            {/* Course prefill indicator */}
            {courseName && (
              <div 
                className="mb-4 px-3 py-2 rounded-lg flex items-center gap-2"
                style={{ 
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--cm-text-tertiary)' }}>
                  Course:
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--cm-text-primary)' }}>
                  {courseName}
                </span>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || remaining === 0}
              className="w-full py-3 rounded-xl font-semibold text-white mb-4 flex items-center justify-center gap-2"
              style={{
                background: remaining === 0 ? 'var(--cm-surface-alt)' : 'var(--cm-accent)',
                opacity: isGenerating || remaining === 0 ? 0.7 : 1,
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : remaining === 0 ? (
                'Daily limit reached'
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate captions
                </>
              )}
            </button>

            {remaining !== null && remaining > 0 && (
              <p 
                className="text-xs text-center mb-4"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
                {remaining} generation{remaining !== 1 ? 's' : ''} remaining today
              </p>
            )}

            {/* Error state */}
            {error && (
              <div 
                className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
                style={{ 
                  background: 'hsl(0 84% 60% / 0.1)',
                  border: '1px solid hsl(0 84% 60% / 0.3)',
                }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(0 84% 60%)' }} />
                <p className="text-sm" style={{ color: 'hsl(0 84% 60%)' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Loading skeleton */}
            {isGenerating && (
              <div className="space-y-3 mb-4">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className="p-4 rounded-xl animate-pulse"
                    style={{ background: 'var(--cm-surface-alt)' }}
                  >
                    <div 
                      className="h-4 rounded mb-2"
                      style={{ background: 'var(--cm-border)', width: '80%' }}
                    />
                    <div 
                      className="h-3 rounded"
                      style={{ background: 'var(--cm-border)', width: '50%' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {captions.length > 0 && !isGenerating && (
              <div className="space-y-3 mb-4">
                {captions.map((caption, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedCaptionIndex(index)}
                    className="w-full text-left p-4 rounded-xl transition-all"
                    style={{
                      background: selectedCaptionIndex === index 
                        ? 'var(--cm-accent-subtle)' 
                        : 'var(--cm-surface-alt)',
                      border: selectedCaptionIndex === index 
                        ? '2px solid var(--cm-accent)' 
                        : '2px solid transparent',
                    }}
                  >
                    <p 
                      className="text-sm mb-2"
                      style={{ color: 'var(--cm-text-primary)' }}
                    >
                      {caption.text}
                    </p>
                    {caption.hashtags.length > 0 && (
                      <p 
                        className="text-xs"
                        style={{ color: 'var(--cm-accent)' }}
                      >
                        {caption.hashtags.join(' ')}
                      </p>
                    )}
                    {selectedCaptionIndex === index && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4" style={{ color: 'var(--cm-accent)' }} />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          {captions.length > 0 && !isGenerating && (
            <div className="px-4 pb-4 pt-2 flex gap-3 flex-shrink-0 border-t" style={{ borderColor: 'var(--cm-border-subtle)' }}>
              <button
                onClick={handleGenerate}
                className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                style={{
                  background: 'var(--cm-surface-alt)',
                  color: 'var(--cm-text-primary)',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={handleAddToCaption}
                disabled={selectedCaptionIndex === null}
                className="flex-1 py-3 rounded-xl font-semibold text-white"
                style={{
                  background: selectedCaptionIndex !== null ? 'var(--cm-accent)' : 'var(--cm-surface-alt)',
                  opacity: selectedCaptionIndex !== null ? 1 : 0.5,
                }}
              >
                Add to Post Caption
              </button>
            </div>
          )}
        </motion.div>

        {/* Confirm Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[10001] flex items-center justify-center px-6"
              onClick={() => setShowConfirmModal(false)}
            >
              <div className="absolute inset-0 bg-black/60" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative rounded-2xl p-6 w-full max-w-sm"
                style={{ background: 'var(--cm-surface-card)' }}
                onClick={(e) => e.stopPropagation()}
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
                  You already have text in your caption. What would you like to do?
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleConfirmReplace}
                    className="w-full py-2.5 rounded-xl font-medium text-white"
                    style={{ background: 'var(--cm-accent)' }}
                  >
                    Replace
                  </button>
                  <button
                    onClick={handleConfirmAppend}
                    className="w-full py-2.5 rounded-xl font-medium"
                    style={{ 
                      background: 'var(--cm-surface-alt)',
                      color: 'var(--cm-text-primary)',
                    }}
                  >
                    Append
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="w-full py-2.5 rounded-xl font-medium"
                    style={{ color: 'var(--cm-text-tertiary)' }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default AiCaptionSheet;
