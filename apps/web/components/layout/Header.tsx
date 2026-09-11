'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick?: () => void;
  menuOpen?: boolean;
  menuToggleRef?: React.Ref<HTMLButtonElement>;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  menuOpen,
  menuToggleRef,
}) => {
  const pathname = usePathname();

  const getCrumb = () => {
    switch (pathname) {
      case '/':
        return 'PIPELINE_RUNTIME';
      case '/analyze':
        return 'STRUCTURAL_PROFILER';
      case '/router':
        return 'DECISION_PIPELINE';
      case '/compare':
        return 'EFFICIENCY_VALIDITY';
      case '/benchmark':
        return 'EMPIRICAL_EVALUATION';
      case '/learned-router':
        return 'LOW_COST_APPROXIMATION';
      case '/reliability':
        return 'SEMANTIC_SAFETY';
      case '/research':
        return 'PAPER_METHODOLOGY';
      default:
        return 'PIPELINE_RUNTIME';
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-sidebar-width right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30 z-40 px-space-lg flex items-center justify-between">
      <div className="flex items-center gap-space-sm min-w-0">
        <button
          ref={menuToggleRef}
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-drawer"
          className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
        <nav className="flex items-center gap-space-2xs font-mono-data-sm text-mono-data-sm text-outline min-w-0">
          <Link href="/" className="hover:text-on-surface transition-colors cursor-pointer shrink-0">
            TOONFORGE
          </Link>
          <span className="text-outline-variant shrink-0">/</span>
          <span className="text-secondary font-medium tracking-wide truncate">
            {getCrumb()}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-space-md shrink-0">
        <div className="flex items-center gap-space-xs">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded border border-secondary/40 bg-secondary/10 text-secondary font-mono-data-sm text-mono-data-sm tracking-wider uppercase font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            VALIDATION ACTIVE
          </span>
          <Link
            href="/research"
            className="hidden lg:inline-flex items-center gap-1 px-space-xs py-0.5 rounded border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high hover:text-on-surface text-on-surface-variant font-mono-data-sm text-mono-data-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">article</span>
            <span>Paper: arXiv:2408.0124</span>
          </Link>
        </div>
        <div className="h-4 w-px bg-outline-variant/40" />
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};