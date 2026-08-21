import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../lib/civicMotion.js';
import { MapPin, History, Check, ShieldCheck, Building, X, Clock, AlertTriangle, CircleDot } from 'lucide-react';
import type { CitizenRequest, Priority } from '../../types/index.js';
import { CustomButton } from './CustomButton.js';
import { retroAudio } from '../../utils/retroAudio.js';

interface RequestDetailsModalProps {
  request: CitizenRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onResolve: (id: string, notes?: string) => void;
  onImageClick: (url: string, title: string) => void;
}

function StatusBadge({ status }: { status: CitizenRequest['status'] }) {
  const map = {
    pending: { label: 'Pending', icon: Clock },
    in_progress: { label: 'In progress', icon: CircleDot },
    completed: { label: 'Resolved', icon: ShieldCheck },
    rejected: { label: 'Closed', icon: X },
  } as const;
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 border border-retro-border rounded-[3px] px-2 py-0.5 text-[12px] font-semibold">
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
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

  const priorityLabel: Record<Priority, string> = { high: 'High', medium: 'Medium', low: 'Low' };

  return (
    <AnimatePresence>
      {isOpen && request && (
        <motion.div
          variants={modalVariants.backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4"
        >
          <motion.div
            variants={modalVariants.panel}
            initial="initial"
            animate="animate"
            exit="exit"
            className="card-elevated w-full max-w-3xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
          >
            <div className="intel-surface-header shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs bg-retro-subtle px-2 py-0.5 border border-retro-border">
                  {request.trackingCode}
                </span>
                <span className="font-body text-sm">Report detail</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  retroAudio.playClick();
                  onClose();
                }}
                className="p-1 border border-retro-border font-body text-xs cursor-pointer rounded-[4px] civic-focus"
              >
                Close
              </button>
            </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-retro-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-retro-border p-3 rounded-[3px]">
            <span className="inline-flex items-center gap-1 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 text-retro-saffron" />
              Priority: {priorityLabel[request.priority]}
            </span>
            <StatusBadge status={request.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-5 space-y-2">
              <p className="civic-label">Evidence</p>
              {request.imageUrl ? (
                <button
                  type="button"
                  onClick={() => onImageClick(request.imageUrl, `${request.category} (#${request.trackingCode})`)}
                  className="relative border border-retro-border bg-retro-subtle aspect-square w-full cursor-pointer overflow-hidden rounded-[3px]"
                >
                  <img src={request.imageUrl} alt={request.category} className="w-full h-full object-cover" />
                </button>
              ) : (
                <div className="aspect-square border border-dashed border-retro-border flex items-center justify-center text-sm text-retro-muted">
                  No photo attached
                </div>
              )}
            </div>

            <div className="md:col-span-7 space-y-4 font-body">
              <div className="border border-retro-border p-4 rounded-[3px] space-y-3">
                <div>
                  <p className="civic-label mb-1">Category</p>
                  <p className="font-semibold">{request.category}</p>
                </div>
                <div className="pt-2 border-t border-retro-border">
                  <p className="civic-label mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </p>
                  <p className="font-semibold">{request.location}</p>
                  <p className="text-sm text-retro-muted flex items-center gap-1 mt-1">
                    <Building className="w-3.5 h-3.5" /> {request.ward}
                  </p>
                </div>
                <div className="pt-2 border-t border-retro-border">
                  <p className="civic-label mb-1">Description</p>
                  <p className="text-sm leading-relaxed">{request.description}</p>
                </div>
              </div>

              <div className="border border-retro-border p-4 rounded-[3px]">
                <p className="civic-label mb-2">Filer</p>
                <p className="font-semibold">Anonymous citizen</p>
                <p className="text-sm text-retro-muted mt-1">Public identity is not stored on this screen.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="civic-label flex items-center gap-1.5 mb-3">
              <History className="w-3.5 h-3.5" /> Status timeline
            </h4>
            <div className="border border-retro-border p-4 rounded-[3px] space-y-3 font-body text-sm">
              {request.timeline.length === 0 && (
                <p className="text-retro-muted">No events recorded yet.</p>
              )}
              {request.timeline.map((event, idx) => (
                <div key={event.id || idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-retro-subtle border border-retro-border flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-semibold">{event.actor}</span>
                      <span className="font-mono text-[11px] text-retro-muted">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-retro-muted mt-0.5">{event.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showRejectForm && (
            <div className="p-4 border border-retro-danger rounded-[3px] space-y-3">
              <h5 className="font-body text-sm font-semibold text-retro-danger">Reason for closing</h5>
              <textarea
                rows={2}
                placeholder="Jurisdiction, insufficient evidence, duplicate…"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="pixel-input w-full"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowRejectForm(false)} className="px-3 py-1 font-body text-xs text-retro-muted cursor-pointer">
                  Cancel
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
                  Confirm close
                </CustomButton>
              </div>
            </div>
          )}

          {showResolveForm && (
            <div className="p-4 border border-retro-success rounded-[3px] space-y-3">
              <h5 className="font-body text-sm font-semibold text-retro-success">Resolution notes</h5>
              <textarea
                rows={2}
                placeholder="Field completion notes…"
                value={resolveNotesInput}
                onChange={(e) => setResolveNotesInput(e.target.value)}
                className="pixel-input w-full"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowResolveForm(false)} className="px-3 py-1 font-body text-xs text-retro-muted cursor-pointer">
                  Cancel
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
                  Mark resolved
                </CustomButton>
              </div>
            </div>
          )}
        </div>

        <div className="bg-retro-subtle px-6 py-3 border-t border-retro-border flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              retroAudio.playClick();
              onClose();
            }}
            className="px-3 py-1.5 font-body text-xs text-retro-muted cursor-pointer"
          >
            Close
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {request.status === 'pending' && (
              <>
                <CustomButton variant="reject" size="sm" onClick={() => setShowRejectForm(true)}>
                  Close
                </CustomButton>
                <CustomButton
                  variant="accept"
                  size="sm"
                  icon={<Check className="w-4 h-4" />}
                  onClick={() => {
                    onAccept(request.id);
                    onClose();
                  }}
                >
                  Assign
                </CustomButton>
              </>
            )}
            {request.status === 'in_progress' && (
              <>
                <CustomButton variant="reject" size="sm" onClick={() => setShowRejectForm(true)}>
                  Close
                </CustomButton>
                <CustomButton variant="resolve" size="sm" icon={<ShieldCheck className="w-4 h-4" />} onClick={() => setShowResolveForm(true)}>
                  Resolve
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
                Reopen
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
                Restore to queue
              </CustomButton>
            )}
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
