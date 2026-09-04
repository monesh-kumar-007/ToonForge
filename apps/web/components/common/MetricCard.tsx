import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
  gradient?: 'blue' | 'cyan' | 'purple' | 'emerald';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  title,
  subtitle,
  badge,
  icon,
  gradient = 'blue',
}) => {
  const gradientStyles = {
    blue: 'from-primary via-secondary to-transparent',
    cyan: 'from-secondary via-primary to-transparent',
    purple: 'from-tertiary via-primary to-transparent',
    emerald: 'from-emerald-400 via-secondary to-transparent',
  };

  return (
    <div className="group relative p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-md border border-outline-variant/15">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
          {label}
        </span>
        {icon && (
          <span className="material-symbols-outlined text-secondary text-[18px]">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-headline text-3xl text-on-surface font-bold">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs text-secondary font-semibold">
            {unit}
          </span>
        )}
      </div>
      <p className="font-sans text-xs text-on-surface font-medium">{title}</p>
      <div className="mt-2 flex items-center justify-between">
        {subtitle && (
          <span className="font-sans text-[11px] text-on-surface-variant truncate">
            {subtitle}
          </span>
        )}
        {badge && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-semibold ml-auto">
            {badge}
          </span>
        )}
      </div>
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-gradient-to-r ${gradientStyles[gradient]} opacity-80`}
      />
    </div>
  );
};
