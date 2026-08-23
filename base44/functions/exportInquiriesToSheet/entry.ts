import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CONNECTOR_ID = "6a8b26af88276f2ae373e42b";
const SHEET_TITLE = "Catering Inquiries";
const HEADER = [
  "Name", "Email", "Phone", "Event Date", "Event Type", "Guest Count",
  "Venue", "Budget / Head", "Dietary Requirements", "Status", "Created Date", "Inquiry ID"
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inquiryIds = Array.isArray(body.inquiry_ids) ? body.inquiry_ids.filter(Boolean) : [];
    const providedSheetId = body.spreadsheet_id || undefined;

    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    } catch {
      return Response.json({ error: "not_connected" }, { status: 401 });
    }
    const authHeaders = {
      "Authorization": `Bearer ${connection.accessToken}`,
      "Content-Type": "application/json"
    };

    // Resolve target spreadsheet: use provided id, else find by name, else create.
    let spreadsheetId = providedSheetId;
    if (!spreadsheetId) {
      const q = encodeURIComponent(`name='${SHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name)`,
        { headers: authHeaders }
      );
      const driveData = await driveRes.json();
      if (Array.isArray(driveData.files) && driveData.files.length > 0) {
        spreadsheetId = driveData.files[0].id;
      } else {
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ properties: { title: SHEET_TITLE } })
        });
        const created = await createRes.json();
        spreadsheetId = created.spreadsheetId;
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=RAW`,
          { method: "POST", headers: authHeaders, body: JSON.stringify({ values: [HEADER] }) }
        );
      }
    }

    // Determine the first sheet's title for the append range.
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: authHeaders }
    );
    const meta = await metaRes.json();
    const firstSheet = meta.sheets && meta.sheets[0] ? meta.sheets[0].properties.title : "Sheet1";

    let appended = 0;
    if (inquiryIds.length > 0) {
      const inquiries = await base44.entities.CateringInquiry.filter({ id: { $in: inquiryIds } });
      const rows = inquiries.map(i => [
        i.name || "",
        i.email || "",
        i.phone || "",
        i.event_date || "",
        i.event_type || "",
        i.guest_count != null ? String(i.guest_count) : "",
        i.venue || "",
        i.budget_per_head || "",
        i.dietary_requirements || "",
        i.status || "",
        i.created_date ? new Date(i.created_date).toISOString() : "",
        i.id || ""
      ]);
      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheet)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: "POST", headers: authHeaders, body: JSON.stringify({ values: rows }) }
      );
      const appendData = await appendRes.json();
      if (appendData.error) {
        return Response.json({ error: appendData.error.message || "Sheets append failed" }, { status: 502 });
      }
      appended = rows.length;
    }

    return Response.json({
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      appended
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}