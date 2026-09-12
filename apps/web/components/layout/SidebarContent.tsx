'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './navigation';

interface SidebarContentProps {
  onClose?: () => void;
  closeButtonRef?: React.Ref<HTMLButtonElement>;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  onClose,
  closeButtonRef,
}) => {
  const pathname = usePathname();

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="h-16 px-space-md flex items-center gap-space-xs border-b border-outline-variant/20 bg-surface-container-low/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Adaptive Context Engine Logo"
            className="h-8 w-auto object-contain"
            src="/ace-logo.png"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-headline-md text-headline-md tracking-tight text-on-surface truncate leading-tight">
              Adaptive Context Engine
            </span>
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider truncate">
              Structural Serialization Research
            </span>
          </div>
          {onClose ? (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          ) : null}
        </div>

        <div className="px-space-md pt-space-md pb-space-xs">
          <span className="font-label-caps text-label-caps text-outline tracking-wider uppercase">
            Research Navigation
          </span>
        </div>

        <nav className="flex-1 px-space-2xs space-y-space-3xs overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex items-center gap-space-xs px-space-sm py-space-xs rounded transition-colors ${
                  isActive
                    ? 'bg-surface-container-high text-primary border-l-2 border-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] transition-colors ${
                    isActive ? 'text-primary' : 'text-outline group-hover:text-primary'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="font-body-md text-body-md">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-space-sm border-t border-outline-variant/30 bg-surface-container-low/70">
        <div className="p-space-xs rounded bg-surface-container-lowest/90 border border-outline-variant/20 flex flex-col gap-space-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="font-label-caps text-label-caps text-secondary font-semibold uppercase tracking-wider">
                SYSTEM READY
              </span>
            </div>
            <span className="font-mono-data-sm text-mono-data-sm text-outline px-space-2xs py-0.5 rounded bg-surface-container-high border border-outline-variant/30">
              STABLE
            </span>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            5 Formats Available · Validation Enabled
          </span>
        </div>
      </div>
    </>
  );
};