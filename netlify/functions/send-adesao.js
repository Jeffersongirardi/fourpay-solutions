const nodemailer = require('nodemailer');
const Busboy = require('busboy');

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  console.log('>>> send-adesao INVOCADA');
  console.log('>>> Method:', event.httpMethod);
  console.log('>>> GMAIL_USER definido?', !!process.env.GMAIL_USER);
  console.log('>>> GMAIL_PASS definido?', !!process.env.GMAIL_PASS);
  console.log('>>> NOTIFICATION_EMAIL definido?', !!process.env.NOTIFICATION_EMAIL);

  try {
    const body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';

    console.log('>>> Content-Type:', contentType);
    console.log('>>> Body length:', body.length);

    if (body.length > 10 * 1024 * 1024) {
      return {
        statusCode: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Conteúdo muito grande (máximo 5 MB total).' }),
      };
    }

    const fields = {};
    const files = [];

    await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: { 'content-type': contentType } });

      busboy.on('field', (name, val) => {
        fields[name] = val;
      });

      busboy.on('file', (fieldname, file, info) => {
        const { filename, mimeType } = info;
        const chunks = [];
        file.on('data', (chunk) => chunks.push(chunk));
        file.on('end', () => {
          files.push({
            field: fieldname,
            name: filename,
            type: mimeType,
            buffer: Buffer.concat(chunks),
          });
        });
      });

      busboy.on('finish', resolve);
      busboy.on('error', reject);
      busboy.end(body);
    });

    console.log('>>> Campos recebidos:', Object.keys(fields).length);
    console.log('>>> Arquivos recebidos:', files.length);

    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 5 * 1024 * 1024;

    for (const file of files) {
      if (file.buffer.length === 0) continue;
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, message: 'Apenas arquivos PDF são aceitos.' }),
        };
      }
      if (file.buffer.length > MAX_FILE_SIZE) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, message: 'Arquivo excede 2 MB.' }),
        };
      }
    }

    var totalSize = files.reduce(function (sum, f) { return sum + f.buffer.length; }, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Total dos anexos excede 5 MB.' }),
      };
    }

    var requiredFields = ['razao_social', 'cnpj', 'cep', 'endereco_empresa', 'bairro', 'cidade', 'estado', 'banco', 'agencia', 'conta_corrente', 'regiao', 'nome_socio', 'nacionalidade', 'rg', 'cpf', 'estado_civil', 'profissao', 'telefone', 'email_socio', 'cep_socio', 'endereco_socio', 'bairro_socio', 'cidade_socio', 'estado_socio', 'tamanho_uniforme'];
    var missing = requiredFields.filter(function (f) { return !fields[f] || !String(fields[f]).trim(); });
    if (missing.length > 0) {
      console.log('>>> Campos obrigatórios faltando:', missing.join(', '));
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Campos obrigatórios não preenchidos.' }),
      };
    }

    var consentRequired = ['consent_dedicacao', 'consent_perfil_comercial', 'consent_relacionamento', 'consent_investimento', 'consent_territorialidade', 'consent_capacitacao', 'consent_veracidade', 'consent_comunicacao', 'consent_assinatura_digital'];
    var missingConsents = consentRequired.filter(function (c) { return !fields[c]; });
    if (missingConsents.length > 0) {
      console.log('>>> Consentimentos faltando:', missingConsents.join(', '));
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Todos os consentimentos devem ser marcados.' }),
      };
    }

    var requiredDocs = ['doc_contrato_social', 'doc_comprovante_bancario'];
    var idOption = fields.id_option || 'rg_cpf';
    if (idOption === 'rg_cpf') {
      var hasRG = files.some(function (f) { return f.field === 'doc_rg' && f.buffer.length > 0; });
      var hasCPF = files.some(function (f) { return f.field === 'doc_cpf' && f.buffer.length > 0; });
      if (!hasRG && !hasCPF) requiredDocs.push('doc_rg');
    } else {
      requiredDocs.push('doc_cnh');
    }
    var missingDocs = requiredDocs.filter(function (d) {
      return !files.some(function (f) { return f.field === d && f.buffer.length > 0; });
    });
    if (missingDocs.length > 0) {
      console.log('>>> Documentos faltando:', missingDocs.join(', '));
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Documentos obrigatórios não anexados.' }),
      };
    }

    const razaoSocial = fields.razao_social || '—';

    const attachments = [];
    const fileListItems = [];

    let fileMapping = [
      { field: 'doc_contrato_social', label: 'Contrato Social / Cartão CNPJ' },
      { field: 'doc_rg', label: 'RG do sócio' },
      { field: 'doc_cpf', label: 'CPF do sócio' },
      { field: 'doc_cnh', label: 'CNH (substitui RG/CPF)' },
      { field: 'doc_comprovante_bancario', label: 'Comprovante bancário' },
    ];

    if (idOption === 'rg_cpf') {
      fileMapping = fileMapping.filter(function (f) { return f.field !== 'doc_cnh'; });
    } else {
      fileMapping = fileMapping.filter(function (f) { return f.field !== 'doc_rg' && f.field !== 'doc_cpf'; });
    }

    for (const f of fileMapping) {
      const file = files.find(ff => ff.field === f.field);
      if (file && file.buffer.length > 0) {
        attachments.push({ filename: file.name, content: file.buffer });
        fileListItems.push(`<tr><td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;color:#059669;width:20px;">\ud83d\udcc4</td><td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;color:#0f172a;"><strong>${f.label}:</strong> ${file.name}</td></tr>`);
      } else {
        fileListItems.push(`<tr><td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;color:#dc2626;width:20px;">\u274c</td><td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;color:#94a3b8;"><strong>${f.label}:</strong> <em>Não anexado</em></td></tr>`);
      }
    }

    const consentFields = [
      { field: 'consent_dedicacao', label: 'Dedicação total', question: 'Você entende que o modelo de negócios exige dedicação integral e que há uma performance mínima exigida da unidade franqueada?' },
      { field: 'consent_perfil_comercial', label: 'Perfil comercial', question: 'Você está ciente de que a franquia BIN exige atuação comercial ativa, com prospecção constante de novos clientes e desenvolvimento de carteira?' },
      { field: 'consent_relacionamento', label: 'Relacionamento com clientes', question: 'Você se compromete a manter relacionamento contínuo com sua base de clientes, prestando suporte, acompanhamento e garantindo a satisfação?' },
      { field: 'consent_investimento', label: 'Investimento', question: 'Você declara ter ciência de que o investimento inclui capital de giro e que não há garantia de faturamento mínimo?' },
      { field: 'consent_territorialidade', label: 'Territorialidade', question: 'Você concorda em respeitar a política de territorialidade e não atuar fora da região designada pela franqueadora?' },
      { field: 'consent_capacitacao', label: 'Capacitação', question: 'Você se compromete a participar integralmente dos treinamentos e capacitações promovidos pela Master Franquia?' },
      { field: 'consent_veracidade', label: 'Veracidade das informações', question: 'Você declara que todas as informações prestadas neste formulário são verdadeiras e assume integral responsabilidade pelas mesmas?' },
      { field: 'consent_comunicacao', label: 'Comunicação (FOURPAY + Fiserv)', question: 'Você autoriza a FOURPAY SOLUTIONS e a Fiserv a utilizar os dados fornecidos para contato, análise de perfil e comunicação sobre o processo de franquia?' },
      { field: 'consent_assinatura_digital', label: 'Assinatura digital', question: 'Você concorda que o envio deste formulário equivale à sua assinatura digital para todos os efeitos legais?' },
    ];

    const consentItems = consentFields.map(c => {
      const answered = !!fields[c.field];
      const answer = fields[c.field] || 'Não consentido';
      const color = answered ? '#059669' : '#dc2626';
      const icon = answered ? '\u2705' : '\u274c';
      return `<tr><td style="padding:5px 6px;border-bottom:1px solid #f1f5f9;">
        <div style="color:${color};font-weight:700;">${icon} ${c.label}</div>
        <div style="color:#475569;font-size:0.82rem;margin:2px 0 0 16px;line-height:1.35;">${c.question}</div>
        <div style="color:${color};font-weight:600;font-size:0.82rem;margin:2px 0 0 16px;">Resposta: ${answer}</div>
      </td></tr>`;
    }).join('');

    function row(label, value) {
      const v = value || '\u2014';
      return `<tr><td style="padding:3px 6px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;width:130px;">${label}</td><td style="padding:3px 6px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${v}</td></tr>`;
    }

    const html = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#e2e8f0;padding:40px 20px;font-family:Inter,Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background-color:#1d4ed8;padding:24px 28px;color:#ffffff;">
            <span style="font-size:1.25rem;font-weight:700;">\ud83d\udccb Nova Ades\u00e3o \u2014 Franqueado BIN</span><br>
            <span style="font-size:0.88rem;opacity:0.85;">${razaoSocial}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 16px;">

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:8px;">
              <tr><td style="font-size:0.85rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;border-bottom:2px solid #dbeafe;" colspan="2">\ud83c\udfe2 Dados da Empresa</td></tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:0.85rem;">
              ${row('Raz\u00e3o Social', fields.razao_social)}
              ${row('CNPJ', fields.cnpj)}
              ${row('CEP', fields.cep)}
              ${row('Endere\u00e7o', fields.endereco_empresa)}
              ${row('Bairro', fields.bairro)}
              ${row('Cidade', fields.cidade)}
              ${row('Estado', fields.estado)}
              ${row('Pa\u00eds', fields.pais)}
              ${row('Banco', fields.banco)}
              ${row('Ag\u00eancia', fields.agencia)}
              ${row('Conta corrente', fields.conta_corrente)}
              ${row('Regi\u00e3o', fields.regiao)}
              ${row('Trajet\u00f3ria', fields.trajetoria)}
            </table>

            <div style="height:20px;font-size:1px;">&nbsp;</div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:8px;">
              <tr><td style="font-size:0.85rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;border-bottom:2px solid #dbeafe;" colspan="2">\ud83d\udc64 Dados do S\u00f3cio Operador</td></tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:0.85rem;">
              ${row('Nome completo', fields.nome_socio)}
              ${row('Nacionalidade', fields.nacionalidade)}
              ${row('RG', fields.rg)}
              ${row('CPF', fields.cpf)}
              ${row('Estado civil', fields.estado_civil)}
              ${row('Profiss\u00e3o', fields.profissao)}
              ${row('Telefone', fields.telefone)}
              ${row('E-mail', fields.email_socio)}
              ${row('CEP', fields.cep_socio)}
              ${row('Endere\u00e7o', fields.endereco_socio)}
              ${row('Bairro', fields.bairro_socio)}
              ${row('Cidade', fields.cidade_socio)}
              ${row('Estado', fields.estado_socio)}
              ${row('Pa\u00eds', fields.pais_socio)}
              ${row('Uniforme', fields.tamanho_uniforme)}
            </table>

            <div style="height:20px;font-size:1px;">&nbsp;</div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:8px;">
              <tr><td style="font-size:0.85rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;border-bottom:2px solid #dbeafe;" colspan="2">\ud83d\udcce Documentos Anexados</td></tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:0.85rem;">
              ${fileListItems.join('')}
            </table>

            <div style="height:20px;font-size:1px;">&nbsp;</div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:8px;">
              <tr><td style="font-size:0.85rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;border-bottom:2px solid #dbeafe;" colspan="2">\u2705 Consentimentos</td></tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:0.85rem;">
              ${consentItems}
            </table>

          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:14px 28px;text-align:center;font-size:0.78rem;color:#94a3b8;border-top:1px solid #e2e8f0;">
            FOURPAY SOLUTIONS \u2014 Master Franqueado Fiserv<br>
            <span style="font-size:0.75rem;">Este \u00e9 um e-mail autom\u00e1tico. N\u00e3o responda a esta mensagem.</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

    console.log('>>> HTML do email gerado');
    console.log('>>> Conectando ao SMTP Gmail...');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log('>>> Transportador criado. Enviando email...');
    console.log('>>> PARA:', process.env.NOTIFICATION_EMAIL);
    console.log('>>> DE:', process.env.GMAIL_USER);

    const info = await transporter.sendMail({
      from: `"Ades\u00e3o Franqueado" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `\ud83d\udccb Nova Ades\u00e3o \u2014 ${razaoSocial}`,
      html,
      attachments,
    });

    console.log('>>> EMAIL ENVIADO! ID:', info.messageId);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: 'Adesão enviada com sucesso.' }),
    };
  } catch (error) {
    console.error('>>> ERRO CAPTURADO:');
    console.error('>>> Nome:', error.name || 'sem nome');
    console.error('>>> Mensagem:', error.message || 'sem mensagem');
    console.error('>>> Stack:', error.stack || 'sem stack');

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Erro ao processar envio.' }),
    };
  }
};
