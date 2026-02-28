import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/Header';
import './globals.css';

// Clerk requires SSR — disable static prerendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tanzania Tax Tools',
  description: 'PAYE, NSSF, SDL & WCF calculators for Tanzania — 2025/2026',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TZ Tax',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#006233',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#f0f4f0] min-h-screen">
          <Header />
          {children}
          <footer className="text-center py-4 px-4 text-xs text-gray-400 leading-relaxed">
            Based on TRA rates for 2025/2026. For official rates visit{' '}
            <a
              href="https://www.tra.go.tz/index.php/tax-tables"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#006233] underline-offset-2 hover:underline"
            >
              tra.go.tz
            </a>
            .<br />
            This calculator is for informational purposes only and does not constitute tax advice.
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
