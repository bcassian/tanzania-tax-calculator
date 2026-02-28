import { nanoid } from 'nanoid';
import type { Bill, LineItem, ParsedReceiptData } from '@/types/bill';
import { fileToBase64, fileToDataUrl } from '@/lib/pdfUtils';

// ─── Factory functions ────────────────────────────────────────────────────────

export function createEmptyBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: nanoid(),
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: null,
    lineItems: [],
    subtotal: 0,
    taxAmount: 0,
    taxRate: null,
    total: 0,
    currency: 'TZS',
    category: null,
    notes: null,
    status: 'manual',
    errorMessage: null,
    sourceFile: null,
    imagePreview: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: nanoid(),
    description: '',
    quantity: null,
    unitPrice: null,
    amount: 0,
    ...overrides,
  };
}

// ─── Map Claude's JSON to a Bill ─────────────────────────────────────────────

function mapParsedDataToBill(
  data: ParsedReceiptData,
  fileInfo: { name: string; preview: string | null }
): Bill {
  const lineItems: LineItem[] = (data.lineItems ?? []).map((item) => ({
    id: nanoid(),
    description: item.description ?? '',
    quantity: item.quantity ?? null,
    unitPrice: item.unitPrice ?? null,
    amount: item.amount ?? 0,
  }));

  if (lineItems.length === 0) {
    lineItems.push(
      createLineItem({ description: data.vendor ?? 'See receipt', amount: data.total ?? 0 })
    );
  }

  const total = data.total ?? 0;
  const taxAmount = data.taxAmount ?? 0;
  const subtotal = data.subtotal ?? total - taxAmount;

  return {
    id: nanoid(),
    vendor: data.vendor ?? '',
    date: data.date ?? new Date().toISOString().split('T')[0],
    invoiceNumber: data.invoiceNumber ?? null,
    lineItems,
    subtotal,
    taxAmount,
    taxRate: data.taxRate ?? null,
    total,
    currency: data.currency ?? 'TZS',
    category: null,
    notes: data.notes ?? null,
    status: 'parsed',
    errorMessage: null,
    sourceFile: fileInfo.name,
    imagePreview: fileInfo.preview,
    createdAt: new Date().toISOString(),
  };
}

// ─── Main parsing function ────────────────────────────────────────────────────

export interface ParseProgress {
  stage: 'reading' | 'parsing' | 'done' | 'error';
  message: string;
}

export async function parseFile(
  file: File,
  onProgress: (p: ParseProgress) => void
): Promise<Bill> {
  const isPdf = file.type === 'application/pdf';

  onProgress({ stage: 'reading', message: 'Reading file…' });

  // For images: generate a preview to display in the UI
  // For PDFs: Claude reads them natively — no client-side rendering needed
  const previewDataUrl = isPdf ? null : await fileToDataUrl(file);
  const fileBase64 = await fileToBase64(file);

  onProgress({ stage: 'parsing', message: 'Extracting data with AI…' });

  const res = await fetch('/api/parse-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64, mimeType: file.type }),
  });

  if (res.status === 503) {
    // No API key configured
    onProgress({ stage: 'done', message: 'No API key' });
    return createEmptyBill({
      status: 'error',
      errorMessage: 'No ANTHROPIC_API_KEY configured. Add it to your Vercel environment variables.',
      sourceFile: file.name,
      imagePreview: previewDataUrl,
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const { data } = await res.json();
  onProgress({ stage: 'done', message: 'Done' });
  return mapParsedDataToBill(data as ParsedReceiptData, { name: file.name, preview: previewDataUrl });
}
