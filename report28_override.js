(function(){
async function gerarRelatorioDiarioPadrao(id){
 let x=dados.find(o=>String(o.id)===String(id));if(!x){alert('Ocorrência não encontrada.');return}
 try{
  const evidencias=await Promise.all((Array.isArray(x.evidencias)?x.evidencias:[]).map(async e=>{
   const source=e.url||e.data||e.src;if(!source)return e;
   if(String(e.tipo||e.type||'').includes('video'))return {...e,url:urlEvidenciaWeb(source)};
   if(String(source).startsWith('data:image/'))return {...e,url:source};
   const r=await fetch(urlEvidenciaWeb(source),{cache:'no-store'});if(!r.ok)throw Error('Não foi possível carregar uma foto. Verifique a conexão.');
   const blob=await r.blob();if(!blob.size)throw Error('Uma foto está vazia.');
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Não foi possível incorporar uma foto.'));reader.readAsDataURL(blob)});
   return {...e,url:data};
  }));
  x={...x,evidencias};localStorage.setItem('line_monitor_ocorrencia_relatorio_diario',JSON.stringify(x));
  window.location.assign(new URL('./relatorio_diario_v38_fotos.html',window.location.href).href);
 }catch(e){alert(e.message||'Não foi possível preparar o Relatório Diário. Tente novamente.')}
}

window.gerarRelatorioDiarioPadrao=gerarRelatorioDiarioPadrao;
window.gerarRelatorioDiario=gerarRelatorioDiarioPadrao;
})();

(() => {
  const original = window.compartilharFalha;
  let preparing = false;
  window.compartilharFalha = async function (id) {
    const occurrence = dados.find(item => String(item.id) === String(id));
    const evidence = Array.isArray(occurrence?.evidencias) ? occurrence.evidencias : [];
    if (!evidence.length || window.Android) return original(id);
    if (preparing || document.getElementById('lm-web-share-evidence')) return;
    if (!confirmarEnvioRelatorio(id, 'ocorrencia')) return;
    preparing = true;
    const dialog = document.createElement('dialog');
    dialog.id = 'lm-web-share-evidence';
    dialog.style.cssText = 'width:min(90vw,460px);max-height:80vh;padding:20px;border:1px solid #b7c7d8;border-radius:14px;color:#0b2545';
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.textContent = 'Preparando fotos e vídeos…';
    const close = document.createElement('button');
    close.textContent = 'Fechar';
    close.onclick = () => dialog.close();
    const urls = [];
    dialog.addEventListener('close', () => {
      dialog.remove();
      urls.forEach(url => setTimeout(() => URL.revokeObjectURL(url), 1000));
    });
    dialog.append(status, close);
    document.body.append(dialog);
    status.style.cssText = 'margin:0 0 16px;line-height:1.45';
    close.style.cssText = 'width:100%;padding:12px;border:0;border-radius:10px;background:#edf3f8;color:#0b2545;font:inherit;font-weight:700';
    const button = document.activeElement;
    const buttonLabel = button?.textContent;
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.textContent = 'Preparando evidências…';
    }
    try {
      const files = [];
      for (const [index, item] of evidence.entries()) {
        if (!dialog.isConnected) return;
        const source = item.url || item.data || item.src;
        if (!source) throw Error('Uma evidência está sem arquivo.');
        const response = typeof urlEvidenciaWeb === 'function'
          ? await fetch(urlEvidenciaWeb(source))
          : await (window.LM37?.fetchMedia || fetch)(source);
        if (!response.ok) throw Error('Não foi possível carregar uma evidência. Verifique a conexão.');
        const blob = await response.blob();
        if (!blob.size) throw Error('Uma evidência está vazia.');
        const type = [blob.type, item.tipo, item.type].map(value => String(value || '').split(';')[0].toLowerCase()).find(value => /^(image|video)\/[a-z0-9.+-]+$/.test(value));
        if (!type) throw Error('Formato de evidência não reconhecido.');
        const ext = ({'image/jpeg':'jpg','video/quicktime':'mov','video/3gpp':'3gp'})[type] || type.split('/')[1];
        files.push(new File([blob], 'Evidencia_' + (index + 1) + '.' + ext, {type}));
      }
      if (!dialog.isConnected) return;
      const title = occurrence.linha + ' - ' + occurrence.equip;
      const text = textoFalha(occurrence);
      const share = document.createElement('button');
      share.textContent = 'Compartilhar texto e evidências';
      const fallback = document.createElement('div');
      const copy = document.createElement('textarea');
      copy.readOnly = true;
      copy.value = text;
      copy.setAttribute('aria-label', 'Texto da ocorrência para copiar');
      copy.style.cssText = 'display:block;width:100%;margin:8px 0';
      fallback.append(copy);
      for (const file of files) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        urls.push(link.href);
        link.download = file.name;
        link.textContent = 'Baixar ' + file.name;
        link.style.display = 'block';
        fallback.append(link);
      }
      const data = {title, text, files};
      const supported = Boolean(navigator.share && navigator.canShare?.(data));
      share.style.cssText = 'width:100%;padding:14px;margin-bottom:8px;border:0;border-radius:10px;background:#195578;color:white;font:inherit;font-weight:700';
      share.textContent = 'Compartilhar no grupo';
      if (supported && navigator.userActivation?.isActive !== false) {
        try {
          await navigator.share(data);
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }
      fallback.hidden = supported;
      share.hidden = !supported;
      status.textContent = supported ? 'Fotos e vídeos prontos para compartilhar.' : 'Copie o texto e baixe as evidências para anexar no WhatsApp.';
      share.onclick = async () => {
        share.disabled = true;
        try { await navigator.share(data); dialog.close(); }
        catch (error) {
          if (error.name !== 'AbortError') {
            status.textContent = 'Copie o texto e baixe as evidências para anexar no WhatsApp.';
            fallback.hidden = false;
          }
        } finally { share.disabled = false; }
      };
      dialog.insertBefore(share, close);
      dialog.insertBefore(fallback, close);
      dialog.showModal();
    } catch (error) {
      status.textContent = error.message || 'Não foi possível preparar as evidências.';
      dialog.showModal();
    } finally {
      preparing = false;
      if (!dialog.open) {
        dialog.remove();
        urls.forEach(url => URL.revokeObjectURL(url));
      }
      if (button instanceof HTMLButtonElement) {
        button.disabled = false;
        button.textContent = buttonLabel;
      }
    }
  };
})();


(function(){
'use strict';
function phase(ev){const p=String(ev.fase||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();return p==='antes'?'Antes':p==='depois'?'Depois':p==='concluido'?'Concluído':p==='pendente'?'Pendente':'Evidências';}
async function compose(list){
 const loaded=[];
 try{
  for(const ev of list){
   if(String(ev.tipo||'').startsWith('video/'))throw Error('Este envio agrupado aceita fotos. Compartilhe os vídeos separadamente.');
   const response=await loadMedia(ev.url);if(!response.ok)throw Error('Não foi possível carregar uma foto.');
   const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('Uma evidência não é uma foto.');
   const url=URL.createObjectURL(blob),im=new Image();loaded.push({im,url,group:phase(ev)});
   await new Promise((ok,fail)=>{im.onload=ok;im.onerror=()=>fail(Error('Não foi possível abrir uma foto.'));im.src=url;});
   if(!im.naturalWidth||!im.naturalHeight)throw Error('Foto inválida.');
  }
  const groups=['Antes','Depois','Pendente','Concluído','Evidências'].map(name=>({name,items:loaded.filter(x=>x.group===name)})).filter(x=>x.items.length);
  const width=1080,pad=32,gap=24,heading=76,inner=width-pad*2;
  function height(item){return Math.round(Math.min(1500,inner*item.im.naturalHeight/item.im.naturalWidth));}
  const c=document.createElement('canvas');const ctx=c.getContext('2d');if(!ctx)throw Error('Não foi possível preparar a imagem.');
  const photoHeight=pad+groups.reduce((sum,g)=>sum+heading+g.items.reduce((h,x)=>h+height(x)+gap,0),0);
  const total=photoHeight+pad;
  if(total>24000)throw Error('As fotos excedem o tamanho da imagem. Reduza a quantidade de fotos neste relatório.');
  c.width=width;c.height=total;
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,total);let y=pad;
  for(const g of groups){
   ctx.fillStyle='#e7f4fc';ctx.fillRect(pad,y,inner,heading-14);ctx.fillStyle='#1e5f7a';ctx.font='bold 36px sans-serif';ctx.textBaseline='middle';ctx.fillText(g.name,pad+20,y+(heading-14)/2);y+=heading;
   for(const x of g.items){
    const h=height(x),scale=Math.min(inner/x.im.naturalWidth,h/x.im.naturalHeight),w=Math.round(x.im.naturalWidth*scale),ih=Math.round(x.im.naturalHeight*scale);
    ctx.fillStyle='#eff5f9';ctx.fillRect(pad,y,inner,h);ctx.drawImage(x.im,pad+(inner-w)/2,y+(h-ih)/2,w,ih);y+=h+gap;
   }
  }
  const url=c.toDataURL('image/jpeg',.93);if(!url.startsWith('data:image/jpeg;base64,'))throw Error('Não foi possível gerar a imagem agrupada.');
  return {url,tipo:'image/jpeg',nome:'Antes_Depois.jpg'};
 }finally{for(const x of loaded)URL.revokeObjectURL(x.url);}
}


async function loadMedia(url){
 const source=typeof urlEvidenciaWeb==='function'?urlEvidenciaWeb(url):url;
 if(typeof urlEvidenciaWeb==='function')return fetch(source);
 if(window.LM37&&LM37.fetchMedia)return LM37.fetchMedia(source);
 return fetch(source);
}
async function prepare(title,text,list){
 if(list.length>30)throw Error('Limite de 30 fotos por compartilhamento.');
 let blob;
 if(list.length===1){
  const r=await loadMedia(list[0].url);
  if(!r.ok)throw Error('Não foi possível carregar a foto.');
  blob=await r.blob();
  if(!blob.size||!blob.type.startsWith('image/'))throw Error('Uma evidência não é uma foto.');
 }else{
  const image=await compose(list);
  const r=await fetch(image.url);blob=await r.blob();
 }
 const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[blob.type]||'jpg';
 return {title,text,files:[new File([blob],'Antes_Depois.'+ext,{type:blob.type})]};
}
function readyDialog(data){
 const dialog=document.createElement('dialog');dialog.id='lm-share44-ready';
 dialog.style.cssText='width:min(90vw,440px);padding:22px;border:1px solid #b7c7d8;border-radius:16px;font:16px Arial;color:#12304b';
 const status=document.createElement('p');status.textContent='Relatório e fotos agrupadas prontos para compartilhar.';
 const share=document.createElement('button');share.textContent='Compartilhar';
 share.style.cssText='width:100%;padding:14px;background:#195578;color:white;border:0;border-radius:10px;font:inherit;font-weight:700';
 const close=document.createElement('button');close.textContent='Fechar';close.style.cssText='width:100%;padding:12px;margin-top:10px;font:inherit';
 close.onclick=()=>dialog.close();
 share.onclick=async()=>{
  if(share.disabled)return;share.disabled=true;
  try{await navigator.share(data);dialog.close()}
  catch(e){if(e.name==='AbortError')dialog.close();else status.textContent='Não foi possível abrir o compartilhamento. Tente novamente.'}
  finally{share.disabled=false}
 };
 dialog.append(status,share,close);dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}
let busy=false;
const original=window.compartilharFalha;
window.compartilharFalha=async function(id){
 if(window.Android)return original(id);
 if(busy||document.getElementById('lm-share44-ready'))return;
 const x=dados.find(item=>String(item.id)===String(id));if(!x)return;
 const list=Array.isArray(x.evidencias)?x.evidencias:[];
 if(!list.length)return original(id);
 if(list.some(ev=>String(ev.tipo||ev.type||'').startsWith('video/')))return original(id);
 if(typeof confirmarEnvioRelatorio==='function'&&!confirmarEnvioRelatorio(id,'ocorrencia'))return;
 busy=true;
 const button=document.activeElement,oldText=button&&button.textContent;
 const isButton=button&&button.tagName==='BUTTON';
 const oldDisabled=isButton?button.disabled:false;
 if(isButton){button.disabled=true;button.textContent='Preparando fotos…'}
 try{
  const data=await prepare(x.linha+' - '+x.equip,textoFalha(x),list);
  if(!navigator.share||!navigator.canShare||!navigator.canShare(data)){
   alert('Este navegador não permite compartilhar texto e imagem juntos. Abra no Chrome ou use o aplicativo Line Monitor 4.4.');return;
  }
  if(!navigator.userActivation||navigator.userActivation.isActive){
   try{await navigator.share(data);return}
   catch(e){if(e.name==='AbortError')return;}
  }
  readyDialog(data);
 }catch(e){alert(e.message||'Não foi possível preparar as fotos.')}
 finally{busy=false;if(isButton){button.disabled=oldDisabled;button.textContent=oldText}}
};
window.LM44Web={phase,compose,prepare,build:'4.4-T14-WEB-20261125'};
})();
