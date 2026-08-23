import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function b64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: authHeader });
    if (!profileRes.ok) {
      const detail = await profileRes.text();
      return Response.json({ error: 'Could not resolve Gmail account', detail }, { status: 502 });
    }
    const profile = await profileRes.json();
    const senderEmail = profile.emailAddress;

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

    const boundary = 'saffronsage_' + Math.random().toString(36).slice(2);
    const message = [
      `From: Saffron & Sage <${senderEmail}>`,
      `To: ${inquiry.email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64url(plainText),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64url(htmlBody),
      `--${boundary}--`,
      '',
    ].join('\r\n');
    const raw = b64url(message);

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });
    if (!sendRes.ok) {
      const detail = await sendRes.text();
      return Response.json({ error: 'Gmail could not send the message', detail }, { status: 502 });
    }
    const sent = await sendRes.json();
    return Response.json({ success: true, messageId: sent.id, sent_to: inquiry.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}