# Integração de download para MacroDroid

GET /api/automation/daily-report, com Authorization: Bearer CHAVE_EXCLUSIVA. Somente o hash da chave de leitura é versionado. A chave do banco permanece no ambiente da função. Para revogar a chave exclusiva, trocar o hash e publicar novamente.

200: HTML anexável com inputs cadastrados no dia anterior (created_at), fuso America/Manaus. 204: dia sem inputs; a macro deve parar sem enviar arquivo antigo. 401: autenticação inválida. 425: antes das 06:00. 502: falha de consulta; parar, sem enviar relatório anterior. O serviço não envia mensagens e não contém agendamento; a execução fica no MacroDroid.

As telas da web e da web de testes permanecem sem resumo ou botões adicionais. Usa a infraestrutura existente para consultar e gerar o documento; não exige computador local ligado. Evidências por links, exigindo internet e acesso.

Configurar na macro o HTTP GET, autenticação por cabeçalho, bloqueio das próximas ações até terminar, validação do status 200, salvamento em arquivo, verificação de dia já enviado e envio do documento a um grupo confirmado. Tela ligada/desbloqueada pode ser necessária para a interação no WhatsApp. Somente o download foi implementado; o envio e o agendamento no aparelho ainda devem ser testados.
