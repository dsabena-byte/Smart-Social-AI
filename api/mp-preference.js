export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN not configured' });

  const BASE_URL = process.env.BASE_URL || 'https://www.tombaio.com';

  const {
    plan = 'starter',
    nombre = '',
    apellido = '',
    email = '',
    brands = [],
    myBrand = '',
    competidores = '',
    redes = '',
    idioma = ''
  } = req.body || {};

  const PLANS = {
    starter: { title: 'tombaio Starter', price: 49, currency: 'ARS' },
    pro:     { title: 'tombaio Pro',     price: 99, currency: 'ARS' },
    reporte: { title: 'tombaio Reporte Inicial', price: 19, currency: 'ARS' }
  };

  const selected = PLANS[plan] || PLANS.starter;

  const preference = {
    items: [
      {
        title: selected.title,
        quantity: 1,
        currency_id: selected.currency,
        unit_price: selected.price
      }
    ],
    payer: {
      name: nombre,
      surname: apellido,
      email: email
    },
    back_urls: {
      success: `${BASE_URL}/success.html`,
      failure: `${BASE_URL}/#formulario`,
      pending: `${BASE_URL}/pending.html`
    },
    auto_return: 'approved',
    metadata: {
      plan,
      nombre,
      apellido,
      email,
      brands,
      myBrand,
      competidores,
      redes,
      idioma
    },
    notification_url: `${BASE_URL}/api/mp-webhook`,
    statement_descriptor: 'tombaio',
    external_reference: `${email}_${plan}_${Date.now()}`
  };

  try {
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      return res.status(mpRes.status).json({ error: data.message || 'Error creating preference', detail: data });
    }

    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
