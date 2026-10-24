(function(root,factory){
  const core=factory();
  if(typeof module==='object'&&module.exports)module.exports=core;
  else{root.LineMonitorDailySummary=core;core.install(root);}
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const ZONE='America/Manaus',OFFSET_MS=4*60*60*1000,STATE_KEY='lm_daily_summary_0600_v1';
  function period(now=new Date()){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    const end=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day))+OFFSET_MS,start=end-86400000;
    return{day:new Date(start-OFFSET_MS).toISOString().slice(0,10),start:new Date(start).toISOString(),end:new Date(end).toISOString(),due:Number(p.hour)>=6};
  }
  const clean=v=>String(v??'').replace(/\r\n?/g,'\n').trim();
  const normalized=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const escape=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function localDate(value){const d=new Date(value);return value&&Number.isFinite(d.getTime())?d.toLocaleString('pt-BR',{timeZone:ZONE}):'Não informado';}
  function reportHTML(rows,p,now=new Date()){
    const day=p.day.split('-').reverse().join('/'),done=rows.filter(completed).length;
    const field=(name,value)=>`<div class="field"><dt>${escape(name)}</dt><dd>${escape(value)||'Não informado'}</dd></div>`;
    const sections=rows.map((r,i)=>{
      const evidence=(Array.isArray(r.evidencias)?r.evidencias:[]).flatMap((ev,j)=>{
        try{const url=new URL(ev.url||ev.src||'',typeof location!=='undefined'?location.href:undefined);if(!['https:','http:'].includes(url.protocol))return[];
          return [`<li><a href="${escape(url.href)}" target="_blank" rel="noopener noreferrer">${escape(ev.nome||`Evidência ${j+1}`)}</a>${ev.comentario?`<p>${escape(ev.comentario)}</p>`:''}</li>`];
        }catch{return[];}
      });
      return `<article><div class="record-head"><span class="number">${i+1}</span><div><p class="line">${escape(r.linha)||'Linha não informada'}</p><h2>${escape(r.equipamento)||'Equipamento não informado'}</h2></div><span class="status ${completed(r)?'done':'pending'}">${escape(r.status)||'Não informado'}</span></div><dl class="details">${field('Tipo',r.tipo_falha)}${field('Responsável(is)',r.responsavel)}${field('Cadastro do input',localDate(r.created_at))}${field('Início da atividade',localDate(r.inicio_parada))}${field('Fim da atividade',localDate(r.fim_parada))}${field('Tempo registrado',r.duracao_minutos!=null&&Number.isFinite(Number(r.duracao_minutos))?`${r.duracao_minutos} min`:'Não informado')}</dl><dl class="technical">${field('Ocorrência',r.falha||r.descricao)}${field('Causa identificada',r.causa_identificada)}${field('Ação realizada',r.acao_realizada)}${r.resolucao_descricao?field('Resolução da pendência',r.resolucao_descricao):''}</dl>${evidence.length?`<div class="evidence"><h3>Evidências</h3><p>Links exigem internet e acesso ao ambiente de origem.</p><ul>${evidence.join('')}</ul></div>`:''}</article>`;
    }).join('');
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Relatório Diário de Ocorrências — ${day}</title><style>
    :root{font-family:Arial,sans-serif;color:#19354b;background:#edf3f7}*{box-sizing:border-box}body{margin:0}header{background:#0b2545;color:#fff;padding:30px max(18px,calc((100% - 980px)/2))}header p{color:#d5e5f0;line-height:1.5}h1{font-size:clamp(24px,5vw,34px);margin:8px 0 12px}header .date{font-size:20px;font-weight:700;margin:0}main{max-width:1016px;padding:18px;margin:auto}.intro{line-height:1.6;color:#516a7e;font-size:14px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:8px 0 20px}.metric{background:#fff;border:1px solid #d7e3eb;padding:18px;border-radius:12px}.metric b{display:block;font-size:28px;color:#0b2545}.metric span{font-size:12px;color:#516a7e}article{background:white;border:1px solid #d7e3eb;border-radius:14px;padding:22px;margin:0 0 18px;break-inside:avoid}.record-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:1px solid #dce6ed;padding-bottom:16px}.number{padding:10px 14px;background:#e8f2fa;border-radius:10px;font-weight:bold}.line{font-size:12px;color:#17658f;font-weight:bold;margin:0 0 5px}h2{font-size:19px;margin:0;overflow-wrap:anywhere}.status{margin-left:auto;font-size:12px;padding:7px 10px;border-radius:20px}.done{background:#e2f4e9;color:#21643c}.pending{background:#fff1d7;color:#78520b}dl{margin:0}.details{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:20px 0;border-bottom:1px solid #dce6ed}.technical .field{padding-top:18px}dt{font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;color:#5c7385;margin-bottom:7px}dd{margin:0;font-size:14px;line-height:1.6;white-space:pre-line;overflow-wrap:anywhere}.evidence{border-top:1px solid #dce6ed;margin-top:18px;padding-top:8px}.evidence h3{font-size:15px}.evidence p{font-size:12px;color:#516a7e;white-space:pre-line}.evidence li{margin-bottom:10px;overflow-wrap:anywhere}a{color:#16658f}footer{padding:18px;text-align:center;color:#536c80;font-size:12px;line-height:1.7}@media(max-width:600px){main{padding:12px}article{padding:17px}.details{grid-template-columns:repeat(2,minmax(0,1fr))}.metrics{gap:7px}.metric{padding:12px 8px}.metric b{font-size:24px}.status{margin-left:0}h2{font-size:17px}}@media print{body{background:#fff}header{background:#fff;color:#19354b;padding:12px}header p{color:#516a7e}main{max-width:none;padding:0}article{box-shadow:none}.metric{padding:12px}a{color:inherit}}
    </style></head><body><header><p>LCM / MAIN · LINE MONITOR</p><h1>Relatório Diário de Ocorrências</h1><p class="date">${day}</p><p>Inputs cadastrados entre 00:00 e 23:59 · Horário de Manaus</p></header><main><p class="intro">Consulta por data de cadastro do input. Textos técnicos preservados conforme os registros. Situação dos registros no momento da geração.</p><section class="metrics" aria-label="Resumo"><div class="metric"><b>${rows.length}</b><span>Ocorrências</span></div><div class="metric"><b>${done}</b><span>Concluídas</span></div><div class="metric"><b>${rows.length-done}</b><span>Não concluídas</span></div></section>${sections}</main><footer>Gerado em ${escape(localDate(now))} · America/Manaus<br>Relatório preparado para compartilhamento manual.</footer></body></html>`;
  }
  function completed(row){return /^(concluid[ao]|finalizad[ao]|resolvid[ao])$/.test(normalized(row.status));}
  function selectRows(rows,p){
    if(!Array.isArray(rows))throw new Error('Resposta de ocorrências inválida.');
    const ids=new Set(),start=Date.parse(p.start),end=Date.parse(p.end);
    return rows.filter(row=>{
      if(!row||typeof row!=='object')throw new Error('Registro inválido recebido do servidor.');
      const date=Date.parse(row.created_at);
      if(!Number.isFinite(date))throw new Error('Registro sem data de cadastro válida.');
      if(date<start||date>=end||normalized(row.status)==='excluida')return false;
      if(row.id!=null){const id=String(row.id);if(ids.has(id))return false;ids.add(id);}
      return true;
    }).sort((a,b)=>clean(a.linha).localeCompare(clean(b.linha),'pt-BR')||Date.parse(a.created_at)-Date.parse(b.created_at)||String(a.id).localeCompare(String(b.id)));
  }
  function format(rows,p){
    const selected=selectRows(rows,p);if(!selected.length)return null;
    const date=p.day.split('-').reverse().join('/'),done=selected.filter(completed).length;
    const result=[`RESUMO DAS OCORRÊNCIAS — ${date}`,'LCM / MAIN',`Cadastros de ${date}, 00:00 a 23:59 (Manaus).`,`Total: ${selected.length} | Concluídas: ${done} | Não concluídas: ${selected.length-done}`];
    let previous='';
    selected.forEach((r,i)=>{
      const line=clean(r.linha)||'Linha não informada';if(line!==previous){result.push('',`LINHA ${line}`);previous=line;}
      result.push('',`${i+1}. ${clean(r.equipamento)||'Equipamento não informado'}`);
      for(const [name,value] of [['Status',r.status],['Ocorrência',r.falha||r.descricao],['Ação realizada',r.acao_realizada],['Responsável(is)',r.responsavel]])result.push(`${name}: ${clean(value)||'Não informado'}`);
      if(r.resolucao_descricao)result.push(`Resolução da pendência: ${clean(r.resolucao_descricao)}`);
    });
    result.push('','Dados consultados no Line Monitor. Compartilhamento manual.');
    return{day:p.day,text:result.join('\n'),count:selected.length,html:reportHTML(selected,p),filename:`Relatorio_Diario_Ocorrencias_${p.day}.html`};
  }
  async function fetchRows(fetcher,api,headers,p){
    const all=[],seen=new Set(),size=100;
    for(let offset=0;offset<10000;offset+=size){
      const url=new URL(api);
      url.searchParams.set('select','id,linha,equipamento,created_at,tipo_falha,status,falha,descricao,causa_identificada,acao_realizada,responsavel,resolucao_descricao,inicio_parada,fim_parada,duracao_minutos,evidencias');
      url.searchParams.set('and',`(created_at.gte.${p.start},created_at.lt.${p.end})`);
      url.searchParams.set('order','created_at.asc,id.asc');
      url.searchParams.set('limit',String(size));url.searchParams.set('offset',String(offset));
      const response=await fetcher(url.href,{headers:{...headers,Prefer:'count=exact'},cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Não foi possível consultar as ocorrências. Tente novamente com internet.');
      const rows=await response.json();if(!Array.isArray(rows))throw new Error('Resposta inválida do servidor.');
      const range=response.headers?.get('content-range')||'',match=range.match(/\/(\d+)$/),total=match?Number(match[1]):null;
      if(!rows.length){if(total!==null&&offset<total)throw new Error('Consulta incompleta. Tente novamente.');return all;}
      for(const row of rows){
        if(!row||row.id==null)throw new Error('Registro sem identificação.');
        const id=String(row.id);if(seen.has(id))throw new Error('A lista mudou durante a consulta. Atualize o resumo.');seen.add(id);all.push(row);
      }
      if(total!==null&&offset+rows.length>=total)return all;
      if(rows.length<size){if(total!==null&&offset+rows.length<total)throw new Error('Servidor retornou uma página incompleta.');return all;}
    }
    throw new Error('Consulta muito grande; o resumo não foi gerado parcialmente.');
  }
  function install(w){
    const doc=w.document;if(!doc||doc.getElementById('lmDailySummaryCard'))return;
    let config={enabled:true,day:null,empty:false},summary=null,busy=false,lastAttempt=0;
    try{const saved=JSON.parse(w.localStorage.getItem(STATE_KEY)||'null');if(saved&&typeof saved.enabled==='boolean')config={...config,enabled:saved.enabled,day:saved.day,empty:saved.empty===true};}catch{}
    function persist(){try{w.localStorage.setItem(STATE_KEY,JSON.stringify(config));}catch{}}
    // O texto com ocorrências permanece apenas na memória. Não armazenar o resumo em arquivos públicos.
    const style=doc.createElement('style');style.textContent=`
      #lmDailySummaryCard{margin:14px 0;padding:18px;background:#fff;border:1px solid #cddfeb;border-radius:14px;color:#173b5b}
      #lmDailySummaryCard h3{margin:0 0 8px;font-size:18px}#lmDailySummaryCard p{font-size:13px;line-height:1.5;margin:8px 0}
      #lmDailySummaryCard label{display:flex;gap:8px;align-items:center;text-transform:none;font-size:13px;color:#173b5b}#lmDailySummaryCard input{width:auto}
      .lm-daily-actions{display:flex;gap:8px;flex-wrap:wrap}.lm-daily-actions button{padding:11px 14px;border:0;border-radius:9px;background:#155f92;color:#fff;font-weight:700;min-height:44px}.lm-daily-actions button:disabled{opacity:.55}
      #lmDailySummaryDialog{border:0;border-radius:16px;padding:20px;max-width:700px;width:calc(100% - 24px);max-height:90vh;box-sizing:border-box;color:#173b5b}#lmDailySummaryDialog::backdrop{background:#102b48aa}
      #lmDailyReportPreview{width:100%;height:50vh;border:1px solid #cddfeb;border-radius:10px;background:#f8fbfd;box-sizing:border-box}
      #lmDailySummaryDialog h2{font-size:20px;margin:0 0 12px}#lmDailySummaryDialog p{font-size:13px;line-height:1.5}.lm-daily-secondary{background:#536d80!important}
    `;doc.head.append(style);
    const card=doc.createElement('section');card.id='lmDailySummaryCard';
    card.innerHTML='<h3>Relatório HTML · 06:00</h3><p>Inputs do dia anterior, de 00:00 a 23:59, no horário de Manaus. Dias sem registros são ignorados.</p><label><input id="lmDailyEnabled" type="checkbox">Preparar automaticamente neste navegador</label><p id="lmDailyStatus" role="status" aria-live="polite"></p><div class="lm-daily-actions"><button id="lmDailyOpen" type="button">Abrir relatório do dia anterior</button></div><p>Verificação às 06:00 com a página aberta ou ao retornar depois desse horário. Salve o arquivo HTML e compartilhe nos grupos do WhatsApp.</p>';
    const home=doc.getElementById('inicio')||doc.querySelector('main')||doc.body;home.insertBefore(card,home.firstChild);
    const dialog=doc.createElement('dialog');dialog.id='lmDailySummaryDialog';
    dialog.innerHTML='<h2 id="lmDailyHeading">Relatório Diário de Ocorrências</h2><p>Confira o relatório. Você pode salvar o HTML e compartilhar o mesmo arquivo em vários grupos.</p><iframe id="lmDailyReportPreview" sandbox title="Prévia do relatório HTML"></iframe><p id="lmDailyShareStatus" role="status" aria-live="polite"></p><div class="lm-daily-actions"><button id="lmDailySave" type="button">Salvar HTML</button><button id="lmDailyShare" type="button">Compartilhar HTML</button><button id="lmDailyRefresh" class="lm-daily-secondary" type="button">Atualizar dados</button><button id="lmDailyClose" class="lm-daily-secondary" type="button">Fechar</button></div>';
    dialog.setAttribute('aria-labelledby','lmDailyHeading');doc.body.append(dialog);
    const byId=id=>doc.getElementById(id),status=byId('lmDailyStatus'),open=byId('lmDailyOpen'),enabled=byId('lmDailyEnabled'),shareStatus=byId('lmDailyShareStatus');
    enabled.checked=config.enabled;
    function paint(){
      const p=period();if(summary&&summary.day!==p.day){summary=null;byId('lmDailyReportPreview').srcdoc='';if(dialog.open)dialog.close();}
      if(busy)return;
      if(summary){status.textContent=`Relatório HTML de ${summary.day.split('-').reverse().join('/')} pronto: ${summary.count} ocorrência(s).`;open.textContent='Abrir relatório pronto';}
      else if(config.day===p.day&&config.empty){status.textContent='Dia anterior sem inputs cadastrados. Relatório ignorado.';open.textContent='Verificar novamente';}
      else{status.textContent=config.enabled?(p.due?'Aguardando consulta ao servidor.':'Verificação automática a partir das 06:00 (Manaus).'):'Preparação automática desativada neste navegador.';open.textContent='Abrir relatório do dia anterior';}
    }
    function apiConfig(){
      // Reutiliza a conexão já estabelecida pelo aplicativo; não introduz credenciais novas.
      if(typeof API==='undefined'||typeof HEADERS==='undefined')throw new Error('Conexão do Line Monitor indisponível. Reabra o aplicativo.');
      return{api:API,headers:HEADERS};
    }
    function show(){if(!summary)return;byId('lmDailyReportPreview').srcdoc=summary.html;shareStatus.textContent='';if(!dialog.open)dialog.showModal();}
    async function generate(manual=false,force=false){
      const p=period();paint();
      if(busy)return;
      if(!manual&&(!config.enabled||!p.due||doc.hidden||Date.now()-lastAttempt<300000))return;
      if(!force&&summary&&summary.day===p.day){if(manual)show();return;}
      if(!manual&&config.day===p.day&&config.empty)return;
      busy=true;lastAttempt=Date.now();open.disabled=true;byId('lmDailyRefresh').disabled=true;
      status.textContent='Consultando ocorrências do dia anterior…';
      try{
        const connection=apiConfig(),rows=await fetchRows(w.fetch.bind(w),connection.api,connection.headers,p),result=format(rows,p);
        if(period().day!==p.day){summary=null;status.textContent='O dia mudou durante a consulta. Verifique novamente.';return;}
        summary=result;config.day=p.day;config.empty=!result;persist();
        byId('lmDailyReportPreview').srcdoc=result?result.html:'';if(!result&&dialog.open)dialog.close();
        if(manual&&result)show();
      }catch(e){
        // Não transformar falta de rede em um dia vazio nem exibir um resumo antigo como atual.
        summary=null;byId('lmDailyReportPreview').srcdoc='';if(dialog.open)dialog.close();status.textContent=clean(e.message)||'Não foi possível preparar o relatório.';
        return;
      }finally{busy=false;open.disabled=false;byId('lmDailyRefresh').disabled=false;}
      paint();
    }
    open.addEventListener('click',()=>generate(true));
    enabled.addEventListener('change',()=>{config.enabled=enabled.checked;persist();paint();if(config.enabled)generate();});
    byId('lmDailyRefresh').addEventListener('click',()=>generate(true,true));
    byId('lmDailyClose').addEventListener('click',()=>dialog.close());
    function save(){
      if(!summary)return;
      const url=w.URL.createObjectURL(new w.Blob([summary.html],{type:'text/html;charset=utf-8'})),a=doc.createElement('a');a.href=url;a.download=summary.filename;doc.body.append(a);a.click();a.remove();w.setTimeout(()=>w.URL.revokeObjectURL(url),60000);
      shareStatus.textContent='Download solicitado. Confira a pasta Downloads e envie o HTML como documento no WhatsApp.';
    }
    byId('lmDailySave').addEventListener('click',save);
    byId('lmDailyShare').addEventListener('click',async()=>{
      if(!summary)return;
      if(typeof w.File!=='function'){shareStatus.textContent='Toque em Salvar HTML e envie o arquivo como documento pelo WhatsApp.';return;}
      const file=new w.File([summary.html],summary.filename,{type:'text/html'});
      if(!w.navigator.share||!w.navigator.canShare?.({files:[file]})){shareStatus.textContent='Este navegador não compartilha HTML diretamente. Toque em Salvar HTML e envie o arquivo como documento pelo WhatsApp.';return;}
      try{await w.navigator.share({files:[file],title:`Relatório de ocorrências ${summary.day}`});shareStatus.textContent='Compartilhamento aberto. A confirmação de entrega deve ser conferida no WhatsApp.';}
      catch(e){shareStatus.textContent=e.name==='AbortError'?'Compartilhamento cancelado. O relatório continua disponível.':'Não foi possível compartilhar. Salve o HTML e envie como documento.';}
    });
    doc.addEventListener('visibilitychange',()=>{if(!doc.hidden){paint();generate();}});
    w.addEventListener('focus',()=>{paint();generate();});w.addEventListener('online',()=>{lastAttempt=0;generate();});
    w.setInterval(()=>{paint();generate();},60000);paint();generate();
  }
  return{period,selectRows,format,fetchRows,completed,reportHTML,install};
});
