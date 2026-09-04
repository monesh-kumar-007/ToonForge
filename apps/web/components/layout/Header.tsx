'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export const Header: React.FC = () => {
  const pathname = usePathname();

  const getBreadcrumb = () => {
    switch (pathname) {
      case '/':
        return 'OVERVIEW';
      case '/analyze':
        return 'ANALYZE_PAYLOAD';
      case '/router':
        return 'ADAPTIVE_ROUTER';
      case '/compare':
        return 'FORMAT_COMPARISON';
      case '/benchmark':
        return 'BENCHMARK_LAB';
      case '/learned-router':
        return 'LEARNED_ROUTER';
      case '/reliability':
        return 'RELIABILITY_SAFETY';
      case '/research':
        return 'RESEARCH_PAPER';
      default:
        return 'DASHBOARD';
    }
  };

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <nav className="flex items-center gap-1.5 font-mono text-xs text-outline">
          <Link href="/" className="hover:text-on-surface transition-colors">
            TOONFORGE
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="text-secondary font-medium tracking-wide">
            {getBreadcrumb()}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-secondary/40 bg-secondary/10 text-secondary font-mono text-[11px] tracking-wider uppercase font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            VALIDATION ACTIVE
          </span>
          <Link
            href="/research"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high hover:text-on-surface text-on-surface-variant font-mono text-[11px] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">article</span>
            <span>Paper Ref</span>
          </Link>
        </div>
        <div className="h-4 w-[1px] bg-outline-variant/40" />
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-mono text-xs font-bold">
          AI
        </div>
      </div>
    </header>
  );
};
