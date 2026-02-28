'use client';

import type { Bill } from '@/types/bill';

interface Props {
  bill: Bill;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function StatusBadge({ status, errorMessage }: Pick<Bill, 'status' | 'errorMessage'>) {
  if (status === 'uploading' || status === 'parsing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
        <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        {status === 'uploading' ? 'Uploading…' : 'Parsing…'}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span title={errorMessage ?? undefined} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
        ✗ Error
      </span>
    );
  }
  if (status === 'manual') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
        Manual
      </span>
    );
  }
  // 'parsed' — check if vendor/date are filled
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
      ✓ Parsed
    </span>
  );
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: currency || 'TZS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BillCard({ bill, selected, onToggleSelect, onEdit, onDelete }: Props) {
  const isProcessing = bill.status === 'uploading' || bill.status === 'parsing';

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-colors
      ${selected ? 'border-[#F28500] ring-2 ring-[#F28500]/20' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={isProcessing}
          className="mt-0.5 w-4 h-4 rounded accent-[#F28500] cursor-pointer shrink-0"
        />

        {/* Thumbnail */}
        {bill.imagePreview ? (
          bill.imagePreview.startsWith('data:application/pdf') ? (
            <div className="w-14 h-16 rounded-md border border-gray-100 shrink-0 overflow-hidden bg-white relative">
              <object
                data={bill.imagePreview}
                type="application/pdf"
                className="w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none"
              >
                <div className="w-14 h-16 flex items-center justify-center text-xl">📄</div>
              </object>
            </div>
          ) : (
            <img
              src={bill.imagePreview}
              alt={bill.sourceFile ?? 'Receipt'}
              className="w-14 h-16 object-cover rounded-md border border-gray-100 shrink-0"
            />
          )
        ) : (
          <div className="w-14 h-16 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0">
            {bill.sourceFile?.endsWith('.pdf') ? '📄' : '🧾'}
          </div>
        )}

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {bill.vendor || <span className="text-gray-400 font-normal italic">No vendor</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {bill.date || '—'} {bill.invoiceNumber ? `· ${bill.invoiceNumber}` : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-900">{fmt(bill.total, bill.currency)}</p>
              {bill.taxAmount > 0 && (
                <p className="text-xs text-gray-400">Tax: {fmt(bill.taxAmount, bill.currency)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <StatusBadge status={bill.status} errorMessage={bill.errorMessage} />
              {bill.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {bill.category}
                </span>
              )}
              {bill.sourceFile && (
                <span className="text-xs text-gray-400 truncate max-w-[120px]" title={bill.sourceFile}>
                  {bill.sourceFile}
                </span>
              )}
            </div>

            {!isProcessing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onEdit}
                  className="text-xs font-medium text-[#F28500] hover:text-[#d97400] transition-colors"
                >
                  Edit
                </button>
                <span className="text-gray-200">|</span>
                <button
                  onClick={onDelete}
                  className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Error message */}
          {bill.status === 'error' && bill.errorMessage && (
            <p className="text-xs text-red-500 mt-1">{bill.errorMessage}</p>
          )}

          {/* Line items preview (collapsed) */}
          {bill.lineItems.length > 0 && bill.status !== 'uploading' && bill.status !== 'parsing' && (
            <div className="mt-2 pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-400">
                {bill.lineItems.length} line item{bill.lineItems.length !== 1 ? 's' : ''}
                {bill.lineItems[0]?.description ? ` · ${bill.lineItems[0].description}` : ''}
                {bill.lineItems.length > 1 ? '…' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
