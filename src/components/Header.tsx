'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Sidebar from './Sidebar';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="border-b-4 border-[#FCD116] bg-[#F28500] text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="-ml-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-colors hover:bg-white/15 print:hidden"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h14M4 11h14M4 16h14" />
              </svg>
            </button>
            <Link href="/" className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-lg font-bold leading-tight sm:text-xl">Tanzania Tax Tools</span>
              <span className="hidden text-xs opacity-75 sm:inline sm:text-sm">by bcassian</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="min-h-[44px] rounded-xl bg-white/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/20">
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
