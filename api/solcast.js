export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const SITE_ID = '84a3-293a-54d1-cb51';
  const AUTH = 'Bearer cF5VUAlv-3-1tfBnjCVABV9L0Va0YtKg';
  const BASE = 'https://api.solcast.com.au';

  try {
    const actualsRes = await fetch(
      `${BASE}/rooftop_sites/${SITE_ID}/estimated_actuals?hours=24&period=PT30M&format=json`,
      { headers: { Authorization: AUTH } }
    );

    if (!actualsRes.ok) {
      const body = await actualsRes.text();
      res.status(actualsRes.status).json({ error: 'Solcast HTTP ' + actualsRes.status, detail: body });
      return;
    }

    const data = await actualsRes.json();

    // Try to get site capacity separately — don't crash if it fails
    let capacity_kw = null;
    try {
      const siteRes = await fetch(`${BASE}/rooftop_sites/${SITE_ID}`, { headers: { Authorization: AUTH } });
      if (siteRes.ok) {
        const site = await siteRes.json();
        capacity_kw = site.capacity || site.dc_capacity || site.ac_capacity || null;
        console.log('Site fields:', JSON.stringify(Object.keys(site)));
        console.log('Site data:', JSON.stringify(site));
      }
    } catch (siteErr) {
      console.log('Site fetch failed (non-fatal):', siteErr.message);
    }

    // Enrich items with estimated GHI if capacity is known
    if (capacity_kw && data.estimated_actuals) {
      data.estimated_actuals = data.estimated_actuals.map(item => ({
        ...item,
        ghi_estimate: Math.round((item.pv_estimate / capacity_kw) * 1000),
        capacity_kw
      }));
    }

    res.status(200).json(data);
  } catch (e) {
    console.error('Solcast handler error:', e);
    res.status(500).json({ error: e.message });
  }
}
