import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../lib/civicMotion.js';
import { ZoomIn, X } from 'lucide-react';
import { retroAudio } from '../../utils/retroAudio.js';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div
          variants={modalVariants.backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => {
            retroAudio.playClick();
            onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Evidence photo'}
        >
          <motion.div
            variants={modalVariants.panel}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col pixel-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="intel-surface-header">
              <div className="flex items-center gap-2 font-body text-sm truncate pr-4">
            <ZoomIn className="w-4 h-4 text-retro-navy shrink-0" aria-hidden />
            <span>Evidence — {title}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 border border-retro-border font-body text-xs font-semibold"
            >
              Open original
            </a>
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                retroAudio.playClick();
                onClose();
              }}
              className="p-1 border border-retro-border cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex items-center justify-center bg-retro-subtle flex-1 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[75vh] object-contain"
          />
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
