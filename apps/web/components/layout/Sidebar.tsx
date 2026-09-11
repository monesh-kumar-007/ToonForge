'use client';

import React from 'react';
import { SidebarContent } from './SidebarContent';

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex-col justify-between select-none hidden lg:flex">
      <SidebarContent />
    </aside>
  );
};