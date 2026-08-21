import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Check, 
  Building, 
  History
} from 'lucide-react';
import type { CitizenRequest, Priority } from '../types';
import { CustomButton } from './CustomButton';
import { retroAudio } from '../utils/retroAudio';

interface RequestDetailsModalProps {
  request: CitizenRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onResolve: (id: string, notes?: string) => void;
  onImageClick: (url: string, title: string) => void;
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  request,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onResolve,
  onImageClick,
}) => {
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [resolveNotesInput, setResolveNotesInput] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  if (!isOpen || !request) return null;

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="badge-rank-high inline-flex items-center gap-1">
            <span>★</span> RANK S: HIGH PRIORITY - URGENT ACTION
          </span>
        );
      case 'medium':
        return (
          <span className="badge-rank-med inline-flex items-center gap-1">
            <span>◆</span> RANK A: MEDIUM PRIORITY
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="pixel-panel w-full max-w-4xl overflow-hidden my-6 max-h-[92vh] flex flex-col border-4 border-black shadow-[8px_8px_0_#000]">
        
        {/* 8-Bit Header */}
        <div className="pixel-window-header shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-xs bg-[#ffe600] text-black px-2 py-0.5 border border-black font-black">
              #{request.trackingCode}
            </span>
            <span className="text-[#00ff88]">
              QUEST DOSSIER // CIVIC GRIEVANCE FILE
            </span>
          </div>
          <button
            onClick={() => {
              retroAudio.playClick();
              onClose();
            }}
            className="p-1 bg-[#ff0055] text-white border border-black font-pixel text-[9px] hover:bg-[#ff3355]"
          >
            [X]
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-[#120c2e]">
          
          {/* Priority & Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#08041a] p-3.5 border-3 border-black">
            <div>{getPriorityBadge(request.priority)}</div>
            <div className="font-pixel text-[9px] text-[#ffe600] flex items-center gap-2">
              <span>STATUS:</span>
              <span className="bg-[#000000] text-[#00f0ff] px-2.5 py-1 border border-[#00f0ff] uppercase">
                {request.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Main Grid: Left Photo, Right Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Photo Section */}
            <div className="md:col-span-5 space-y-2">
              <label className="block font-pixel text-[9px] text-[#ffe600] uppercase tracking-wider">
                EVIDENCE PHOTO
              </label>
              <div
                onClick={() => onImageClick(request.imageUrl, `${request.category} (#${request.trackingCode})`)}
                className="relative border-4 border-black bg-black aspect-square cursor-pointer group shadow-[4px_4px_0_#000]"
              >
                <img
                  src={request.imageUrl}
                  alt={request.category}
                  className="w-full h-full object-cover pixel-art-image group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-pixel text-[8px] text-[#ffe600] text-center p-2">
                  [CLICK TO EXPAND FULLSCREEN]
                </div>
              </div>
            </div>

            {/* Information Section */}
            <div className="md:col-span-7 space-y-4 font-retro text-lg">
              
              {/* Category & Location */}
              <div className="bg-[#08041a] p-4 border-3 border-black space-y-2.5">
                <div>
                  <span className="font-pixel text-[8px] uppercase text-[#ff007f] block">CATEGORY</span>
                  <p className="font-bold text-white text-xl">{request.category}</p>
                </div>

                <div className="pt-2 border-t-2 border-black">
                  <span className="font-pixel text-[8px] uppercase text-[#ff9900] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#ff3355]" /> LOCATION DETAILS
                  </span>
                  <p className="font-bold text-white text-lg">{request.location}</p>
                  <p className="text-[#00f0ff] flex items-center gap-1 mt-0.5 text-base">
                    <Building className="w-3.5 h-3.5" /> Division: {request.ward}
                  </p>
                </div>

                <div className="pt-2 border-t-2 border-black">
                  <span className="font-pixel text-[8px] uppercase text-[#ffe600] block">DESCRIPTION</span>
                  <p className="text-slate-200 text-lg leading-tight mt-0.5">
                    {request.description}
                  </p>
                </div>
              </div>

              {/* Citizen Details */}
              <div className="bg-[#08041a] p-4 border-3 border-black">
                <span className="font-pixel text-[8px] uppercase text-[#00ff88] mb-2 block">
                  REPORTING CITIZEN (NPC)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base">
                  <div>
                    <span className="text-slate-400">Name:</span>
                    <p className="font-bold text-white text-lg">{request.citizenName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone:</span>
                    <p className="font-bold text-[#00f0ff] flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5" /> {request.citizenPhone}
                    </p>
                  </div>
                  {request.citizenEmail && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400">Email:</span>
                      <p className="font-bold text-white flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> {request.citizenEmail}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Timeline / Audit Trail */}
          <div>
            <h4 className="font-pixel text-[9px] text-[#ffe600] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <History className="w-4 h-4 text-[#ffe600]" />
              QUEST LOG & LIFECYCLE TIMELINE
            </h4>
            <div className="bg-[#08041a] p-4 border-3 border-black space-y-3 font-retro text-lg">
              {request.timeline.map((event, idx) => (
                <div key={event.id || idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#ffe600] text-black flex items-center justify-center shrink-0 font-pixel text-[9px] font-black mt-0.5 border border-black">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-pixel text-[9px] text-[#00ff88]">{event.actor}</span>
                      <span className="font-pixel text-[8px] text-slate-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-0.5 text-base">{event.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rejection Form Input */}
          {showRejectForm && (
            <div className="p-4 bg-[#20040f] border-4 border-[#ff3355] space-y-3">
              <h5 className="font-pixel text-[9px] text-[#ff3355]">
                REASON FOR JURISDICTION REJECTION:
              </h5>
              <textarea
                rows={2}
                placeholder="Specify rejection justification..."
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="pixel-input w-full"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1 font-pixel text-[8px] text-slate-400"
                >
                  CANCEL
                </button>
                <CustomButton
                  variant="reject"
                  size="sm"
                  onClick={() => {
                    onReject(request.id, rejectReasonInput);
                    setShowRejectForm(false);
                    onClose();
                  }}
                >
                  CONFIRM REJECTION
                </CustomButton>
              </div>
            </div>
          )}

          {/* Resolve Form Input */}
          {showResolveForm && (
            <div className="p-4 bg-[#021f14] border-4 border-[#00ff88] space-y-3">
              <h5 className="font-pixel text-[9px] text-[#00ff88]">
                FIELD CLEARANCE & RESOLUTION REPORT:
              </h5>
              <textarea
                rows={2}
                placeholder="Field team completion notes..."
                value={resolveNotesInput}
                onChange={(e) => setResolveNotesInput(e.target.value)}
                className="pixel-input w-full"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowResolveForm(false)}
                  className="px-3 py-1 font-pixel text-[8px] text-slate-400"
                >
                  CANCEL
                </button>
                <CustomButton
                  variant="resolve"
                  size="sm"
                  onClick={() => {
                    onResolve(request.id, resolveNotesInput);
                    setShowResolveForm(false);
                    onClose();
                  }}
                >
                  MARK AS RESOLVED
                </CustomButton>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-[#08041a] px-6 py-4 border-t-4 border-black flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              retroAudio.playClick();
              onClose();
            }}
            className="px-4 py-2 font-pixel text-[9px] text-slate-400 hover:text-white"
          >
            CLOSE DOSSIER
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {request.status === 'pending' && (
              <>
                <CustomButton
                  variant="reject"
                  size="sm"
                  onClick={() => setShowRejectForm(true)}
                >
                  REJECT QUEST
                </CustomButton>

                <CustomButton
                  variant="accept"
                  size="sm"
                  icon={<Check className="w-4 h-4 stroke-[3]" />}
                  onClick={() => {
                    onAccept(request.id);
                    onClose();
                  }}
                >
                  ACCEPT QUEST
                </CustomButton>
              </>
            )}

            {request.status === 'in_progress' && (
              <>
                <CustomButton
                  variant="reject"
                  size="sm"
                  onClick={() => setShowRejectForm(true)}
                >
                  REJECT
                </CustomButton>

                <CustomButton
                  variant="resolve"
                  size="sm"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  onClick={() => setShowResolveForm(true)}
                >
                  RESOLVE CASE
                </CustomButton>
              </>
            )}

            {request.status === 'completed' && (
              <CustomButton
                variant="neutral"
                size="sm"
                onClick={() => {
                  onAccept(request.id);
                  onClose();
                }}
              >
                REOPEN QUEST
              </CustomButton>
            )}

            {request.status === 'rejected' && (
              <CustomButton
                variant="accept"
                size="sm"
                onClick={() => {
                  onAccept(request.id);
                  onClose();
                }}
              >
                RESTORE TO QUEUE
              </CustomButton>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
