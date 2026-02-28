'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Header() {
  return (
    <header className="bg-[#006233] text-white border-b-4 border-[#FCD116]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <span className="text-lg sm:text-xl font-bold leading-tight">Tanzania Tax Tools</span>
          <span className="text-xs sm:text-sm opacity-75 hidden sm:inline">by bcassian</span>
        </Link>

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
  );
}
