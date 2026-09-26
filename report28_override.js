(function(){
  window.gerarRelatorioDiario = function(id){
    var ocorrencia = dados.find(function(item){
      return String(item.id) === String(id);
    });

    if(!ocorrencia){
      alert('Ocorrência não encontrada.');
      return;
    }

    try{
      localStorage.setItem(
        'line_monitor_ocorrencia_relatorio_diario',
        JSON.stringify(ocorrencia)
      );
      window.location.assign(
        new URL('./relatorio_diario_padrao.html', window.location.href).href
      );
    }catch(error){
      console.error('Erro ao abrir Relatório Diário:', error);
      alert('Não foi possível preparar o Relatório Diário. Tente novamente.');
    }
  };
})();
