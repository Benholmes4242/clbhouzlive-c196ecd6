import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOMENT_CATEGORIES, getCategoryById, type MomentCategoryDef } from '../categoryDefinitions';
import { suggestCategories } from '@/utils/categorySuggestions';
import { POST_LIMITS } from '@/constants/postLimits';
import { triggerHaptic } from '@/lib/ui/haptics';

const MAX_CATEGORIES = POST_LIMITS.MAX_CATEGORIES;

// Core categories (first 9) shown in main grid
const CORE_CATEGORIES = MOMENT_CATEGORIES.slice(0, 9);
// More tags (remaining) collapsed by default
const MORE_CATEGORIES = MOMENT_CATEGORIES.slice(9);

// ─── Default accent for categories without explicit color ───
const DEFAULT_ACCENT = {
  bg: 'bg-muted/50', text: 'text-muted-foreground',
  bgActive: 'bg-primary/20', textActive: 'text-primary',
  ring: 'ring-primary/30',
};

// ─── Extracted CategoryTile (React.memo) ───
interface CategoryTileProps {
  category: MomentCategoryDef;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (id: string) => void;
  isLarge?: boolean;
  animationDelay?: number;
}

const CategoryTile = React.memo<CategoryTileProps>(({
  category,
  isSelected,
  isDisabled,
  onToggle,
  isLarge = false,
  animationDelay = 0,
}) => {
  const Icon = category.icon;
  const accent = category.accentColor ?? DEFAULT_ACCENT;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: animationDelay }}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      onClick={() => onToggle(category.id)}
      disabled={isDisabled}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all duration-200",
        isLarge ? "p-4" : "p-3",
        isSelected
          ? `bg-primary/10 ring-1 ${accent.ring}`
          : "bg-muted/30",
        isDisabled && "opacity-40 cursor-not-allowed",
        !isDisabled && !isSelected && "hover:bg-muted/50 active:bg-muted/60"
      )}
    >
      {/* Checkmark with spring bounce */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center bg-primary"
          >
            <Check className="w-2.5 h-2.5 text-primary-foreground" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon circle — accent-colored */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200",
        isSelected ? `${accent.bgActive} ${accent.textActive}` : `${accent.bg} ${accent.text}`
      )}>
        <Icon className={cn(isLarge ? "w-5 h-5" : "w-5 h-5")} />
      </div>

      {/* Label */}
      <span className={cn(
        "text-center leading-tight transition-colors duration-200",
        isLarge ? "text-sm font-medium" : "text-xs font-medium",
        isSelected ? "text-foreground" : "text-muted-foreground"
      )}>
        {category.label}
      </span>
    </motion.button>
  );
});
CategoryTile.displayName = 'CategoryTile';

// ─── Selected pill ───
interface SelectedPillProps {
  category: MomentCategoryDef;
  onRemove: (id: string) => void;
}

const SelectedPill = React.memo<SelectedPillProps>(({ category, onRemove }) => {
  const Icon = category.icon;
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-medium rounded-full px-2.5 py-1 shrink-0"
    >
      <Icon className="w-3 h-3" />
      <span className="whitespace-nowrap">{category.label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(category.id); }}
        className="ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </motion.div>
  );
});
SelectedPill.displayName = 'SelectedPill';

// ─── Main Sheet ───
interface MomentCategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onConfirm?: (categories: string[]) => void;
  caption?: string;
  hasCourse?: boolean;
  mediaTypes?: ('video' | 'photo')[];
}

/**
 * MomentCategorySheet - Bottom sheet for selecting moment categories
 * Multi-select (up to 5) with Continue CTA
 * 9 core categories in main grid, remaining under "Browse all tags"
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
    return suggestCategories({ caption, hasCourse, mediaTypes });
  }, [caption, hasCourse, mediaTypes]);

  // Filter out already-selected from suggestions, limit to 4
  const activeSuggestions = useMemo(() => {
    return suggestedCategoryIds
      .filter(id => !selectedCategories.includes(id))
      .slice(0, 4);
  }, [suggestedCategoryIds, selectedCategories]);

  // Only show suggestions if there's some signal
  const hasSuggestionSignal = caption.trim().length > 0 || hasCourse || mediaTypes.length > 0;

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return MOMENT_CATEGORIES.filter(
      cat => cat.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Multi-select toggle — stable callback
  const toggleCategory = useCallback((categoryId: string) => {
    triggerHaptic('selection');
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else if (selectedCategories.length < MAX_CATEGORIES) {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  }, [selectedCategories, onCategoriesChange]);

  // Remove from pills
  const removeCategory = useCallback((categoryId: string) => {
    triggerHaptic('light');
    onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
  }, [selectedCategories, onCategoriesChange]);

  // Resolved selected category objects
  const selectedCategoryDefs = useMemo(() => {
    return selectedCategories
      .map(id => getCategoryById(id))
      .filter(Boolean) as MomentCategoryDef[];
  }, [selectedCategories]);

  const isAtMaxSelection = selectedCategories.length >= MAX_CATEGORIES;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] light"
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
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl max-h-[75vh] flex flex-col bg-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header with count */}
          <div className="flex items-center justify-between px-5 pb-3">
            <h3 className="text-lg font-semibold text-foreground">
              Tag your moment
            </h3>
            <div className="flex items-center gap-3">
              {/* Counter — progressive styling */}
              <span className={cn(
                "text-xs transition-all duration-200",
                isAtMaxSelection
                  ? "bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full"
                  : selectedCategories.length > 0
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
              )}>
                {selectedCategories.length}/{MAX_CATEGORIES}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div 
            className="flex-1 overflow-y-auto px-5 pb-20"
            style={{ maxHeight: 'calc(75vh - 140px)' }}
          >
            {/* Search input */}
            <div className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Start typing to tag this moment…"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/30 border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow duration-200"
                />
              </div>
            </div>

            {/* Selected pills row */}
            <AnimatePresence>
              {selectedCategoryDefs.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pb-3"
                >
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                    <AnimatePresence mode="popLayout">
                      {selectedCategoryDefs.map(cat => (
                        <SelectedPill key={cat.id} category={cat} onRemove={removeCategory} />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search results */}
            {filteredCategories ? (
              <div className="pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {filteredCategories.map((cat, i) => (
                    <CategoryTile
                      key={cat.id}
                      category={cat}
                      isSelected={selectedCategories.includes(cat.id)}
                      isDisabled={!selectedCategories.includes(cat.id) && isAtMaxSelection}
                      onToggle={toggleCategory}
                      animationDelay={i * 0.03}
                    />
                  ))}
                </div>
                {filteredCategories.length === 0 && (
                  <p className="text-center py-8 text-sm text-muted-foreground">
                    No tags match "{searchQuery}"
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Suggested for you */}
                {hasSuggestionSignal && activeSuggestions.length > 0 && (
                  <div className="pb-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-primary uppercase tracking-wide">
                        Suggested for you
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {activeSuggestions.map((catId, i) => {
                        const cat = getCategoryById(catId);
                        if (!cat) return null;
                        return (
                          <CategoryTile
                            key={catId}
                            category={cat}
                            isSelected={selectedCategories.includes(catId)}
                            isDisabled={!selectedCategories.includes(catId) && isAtMaxSelection}
                            onToggle={toggleCategory}
                            isLarge
                            animationDelay={i * 0.03}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Core categories (first 9) */}
                <div className="pb-4">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3 block">
                    Categories
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {CORE_CATEGORIES.map((cat, i) => (
                      <CategoryTile
                        key={cat.id}
                        category={cat}
                        isSelected={selectedCategories.includes(cat.id)}
                        isDisabled={!selectedCategories.includes(cat.id) && isAtMaxSelection}
                        onToggle={toggleCategory}
                        animationDelay={i * 0.03}
                      />
                    ))}
                  </div>
                </div>

                {/* Browse all tags — collapsible */}
                <div className="pb-4">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setShowMoreTags(!showMoreTags);
                    }}
                    className="flex items-center gap-2 py-2"
                  >
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      Browse all tags
                    </span>
                    <motion.div
                      animate={{ rotate: showMoreTags ? 180 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {showMoreTags && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          {MORE_CATEGORIES.map((cat, i) => (
                            <CategoryTile
                              key={cat.id}
                              category={cat}
                              isSelected={selectedCategories.includes(cat.id)}
                              isDisabled={!selectedCategories.includes(cat.id) && isAtMaxSelection}
                              onToggle={toggleCategory}
                              animationDelay={i * 0.03}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Continue CTA — fixed at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 px-5 pt-3 pb-4 border-t border-border/30 bg-card"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
          >
            <button
              onClick={() => {
                if (selectedCategories.length > 0) {
                  if (onConfirm) {
                    onConfirm(selectedCategories);
                  } else {
                    onClose();
                  }
                }
              }}
              disabled={selectedCategories.length === 0}
              className={cn(
                "w-full h-11 rounded-xl font-semibold text-sm transition-all duration-300",
                selectedCategories.length > 0
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground/50 cursor-not-allowed"
              )}
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
