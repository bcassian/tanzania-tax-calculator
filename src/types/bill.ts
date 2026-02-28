export interface LineItem {
  id: string;
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
}

export type BillStatus = 'uploading' | 'parsing' | 'parsed' | 'error' | 'manual';

export interface Bill {
  id: string;
  vendor: string;
  date: string; // ISO format: YYYY-MM-DD
  invoiceNumber: string | null;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number | null;
  total: number;
  currency: string; // default 'TZS'
  category: string | null;
  notes: string | null;
  status: BillStatus;
  errorMessage: string | null;
  sourceFile: string | null;
  imagePreview: string | null; // base64 data URL
  createdAt: string; // ISO timestamp
}

export interface ParsedReceiptData {
  vendor: string | null;
  date: string | null;
  invoiceNumber: string | null;
  lineItems: Array<{
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    amount: number;
  }>;
  subtotal: number | null;
  taxAmount: number | null;
  taxRate: number | null;
  total: number | null;
  currency: string | null;
  category: string | null;
  notes: string | null;
}

export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel & Transport',
  'Utilities',
  'Meals & Entertainment',
  'Professional Services',
  'IT & Software',
  'Rent',
  'Marketing & Advertising',
  'Equipment',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExportFormat = 'xero' | 'quickbooks' | 'generic';
export type ExportFileType = 'csv' | 'xlsx';
