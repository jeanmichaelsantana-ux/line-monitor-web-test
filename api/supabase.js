const SUPABASE_ORIGIN = 'https://evfjvnkaamkhsxzvkpex.supabase.co';
module.exports = async function handler(req, res) {
  try {
    const path = typeof req.query.path === 'string' ? req.query.path : '';
    if (!path.startsWith('/rest/v1/')) return res.status(400).json({error:'Invalid path'});
    const headers = {};
    if (req.headers.apikey) headers.apikey = req.headers.apikey;
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    if (req.headers.prefer) headers.prefer = req.headers.prefer;
    let body;
    if (!['GET','HEAD'].includes(req.method) && req.body != null) body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const upstream = await fetch(SUPABASE_ORIGIN + path,{method:req.method,headers,body});
    const text = await upstream.text();
    res.status(upstream.status);
    const ct=upstream.headers.get('content-type'); if(ct) res.setHeader('content-type',ct);
    return res.send(text);
  } catch(e) { return res.status(502).json({error:'Falha na conexão com o banco de dados'}); }
};