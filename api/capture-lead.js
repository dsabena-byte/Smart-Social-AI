// Lead capture endpoint — fires before MercadoPago redirect (best effort, never blocks payment)
const N8N_LEAD_WEBHOOK = process.env.N8N_LEAD_WEBHOOK_URL || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!N8N_LEAD_WEBHOOK) {
    return res.status(200).json({ status: 'skipped', reason: 'N8N_LEAD_WEBHOOK_URL not configured' });
  }

  try {
    await fetch(N8N_LEAD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(req.body || {}),
        captured_at: new Date().toISOString(),
        source: 'tombaio-web'
      })
    });
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    // Always 200 — never block the payment flow
    return res.status(200).json({ status: 'error', message: err.message });
  }
}
