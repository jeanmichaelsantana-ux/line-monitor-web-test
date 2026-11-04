export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  const key = process.env.GEMINI_API_KEY;
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!key || !url || !anon) return res.status(503).json({ erro: 'Integração não configurada.' });
  const token = (req.headers.authorization || '').match(/^Bearer (.+)$/i)?.[1];
  if (!token) return res.status(401).json({ erro: 'Faça login no Line Monitor.' });
  try {
    const auth = await fetch(url.replace(/\/$/, '') + '/auth/v1/user', {
      headers: { Authorization: 'Bearer ' + token, apikey: anon },
      signal: AbortSignal.timeout(8000)
    });
    if (!auth.ok) return res.status(401).json({ erro: 'Sessão inválida.' });
    const pergunta = typeof req.body?.pergunta === 'string' ? req.body.pergunta.trim() : '';
    const imagem = req.body?.imagem;
    if (pergunta.length > 1500) return res.status(400).json({ erro: 'Pergunta excede 1500 caracteres.' });
    if (imagem != null && (typeof imagem !== 'object' || !['image/jpeg','image/png','image/webp'].includes(imagem.mimeType) || typeof imagem.data !== 'string' || imagem.data.length > 5500000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(imagem.data))) return res.status(400).json({ erro: 'Imagem inválida. Use JPG, PNG ou WebP até 4 MB.' });
    if (!pergunta && !imagem) return res.status(400).json({ erro: 'Envie uma pergunta ou imagem.' });
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'Você é Lino, assistente de manutenção industrial do Line Monitor. Responda em português brasileiro, com objetividade e segurança. Não invente parâmetros, alarmes, históricos ou procedimentos específicos. Quando faltar manual ou evidência, diga que precisa confirmar. Para fotos de alarmes, diagramas elétricos, telas de PLC/robôs e sistemas Vision: descreva apenas o que é legível, diferencie fatos de hipóteses, indique verificações técnicas e solicite manual/modelo quando necessário. Em NR12, nunca recomende bypass, pontes ou neutralização de proteções. Não invente endereços DI/DO, valores ou diagramas. Nunca execute comandos em máquinas.' }] },
        contents: [{ role: 'user', parts: [...(pergunta ? [{ text: pergunta }] : [{ text: 'Analise tecnicamente esta imagem, informe o que consegue ler e proponha verificações seguras.' }]), ...(imagem ? [{ inline_data: { mime_type: imagem.mimeType, data: imagem.data } }] : [])] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.3 }
      }),
      signal: AbortSignal.timeout(25000)
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ erro: 'Gemini indisponível ou chave sem acesso. Confira os logs da Vercel.' });
    const resposta = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!resposta) return res.status(502).json({ erro: 'Gemini não retornou resposta.' });
    return res.status(200).json({ resposta });
  } catch (e) {
    return res.status(502).json({ erro: 'Falha temporária de comunicação com a IA.' });
  }
}
