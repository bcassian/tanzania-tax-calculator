import type { Bill, ExportFormat, ExportFileType } from '@/types/bill';

// ─── Xero Bills CSV format ────────────────────────────────────────────────────
// Reference: https://central.xero.com/s/article/Import-invoices-or-bills

function toXeroRows(bills: Bill[]): string[][] {
  const header = [
    'ContactName',
    'EmailAddress',
    'InvoiceDate',
    'DueDate',
    'InvoiceNumber',
    'Reference',
    'Description',
    'Quantity',
    'UnitAmount',
    'AccountCode',
    'TaxType',
    'Currency',
  ];

  const rows: string[][] = [header];

  for (const bill of bills) {
    const date = bill.date || '';
    const items = bill.lineItems.length > 0 ? bill.lineItems : [{ description: '', quantity: null, unitPrice: null, amount: bill.total }];

    items.forEach((item, idx) => {
      rows.push([
        bill.vendor || '',
        '', // EmailAddress — leave blank
        formatDateXero(date),
        formatDateXero(date), // DueDate same as invoice date
        idx === 0 ? (bill.invoiceNumber ?? '') : '', // only on first row
        '', // Reference
        item.description || '',
        item.quantity != null ? String(item.quantity) : '1',
        item.unitPrice != null ? String(item.unitPrice) : String(item.amount),
        '400', // AccountCode — default purchases account
        bill.taxAmount > 0 ? 'Tax Inclusive' : 'Tax Exclusive',
        bill.currency || 'TZS',
      ]);
    });
  }

  return rows;
}

// ─── QuickBooks CSV format ────────────────────────────────────────────────────

function toQuickBooksRows(bills: Bill[]): string[][] {
  const header = [
    'Vendor',
    'TxnDate',
    'RefNumber',
    'Account',
    'Memo',
    'Description',
    'Quantity',
    'Rate',
    'Amount',
    'Currency',
  ];

  const rows: string[][] = [header];

  for (const bill of bills) {
    const items = bill.lineItems.length > 0 ? bill.lineItems : [{ description: '', quantity: null, unitPrice: null, amount: bill.total }];

    items.forEach((item, idx) => {
      rows.push([
        bill.vendor || '',
        formatDateUS(bill.date),
        idx === 0 ? (bill.invoiceNumber ?? '') : '',
        'Accounts Payable',
        bill.notes ?? '',
        item.description || '',
        item.quantity != null ? String(item.quantity) : '1',
        item.unitPrice != null ? String(item.unitPrice) : String(item.amount),
        String(item.amount),
        bill.currency || 'TZS',
      ]);
    });
  }

  return rows;
}

// ─── Generic CSV format ───────────────────────────────────────────────────────

function toGenericRows(bills: Bill[]): string[][] {
  const header = [
    'ID',
    'Vendor',
    'Date',
    'InvoiceNumber',
    'Subtotal',
    'Tax',
    'Total',
    'Currency',
    'Category',
    'LineItems',
    'Notes',
  ];

  const rows: string[][] = [header];

  for (const bill of bills) {
    rows.push([
      bill.id,
      bill.vendor || '',
      bill.date || '',
      bill.invoiceNumber ?? '',
      String(bill.subtotal),
      String(bill.taxAmount),
      String(bill.total),
      bill.currency || 'TZS',
      bill.category ?? '',
      bill.lineItems.map((i) => i.description).join('; '),
      bill.notes ?? '',
    ]);
  }

  return rows;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatDateXero(isoDate: string): string {
  // Xero accepts DD/MM/YYYY
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateUS(isoDate: string): string {
  // QuickBooks: MM/DD/YYYY
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${m}/${d}/${y}`;
}

// ─── CSV serialisation ────────────────────────────────────────────────────────

function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          // Wrap in quotes if cell contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

// ─── Excel serialisation (via xlsx / SheetJS) ─────────────────────────────────

async function rowsToXlsx(rows: string[][], sheetName: string): Promise<Blob> {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportBills(
  bills: Bill[],
  format: ExportFormat,
  fileType: ExportFileType
): Promise<void> {
  let rows: string[][];
  let filename: string;

  switch (format) {
    case 'xero':
      rows = toXeroRows(bills);
      filename = `receipts-xero.${fileType}`;
      break;
    case 'quickbooks':
      rows = toQuickBooksRows(bills);
      filename = `receipts-quickbooks.${fileType}`;
      break;
    default:
      rows = toGenericRows(bills);
      filename = `receipts.${fileType}`;
  }

  let blob: Blob;
  if (fileType === 'xlsx') {
    const sheetName = format === 'xero' ? 'Xero Bills' : format === 'quickbooks' ? 'QuickBooks Bills' : 'Receipts';
    blob = await rowsToXlsx(rows, sheetName);
  } else {
    blob = new Blob([rowsToCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
