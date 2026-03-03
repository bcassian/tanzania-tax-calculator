import type { Metadata } from 'next';
import Link from 'next/link';
import { getDatabasePages } from '@/lib/notion';

export const revalidate = 300; // ISR — refresh every 5 minutes

export const metadata: Metadata = {
  title: 'Master Tax Guide — Tanzania Tax Tools',
  description:
    'Comprehensive reference for Tanzania tax types, rates, filing deadlines and compliance requirements.',
};

export default async function TaxGuidePage() {
  const envOk = process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID;

  if (!envOk) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Master Tax Guide</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Comprehensive reference for Tanzania tax types and rates.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
          <strong>Configuration required</strong>
          <p className="mt-1 text-amber-700">
            The tax guide is powered by Notion. Set the <code>NOTION_API_KEY</code> and{' '}
            <code>NOTION_DATABASE_ID</code> environment variables to enable this feature.
          </p>
        </div>
      </main>
    );
  }

  let pages: Awaited<ReturnType<typeof getDatabasePages>> = [];
  let error = false;

  try {
    pages = await getDatabasePages();
  } catch {
    error = true;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Master Tax Guide</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select a topic to learn more about Tanzania tax regulations.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700 mb-4">
          Unable to load guide topics. Please try again later.
        </div>
      )}

      <div className="space-y-3">
        {pages.map((page) => (
          <Link
            key={page.id}
            href={`/tax-guide/${page.id}`}
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-[#006233]/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">{page.icon}</div>
              <h2 className="text-base font-semibold text-gray-900 group-hover:text-[#006233] transition-colors">
                {page.title}
              </h2>
              <span className="ml-auto text-gray-300 group-hover:text-[#006233] transition-colors text-lg">
                ›
              </span>
            </div>
          </Link>
        ))}
      </div>

      {pages.length === 0 && !error && (
        <p className="text-sm text-gray-400 text-center py-8">
          No guide topics published yet.
        </p>
      )}
    </main>
  );
}
