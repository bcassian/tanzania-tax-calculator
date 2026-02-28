// Client-side only — only import from 'use client' components/contexts.
// pdfjs-dist uses browser APIs (canvas, Web Workers).

import type { PDFDocumentProxy } from 'pdfjs-dist';

type PdfjsLib = typeof import('pdfjs-dist');
let pdfjsLib: PdfjsLib | null = null;

async function getPdfJs(): Promise<PdfjsLib> {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
  return pdfjsLib;
}

async function renderPageToDataUrl(pdf: PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.5 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

async function extractPageText(pdf: PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  return textContent.items
    .filter((item) => 'str' in item)
    .map((item) => (item as { str: string }).str)
    .join(' ')
    .trim();
}

export interface PdfPageResult {
  pageNum: number;
  dataUrl: string;
  textContent: string;
}

export async function pdfToImages(file: File, maxPages = 3): Promise<PdfPageResult[]> {
  const lib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  let pdf: PDFDocumentProxy;
  try {
    pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    throw new Error(
      err instanceof Error && err.message.includes('password')
        ? 'This PDF is password-protected. Please remove the password before uploading.'
        : 'Could not read this PDF file. It may be corrupted or in an unsupported format.'
    );
  }

  const pagesToProcess = Math.min(pdf.numPages, maxPages);
  const results: PdfPageResult[] = [];

  for (let i = 1; i <= pagesToProcess; i++) {
    const [dataUrl, textContent] = await Promise.all([
      renderPageToDataUrl(pdf, i),
      extractPageText(pdf, i),
    ]);
    results.push({ pageNum: i, dataUrl, textContent });
  }

  return results;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1];
}

export function dataUrlMimeType(dataUrl: string): string {
  return dataUrl.split(';')[0].split(':')[1];
}
