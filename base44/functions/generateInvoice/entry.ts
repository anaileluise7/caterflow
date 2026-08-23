import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { inquiry_id } = body || {};
    if (!inquiry_id) return Response.json({ error: 'Missing inquiry_id' }, { status: 400 });

    const inquiry = await base44.entities.CateringInquiry.get(inquiry_id);
    if (!inquiry) return Response.json({ error: 'Inquiry not found' }, { status: 404 });
    if (!inquiry.proposal) return Response.json({ error: 'No proposal to invoice from' }, { status: 400 });

    const prompt = `You are the finance lead at "Saffron & Sage", a premium UK catering company. Convert the catering proposal below into a formal invoice. All amounts in GBP (£).

INQUIRY:
- Client: ${inquiry.name || ''}
- Event type: ${inquiry.event_type || ''}
- Event date: ${inquiry.event_date || ''}
- Venue: ${inquiry.venue || ''}
- Guest count: ${inquiry.guest_count || 0}

PROPOSAL:
${inquiry.proposal}

Produce a clean invoice with 3-6 line items covering the menu and service (e.g. canapés, starter, main, dessert, service staff & equipment). Derive unit prices and quantities from the proposal's investment section and the guest count so the line items sum to the quoted total. Apply UK VAT at 20% on the subtotal. Return strictly valid JSON matching the schema, no markdown.`;

    const schema = {
      type: "object",
      properties: {
        invoice_number: { type: "string" },
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unit_price: { type: "number" },
              amount: { type: "number" }
            },
            required: ["description", "quantity", "unit_price", "amount"]
          }
        },
        subtotal: { type: "number" },
        tax_rate: { type: "number" },
        tax_amount: { type: "number" },
        total: { type: "number" },
        payment_terms: { type: "string" },
        notes: { type: "string" }
      },
      required: ["invoice_number", "line_items", "subtotal", "tax_rate", "tax_amount", "total", "payment_terms"]
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });

    return Response.json({ invoice: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}