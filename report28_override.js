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
