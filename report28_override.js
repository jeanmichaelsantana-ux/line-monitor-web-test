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
    dialog.showModal();
    try {
      const files = [];
      for (const [index, item] of evidence.entries()) {
        if (!dialog.open) return;
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
      if (!dialog.open) return;
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
      fallback.hidden = supported;
      share.hidden = !supported;
      status.textContent = supported ? 'Evidências prontas. Toque para escolher o WhatsApp.' : 'Copie o texto e baixe as evidências para anexar no WhatsApp.';
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
    } catch (error) {
      status.textContent = error.message || 'Não foi possível preparar as evidências.';
    } finally { preparing = false; }
  };
})();
