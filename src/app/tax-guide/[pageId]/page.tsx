import type { Metadata } from 'next';
import Link from 'next/link';
import { getPage, getPageBlocks } from '@/lib/notion';
import { NotionBlocks } from '@/components/NotionBlockRenderer';

// Revalidate every 5 minutes so Notion edits appear without redeployment
export const revalidate = 300;

// ── Dynamic metadata ────────────────────────────────────────────────────────

type PageProps = { params: Promise<{ pageId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { pageId } = await params;
  try {
    const page = await getPage(pageId);
    return {
      title: `${page.title} — Tanzania Master Tax Guide`,
      description: `Read about ${page.title} in the Tanzania Master Tax Guide.`,
    };
  } catch {
    return { title: 'Section Not Found — Tanzania Master Tax Guide' };
  }
}

// ── Page component ──────────────────────────────────────────────────────────

export default async function TaxGuideSection({
  params,
}: PageProps) {
  const { pageId } = await params;

  let page;
  let blocks;
  let error = false;

  try {
    [page, blocks] = await Promise.all([
      getPage(pageId),
      getPageBlocks(pageId),
    ]);
  } catch {
    error = true;
  }

  if (error || !page || !blocks) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href="/tax-guide"
          className="inline-flex items-center gap-1 text-sm text-[#F28500] hover:text-[#d97400] transition-colors mb-6"
        >
          ← Back to guide
        </Link>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>Section not found.</strong> This section may have been removed
          or the link may be outdated.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back link */}
      <Link
        href="/tax-guide"
        className="inline-flex items-center gap-1 text-sm text-[#F28500] hover:text-[#d97400] transition-colors mb-6"
      >
        ← Back to guide
      </Link>

      {/* Page title */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        {page.icon && <span className="mr-2">{page.icon}</span>}
        {page.title}
      </h1>
      <p className="text-xs text-gray-400 mb-6">
        View only · Updated from Notion
      </p>

      {/* Rendered Notion content */}
      <article className="space-y-3">
        <NotionBlocks blocks={blocks} />
      </article>
    </main>
  );
}
