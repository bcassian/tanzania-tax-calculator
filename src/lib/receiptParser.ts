import { nanoid } from 'nanoid';
import type { Bill, LineItem, ParsedReceiptData } from '@/types/bill';
import { pdfToImages, fileToDataUrl, dataUrlToBase64, dataUrlMimeType } from '@/lib/pdfUtils';

// ─── Factory functions ───────────────────────────────────────────────────────

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

// ─── Claude Vision path ───────────────────────────────────────────────────────

async function parseWithClaude(
  imageBase64: string,
  mimeType: string,
  textContent?: string
): Promise<ParsedReceiptData> {
  const res = await fetch('/api/parse-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, textContent }),
  });

  if (res.status === 503) {
    throw new Error('NO_API_KEY');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const { data } = await res.json();
  return data as ParsedReceiptData;
}

// ─── Tesseract fallback ───────────────────────────────────────────────────────

async function parseWithTesseract(imageDataUrl: string): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(imageDataUrl);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

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

  let imageDataUrl: string;
  let mimeType: string;
  let textContent: string | undefined;
  let previewDataUrl: string | null = null;

  if (isPdf) {
    const pages = await pdfToImages(file, 1); // first page only for receipts
    if (pages.length === 0) throw new Error('Could not extract any pages from PDF.');
    imageDataUrl = pages[0].dataUrl;
    mimeType = 'image/jpeg';
    textContent = pages[0].textContent || undefined;
    previewDataUrl = imageDataUrl;
  } else {
    imageDataUrl = await fileToDataUrl(file);
    mimeType = dataUrlMimeType(imageDataUrl);
    previewDataUrl = imageDataUrl;
  }

  const imageBase64 = dataUrlToBase64(imageDataUrl);

  onProgress({ stage: 'parsing', message: 'Extracting data…' });

  try {
    const parsed = await parseWithClaude(imageBase64, mimeType, textContent);
    onProgress({ stage: 'done', message: 'Done' });
    return mapParsedDataToBill(parsed, { name: file.name, preview: previewDataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === 'NO_API_KEY') {
      // Fall back to Tesseract — returns raw text, user fills fields manually
      onProgress({ stage: 'parsing', message: 'Using open-source OCR…' });
      const rawText = await parseWithTesseract(imageDataUrl);
      onProgress({ stage: 'done', message: 'Done (OCR mode)' });

      return createEmptyBill({
        status: 'parsed',
        sourceFile: file.name,
        imagePreview: previewDataUrl,
        notes: rawText.trim() || 'No text could be extracted.',
        // Leave vendor/date/etc blank for manual entry
      });
    }

    throw err;
  }
}
