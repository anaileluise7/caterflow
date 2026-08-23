import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGmailSender, sendGmail, escapeHtml } from '../../shared/gmailSend.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const inquiryId = body.inquiry_id;
    if (!inquiryId) return Response.json({ error: 'inquiry_id is required' }, { status: 400 });

    const inquiry = await base44.entities.CateringInquiry.get(inquiryId);
    if (!inquiry) return Response.json({ error: 'Inquiry not found' }, { status: 404 });
    if (!inquiry.proposal) return Response.json({ error: 'No proposal has been generated yet' }, { status: 400 });
    if (!inquiry.email) return Response.json({ error: 'This inquiry has no client email address' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const senderEmail = await getGmailSender(accessToken);

    const subject = `Your Catering Proposal from Saffron & Sage - ${inquiry.event_type || 'Event'} on ${inquiry.event_date || ''}`;
    const plainText =
      `Hi ${inquiry.name || 'there'},\n\n` +
      `Thank you for your inquiry with Saffron & Sage. Please find our proposed catering offering below.\n\n` +
      `${inquiry.proposal}\n\n` +
      `We would love to discuss the details and bring this to life for you. Just reply to this email or call us anytime.\n\n` +
      `Warm regards,\nThe Saffron & Sage Events Team`;
    const htmlBody =
      `<p>Hi ${escapeHtml(inquiry.name || 'there')},</p>` +
      `<p>Thank you for your inquiry with Saffron &amp; Sage. Please find our proposed catering offering below.</p>` +
      `<div style="white-space: pre-wrap; font-family: -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.6;">${escapeHtml(inquiry.proposal)}</div>` +
      `<p>We would love to discuss the details and bring this to life for you. Just reply to this email or call us anytime.</p>` +
      `<p>Warm regards,<br/>The Saffron &amp; Sage Events Team</p>`;

    const messageId = await sendGmail(accessToken, {
      to: inquiry.email,
      subject,
      plainText,
      htmlBody,
      senderName: 'Saffron & Sage',
      senderEmail,
    });
    try {
      await base44.entities.EmailMessage.create({
        inquiry_id: inquiryId,
        recipient: inquiry.email,
        subject,
        body: plainText,
        kind: 'Proposal',
      });
    } catch (logErr) {
      console.error('Failed to log email message:', logErr.message);
    }
    return Response.json({ success: true, messageId, sent_to: inquiry.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}