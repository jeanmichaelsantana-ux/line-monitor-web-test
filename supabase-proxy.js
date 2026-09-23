export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Backend Line Monitor não configurado.' });
  }

  const raw = req.url || '';
  const prefix = '/api/supabase';
  const pos = raw.indexOf(prefix);
  let targetPath = pos >= 0 ? raw.slice(pos + prefix.length) : '/';
  if (!targetPath.startsWith('/')) targetPath = '/' + targetPath;

  const target = SUPABASE_URL.replace(/\/$/, '') + targetPath;
  const headers = {};
  for (const [k, v] of Object.entries(req.headers || {})) {
    const key = k.toLowerCase();
    if (['host','connection','content-length','apikey','authorization','origin','referer'].includes(key)) continue;
    if (v != null) headers[k] = v;
  }
  headers.apikey = SUPABASE_KEY;
  headers.authorization = `Bearer ${SUPABASE_KEY}`;

  let body;
  if (!['GET','HEAD'].includes(req.method)) {
    if (Buffer.isBuffer(req.body)) body = req.body;
    else if (typeof req.body === 'string') body = req.body;
    else if (req.body != null) body = JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(target, { method: req.method, headers, body, redirect: 'follow' });
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const lk = key.toLowerCase();
      if (!['content-encoding','content-length','transfer-encoding','connection','access-control-allow-origin'].includes(lk)) {
        try { res.setHeader(key, value); } catch {}
      }
    });
    res.setHeader('Cache-Control', 'no-store');
    const data = Buffer.from(await upstream.arrayBuffer());
    return res.send(data);
  } catch (e) {
    return res.status(502).json({ error: 'Falha de comunicação do backend Line Monitor.', detail: String(e?.message || e) });
  }
}
