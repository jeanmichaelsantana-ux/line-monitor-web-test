(function(){
const key='lm_alteracoes_isoladas_v2';
const esc=v=>String(v||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function records(){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
function init(){
 const area=document.getElementById('registro');if(!area)return;
 const original=Array.from(area.children).filter(el=>!el.classList.contains('page-head'));
 const head=area.querySelector('.page-head h2');if(head)head.textContent='Novo registro';
 const panel=document.createElement('div');panel.innerHTML=`
 <style>.lm-choice{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:14px 0}.lm-choice button{padding:13px 5px;background:white;color:#155584;border:1px solid #9bbdd6;border-radius:10px;font-weight:700}.lm-choice button.active{background:#155584;color:white}.lm-alter{background:white;padding:16px;border-radius:10px;margin-top:12px}.lm-alter label{margin-top:10px}.lm-alter input,.lm-alter select,.lm-alter textarea{width:100%;margin:5px 0 10px;padding:11px}.lm-alter .save{background:#155584;color:white;padding:13px;border:0;border-radius:8px;width:100%}.lm-alter .record{padding:12px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}</style>
 <div class="lm-choice"><button id="lm-occ" class="active" type="button">Registrar ocorrência</button><button id="lm-alt" type="button">Registrar alteração</button></div>
 <div id="lm-alt-panel" class="lm-alter" hidden><form id="lm-alt-form">
 <label>Categoria</label><select name="categoria"><option>Robô</option><option>PLC</option><option>PLC de Segurança</option></select>
 <label>Linha</label><input name="linha" placeholder="VL01 / VL02 / VM01..." required>
 <label>Equipamento</label><input name="equipamento" required>
 <label>Fabricante e modelo</label><input name="modelo" required>
 <label>Solicitante</label><input name="solicitante" required>
 <label>Motivo</label><textarea name="motivo" required></textarea>
 <label>Técnico</label><input name="tecnico" required>
 <label>Risco</label><textarea name="risco" required></textarea>
 <label>Pontos de montagem / alteração de programação</label><textarea name="descricao" required></textarea>
 <button class="save" type="submit">Salvar alteração</button></form>
 <h3>Histórico de alterações</h3><div id="lm-alt-history"></div>
 <small>Teste isolado: registros somente neste aparelho. Não há sincronização com Supabase nem análise real do Lino.</small></div>`;
 const ref=original[0];if(ref)area.insertBefore(panel,ref);else area.appendChild(panel);
 const show=alt=>{original.forEach(e=>e.style.display=alt?'none':'');panel.querySelector('#lm-alt-panel').hidden=!alt;panel.querySelector('#lm-occ').classList.toggle('active',!alt);panel.querySelector('#lm-alt').classList.toggle('active',alt);if(alt)render()};
 function render(){panel.querySelector('#lm-alt-history').innerHTML=records().map(r=>'<div class="record"><b>'+esc(r.categoria)+' — '+esc(r.equipamento)+'</b><div>'+esc(r.linha)+' | '+esc(r.data)+'</div><div>'+esc(r.descricao)+'</div><small>'+esc(r.tecnico)+'</small></div>').join('')||'Nenhuma alteração registrada.'}
 panel.querySelector('#lm-occ').onclick=()=>show(false);
 panel.querySelector('#lm-alt').onclick=()=>show(true);
 panel.querySelector('#lm-alt-form').onsubmit=e=>{e.preventDefault();const r=Object.fromEntries(new FormData(e.target).entries());r.data=new Date().toLocaleString('pt-BR');localStorage.setItem(key,JSON.stringify([r,...records()]));e.target.reset();render();alert('Alteração salva somente neste aparelho.')};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();