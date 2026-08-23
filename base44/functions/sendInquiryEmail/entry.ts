import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGmailSender, sendGmail, escapeHtml } from '../../shared/gmailSend.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const inquiryId = body.inquiry_id;
    const subject = (body.subject || '').trim();
    const messageBody = body.body || '';
    if (!inquiryId) return Response.json({ error: 'inquiry_id is required' }, { status: 400 });
    if (!subject) return Response.json({ error: 'subject is required' }, { status: 400 });
    if (!messageBody.trim()) return Response.json({ error: 'body is required' }, { status: 400 });

    const inquiry = await base44.entities.CateringInquiry.get(inquiryId);
    if (!inquiry) return Response.json({ error: 'Inquiry not found' }, { status: 404 });
    if (!inquiry.email) return Response.json({ error: 'This inquiry has no client email address' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const senderEmail = await getGmailSender(accessToken);
    const htmlBody = `<div style="white-space: pre-wrap; font-family: -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.6;">${escapeHtml(messageBody)}</div>`;
    const messageId = await sendGmail(accessToken, {
      to: inquiry.email,
      subject,
      plainText: messageBody,
      htmlBody,
      senderName: 'Saffron & Sage',
      senderEmail,
    });
    return Response.json({ success: true, messageId, sent_to: inquiry.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}