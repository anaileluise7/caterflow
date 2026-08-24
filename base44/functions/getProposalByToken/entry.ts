import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public, read-only proposal lookup by share token.
// No user auth: anyone with the token can view the client-facing fields only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const token = (body.token || "").trim();
    if (!token || token.length < 8) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const inquiries = await base44.asServiceRole.entities.CateringInquiry.filter({ share_token: token });
    const inquiry = inquiries && inquiries[0];
    if (!inquiry) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    return Response.json({
      name: inquiry.name,
      event_date: inquiry.event_date,
      event_type: inquiry.event_type,
      guest_count: inquiry.guest_count,
      venue: inquiry.venue,
      budget_per_head: inquiry.budget_per_head,
      dietary_requirements: inquiry.dietary_requirements,
      additional_notes: inquiry.additional_notes,
      proposal: inquiry.proposal,
      status: inquiry.status
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}