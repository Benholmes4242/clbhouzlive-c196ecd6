import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Tag, Sparkles, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOMENT_CATEGORIES, getCategoryById, CORE_CATEGORY_IDS } from '../categoryDefinitions';
import { suggestCategories } from '@/utils/categorySuggestions';
import { triggerHaptic } from '@/lib/ui/haptics';

// Core categories (first 9) shown in main grid
const CORE_CATEGORIES = MOMENT_CATEGORIES.slice(0, 9);
// More tags (remaining 21) collapsed by default
const MORE_CATEGORIES = MOMENT_CATEGORIES.slice(9);

interface MomentCategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onConfirm?: (categories: string[]) => void; // Called when Continue is tapped with a selection
  caption?: string;
  hasCourse?: boolean;
  mediaTypes?: ('video' | 'photo')[];
}

/**
 * MomentCategorySheet - Bottom sheet for selecting moment categories
 * Redesigned with 3-column grid, SVG icons, and progressive disclosure
 * Multi-select mode (up to 5 categories) with Continue CTA
 * 
 * Shows 9 core categories in main grid, 21 more under "More Tags"
 */
export const MomentCategorySheet: React.FC<MomentCategorySheetProps> = ({
  isOpen,
  onClose,
  selectedCategories,
  onCategoriesChange,
  onConfirm,
  caption = '',
  hasCourse = false,
  mediaTypes = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreTags, setShowMoreTags] = useState(false);

  // Get suggested categories
  const suggestedCategoryIds = useMemo(() => {
    return suggestCategories({
      caption,
      hasCourse,
      mediaTypes,
    });
  }, [caption, hasCourse, mediaTypes]);

  // Filter out already-selected from suggestions, limit to 4
  const activeSuggestions = useMemo(() => {
    return suggestedCategoryIds
      .filter(id => !selectedCategories.includes(id))
      .slice(0, 4);
  }, [suggestedCategoryIds, selectedCategories]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return MOMENT_CATEGORIES.filter(
      cat => cat.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Multi-select: toggle category
  const toggleCategory = useCallback((categoryId: string) => {
    triggerHaptic('selection');
    
    if (selectedCategories.includes(categoryId)) {
      // Remove if already selected
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else if (selectedCategories.length < MAX_CATEGORIES) {
      // Add if under limit
      onCategoriesChange([...selectedCategories, categoryId]);
    }
    // If at max, do nothing (button should be disabled)
  }, [selectedCategories, onCategoriesChange, MAX_CATEGORIES]);

  const isAtMaxSelection = selectedCategories.length >= MAX_CATEGORIES;

  if (!isOpen) return null;

  // Category tile component
  const CategoryTile = ({ 
    categoryId, 
    isLarge = false 
  }: { 
    categoryId: string; 
    isLarge?: boolean;
  }) => {
    const cat = getCategoryById(categoryId);
    if (!cat) return null;
    
    const isSelected = selectedCategories.includes(categoryId);
    const isDisabled = !isSelected && isAtMaxSelection;
    const Icon = cat.icon;
    
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => toggleCategory(categoryId)}
        disabled={isDisabled}
        className={cn(
          "relative flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all duration-150",
          isLarge ? "p-4" : "p-3",
          isDisabled && "opacity-40 cursor-not-allowed"
        )}
        style={{
          background: isSelected 
            ? '#ffffff' 
            : '#f8fafc',
          border: isSelected 
            ? '2px solid hsl(var(--primary))' 
            : '1px solid transparent',
          boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
        }}
      >
        {/* Checkmark */}
        {isSelected && (
          <div 
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center bg-primary"
          >
            <Check className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}
        
        <Icon 
          className={cn(isLarge ? "w-6 h-6" : "w-5 h-5")}
          style={{ 
            color: isSelected ? 'hsl(var(--primary))' : '#64748b' 
          }}
        />
        <span 
          className={cn(
            "text-center leading-tight",
            isLarge ? "text-sm font-medium" : "text-xs font-medium"
          )}
          style={{ 
            color: isSelected ? 'hsl(var(--primary))' : '#64748b' 
          }}
        >
          {cat.label}
        </span>
      </motion.button>
    );
  };

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
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl max-h-[75vh] flex flex-col"
          style={{ 
            background: 'var(--cm-surface-card)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-[#e2e8f0]" />
          </div>

          {/* Header with count */}
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedCategories.length}/{MAX_CATEGORIES}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--cm-surface-alt)' }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div 
            className="flex-1 overflow-y-auto px-4 pb-20"
            style={{ maxHeight: 'calc(75vh - 140px)' }}
          >
            {/* Search input - secondary emphasis */}
            <div className="pb-4">
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: '#e2e8f0',
                  border: '1px solid transparent',
                }}
              >
                <Search className="w-4 h-4" style={{ color: 'var(--cm-text-tertiary)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Start typing to tag this moment…"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ 
                    color: 'var(--cm-text-primary)',
                    caretColor: 'var(--cm-surface-slate)',
                  }}
                />
              </div>
            </div>

            {/* Search results */}
            {filteredCategories ? (
              <div className="pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {filteredCategories.map(cat => (
                    <CategoryTile key={cat.id} categoryId={cat.id} />
                  ))}
                </div>
                {filteredCategories.length === 0 && (
                  <p 
                    className="text-center py-8 text-sm"
                    style={{ color: 'var(--cm-text-tertiary)' }}
                  >
                    No tags match "{searchQuery}"
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Suggested for you */}
                {activeSuggestions.length > 0 && (
                  <div className="pb-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--cm-text-secondary)' }} />
                      <span 
                        className="text-xs font-medium uppercase tracking-wide"
                        style={{ color: 'var(--cm-text-secondary)' }}
                      >
                        Suggested for you
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {activeSuggestions.map(catId => (
                        <CategoryTile key={catId} categoryId={catId} isLarge />
                      ))}
                    </div>
                  </div>
                )}

                {/* Core categories (first 9) */}
                <div className="pb-4">
                  <span 
                    className="text-xs font-medium uppercase tracking-wide mb-3 block"
                    style={{ color: 'var(--cm-text-secondary)' }}
                  >
                    Categories
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {CORE_CATEGORIES.map(cat => (
                      <CategoryTile key={cat.id} categoryId={cat.id} />
                    ))}
                  </div>
                </div>

                {/* More tags - collapsible (21 additional categories) */}
                <div className="pb-4">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setShowMoreTags(!showMoreTags);
                    }}
                    className="flex items-center gap-2 py-2"
                  >
                    <span 
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: 'var(--cm-text-secondary)' }}
                    >
                      More tags ({MORE_CATEGORIES.length})
                    </span>
                    <motion.div
                      animate={{ rotate: showMoreTags ? 180 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown 
                        className="w-4 h-4" 
                        style={{ color: 'var(--cm-text-secondary)' }} 
                      />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {showMoreTags && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          {MORE_CATEGORIES.map(cat => (
                            <CategoryTile key={cat.id} categoryId={cat.id} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Continue CTA - fixed at bottom */}
          <div 
            className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-4"
            style={{ 
              background: 'linear-gradient(to top, var(--cm-surface-card) 80%, transparent)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
            }}
          >
            <button
              onClick={() => {
                if (selectedCategories.length > 0) {
                  // Call onConfirm if provided (for pending schedule flow)
                  if (onConfirm) {
                    onConfirm(selectedCategories);
                  } else {
                    onClose();
                  }
                }
              }}
              disabled={selectedCategories.length === 0}
              className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-150"
              style={{
                background: selectedCategories.length > 0 
                  ? 'hsl(var(--primary))' 
                  : 'rgba(100, 116, 139, 0.30)',
                color: selectedCategories.length > 0 ? 'hsl(var(--primary-foreground))' : 'rgba(255, 255, 255, 0.60)',
                boxShadow: selectedCategories.length > 0 
                  ? '0 2px 8px rgba(0, 0, 0, 0.15)' 
                  : 'none',
              }}
            >
              Continue {selectedCategories.length > 0 && `(${selectedCategories.length})`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MomentCategorySheet;
