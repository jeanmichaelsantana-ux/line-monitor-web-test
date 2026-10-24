const crypto=require('node:crypto');
const core=require('./daily-export-core.cjs');
// Chave exclusiva de leitura: somente seu hash é versionado. Não é a chave do banco.
const TOKEN_HASH='646a6720da7276c2701512ce94f0492848ac7c2bbf7a49f4a23442f0497909e3';
module.exports=async function dailyExport(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Método não permitido.'});}
  const auth=String(req.headers.authorization||'');
  const actual=crypto.createHash('sha256').update(auth.startsWith('Bearer ')?auth.slice(7):'').digest();
  if(!crypto.timingSafeEqual(actual,Buffer.from(TOKEN_HASH,'hex')))return res.status(401).json({error:'Autenticação da automação necessária.'});
  const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY;
  if(!base||!key)return res.status(503).json({error:'Integração não configurada.'});
  const p=core.period();
  if(!p.due)return res.status(425).json({error:'A geração está disponível a partir das 06:00 de Manaus.'});
  try{
    const rows=await core.fetchRows(fetch,base.replace(/\/$/,'')+'/rest/v1/ocorrencias',{apikey:key,Authorization:'Bearer '+key},p);
    const report=core.format(rows,p);
    res.setHeader('X-LineMonitor-Count',String(report?.count||0));
    res.setHeader('X-LineMonitor-Date',p.day);
    if(!report)return res.status(204).end();
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Disposition',`attachment; filename="${report.filename}"`);
    return res.status(200).send(report.html);
  }catch{return res.status(502).json({error:'Consulta incompleta ou indisponível. Nenhum relatório foi gerado.'});}
};
