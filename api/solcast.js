export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const SITE_ID = '84a3-293a-54d1-cb51';
  const AUTH = 'Bearer cF5VUAlv-3-1tfBnjCVABV9L0Va0YtKg';
  const BASE = 'https://api.solcast.com.au';

  try {
    // Fetch site details and actuals in parallel
    const [siteRes, actualsRes] = await Promise.all([
      fetch(`${BASE}/rooftop_sites/${SITE_ID}`, { headers: { Authorization: AUTH } }),
      fetch(`${BASE}/rooftop_sites/${SITE_ID}/estimated_actuals?hours=24&period=PT30M&format=json`, { headers: { Authorization: AUTH } })
    ]);

    if (!actualsRes.ok) {
      res.status(actualsRes.status).json({ error: 'Solcast actuals HTTP ' + actualsRes.status });
      return;
    }

    const actuals = await actualsRes.json();
    let capacity_kw = null;

    if (siteRes.ok) {
      const site = await siteRes.json();
      // capacity is in kW DC
      capacity_kw = site.capacity || site.dc_capacity || null;
    }

    // Enrich each item with estimated GHI if capacity is known
    if (capacity_kw && actuals.estimated_actuals) {
      actuals.estimated_actuals = actuals.estimated_actuals.map(item => ({
        ...item,
        ghi_estimate: capacity_kw > 0 ? Math.round((item.pv_estimate / capacity_kw) * 1000) : null,
        capacity_kw
      }));
    }

    res.status(200).json(actuals);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
