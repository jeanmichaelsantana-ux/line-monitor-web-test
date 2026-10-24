# Relatório HTML dos inputs — 06:00

Na tela Início da versão web de testes, use “Relatório HTML · 06:00”. O relatório pode ser visualizado, salvo e compartilhado como arquivo HTML nos grupos do WhatsApp.

## Regra configurada

- America/Manaus, a partir das 06:00.
- Inputs cadastrados (`created_at`) no dia anterior: 00:00 inclusive até 00:00 do dia seguinte exclusive. Uma atividade iniciada em outra data entra se o cadastro ocorreu no dia consultado.
- Dias sem registros: nenhum HTML é gerado; sem alerta ou envio.
- Campos: linha, equipamento, tipo, status, responsável, cadastro, início/fim, duração registrada, ocorrência, causa, ação e resolução, quando disponível.
- Textos preservados conforme cadastro. Situação atual no instante da geração.
- Evidências por links, quando existentes; exigem conexão e permissão. As mídias não são embutidas no HTML.
- Consulta completa e paginada ao servidor. Falhas não viram dias vazios e não geram relatório parcial.
- “Atualizar dados” gera novamente a consulta do dia anterior.
- “Salvar HTML” solicita download. “Compartilhar HTML” usa compartilhamento nativo de arquivo; quando indisponível, salvar e anexar como documento no WhatsApp.
- O usuário escolhe os grupos e confirma o envio. Abrir a folha de compartilhamento não confirma entrega.

## Execução no celular

Uma página web fechada não desperta o celular às 06:00. A geração automática acontece com a página aberta/visível, ou quando o usuário reabre/retorna após 06:00. O arquivo fica pronto em memória até salvar ou compartilhar. Uma rotina pontual com tela bloqueada exige agendamento nativo Android, ainda não incluído. Esta alteração não modifica o APK instalado.

O armazenamento local guarda apenas a opção de ativação e o marcador de dia vazio. O relatório e os dados técnicos ficam em memória até o usuário salvar o arquivo. Nenhuma ocorrência é gravada no backend por esse recurso.

## Validação

- `node daily-summary.test.cjs`: horário de Manaus, viradas de dia/mês/ano e ano bissexto, limites do período, dias vazios, exclusão, duplicatas, campos, HTML com texto escapado, links e paginação/erros.
- `node daily-summary-ui.test.cjs`: preparação HTML, prévia, download, compartilhamento de arquivo, navegador incompatível, cancelamento e falhas, com DOM simulado.
- Teste visual e compartilhamento em aparelhos reais continuam necessários; o ambiente local não possui navegador Chromium instalado.
