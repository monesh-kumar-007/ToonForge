import React from 'react';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const norm = status.toUpperCase();

  let colorClasses = 'bg-surface-container-high text-on-surface-variant border-outline-variant/30';
  let dotColor = 'bg-outline';

  if (norm === 'VALID' || norm === 'OPTIMAL' || norm === 'OPTIMAL LEADER' || norm === 'SOUND') {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (norm === 'REJECTED' || norm === 'HIGH DEFECT' || norm === 'CORRUPTED') {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dotColor = 'bg-rose-400';
  } else if (norm === 'SELECTED') {
    colorClasses = 'bg-primary/10 text-primary border-primary/40';
    dotColor = 'bg-primary';
  } else if (norm === 'FINAL_FALLBACK' || norm === 'FALLBACK' || norm === 'HIGH VOLATILITY') {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (norm === 'INELIGIBLE') {
    colorClasses = 'bg-surface-container-highest text-outline border-outline-variant/20';
    dotColor = 'bg-outline';
  } else if (norm === 'BASELINE') {
    colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    dotColor = 'bg-blue-400';
  } else if (norm === 'STABLE' || norm === 'SPECIALIZED') {
    colorClasses = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    dotColor = 'bg-cyan-400';
  }

  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded border uppercase tracking-wider ${padding} ${colorClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label || status}
    </span>
  );
};
