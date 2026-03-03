'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Sidebar from './Sidebar';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="bg-[#F28500] text-white border-b-4 border-[#FCD116]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/15 transition-colors print:hidden"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h14M4 11h14M4 16h14" />
              </svg>
            </button>
            <Link href="/" className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-lg sm:text-xl font-bold leading-tight">Tanzania Tax Tools</span>
              <span className="text-xs sm:text-sm opacity-75 hidden sm:inline">by bcassian</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
