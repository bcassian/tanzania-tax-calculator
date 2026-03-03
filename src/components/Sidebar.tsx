'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import SidebarNavItem from './SidebarNavItem';
import SidebarGuideSection from './SidebarGuideSection';
import { NAV_TOOLS } from '@/lib/navConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Body scroll lock + focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Delay focus to after transition
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          data-sidebar-backdrop
          className="fixed inset-0 z-[54] bg-black/30 backdrop-blur-sm print:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <nav
        data-sidebar
        className={`fixed inset-y-0 left-0 z-[55] w-72 bg-white shadow-xl flex flex-col
          transform transition-transform duration-300 ease-in-out print:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div>
            <span className="text-base font-bold text-gray-900">Tanzania Tax Tools</span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Close menu"
            tabIndex={isOpen ? 0 : -1}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* Tools section */}
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Tools
          </div>

          <div className="space-y-0.5 mb-2">
            <SidebarNavItem
              href="/"
              icon="🏠"
              label="Home"
              active={pathname === '/'}
              onClick={onClose}
            />
            {NAV_TOOLS.map((tool) => (
              <SidebarNavItem
                key={tool.shortTitle}
                href={tool.href}
                icon={tool.icon}
                label={tool.shortTitle}
                badge={tool.badge}
                active={isActive(tool.href)}
                disabled={tool.disabled}
                onClick={onClose}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="mx-4 my-2 border-t border-gray-100" />

          {/* Tax Guide section */}
          <SidebarGuideSection
            currentPath={pathname}
            onNavigate={onClose}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          by bcassian
        </div>
      </nav>
    </>
  );
}
