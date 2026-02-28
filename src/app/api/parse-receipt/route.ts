import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const PARSE_PROMPT = `You are a receipt/invoice data extraction assistant. Extract structured data from this receipt/invoice and return ONLY valid JSON with no markdown, no code fences, no explanation.

Return this exact JSON structure:
{
  "vendor": "string (business name, or null if unclear)",
  "date": "string (ISO format YYYY-MM-DD, or null if unclear)",
  "invoiceNumber": "string or null",
  "lineItems": [
    {
      "description": "string",
      "quantity": null or number,
      "unitPrice": null or number,
      "amount": number
    }
  ],
  "subtotal": null or number,
  "taxAmount": null or number,
  "taxRate": null or number,
  "total": null or number,
  "currency": "string (3-letter ISO code — use TZS for Tanzania, USD for US, etc.)",
  "category": "string (one of the allowed categories below, or null if unclear)",
  "notes": "string or null"
}

Rules:
- All monetary values must be plain numbers with no currency symbols or commas
- If you cannot determine a value with confidence, use null
- For lineItems: if the receipt shows only a total with no itemization, return one line item with the vendor/product name as description
- Date must be YYYY-MM-DD strictly; parse formats like "15 Jan 2025", "01/15/25", etc.
- Currency default is TZS for Tanzania receipts; detect from symbols (Tsh, $, £, €, KSh, UGX)
- taxRate should be a percentage value (e.g. 18 for 18% VAT), not a decimal
- category must be exactly one of: "Office Supplies", "Travel & Transport", "Utilities", "Meals & Entertainment", "Professional Services", "IT & Software", "Rent", "Marketing & Advertising", "Equipment", "Other". Infer from the vendor name, line item descriptions, and context. Use null only if truly ambiguous`;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ImageMime = (typeof IMAGE_TYPES)[number];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured', fallback: true }, { status: 503 });
  }

  let body: { fileBase64: string; mimeType: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { fileBase64, mimeType } = body;
  if (!fileBase64 || !mimeType) {
    return NextResponse.json({ error: 'Missing fileBase64 or mimeType' }, { status: 400 });
  }

  const isImage = IMAGE_TYPES.includes(mimeType as ImageMime);
  const isPdf = mimeType === 'application/pdf';

  if (!isImage && !isPdf) {
    return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 400 });
  }

  // Images use 'image' block; PDFs use 'document' block (Claude natively reads PDFs)
  const fileContent: Anthropic.MessageParam['content'][number] = isImage
    ? {
        type: 'image',
        source: { type: 'base64', media_type: mimeType as ImageMime, data: fileBase64 },
      }
    : {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
      };

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [fileContent, { type: 'text', text: PARSE_PROMPT }],
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed;
    try {
      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Unexpected response from AI model', raw: responseText },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[parse-receipt] Claude API error:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
