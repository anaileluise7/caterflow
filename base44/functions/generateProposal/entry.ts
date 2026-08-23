import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      name, event_date, event_type, guest_count,
      venue, budget_per_head, dietary_requirements, additional_notes
    } = body || {};

    if (!name || !event_type || !guest_count) {
      return Response.json({ error: "Missing required inquiry fields" }, { status: 400 });
    }

    const prompt = `You are the Events Director at "Saffron & Sage", a premium catering company known for seasonal, locally-sourced, beautifully presented food. Write a warm, professional catering proposal in markdown for the following inquiry. Tailor the menu and tone to the event type and guest count.

INQUIRY DETAILS:
- Client name: ${name || "there"}
- Event date: ${event_date || "TBD"}
- Event type: ${event_type}
- Guest count: ${guest_count}
- Venue / location: ${venue || "To be confirmed"}
- Budget per head: ${budget_per_head || "Not specified — suggest a suitable range"}
- Dietary requirements: ${dietary_requirements || "None specified"}
- Additional notes: ${additional_notes || "None"}

Structure the proposal with these markdown sections:
## A Personal Welcome
A warm 1-2 sentence greeting addressing the client by first name, acknowledging their ${event_type.toLowerCase()}.

## Suggested Menu
A tailored menu with:
- **Canapés** (2-3 options)
- **Starter**
- **Mains** (2 options: one meat, one fish or vegetarian)
- **Dessert**
Keep dish names evocative and seasonal.

## Investment
An estimated price per head and a total estimate for ${guest_count} guests. If no budget was given, suggest a sensible range for a ${event_type.toLowerCase()} of this size. Be transparent about what's an estimate.

## What's Included
A short bulleted list (service staff, crockery & glassware, setup & breakdown, etc.).

## Next Steps
Invite them to book a tasting, mention a confirmation timeline, and note any deposit terms.

## With Warmth
A short sign-off from the Saffron & Sage team.

Keep the whole proposal elegant, concise, and genuinely tailored — no generic filler.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
    });

    return Response.json({ proposal: typeof result === "string" ? result : String(result) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}