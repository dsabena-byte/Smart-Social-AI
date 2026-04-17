const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // MP sends a GET challenge to verify the endpoint
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body || {};

  // Only process payment notifications
  if (type !== 'payment' || !data?.id) {
    return res.status(200).json({ status: 'ignored' });
  }

  try {
    // Fetch payment details from MP
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    });

    if (!paymentRes.ok) {
      return res.status(200).json({ status: 'payment_fetch_failed' });
    }

    const payment = await paymentRes.json();

    // Only trigger onboarding for approved payments
    if (payment.status !== 'approved') {
      return res.status(200).json({ status: 'not_approved', payment_status: payment.status });
    }

    const meta = payment.metadata || {};

    // Trigger N8N onboarding workflow
    if (N8N_WEBHOOK_URL) {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: payment.id,
          external_reference: payment.external_reference,
          plan: meta.plan,
          nombre: meta.nombre,
          apellido: meta.apellido,
          email: meta.email,
          brands: meta.brands,
          myBrand: meta.my_brand || meta.myBrand,
          competidores: meta.competidores,
          redes: meta.redes,
          idioma: meta.idioma,
          amount: payment.transaction_amount,
          currency: payment.currency_id
        })
      });
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    // Always return 200 to MP so it doesn't retry indefinitely
    return res.status(200).json({ status: 'error', message: err.message });
  }
}
