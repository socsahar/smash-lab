/**
 * Event waiver link preview + redirect — Vercel serverless function.
 *
 * Purpose: When someone shares an event-waiver link on WhatsApp/Facebook/Twitter,
 * those platforms fetch the URL with a "scraper" that does NOT execute JavaScript.
 * To make the preview show the event title, we serve dynamic <meta og:*> tags
 * here based on the URL's `d` payload (base64url-encoded JSON).
 *
 * Real visitors receive the same HTML but are immediately redirected to
 * /event-waiver.html via a meta-refresh + JS redirect.
 *
 * URL format: /api/e?d=<base64url-encoded JSON payload>
 *   payload short keys: i=id, t=title, k=type, d=datetime, r=responsible, n=participants
 */

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function decodeData(d) {
    if (!d || typeof d !== 'string') return null;
    try {
        const b64 = d.replace(/-/g, '+').replace(/_/g, '/');
        const padLen = b64.length % 4 === 0 ? 0 : 4 - (b64.length % 4);
        const padded = b64 + '='.repeat(padLen);
        const json = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(json);
    } catch (err) {
        return null;
    }
}

export default async function handler(req, res) {
    const d = (req.query && req.query.d) || '';
    const payload = decodeData(d) || {};

    // Support both new short-key and legacy long-key payloads
    const title = payload.t || payload.title || 'אירוע SMASH LAB';
    const eventId = payload.i || payload.id || '';

    // Build the destination URL — pass `d` through so event-waiver.html
    // can decode the same payload (saves a duplicate base64 in the URL).
    const dest = '/event-waiver.html?d=' + encodeURIComponent(d);

    const safeTitle = escapeHtml(title);
    const ogTitle = escapeHtml('כתב ויתור: ' + title);
    const ogDesc = escapeHtml('לחץ לחתימה על כתב הוויתור לאירוע - SMASH LAB');
    const safeDest = escapeHtml(dest);

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${ogTitle}</title>
<meta name="description" content="${ogDesc}">

<!-- Open Graph / WhatsApp / Facebook -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="SMASH LAB">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDesc}">
<meta property="og:locale" content="he_IL">

<!-- Twitter -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${ogTitle}">
<meta name="twitter:description" content="${ogDesc}">

<!-- Redirect real visitors immediately -->
<meta http-equiv="refresh" content="0; url=${safeDest}">
<link rel="canonical" href="${safeDest}">

<style>
  body { font-family: Arial, sans-serif; background:#1a1a1a; color:#fff; text-align:center; padding:2rem; }
  a { color:#ff6b00; }
</style>
</head>
<body>
<h2>🎉 ${safeTitle}</h2>
<p>טוען דף חתימה...</p>
<p><a href="${safeDest}">לחץ כאן אם הדף לא נטען אוטומטית</a></p>
<script>
  // Immediate JS redirect for real browsers (scrapers don't run JS)
  window.location.replace(${JSON.stringify(dest)});
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).send(html);
}
