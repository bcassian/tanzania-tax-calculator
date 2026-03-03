import type { Metadata } from 'next';
import Link from 'next/link';
import { getDatabasePages } from '@/lib/notion';

export const metadata: Metadata = {
  title: 'Tanzania Master Tax Guide — Tax Tools',
  description:
    'Comprehensive Tanzania tax reference — income tax, VAT, withholding, stamp duty, customs, and more.',
};

// Revalidate every 5 minutes so Notion edits appear without redeployment
export const revalidate = 300;

export default async function TaxGuidePage() {
  let pages;
  let error = false;

  try {
    pages = await getDatabasePages();
  } catch {
    error = true;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Tanzania Master Tax Guide
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Comprehensive reference for Tanzania tax law. View only — updated
          automatically from Notion.
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-4">
          <strong>Unable to load guide.</strong> Please check that the{' '}
          <code className="font-mono text-xs bg-amber-100 px-1 rounded">
            NOTION_API_KEY
          </code>{' '}
          and{' '}
          <code className="font-mono text-xs bg-amber-100 px-1 rounded">
            NOTION_DATABASE_ID
          </code>{' '}
          environment variables are set correctly.
        </div>
      )}

      {pages && pages.length > 0 && (
        <div className="space-y-2">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={`/tax-guide/${page.id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-[#006233]/30 transition-all group"
            >
              <span className="text-xl shrink-0">
                {page.icon ?? '📄'}
              </span>
              <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 group-hover:text-[#006233] transition-colors truncate">
                {page.title}
              </span>
              <span className="text-gray-300 group-hover:text-[#006233] transition-colors text-lg shrink-0">
                ›
              </span>
            </Link>
          ))}
        </div>
      )}

      {pages && pages.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">
          No sections found. Make sure the Notion database has been shared with
          the integration.
        </p>
      )}
    </main>
  );
}
