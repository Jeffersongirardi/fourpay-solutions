const nodemailer = require('nodemailer');
const Busboy = require('busboy');

// Adesão MEDPREV — Clover Flex (teste local, sem commit em produção ainda)
exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };

  try {
    const body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    if (body.length > 10 * 1024 * 1024) {
      return { statusCode: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, message: 'Conteúdo muito grande (máximo 5 MB).' }) };
    }

    const fields = {};
    const files = [];
    await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: { 'content-type': contentType } });
      busboy.on('field', (name, val) => { fields[name] = val; });
      busboy.on('file', (fieldname, file, info) => {
        const { filename, mimeType } = info;
        const chunks = [];
        file.on('data', (c) => chunks.push(c));
        file.on('end', () => files.push({ field: fieldname, name: filename, type: mimeType, buffer: Buffer.concat(chunks) }));
      });
      busboy.on('finish', resolve);
      busboy.on('error', reject);
      busboy.end(body);
    });

    const required = ['cnpj', 'razao_social', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'telefone_loja', 'celular', 'banco', 'agencia', 'conta_corrente', 'qtd_clover_flex', 'antecipacao_automatica', 'link_pagamento'];
    const missing = required.filter((f) => !fields[f] || !String(fields[f]).trim());
    if (missing.length) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, message: 'Campos obrigatórios faltando: ' + missing.join(', ') }) };
    }
    if (!fields.consent_veracidade || !fields.consent_comunicacao) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, message: 'É preciso aceitar os 2 consentimentos.' }) };
    }
    // sócios_json: ao menos 1 válido
    let socios = [];
    try { socios = JSON.parse(fields.socios_json || '[]'); } catch (e) { socios = []; }
    if (!socios.length || !socios[0].nome || !socios[0].cpf) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, message: 'Cadastre ao menos 1 sócio com nome e CPF.' }) };
    }
    // comprovante: pdf ou imagem até 5MB
    const comp = files.find((f) => f.field === 'doc_comprovante_bancario' && f.buffer.length > 0);
    if (!comp) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, message: 'Anexe o comprovante bancário.' }) };
    }
    const okType = comp.type === 'application/pdf' || comp.type.startsWith('image/') || /\.(pdf|jpg|jpeg|png)$/i.test(comp.name);
    if (!okType) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, message: 'Comprovante deve ser PDF ou imagem (JPG/PNG).' }) };
    }
    if (comp.buffer.length > 5 * 1024 * 1024) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, message: 'Comprovante excede 5 MB.' }) };
    }

    let horario = [];
    try { horario = JSON.parse(fields.horario_json || '[]'); } catch (e) { horario = []; }
    const diaNomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const horarioTxt = horario.map((h, i) => (diaNomes[i] || i) + ': ' + (h.fechado ? 'Fechado' : (h.abre || '—') + '–' + (h.fecha || '—'))).join(' | ');
    const sociosTxt = socios.map((s, i) => 'Sócio ' + (i + 1) + ': ' + s.nome + ' · CPF ' + s.cpf + ' · Nasc ' + (s.nasc || '—') + ' · ' + s.email).join('<br>');

    const planoTxt = fields.plano_escolhido === 'com_antecipacao'
      ? 'Plano 2 — com antecipação 1,44% (Clover Flex R$ 79,00/mês + isenção por faturamento)'
      : 'Plano 1 — sem antecipação (Clover Flex R$ 99,00/mês)';
    function row(l, v) { return '<tr><td style="padding:3px 6px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;width:150px;">' + l + '</td><td style="padding:3px 6px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">' + (v || '—') + '</td></tr>'; }
    const html =
      '<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;">' +
      '<h2 style="background:#1d4ed8;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0;margin:0;">🏥 Nova Adesão MEDPREV — ' + (fields.razao_social || '') + '</h2>' +
      '<div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:18px 22px;">' +
      '<table style="width:100%;font-size:.85rem;" cellpadding="0" cellspacing="0">' +
      row('Plano', planoTxt) + row('CNPJ', fields.cnpj) + row('Unidade', fields.unidade) +
      row('Endereço', fields.rua + ', ' + fields.numero + ' ' + (fields.complemento || '')) +
      row('Bairro/CEP', fields.bairro + ' · ' + fields.cep) + row('Cidade/UF', fields.cidade + '/' + fields.estado) +
      row('Tel loja / Cel', fields.telefone_loja + ' · ' + fields.celular) +
      row('Horário', horarioTxt) +
      '</table><p style="font-size:.85rem;"><strong>Sócios:</strong><br>' + sociosTxt + '</p>' +
      '<table style="width:100%;font-size:.85rem;" cellpadding="0" cellspacing="0">' +
      row('Banco/Ag/Conta', fields.banco + ' · ' + fields.agencia + ' · ' + fields.conta_corrente) +
      row('Qtd. Clover Flex', fields.qtd_clover_flex) +
      row('Antecipação', fields.antecipacao_automatica) + row('Link pagamento', fields.link_pagamento) +
      '</table><p style="color:#94a3b8;font-size:.75rem;">FOURPAY SOLUTIONS — página de teste MEDPREV.</p>' +
      '</div></div>';

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({
      from: '"Adesão MEDPREV" <' + process.env.GMAIL_USER + '>',
      to: process.env.MEDPREV_EMAIL || process.env.NOTIFICATION_EMAIL,
      subject: '🏥 Nova Adesão MEDPREV — ' + (fields.razao_social || ''),
      html,
      attachments: [{ filename: comp.name, content: comp.buffer }],
    });

    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, message: 'Adesão MEDPREV enviada.' }) };
  } catch (error) {
    console.error('send-adesao-medprev erro:', error.message);
    return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, message: 'Erro ao processar envio.' }) };
  }
};
