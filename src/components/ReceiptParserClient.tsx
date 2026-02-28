'use client';

import { useEffect, useState } from 'react';
import type { Bill } from '@/types/bill';
import { parseFile, createEmptyBill } from '@/lib/receiptParser';
import ReceiptUploader from '@/components/ReceiptUploader';
import BillsList from '@/components/BillsList';
import BillEditor from '@/components/BillEditor';

const STORAGE_KEY = 'receipt-parser-bills';
const MAX_STORED_BILLS = 50;

function loadBillsFromStorage(): Bill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBillsToStorage(bills: Bill[]) {
  try {
    // Truncate to latest N to respect localStorage limits
    const toStore = bills.slice(-MAX_STORED_BILLS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage may be full — silently ignore
  }
}

export default function ReceiptParserClient() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'configured' | 'missing'>('unknown');

  // Hydrate from localStorage after mount
  useEffect(() => {
    setBills(loadBillsFromStorage());
    setIsHydrated(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (isHydrated) saveBillsToStorage(bills);
  }, [bills, isHydrated]);

  // Probe API key status once
  useEffect(() => {
    fetch('/api/parse-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => {
        setApiKeyStatus(data.fallback === true ? 'missing' : 'configured');
      })
      .catch(() => setApiKeyStatus('missing'));
  }, []);

  function updateBill(updated: Bill) {
    setBills((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function deleteBill(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }

  function deleteSelected(ids: string[]) {
    const idSet = new Set(ids);
    setBills((prev) => prev.filter((b) => !idSet.has(b.id)));
  }

  async function processFiles(files: File[]) {
    // Add placeholder bills immediately so user sees progress
    const placeholders: Bill[] = files.map((file) =>
      createEmptyBill({
        status: 'uploading',
        sourceFile: file.name,
      })
    );

    setBills((prev) => [...prev, ...placeholders]);

    // Process sequentially to avoid overwhelming the API
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const placeholder = placeholders[i];

      // Set to parsing
      setBills((prev) =>
        prev.map((b) => (b.id === placeholder.id ? { ...b, status: 'parsing' } : b))
      );

      try {
        const parsed = await parseFile(file, (progress) => {
          setBills((prev) =>
            prev.map((b) =>
              b.id === placeholder.id
                ? { ...b, status: progress.stage === 'error' ? 'error' : 'parsing' }
                : b
            )
          );
        });

        // Replace placeholder with parsed bill (keep placeholder id for list stability)
        setBills((prev) =>
          prev.map((b) => (b.id === placeholder.id ? { ...parsed, id: placeholder.id } : b))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Parsing failed';
        setBills((prev) =>
          prev.map((b) =>
            b.id === placeholder.id ? { ...b, status: 'error', errorMessage: message } : b
          )
        );
      }
    }
  }

  function addManualBill() {
    const blank = createEmptyBill();
    setBills((prev) => [...prev, blank]);
    setEditingBill(blank);
  }

  if (!isHydrated) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#F28500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* API key status banner */}
      {apiKeyStatus === 'missing' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>OCR mode:</strong> No Anthropic API key detected. Receipts will be parsed with
          open-source OCR (Tesseract.js) — text will be extracted but fields won&apos;t be
          auto-filled. To enable AI parsing, add <code className="font-mono text-xs bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to
          your <code className="font-mono text-xs bg-amber-100 px-1 rounded">.env.local</code> file.
        </div>
      )}
      {apiKeyStatus === 'configured' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          ✓ AI parsing ready — Claude will extract vendor, date, line items and totals automatically.
        </div>
      )}

      {/* Upload zone */}
      <ReceiptUploader onFilesSelected={processFiles} />

      {/* Manual add */}
      <div className="flex justify-end">
        <button
          onClick={addManualBill}
          className="text-sm font-medium text-[#F28500] hover:text-[#d97400] transition-colors flex items-center gap-1"
        >
          <span className="text-base leading-none">+</span> Add bill manually
        </button>
      </div>

      {/* Bills list */}
      <BillsList
        bills={bills}
        onEdit={setEditingBill}
        onDelete={deleteBill}
        onDeleteSelected={deleteSelected}
      />

      {/* Empty state */}
      {bills.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No bills yet. Upload a receipt or add one manually.
        </div>
      )}

      {/* Clear all (when there are bills) */}
      {bills.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              if (confirm('Clear all bills? This cannot be undone.')) setBills([]);
            }}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Clear all bills
          </button>
        </div>
      )}

      {/* Editor modal */}
      <BillEditor
        bill={editingBill}
        onSave={(updated) => {
          updateBill(updated);
          setEditingBill(null);
        }}
        onClose={() => setEditingBill(null)}
      />
    </div>
  );
}
