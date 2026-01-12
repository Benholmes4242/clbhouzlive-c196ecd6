import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Tag, Sparkles, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOMENT_CATEGORIES, getCategoryById, CORE_CATEGORY_IDS } from '../categoryDefinitions';
import { suggestCategories } from '@/utils/categorySuggestions';
import { triggerHaptic } from '@/lib/ui/haptics';

const CORE_CATEGORIES = MOMENT_CATEGORIES.slice(0, 9);
const MORE_CATEGORIES = MOMENT_CATEGORIES.slice(9);

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
 * MomentCategorySheet - Premium tag selection sheet
 * Single-select mode with collectible-style category tiles
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

  const suggestedCategoryIds = useMemo(() => {
    return suggestCategories({ caption, hasCourse, mediaTypes });
  }, [caption, hasCourse, mediaTypes]);

  const activeSuggestions = useMemo(() => {
    return suggestedCategoryIds
      .filter(id => !selectedCategories.includes(id))
      .slice(0, 4);
  }, [suggestedCategoryIds, selectedCategories]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return MOMENT_CATEGORIES.filter(cat => cat.label.toLowerCase().includes(query));
  }, [searchQuery]);

  const selectCategory = useCallback((categoryId: string) => {
    triggerHaptic('selection');
    onCategoriesChange([categoryId]);
  }, [onCategoriesChange]);

  const selectedCategoryId = selectedCategories[0] || null;

  if (!isOpen) return null;

  const CategoryTile = ({ categoryId, isLarge = false }: { categoryId: string; isLarge?: boolean }) => {
    const cat = getCategoryById(categoryId);
    if (!cat) return null;
    
    const isSelected = selectedCategoryId === categoryId;
    const Icon = cat.icon;
    
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => selectCategory(categoryId)}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-2xl transition-all",
          isLarge ? "p-5" : "p-4"
        )}
        style={{
          background: isSelected 
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.05))'
            : 'var(--cm-surface-alt)',
          border: isSelected 
            ? '1.5px solid rgba(245, 158, 11, 0.4)' 
            : '1px solid var(--cm-border-subtle)',
          boxShadow: isSelected 
            ? '0 0 16px rgba(245, 158, 11, 0.1)' 
            : 'none',
        }}
      >
        {isSelected && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
        
        <Icon 
          className={cn(isLarge ? "w-7 h-7" : "w-6 h-6")}
          style={{ color: isSelected ? '#f59e0b' : 'var(--cm-icon-primary)' }}
        />
        <span 
          className={cn("text-center leading-tight font-medium", isLarge ? "text-sm" : "text-xs")}
          style={{ color: isSelected ? '#f59e0b' : 'var(--cm-text-primary)' }}
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
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="absolute bottom-0 left-0 right-0 rounded-t-[28px] max-h-[80vh] flex flex-col"
          style={{ 
            background: 'var(--cm-surface-card)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-300/60" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--cm-surface-alt)' }}
              >
                <Tag className="w-5 h-5" style={{ color: 'var(--cm-icon-primary)' }} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--cm-text-primary)' }}>
                Tag your moment
              </h3>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center",
                "bg-slate-100/80 dark:bg-slate-800/80",
                "backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50",
                "transition-all duration-200 active:scale-95"
              )}
            >
              <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ maxHeight: 'calc(80vh - 160px)' }}>
            {/* Search */}
            <div className="pb-4">
              <div 
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                }}
              >
                <Search className="w-4 h-4" style={{ color: 'var(--cm-text-tertiary)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to tag… (e.g. #review, #matchplay)"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--cm-text-primary)', caretColor: '#f59e0b' }}
                />
              </div>
            </div>

            {filteredCategories ? (
              <div className="pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {filteredCategories.map(cat => (
                    <CategoryTile key={cat.id} categoryId={cat.id} />
                  ))}
                </div>
                {filteredCategories.length === 0 && (
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--cm-text-tertiary)' }}>
                    No tags match "{searchQuery}"
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Suggestions */}
                {activeSuggestions.length > 0 && (
                  <div className="pb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4" style={{ color: '#a855f7' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cm-text-secondary)' }}>
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

                {/* Core Categories */}
                <div className="pb-5">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'var(--cm-text-secondary)' }}>
                    Categories
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {CORE_CATEGORIES.map(cat => (
                      <CategoryTile key={cat.id} categoryId={cat.id} />
                    ))}
                  </div>
                </div>

                {/* More Tags */}
                <div className="pb-4">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setShowMoreTags(!showMoreTags);
                    }}
                    className="flex items-center gap-2 py-2"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cm-text-secondary)' }}>
                      More tags ({MORE_CATEGORIES.length})
                    </span>
                    <motion.div animate={{ rotate: showMoreTags ? 180 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronDown className="w-4 h-4" style={{ color: 'var(--cm-text-secondary)' }} />
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
                        <div className="grid grid-cols-3 gap-3 pt-3">
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

          {/* Continue CTA */}
          <div 
            className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-6"
            style={{ 
              background: 'linear-gradient(to top, var(--cm-surface-card) 70%, transparent)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
            }}
          >
            <button
              onClick={() => {
                if (selectedCategoryId) {
                  if (onConfirm) {
                    onConfirm([selectedCategoryId]);
                  } else {
                    onClose();
                  }
                }
              }}
              disabled={!selectedCategoryId}
              className={cn(
                "w-full h-12 rounded-2xl font-semibold text-base",
                "transition-all duration-200 active:scale-[0.98]",
                "disabled:opacity-50"
              )}
              style={{
                background: selectedCategoryId 
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                  : 'var(--cm-surface-alt)',
                color: selectedCategoryId ? 'white' : 'var(--cm-text-tertiary)',
                boxShadow: selectedCategoryId 
                  ? '0 4px 16px rgba(245, 158, 11, 0.25)' 
                  : 'none',
              }}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MomentCategorySheet;
