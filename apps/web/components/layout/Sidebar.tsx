'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Overview', path: '/', icon: 'dashboard' },
  { name: 'Analyze Payload', path: '/analyze', icon: 'data_object' },
  { name: 'Adaptive Router', path: '/router', icon: 'alt_route' },
  { name: 'Format Comparison', path: '/compare', icon: 'compare_arrows' },
  { name: 'Benchmark Lab', path: '/benchmark', icon: 'speed' },
  { name: 'Learned Router', path: '/learned-router', icon: 'neurology' },
  { name: 'Reliability', path: '/reliability', icon: 'verified' },
  { name: 'Research', path: '/research', icon: 'menu_book' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header Branding */}
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
        </div>

        {/* Category Label */}
        <div className="px-space-md pt-space-md pb-space-xs">
          <span className="font-label-caps text-label-caps text-outline tracking-wider uppercase">
            Research Navigation
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-space-2xs space-y-space-3xs overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
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

      {/* Footer System Status */}
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
              v2.4-eval
            </span>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            5 Formats Available · Validation Enabled
          </span>
        </div>
      </div>
    </aside>
  );
};