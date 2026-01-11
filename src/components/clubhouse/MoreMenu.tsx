/**
 * MoreMenu - Bottom sheet menu for additional post actions
 * Includes: Not interested, Report, Copy link, etc.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  EyeOff, 
  Flag, 
  Link2, 
  Download, 
  Star,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNotInterested?: () => void;
  onReport?: () => void;
  onCopyLink?: () => void;
  onDownload?: () => void;
  onAddToFavorites?: () => void;
  showDownload?: boolean;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, destructive }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-4 w-full px-5 py-4',
      'text-left transition-colors',
      destructive 
        ? 'text-red-400 hover:bg-red-500/10' 
        : 'text-white hover:bg-white/5'
    )}
  >
    <span className="w-5 h-5 flex-shrink-0">{icon}</span>
    <span className="text-[15px] font-medium">{label}</span>
  </button>
);

export const MoreMenu: React.FC<MoreMenuProps> = ({
  isOpen,
  onClose,
  onNotInterested,
  onReport,
  onCopyLink,
  onDownload,
  onAddToFavorites,
  showDownload = false,
}) => {
  const handleCopyLink = async () => {
    if (onCopyLink) {
      onCopyLink();
    }
    // Also copy to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[101]"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div
              className="rounded-t-2xl overflow-hidden"
              style={{
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <span className="text-lg font-semibold text-white">Options</span>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              
              {/* Menu items */}
              <div className="py-2">
                {onNotInterested && (
                  <MenuItem
                    icon={<EyeOff className="w-5 h-5" />}
                    label="Not interested"
                    onClick={() => {
                      onNotInterested();
                      onClose();
                    }}
                  />
                )}
                
                {onAddToFavorites && (
                  <MenuItem
                    icon={<Star className="w-5 h-5" />}
                    label="Add to favourites"
                    onClick={() => {
                      onAddToFavorites();
                      onClose();
                    }}
                  />
                )}
                
                <MenuItem
                  icon={<Link2 className="w-5 h-5" />}
                  label="Copy link"
                  onClick={handleCopyLink}
                />
                
                {showDownload && onDownload && (
                  <MenuItem
                    icon={<Download className="w-5 h-5" />}
                    label="Download"
                    onClick={() => {
                      onDownload();
                      onClose();
                    }}
                  />
                )}
                
                {onReport && (
                  <MenuItem
                    icon={<Flag className="w-5 h-5" />}
                    label="Report"
                    onClick={() => {
                      onReport();
                      onClose();
                    }}
                    destructive
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MoreMenu;
