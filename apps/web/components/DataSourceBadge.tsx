'use client';

export type DataSourceState =
  | 'live'
  | 'loading'
  | 'idle'
  | 'demo'
  | 'reference'
  | 'error';

interface DataSourceBadgeProps {
  state: DataSourceState;
  label?: string;
  className?: string;
}

const DOT_COLORS: Record<DataSourceState, string> = {
  live: 'bg-secondary',
  loading: 'bg-outline animate-pulse',
  idle: 'bg-outline-variant',
  demo: 'bg-tertiary',
  reference: 'bg-outline',
  error: 'bg-error',
};

const PILL_COLORS: Record<DataSourceState, string> = {
  live: 'bg-secondary/10 text-secondary border-secondary/30',
  loading: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
  idle: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
  demo: 'bg-tertiary/10 text-tertiary border-tertiary/30',
  reference: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
  error: 'bg-error-container text-on-error-container border-error/40',
};

const DEFAULT_LABELS: Record<DataSourceState, string> = {
  live: 'Live API',
  loading: 'Loading…',
  idle: 'Awaiting input',
  demo: 'Demo data',
  reference: 'Static reference',
  error: 'API unavailable',
};

export default function DataSourceBadge({
  state,
  label,
  className = '',
}: DataSourceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-space-2xs py-0.5 rounded border font-mono-data-sm text-mono-data-sm tracking-wide whitespace-nowrap ${PILL_COLORS[state]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_COLORS[state]}`} />
      {label ?? DEFAULT_LABELS[state]}
    </span>
  );
}