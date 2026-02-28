'use client';

import { useEffect, useState } from 'react';
import type { Bill, LineItem } from '@/types/bill';
import { EXPENSE_CATEGORIES } from '@/types/bill';
import { createLineItem } from '@/lib/receiptParser';

interface Props {
  bill: Bill | null;
  onSave: (updated: Bill) => void;
  onClose: () => void;
}

const CURRENCIES = ['TZS', 'USD', 'EUR', 'GBP', 'KES', 'UGX', 'ZAR'];

export default function BillEditor({ bill, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Bill | null>(null);

  useEffect(() => {
    setDraft(bill ? { ...bill, lineItems: bill.lineItems.map((i) => ({ ...i })) } : null);
  }, [bill]);

  if (!draft) return null;

  function updateField<K extends keyof Bill>(key: K, value: Bill[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  // Line item helpers
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

  // Auto-recalculate subtotal from line items
  const lineItemsTotal = draft.lineItems.reduce((sum, i) => sum + (i.amount || 0), 0);

  function handleSave() {
    if (!draft) return;
    const subtotal = draft.lineItems.length > 0 ? lineItemsTotal : draft.subtotal;
    const total = subtotal + (draft.taxAmount || 0);
    onSave({ ...draft, subtotal, total, status: draft.status === 'error' ? 'parsed' : draft.status });
  }

  const inputCls =
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#F28500] focus:ring-2 focus:ring-[#F28500]/10';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-xl max-h-[95dvh] flex flex-col rounded-t-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Edit Bill</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {/* Image preview */}
            {draft.imagePreview && (
              <div className="flex justify-center">
                <img
                  src={draft.imagePreview}
                  alt="Receipt preview"
                  className="max-h-40 rounded-lg border border-gray-100 object-contain"
                />
              </div>
            )}

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
                  <p className="text-xs text-gray-400 py-2 text-center">No line items — click "Add row" to add one.</p>
                )}
                {draft.lineItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_80px_80px_80px_32px] gap-1.5 items-center">
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
                ))}
              </div>

              {/* Column labels */}
              {draft.lineItems.length > 0 && (
                <div className="grid grid-cols-[1fr_80px_80px_80px_32px] gap-1.5 mt-1">
                  <span className="text-xs text-gray-400">Description</span>
                  <span className="text-xs text-gray-400 text-right">Qty</span>
                  <span className="text-xs text-gray-400 text-right">Unit price</span>
                  <span className="text-xs text-gray-400 text-right">Amount</span>
                  <span />
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Subtotal{draft.lineItems.length > 0 ? ' (auto)' : ''}
                </label>
                <input
                  type="number"
                  value={draft.lineItems.length > 0 ? lineItemsTotal : draft.subtotal}
                  onChange={(e) => draft.lineItems.length === 0 && updateField('subtotal', Number(e.target.value))}
                  readOnly={draft.lineItems.length > 0}
                  min="0"
                  className={`${inputCls} text-right ${draft.lineItems.length > 0 ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Tax{draft.taxRate ? ` (${draft.taxRate}%)` : ''}
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
                  value={draft.lineItems.length > 0 ? lineItemsTotal + draft.taxAmount : draft.total}
                  onChange={(e) => draft.lineItems.length === 0 && updateField('total', Number(e.target.value))}
                  readOnly={draft.lineItems.length > 0}
                  min="0"
                  className={`${inputCls} text-right font-semibold ${draft.lineItems.length > 0 ? 'bg-gray-50 text-gray-500' : ''}`}
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
    </>
  );
}
