import React from 'react';
import { 
  MapPin, 
  Clock, 
  Check, 
  X, 
  CheckSquare, 
  Tag,
  Building
} from 'lucide-react';
import type { CitizenRequest, Priority } from '../types';
import { CustomButton } from './CustomButton';

interface RequestCardProps {
  request: CitizenRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onResolve: (id: string) => void;
  onViewDetails: (request: CitizenRequest) => void;
  onImageClick: (url: string, title: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onReject,
  onResolve,
  onViewDetails,
  onImageClick,
}) => {
  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="badge-rank-high inline-flex items-center gap-1">
            <span>★</span> RANK S: HIGH PRIORITY
          </span>
        );
      case 'medium':
        return (
          <span className="badge-rank-med inline-flex items-center gap-1">
            <span>◆</span> RANK A: MED PRIORITY
          </span>
        );
      case 'low':
        return (
          <span className="badge-rank-low inline-flex items-center gap-1">
            <span>●</span> RANK B: LOW PRIORITY
          </span>
        );
    }
  };

  const getStatusBadge = (status: CitizenRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="font-pixel text-[8px] px-2 py-0.5 bg-[#ffe600] text-black border border-black font-bold">
            [PENDING QUEUE]
          </span>
        );
      case 'in_progress':
        return (
          <span className="font-pixel text-[8px] px-2 py-0.5 bg-[#00f0ff] text-black border border-black font-bold">
            [IN PROGRESS]
          </span>
        );
      case 'completed':
        return (
          <span className="font-pixel text-[8px] px-2 py-0.5 bg-[#00ff88] text-black border border-black font-bold">
            [STAGE CLEARED]
          </span>
        );
      case 'rejected':
        return (
          <span className="font-pixel text-[8px] px-2 py-0.5 bg-[#ff3355] text-white border border-black font-bold">
            [GAME OVER / REJECTED]
          </span>
        );
    }
  };

  const formattedDate = new Date(request.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`pixel-panel flex flex-col transition-transform hover:-translate-y-1 ${
        request.priority === 'high' && request.status === 'pending'
          ? 'pixel-panel-magenta ring-2 ring-[#ff007f]'
          : request.status === 'completed'
          ? 'pixel-panel-green'
          : request.status === 'rejected'
          ? 'border-[#000000] opacity-80'
          : 'border-[#000000]'
      }`}
    >
      {/* 8-Bit Quest Window Titlebar */}
      <div className="pixel-window-header">
        <div className="flex items-center gap-2 truncate pr-2">
          <span className="text-[#00ff88]">#{request.trackingCode}</span>
          <span className="hidden sm:inline">{getStatusBadge(request.status)}</span>
        </div>
        <div className="shrink-0">{getPriorityBadge(request.priority)}</div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
        
        {/* Photo & Description Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          
          {/* Pixelated Photo Preview with CRT scanline effect */}
          <div 
            onClick={() => onImageClick(request.imageUrl, `${request.category} (#${request.trackingCode})`)}
            className="relative w-full sm:w-36 h-36 shrink-0 overflow-hidden bg-[#000000] cursor-pointer group border-4 border-[#000000] shadow-[3px_3px_0_#000]"
          >
            <img
              src={request.imageUrl}
              alt={`Civic Issue - ${request.category}`}
              className="w-full h-full object-cover pixel-art-image group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-[#000000]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-pixel text-[8px] text-[#ffe600] text-center p-1">
              [INSPECT PHOTO]
            </div>
          </div>

          {/* Issue Information */}
          <div className="flex-1 min-w-0">
            <div className="font-pixel text-[9px] text-[#ffe600] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#ff007f]" />
              <span>{request.category}</span>
            </div>

            <p className="font-retro text-xl text-white line-clamp-3 mb-2 leading-tight">
              {request.description}
            </p>

            {/* Location & Ward */}
            <div className="space-y-1 font-retro text-base text-slate-300">
              <div className="flex items-start gap-1 text-[#ff9900]">
                <MapPin className="w-4 h-4 text-[#ff3355] shrink-0 mt-0.5" />
                <span className="break-words">{request.location}</span>
              </div>
              <div className="flex items-center gap-1 text-[#00f0ff]">
                <Building className="w-4 h-4 text-[#00f0ff] shrink-0" />
                <span>{request.ward}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Citizen Metadata Divider */}
        <div className="mt-auto pt-3 border-t-2 border-[#000000] flex flex-wrap items-center justify-between gap-2 font-retro text-base text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#000000] border-2 border-[#ffe600] text-[#ffe600] flex items-center justify-center font-pixel text-[10px]">
              {request.citizenName.charAt(0)}
            </div>
            <div>
              <span className="font-bold text-white block">{request.citizenName}</span>
              <span className="text-xs text-slate-400 font-mono">{request.citizenPhone}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 font-pixel text-[8px] text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Notes Banners */}
        {request.status === 'rejected' && request.rejectionReason && (
          <div className="p-2.5 bg-[#20040f] border-2 border-[#ff3355] font-retro text-base text-[#ff6680]">
            <strong className="font-pixel text-[9px] text-[#ff3355] block mb-0.5">REJECTION LOG:</strong>
            {request.rejectionReason}
          </div>
        )}

        {request.status === 'completed' && request.resolutionNotes && (
          <div className="p-2.5 bg-[#021f14] border-2 border-[#00ff88] font-retro text-base text-[#80ffc0]">
            <strong className="font-pixel text-[9px] text-[#00ff88] block mb-0.5">CLEARANCE REPORT:</strong>
            {request.resolutionNotes}
          </div>
        )}

      </div>

      {/* 8-Bit Pixel Button Controls */}
      <div className="p-3.5 bg-[#08041a] border-t-4 border-[#000000] flex flex-wrap items-center gap-2">
        
        {/* If status is Pending: ACCEPT (Pixel-Green) & REJECT (Pixel-Red) */}
        {request.status === 'pending' && (
          <>
            <div className="flex-1">
              <CustomButton
                variant="accept"
                size="sm"
                fullWidth
                icon={<Check className="w-4 h-4 stroke-[3]" />}
                onClick={() => onAccept(request.id)}
              >
                ACCEPT
              </CustomButton>
            </div>

            <div className="flex-1">
              <CustomButton
                variant="reject"
                size="sm"
                fullWidth
                icon={<X className="w-4 h-4 stroke-[3]" />}
                onClick={() => onReject(request.id)}
              >
                REJECT
              </CustomButton>
            </div>
          </>
        )}

        {/* If status is In Progress: Mark Resolved */}
        {request.status === 'in_progress' && (
          <>
            <div className="flex-1">
              <CustomButton
                variant="resolve"
                size="sm"
                fullWidth
                icon={<CheckSquare className="w-4 h-4" />}
                onClick={() => onResolve(request.id)}
              >
                MARK RESOLVED
              </CustomButton>
            </div>

            <div>
              <CustomButton
                variant="reject"
                size="sm"
                icon={<X className="w-4 h-4" />}
                onClick={() => onReject(request.id)}
              >
                REJECT
              </CustomButton>
            </div>
          </>
        )}

        {/* If status is Completed: Reopen */}
        {request.status === 'completed' && (
          <div className="flex-1 flex items-center justify-between gap-2">
            <span className="font-pixel text-[9px] text-[#00ff88] flex items-center gap-1">
              ✓ QUEST CLEARED
            </span>
            <CustomButton
              variant="neutral"
              size="sm"
              onClick={() => onAccept(request.id)}
            >
              REOPEN
            </CustomButton>
          </div>
        )}

        {/* If status is Rejected: Restore */}
        {request.status === 'rejected' && (
          <div className="flex-1 flex items-center justify-between gap-2">
            <span className="font-pixel text-[9px] text-[#ff3355]">
              ✕ ARCHIVED
            </span>
            <CustomButton
              variant="accept"
              size="sm"
              onClick={() => onAccept(request.id)}
            >
              RE-ADMIT
            </CustomButton>
          </div>
        )}

        {/* Inspector Button */}
        <button
          onClick={() => onViewDetails(request)}
          title="Open Quest Dossier"
          className="p-2 bg-[#000000] hover:bg-[#ffe600] text-[#ffe600] hover:text-black border-2 border-[#000000] shadow-[2px_2px_0_#000] transition font-pixel text-[8px] flex items-center gap-1"
        >
          <span>DOSSIER</span>
        </button>

      </div>
    </div>
  );
};
