import type { Metadata } from 'next';
import ReceiptParserClient from '@/components/ReceiptParserClient';

export const metadata: Metadata = {
  title: 'Receipt & Invoice Parser — Tanzania Tax Tools',
  description:
    'Upload photos or PDFs of receipts and invoices. Extract vendor, date, line items and totals automatically. Export to Xero or QuickBooks CSV.',
};

export default function ReceiptParserPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Receipt &amp; Invoice Parser</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload receipt photos or PDFs — AI extracts the details for you to review, edit, and
          export to your accounting software.
        </p>
      </div>

      <ReceiptParserClient />
    </main>
  );
}
