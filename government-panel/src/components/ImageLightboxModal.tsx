import React from 'react';
import { ZoomIn } from 'lucide-react';
import { retroAudio } from '../utils/retroAudio';

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
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => {
        retroAudio.playClick();
        onClose();
      }}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col pixel-panel border-4 border-black shadow-[8px_8px_0_#000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pixel Top bar */}
        <div className="pixel-window-header">
          <div className="flex items-center gap-2 font-pixel text-[9px] text-[#ffe600] truncate pr-4">
            <ZoomIn className="w-4 h-4 text-[#00f0ff] shrink-0" />
            <span>EVIDENCE INSPECTOR // {title}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 bg-[#1f0a42] text-[#00f0ff] border border-black font-pixel text-[8px] hover:bg-[#3b0f5e]"
              title="Open full original in new tab"
            >
              [LINK]
            </a>
            <button
              onClick={() => {
                retroAudio.playClick();
                onClose();
              }}
              className="p-1 bg-[#ff0055] text-white border border-black font-pixel text-[8px] hover:bg-[#ff3355]"
            >
              [X]
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="p-4 flex items-center justify-center bg-[#000000] flex-1 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[75vh] object-contain pixel-art-image border-4 border-black shadow-[4px_4px_0_#ffe600]"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#08041a] text-slate-400 font-pixel text-[8px] flex justify-between items-center border-t-2 border-black">
          <span>CIVIC DISPATCH ARCHIVE</span>
          <span>CLICK OUTSIDE OR PRESS ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};
