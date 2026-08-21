import React from 'react';
import {
  MapPin,
  Clock,
  Check,
  X,
  CheckSquare,
  AlertTriangle,
  CircleDot,
  ShieldCheck,
} from 'lucide-react';
import type { CitizenRequest, Priority } from '../../types/index.js';
import { CustomButton } from './CustomButton.js';

interface RequestCardProps {
  request: CitizenRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onResolve: (id: string) => void;
  onViewDetails: (request: CitizenRequest) => void;
  onImageClick: (url: string, title: string) => void;
}

function StatusBadge({ status }: { status: CitizenRequest['status'] }) {
  const map = {
    pending: { label: 'Pending', icon: Clock, className: 'bg-[#fdf0e4] text-retro-accent border-[#efc9a8]' },
    in_progress: { label: 'In progress', icon: CircleDot, className: 'bg-[#e8eef6] text-retro-navy border-[#c5d0de]' },
    completed: { label: 'Resolved', icon: ShieldCheck, className: 'bg-[#e6f4ec] text-retro-success border-[#b7dcc6]' },
    rejected: { label: 'Closed', icon: X, className: 'bg-[#fde8e8] text-retro-danger border-[#f0b4b0]' },
  } as const;
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 border rounded-[3px] px-2 py-0.5 text-[11px] font-semibold shadow-sm ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map = {
    high: { label: 'High', icon: AlertTriangle, className: 'badge-rank-high' },
    medium: { label: 'Medium', icon: CircleDot, className: 'badge-rank-med' },
    low: { label: 'Low', icon: Clock, className: 'badge-rank-low' },
  } as const;
  const cfg = map[priority];
  const Icon = cfg.icon;
  return (
    <span className={`shadow-sm ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onReject,
  onResolve,
  onViewDetails,
  onImageClick,
}) => {
  const formattedDate = new Date(request.timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const priorityBorder = {
    high: 'border-l-3 border-l-retro-danger',
    medium: 'border-l-3 border-l-retro-saffron',
    low: 'border-l-3 border-l-retro-navy',
  }[request.priority];

  return (
    <tr className={`border-b border-retro-border hover:bg-retro-subtle/50 transition-colors duration-150 ${priorityBorder}`}>
      <td className="px-3 py-3 font-mono text-xs text-retro-navy whitespace-nowrap">
        {request.trackingCode}
      </td>
      <td className="px-3 py-3 max-w-0">
        <button
          type="button"
          onClick={() => onViewDetails(request)}
          className="text-left cursor-pointer w-full min-w-0"
        >
          <div className="font-body text-sm font-semibold text-retro-text line-clamp-2" title={request.description}>
            {request.description}
          </div>
          <div className="font-body text-xs text-retro-muted mt-1 truncate">{request.category}</div>
        </button>
      </td>
      <td className="px-3 py-3 font-body text-xs text-retro-text max-w-0">
        <div className="flex items-start gap-1 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-retro-saffron shrink-0 mt-0.5" />
          <span className="min-w-0">
            <span className="block truncate" title={request.location}>{request.location}</span>
            <span className="block text-retro-muted truncate">{request.ward}</span>
          </span>
        </div>
      </td>
      <td className="px-3 py-3">
        <PriorityBadge priority={request.priority} />
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={request.status} />
      </td>
      <td className="px-3 py-3 font-mono text-[11px] text-retro-muted whitespace-nowrap">
        {formattedDate}
      </td>
      <td className="px-3 py-3">
        {request.imageUrl ? (
          <button
            type="button"
            onClick={() => onImageClick(request.imageUrl, `${request.category} (#${request.trackingCode})`)}
            className="w-10 h-10 overflow-hidden border border-retro-border rounded-[3px] cursor-pointer"
          >
            <img src={request.imageUrl} alt="" className="w-full h-full object-cover" />
          </button>
        ) : (
          <span className="text-xs text-retro-muted">—</span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1.5 justify-end items-center">
          {request.status === 'pending' && (
            <>
              <CustomButton variant="accept" size="md" icon={<Check className="w-3.5 h-3.5" />} onClick={() => onAccept(request.id)}>
                Assign
              </CustomButton>
              <CustomButton variant="reject" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => onReject(request.id)}>
                Close
              </CustomButton>
            </>
          )}
          {request.status === 'in_progress' && (
            <CustomButton variant="resolve" size="md" icon={<CheckSquare className="w-3.5 h-3.5" />} onClick={() => onResolve(request.id)}>
              Resolve
            </CustomButton>
          )}
          <button
            type="button"
            onClick={() => onViewDetails(request)}
            className="px-2 py-1 border border-retro-border font-body text-[11px] font-semibold rounded-[3px] cursor-pointer hover:bg-retro-subtle transition-colors"
          >
            Details
          </button>
        </div>
      </td>
    </tr>
  );
};
