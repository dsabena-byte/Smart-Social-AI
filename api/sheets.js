// Vercel serverless function: proxy to Google Apps Script (bypasses JSONP/CORS)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxkG0DMID1sTPpQGj9W_VwwU2BKMUYAQkXff2rygXjMGwe_ZvgUOfkyg6N7A_2mLqCV/exec';

export default async function handler(req, res) {
  const { sheetId, sheet } = req.query;

  const url = new URL(APPS_SCRIPT_URL);
  if (sheetId) url.searchParams.set('sheetId', sheetId);
  if (sheet)   url.searchParams.set('sheet', sheet);

  try {
    const response = await fetch(url.toString(), {
      redirect: 'follow',
      headers: { 'User-Agent': 'Vercel-Proxy/1.0' }
    });
    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
