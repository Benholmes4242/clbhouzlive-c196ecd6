import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Tag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOMENT_CATEGORIES, getCategoryById } from '../categoryDefinitions';
import { suggestCategories } from '@/utils/categorySuggestions';
import { triggerHaptic } from '@/lib/ui/haptics';

const MAX_CATEGORIES = 3;

interface MomentCategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  // Context for suggestions
  caption?: string;
  hasCourse?: boolean;
  mediaTypes?: ('video' | 'photo')[];
}

/**
 * MomentCategorySheet - Bottom sheet for selecting moment categories
 * Includes AI-powered suggestions based on caption/context
 * At least 1 category required, max 3
 */
export const MomentCategorySheet: React.FC<MomentCategorySheetProps> = ({
  isOpen,
  onClose,
  selectedCategories,
  onCategoriesChange,
  caption = '',
  hasCourse = false,
  mediaTypes = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get suggested categories
  const suggestedCategoryIds = useMemo(() => {
    return suggestCategories({
      caption,
      hasCourse,
      mediaTypes,
    });
  }, [caption, hasCourse, mediaTypes]);

  // Filter out already-selected from suggestions
  const activeSuggestions = useMemo(() => {
    return suggestedCategoryIds.filter(id => !selectedCategories.includes(id));
  }, [suggestedCategoryIds, selectedCategories]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return MOMENT_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return MOMENT_CATEGORIES.filter(
      cat => cat.label.toLowerCase().includes(query) || cat.emoji.includes(query)
    );
  }, [searchQuery]);

  // Toggle category selection with haptic
  const toggleCategory = useCallback((categoryId: string) => {
    triggerHaptic('selection');
    if (selectedCategories.includes(categoryId)) {
      // Remove category
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else if (selectedCategories.length < MAX_CATEGORIES) {
      // Add category
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  }, [selectedCategories, onCategoriesChange]);

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
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl max-h-[70vh] flex flex-col"
          style={{ 
            background: 'var(--cm-surface-card)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--cm-border)' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5" style={{ color: 'var(--cm-icon-primary)' }} />
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--cm-text-primary)' }}
              >
                Tag your moment
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--cm-surface-alt)' }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
            </button>
          </div>

          {/* Suggested categories - SLATE styling, no gold */}
          {activeSuggestions.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--cm-text-secondary)' }} />
                <span 
                  className="text-xs font-medium"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  Suggested for you
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSuggestions.map(catId => {
                  const cat = getCategoryById(catId);
                  if (!cat) return null;
                  const isDisabled = selectedCategories.length >= MAX_CATEGORIES;
                  
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => !isDisabled && toggleCategory(cat.id)}
                      disabled={isDisabled}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        isDisabled && "opacity-40 cursor-not-allowed"
                      )}
                      style={{
                        background: 'rgba(100, 116, 139, 0.12)',
                        border: '1px solid rgba(100, 116, 139, 0.25)',
                        color: 'var(--cm-text-primary)',
                      }}
                    >
                      <Sparkles className="w-3 h-3" style={{ color: 'var(--cm-text-secondary)' }} />
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search input - enhanced emphasis */}
          <div className="px-4 pb-3">
            <div 
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: 'var(--cm-surface-input)',
                border: '1.5px solid var(--cm-border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <Search className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Start typing to tag this moment..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ 
                  color: 'var(--cm-text-primary)',
                  caretColor: 'var(--cm-surface-slate)',
                }}
                // NO autoFocus - keyboard only appears when user taps
              />
            </div>
          </div>

          {/* Selected categories pills */}
          {selectedCategories.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(catId => {
                  const cat = getCategoryById(catId);
                  if (!cat) return null;
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleCategory(cat.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{
                        background: 'var(--cm-surface-slate)',
                        color: 'white',
                      }}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                      <X className="w-3.5 h-3.5 opacity-70" />
                    </motion.button>
                  );
                })}
              </div>
              <p 
                className="text-xs mt-2"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
                {selectedCategories.length}/{MAX_CATEGORIES} categories selected
              </p>
            </div>
          )}

          {/* Category options */}
          <div 
            className="flex-1 overflow-y-auto px-4 pb-4"
            style={{ maxHeight: '40vh' }}
          >
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                const isDisabled = !isSelected && selectedCategories.length >= MAX_CATEGORIES;
                
                return (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => toggleCategory(cat.id)}
                    disabled={isDisabled}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                    style={{
                      background: isSelected ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                      border: isSelected ? 'none' : '1px solid var(--cm-border-subtle)',
                      color: isSelected ? 'white' : 'var(--cm-text-primary)',
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {filteredCategories.length === 0 && (
              <p 
                className="text-center py-8 text-sm"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
                No categories match "{searchQuery}"
              </p>
            )}
          </div>

          {/* Done button - updated CTA copy */}
          <div className="px-4 pt-2">
            <button
              onClick={onClose}
              disabled={selectedCategories.length === 0}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: selectedCategories.length > 0 ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                color: selectedCategories.length > 0 ? 'white' : 'var(--cm-text-tertiary)',
                border: selectedCategories.length > 0 ? 'none' : '1px solid var(--cm-border-subtle)',
              }}
            >
              {selectedCategories.length === 0 ? 'Choose at least one tag to continue' : 'Done'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MomentCategorySheet;
