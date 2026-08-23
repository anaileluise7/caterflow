export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function b64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function getGmailSender(accessToken) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Could not resolve Gmail account: ${detail}`);
  }
  const profile = await res.json();
  return profile.emailAddress;
}

export async function sendGmail(accessToken, { to, subject, plainText, htmlBody, senderName, senderEmail }) {
  const from = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
  const boundary = 'saffronsage_' + Math.random().toString(36).slice(2);
  const message = [
    `From: ${from}`,
    `To: ${to}`,
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
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gmail could not send the message: ${detail}`);
  }
  const sent = await res.json();
  return sent.id;
}