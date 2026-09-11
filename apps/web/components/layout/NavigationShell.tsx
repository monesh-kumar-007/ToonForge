'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';

interface NavigationShellProps {
  children: React.ReactNode;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <Sidebar />
      <div className="pl-0 lg:pl-sidebar-width min-h-screen flex flex-col">
        <Header
          onMenuClick={openMenu}
          menuOpen={menuOpen}
          menuToggleRef={menuToggleRef}
        />
        <main className="w-full pt-16 bg-surface flex-1">
          {children}
        </main>
      </div>
      <MobileDrawer
        open={menuOpen}
        onClose={closeMenu}
        returnFocusRef={menuToggleRef}
      />
    </>
  );
};