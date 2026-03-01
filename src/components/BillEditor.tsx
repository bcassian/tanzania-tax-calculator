'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Bill, LineItem } from '@/types/bill';
import { EXPENSE_CATEGORIES } from '@/types/bill';
import { createLineItem } from '@/lib/receiptParser';

interface Props {
  bill: Bill | null;
  onSave: (updated: Bill) => void;
  onClose: () => void;
}

const CURRENCIES = ['TZS', 'USD', 'EUR', 'GBP', 'KES', 'UGX', 'ZAR'];

function DocumentPreview({
  src,
  isPdf,
  alt,
  className,
}: {
  src: string;
  isPdf: boolean;
  alt: string;
  className?: string;
}) {
  if (isPdf) {
    return (
      <iframe
        src={src}
        title={alt}
        className={className}
        style={{ border: 'none' }}
      />
    );
  }
  return <img src={src} alt={alt} className={className} />;
}

export default function BillEditor({ bill, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Bill | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  useEffect(() => {
    setDraft(bill ? { ...bill, lineItems: bill.lineItems.map((i) => ({ ...i })) } : null);
    setLightboxOpen(false);
    setPreviewCollapsed(false);
  }, [bill]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      }
    },
    [lightboxOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  if (!draft) return null;

  const isPdf = draft.imagePreview?.startsWith('data:application/pdf') ?? false;
  const hasPreview = !!draft.imagePreview;

  function updateField<K extends keyof Bill>(key: K, value: Bill[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateLineItem(id: string, key: keyof LineItem, value: string | number | null) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.map((item) =>
          item.id === id ? { ...item, [key]: value } : item
        ),
      };
    });
  }

  function addLineItem() {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, lineItems: [...prev.lineItems, createLineItem()] };
    });
  }

  function removeLineItem(id: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, lineItems: prev.lineItems.filter((i) => i.id !== id) };
    });
  }

  const lineItemsTotal = draft.lineItems.reduce((sum, i) => sum + (i.amount || 0), 0);

  // When tax-inclusive, line item amounts already contain tax, so:
  //   total = lineItemsTotal (what you actually pay)
  //   subtotal = lineItemsTotal - taxAmount (the ex-tax portion)
  // When tax-exclusive:
  //   subtotal = lineItemsTotal
  //   total = lineItemsTotal + taxAmount
  const hasLineItems = draft.lineItems.length > 0;
  const computedSubtotal = hasLineItems
    ? (draft.taxInclusive ? lineItemsTotal - (draft.taxAmount || 0) : lineItemsTotal)
    : draft.subtotal;
  const computedTotal = hasLineItems
    ? (draft.taxInclusive ? lineItemsTotal : lineItemsTotal + (draft.taxAmount || 0))
    : draft.total;

  function handleSave() {
    if (!draft) return;
    onSave({
      ...draft,
      subtotal: computedSubtotal,
      total: computedTotal,
      status: draft.status === 'error' ? 'parsed' : draft.status,
    });
  }

  const inputCls =
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#F28500] focus:ring-2 focus:ring-[#F28500]/10';

  /* ── Preview panel (reused in both mobile stacked & desktop side-by-side) ── */
  const previewPanel = hasPreview ? (
    <div className="flex flex-col items-center justify-center h-full">
      <div
        className="cursor-pointer w-full h-full flex items-center justify-center"
        onClick={() => setLightboxOpen(true)}
        title="Click to expand"
      >
        <DocumentPreview
          src={draft.imagePreview!}
          isPdf={isPdf}
          alt={draft.sourceFile ?? 'Receipt preview'}
          className={
            isPdf
              ? 'w-full h-full min-h-[300px] rounded-lg'
              : 'max-w-full max-h-full object-contain rounded-lg'
          }
        />
      </div>
      <button
        onClick={() => setLightboxOpen(true)}
        className="mt-2 text-xs text-gray-400 hover:text-[#F28500] transition-colors"
      >
        Click to expand
      </button>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-300">
      <span className="text-4xl mb-2">🧾</span>
      <p className="text-xs">{draft.sourceFile ?? 'No preview available'}</p>
    </div>
  );

  /* ── Form fields ── */
  const formContent = (
    <div className="space-y-5">
      {/* Core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Vendor / Supplier</label>
          <input
            type="text"
            value={draft.vendor}
            onChange={(e) => updateField('vendor', e.target.value)}
            placeholder="e.g. Jumia Food"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Number</label>
          <input
            type="text"
            value={draft.invoiceNumber ?? ''}
            onChange={(e) => updateField('invoiceNumber', e.target.value || null)}
            placeholder="e.g. INV-001"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => updateField('date', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
          <select
            value={draft.currency}
            onChange={(e) => updateField('currency', e.target.value)}
            className={inputCls}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select
            value={draft.category ?? ''}
            onChange={(e) => updateField('category', e.target.value || null)}
            className={inputCls}
          >
            <option value="">— Select category —</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-500">Line Items</label>
          <button
            onClick={addLineItem}
            className="text-xs font-medium text-[#F28500] hover:text-[#d97400] transition-colors"
          >
            + Add row
          </button>
        </div>

        <div className="space-y-2">
          {draft.lineItems.length === 0 && (
            <p className="text-xs text-gray-400 py-2 text-center">No line items — click &quot;Add row&quot; to add one.</p>
          )}
          {draft.lineItems.map((item) => (
            <div key={item.id}>
              {/* Mobile: description + remove on first row, numbers on second row */}
              <div className="sm:hidden space-y-1.5 py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    placeholder="Description"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    onClick={() => removeLineItem(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none p-1 shrink-0"
                    title="Remove row"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="number"
                    value={item.quantity ?? ''}
                    onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Qty"
                    min="0"
                    className={`${inputCls} text-right`}
                  />
                  <input
                    type="number"
                    value={item.unitPrice ?? ''}
                    onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Price"
                    min="0"
                    className={`${inputCls} text-right`}
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateLineItem(item.id, 'amount', Number(e.target.value))}
                    placeholder="Amount"
                    min="0"
                    className={`${inputCls} text-right`}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <span className="text-xs text-gray-400 text-right">Qty</span>
                  <span className="text-xs text-gray-400 text-right">Unit price</span>
                  <span className="text-xs text-gray-400 text-right">Amount</span>
                </div>
              </div>

              {/* Desktop: all in one row */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px_80px_32px] gap-1.5 items-center">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  placeholder="Description"
                  className={inputCls}
                />
                <input
                  type="number"
                  value={item.quantity ?? ''}
                  onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Qty"
                  min="0"
                  className={`${inputCls} text-right`}
                />
                <input
                  type="number"
                  value={item.unitPrice ?? ''}
                  onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Price"
                  min="0"
                  className={`${inputCls} text-right`}
                />
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateLineItem(item.id, 'amount', Number(e.target.value))}
                  placeholder="Amount"
                  min="0"
                  className={`${inputCls} text-right`}
                />
                <button
                  onClick={() => removeLineItem(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
                  title="Remove row"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {draft.lineItems.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px_80px_32px] gap-1.5 mt-1">
            <span className="text-xs text-gray-400">Description</span>
            <span className="text-xs text-gray-400 text-right">Qty</span>
            <span className="text-xs text-gray-400 text-right">Unit price</span>
            <span className="text-xs text-gray-400 text-right">Amount</span>
            <span />
          </div>
        )}
      </div>

      {/* Tax inclusive toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.taxInclusive}
          onChange={(e) => updateField('taxInclusive', e.target.checked)}
          className="w-4 h-4 rounded accent-[#F28500]"
        />
        <span className="text-xs font-medium text-gray-500">
          Tax already included in prices
        </span>
        {draft.taxInclusive && (
          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">VAT inclusive</span>
        )}
      </label>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {draft.taxInclusive ? 'Subtotal (ex-tax)' : 'Subtotal'}{hasLineItems ? ' (auto)' : ''}
          </label>
          <input
            type="number"
            value={hasLineItems ? computedSubtotal : draft.subtotal}
            onChange={(e) => !hasLineItems && updateField('subtotal', Number(e.target.value))}
            readOnly={hasLineItems}
            min="0"
            className={`${inputCls} text-right ${hasLineItems ? 'bg-gray-50 text-gray-500' : ''}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Tax{draft.taxRate ? ` (${draft.taxRate}%)` : ''}{draft.taxInclusive ? ' (incl.)' : ''}
          </label>
          <input
            type="number"
            value={draft.taxAmount}
            onChange={(e) => updateField('taxAmount', Number(e.target.value))}
            min="0"
            className={`${inputCls} text-right`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
          <input
            type="number"
            value={hasLineItems ? computedTotal : draft.total}
            onChange={(e) => !hasLineItems && updateField('total', Number(e.target.value))}
            readOnly={hasLineItems}
            min="0"
            className={`${inputCls} text-right font-semibold ${hasLineItems ? 'bg-gray-50 text-gray-500' : ''}`}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea
          value={draft.notes ?? ''}
          onChange={(e) => updateField('notes', e.target.value || null)}
          placeholder="Any additional notes…"
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — wider on desktop when preview exists */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className={`bg-white w-full sm:rounded-2xl shadow-xl max-h-[95dvh] flex flex-col rounded-t-2xl ${
            hasPreview ? 'sm:max-w-5xl' : 'sm:max-w-2xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Edit Bill</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none p-1 -mr-1"
            >
              ✕
            </button>
          </div>

          {/* Body — split on desktop, stacked on mobile */}
          <div className="overflow-y-auto flex-1 sm:overflow-hidden">
            <div className={`h-full ${hasPreview ? 'sm:flex' : ''}`}>
              {/* Preview panel — desktop: left side; mobile: collapsible top */}
              {hasPreview && (
                <>
                  {/* Mobile: collapsible preview */}
                  <div className="sm:hidden border-b border-gray-100">
                    <button
                      onClick={() => setPreviewCollapsed(!previewCollapsed)}
                      className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      <span>Source Document</span>
                      <span className="text-gray-400">{previewCollapsed ? '▼ Show' : '▲ Hide'}</span>
                    </button>
                    {!previewCollapsed && (
                      <div className="px-5 pb-4 max-h-[40vh]">
                        {previewPanel}
                      </div>
                    )}
                  </div>

                  {/* Desktop: side panel */}
                  <div className="hidden sm:flex sm:flex-col sm:w-[40%] sm:border-r sm:border-gray-100 p-4 sm:overflow-y-auto">
                    <p className="text-xs font-medium text-gray-500 mb-3">Source Document</p>
                    <div className="flex-1 min-h-0">
                      {previewPanel}
                    </div>
                  </div>
                </>
              )}

              {/* Form panel */}
              <div
                className={`p-5 ${
                  hasPreview ? 'sm:w-[60%] sm:overflow-y-auto sm:max-h-[calc(95dvh-8rem)]' : ''
                }`}
              >
                {formContent}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-sm font-medium bg-[#F28500] text-white hover:bg-[#d97400] transition-colors
                px-5 py-2 rounded-lg"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && draft.imagePreview && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-md"
            onClick={() => setLightboxOpen(false)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white/70 hover:text-white text-2xl z-[80] transition-colors p-3 rounded-full hover:bg-white/10"
              title="Close (Esc)"
            >
              ✕
            </button>
            <DocumentPreview
              src={draft.imagePreview}
              isPdf={isPdf}
              alt={draft.sourceFile ?? 'Receipt'}
              className={
                isPdf
                  ? 'w-full h-full max-w-4xl rounded-xl bg-white'
                  : 'max-w-full max-h-full object-contain rounded-xl shadow-2xl'
              }
            />
          </div>
        </>
      )}
    </>
  );
}
