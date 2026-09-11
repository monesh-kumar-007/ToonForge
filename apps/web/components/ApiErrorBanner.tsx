'use client';

interface ApiErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export default function ApiErrorBanner({
  message,
  onDismiss,
}: ApiErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-space-sm rounded-lg bg-error-container px-space-md py-space-xs shadow-lg"
    >
      <div className="flex items-start gap-space-xs">
        <span className="material-symbols-outlined mt-0.5 text-[16px] text-on-error-container">
          error
        </span>
        <p className="font-body-md text-body-md text-on-error-container">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss API error"
        className="rounded p-0.5 text-on-error-container transition-colors hover:bg-on-error-container/10"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}