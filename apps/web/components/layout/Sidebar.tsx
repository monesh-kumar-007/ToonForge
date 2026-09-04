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
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header Branding */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-outline-variant/20 bg-surface-container-low/50">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-surface font-headline font-bold text-sm shadow-md">
            TF
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline text-sm font-semibold tracking-tight text-on-surface truncate leading-tight">
              TOONFORGE
            </span>
            <span className="font-mono text-[9px] uppercase text-secondary font-medium tracking-wider truncate">
              Adaptive Context Engine
            </span>
          </div>
        </div>

        {/* Category Label */}
        <div className="px-4 pt-4 pb-2">
          <span className="font-mono text-[10px] text-outline tracking-wider uppercase font-semibold">
            Research Navigation
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded transition-colors text-xs font-medium ${
                  isActive
                    ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
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
                <span className="font-sans">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-outline-variant/30 bg-surface-container-low/70">
        <div className="p-2.5 rounded bg-surface-container-lowest/90 border border-outline-variant/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="font-mono text-[10px] text-secondary font-semibold uppercase tracking-wider">
                ENGINE ACTIVE
              </span>
            </div>
            <span className="font-mono text-[10px] text-outline px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">
              v1.0-eval
            </span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant">
            5 Formats · Strict Safety ON
          </span>
        </div>
      </div>
    </aside>
  );
};
