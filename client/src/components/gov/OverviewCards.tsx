import React from 'react';
import { motion } from 'motion/react';
import { Clock, CheckSquare, Flame, Activity, XOctagon } from 'lucide-react';
import type { CitizenRequest } from '../../types/index.js';
import { retroAudio } from '../../utils/retroAudio.js';
import { useCivicMotion, useCountUp, cardHover } from '../../lib/civicMotion.js';

interface OverviewCardsProps {
  requests: CitizenRequest[];
  onFilterByStatus?: (status: string) => void;
  activeStatusFilter?: string;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  requests,
  onFilterByStatus,
  activeStatusFilter = 'all',
}) => {
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;
  const highPriorityPendingCount = requests.filter(
    (r) => r.status === 'pending' && r.priority === 'high'
  ).length;
  const totalValid = pendingCount + inProgressCount + completedCount;
  const resolutionRate = totalValid > 0 ? Math.round((completedCount / totalValid) * 100) : 0;

  const animatedPending = useCountUp(pendingCount);
  const animatedInProgress = useCountUp(inProgressCount);
  const animatedCompleted = useCountUp(completedCount);
  const animatedRejected = useCountUp(rejectedCount);

  const handleCardClick = (status: string) => {
    retroAudio.playClick();
    if (onFilterByStatus) {
      onFilterByStatus(activeStatusFilter === status ? 'all' : status);
    }
  };

  const cards = [
    {
      id: 'pending',
      label: 'Open queue',
      value: animatedPending,
      icon: Clock,
      footnote: `${highPriorityPendingCount} urgent`,
      footnoteIcon: Flame,
      borderColor: 'border-l-retro-saffron',
    },
    {
      id: 'in_progress',
      label: 'In progress',
      value: animatedInProgress,
      icon: Activity,
      footnote: 'Assigned to field',
      borderColor: 'border-l-retro-navy',
    },
    {
      id: 'completed',
      label: 'Resolved',
      value: animatedCompleted,
      icon: CheckSquare,
      footnote: `${resolutionRate}% resolution`,
      borderColor: 'border-l-retro-success',
    },
    {
      id: 'rejected',
      label: 'Closed',
      value: animatedRejected,
      icon: XOctagon,
      footnote: 'Out of jurisdiction',
      borderColor: 'border-l-retro-muted',
    },
  ];

  const { list, item } = useCivicMotion();

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="civic-label mb-1">Key figures</p>
          <h2 className="section-heading">Operations snapshot</h2>
        </div>
        <p className="font-body text-xs text-retro-muted">Counts from filed reports</p>
      </div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" initial="initial" animate="animate" variants={list}>
        {cards.map((card) => {
          const Icon = card.icon;
          const active = activeStatusFilter === card.id;
          return (
            <motion.button
              key={card.id}
              type="button"
              variants={item}
              {...cardHover}
              onClick={() => handleCardClick(card.id)}
              className={`text-left card-elevated border-l-[3px] ${card.borderColor} p-4 cursor-pointer min-w-0 transition-[border-color,box-shadow] duration-150 ${
                active ? 'shadow-card-hover border-retro-navy' : 'hover:border-retro-navy/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="civic-label">{card.label}</span>
                <Icon className="w-4 h-4 text-retro-navy" />
              </div>
              <div className="kpi-number text-retro-text tabular-nums">
                {card.value}
              </div>
              <div className="mt-2 font-body text-xs text-retro-muted flex items-center gap-1">
                {card.footnoteIcon && <card.footnoteIcon className="w-3.5 h-3.5 text-retro-saffron" />}
                {card.footnote}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
};
