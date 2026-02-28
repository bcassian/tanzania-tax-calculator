import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const PARSE_PROMPT = `You are a receipt/invoice data extraction assistant. Extract structured data from this receipt/invoice image and return ONLY valid JSON with no markdown, no code fences, no explanation.

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
  "notes": "string or null"
}

Rules:
- All monetary values must be plain numbers with no currency symbols or commas
- If you cannot determine a value with confidence, use null
- For lineItems: if the receipt shows only a total with no itemization, return one line item with the vendor/product name as description
- Date must be YYYY-MM-DD strictly; parse date formats like "15 Jan 2025", "01/15/25", etc.
- Currency default is TZS for Tanzania receipts; detect from currency symbols (Tsh, $, £, €, KSh, UGX)
- taxRate should be a percentage value (e.g. 18 for 18% VAT), not a decimal`;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured', fallback: true }, { status: 503 });
  }

  let body: { imageBase64: string; mimeType: string; textContent?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { imageBase64, mimeType, textContent } = body;

  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: 'Missing imageBase64 or mimeType' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
  type AllowedMime = (typeof allowedTypes)[number];
  if (!allowedTypes.includes(mimeType as AllowedMime)) {
    return NextResponse.json({ error: `Unsupported image type: ${mimeType}` }, { status: 400 });
  }

  const userContent: Anthropic.MessageParam['content'] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mimeType as AllowedMime,
        data: imageBase64,
      },
    },
  ];

  if (textContent && textContent.length > 50) {
    userContent.push({
      type: 'text',
      text: `Additional text extracted from document (use to improve accuracy):\n${textContent.slice(0, 2000)}`,
    });
  }

  userContent.push({ type: 'text', text: PARSE_PROMPT });

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: userContent }],
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
