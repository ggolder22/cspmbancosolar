export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const url = 'https://api.solcast.com.au/rooftop_sites/84a3-293a-54d1-cb51/estimated_actuals' +
    '?hours=24&period=PT30M&format=json';

  try {
    const r = await fetch(url, {
      headers: { 'Authorization': 'Bearer cF5VUAlv-3-1tfBnjCVABV9L0Va0YtKg' }
    });
    if (!r.ok) {
      res.status(r.status).json({ error: 'Solcast HTTP ' + r.status });
      return;
    }
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
