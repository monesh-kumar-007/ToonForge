'use client';

import React, { useEffect, useRef } from 'react';
import { SidebarContent } from './SidebarContent';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement>;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  returnFocusRef,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 left-0 z-50 w-sidebar-width max-w-[85vw] bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between select-none transition-[transform,visibility] duration-200 ease-out lg:hidden ${
          open ? 'translate-x-0 visible' : '-translate-x-full invisible'
        }`}
      >
        <SidebarContent onClose={onClose} closeButtonRef={closeButtonRef} />
      </aside>
    </>
  );
};