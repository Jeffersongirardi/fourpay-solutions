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

    const razaoSocial = fields.razao_social || '—';

    const attachments = [];
    const fileListItems = [];

    const fileMapping = [
      { field: 'doc_contrato_social', label: 'Contrato Social / Cartão CNPJ' },
      { field: 'doc_rg', label: 'RG do sócio' },
      { field: 'doc_cpf', label: 'CPF do sócio' },
      { field: 'doc_comprovante_bancario', label: 'Comprovante bancário' },
    ];

    for (const f of fileMapping) {
      const file = files.find(ff => ff.field === f.field);
      if (file && file.buffer.length > 0) {
        attachments.push({ filename: file.name, content: file.buffer });
        fileListItems.push(`<li><strong>${f.label}:</strong> ${file.name}</li>`);
      } else {
        fileListItems.push(`<li><strong>${f.label}:</strong> <em>Não anexado</em></li>`);
      }
    }

    const consentFields = [
      { field: 'consent_dedicacao', label: 'Dedicação total' },
      { field: 'consent_perfil_comercial', label: 'Perfil comercial' },
      { field: 'consent_relacionamento', label: 'Relacionamento com clientes' },
      { field: 'consent_investimento', label: 'Investimento' },
      { field: 'consent_territorialidade', label: 'Territorialidade' },
      { field: 'consent_capacitacao', label: 'Capacitação' },
      { field: 'consent_veracidade', label: 'Veracidade das informações' },
      { field: 'consent_comunicacao', label: 'Comunicação (FOURPAY + Fiserv)' },
      { field: 'consent_assinatura_digital', label: 'Assinatura digital' },
    ];

    const consentItems = consentFields.map(c =>
      `<tr><td style="padding:4px 8px;color:${fields[c.field] ? '#059669' : '#dc2626'}">${fields[c.field] ? '\u2705' : '\u274c'}</td><td style="padding:4px 8px">${c.label}: <strong>${fields[c.field] || 'N\u00e3o consentido'}</strong></td></tr>`
    ).join('');

    function objRow(label, value) {
      return `<tr><td style="padding:4px 8px; font-weight:600; color:#475569; white-space:nowrap; border-bottom:1px solid #f1f5f9;">${label}</td><td style="padding:4px 8px; border-bottom:1px solid #f1f5f9;">${value}</td></tr>`;
    }

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1d4ed8; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 1.3rem;">\ud83d\udccb Nova Ades\u00e3o \u2014 Franqueado BIN</h1>
          <p style="margin: 4px 0 0; opacity: 0.9;">${razaoSocial}</p>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #e2e8f0;">
          <h2 style="font-size: 1rem; color: #1d4ed8; margin: 0 0 12px;">Dados da Empresa</h2>
          <table style="width:100%; border-collapse:collapse; font-size:0.88rem; margin-bottom:24px;">
            ${objRow('Raz\u00e3o Social', fields.razao_social || '\u2014')}
            ${objRow('CNPJ', fields.cnpj || '\u2014')}
            ${objRow('CEP', fields.cep || '\u2014')}
            ${objRow('Endere\u00e7o', fields.endereco_empresa || '\u2014')}
            ${objRow('Bairro', fields.bairro || '\u2014')}
            ${objRow('Cidade', fields.cidade || '\u2014')}
            ${objRow('Estado', fields.estado || '\u2014')}
            ${objRow('Pa\u00eds', fields.pais || '\u2014')}
            ${objRow('Banco', fields.banco || '\u2014')}
            ${objRow('Ag\u00eancia', fields.agencia || '\u2014')}
            ${objRow('Conta corrente', fields.conta_corrente || '\u2014')}
            ${objRow('Regi\u00e3o', fields.regiao || '\u2014')}
            ${objRow('Trajet\u00f3ria', fields.trajetoria || '\u2014')}
          </table>
          <h2 style="font-size: 1rem; color: #1d4ed8; margin: 0 0 12px;">Dados do S\u00f3cio Operador</h2>
          <table style="width:100%; border-collapse:collapse; font-size:0.88rem; margin-bottom:24px;">
            ${objRow('Nome completo', fields.nome_socio || '\u2014')}
            ${objRow('Nacionalidade', fields.nacionalidade || '\u2014')}
            ${objRow('RG', fields.rg || '\u2014')}
            ${objRow('CPF', fields.cpf || '\u2014')}
            ${objRow('Estado civil', fields.estado_civil || '\u2014')}
            ${objRow('Profiss\u00e3o', fields.profissao || '\u2014')}
            ${objRow('Telefone', fields.telefone || '\u2014')}
            ${objRow('E-mail', fields.email_socio || '\u2014')}
            ${objRow('CEP', fields.cep_socio || '\u2014')}
            ${objRow('Endere\u00e7o', fields.endereco_socio || '\u2014')}
            ${objRow('Bairro', fields.bairro_socio || '\u2014')}
            ${objRow('Cidade', fields.cidade_socio || '\u2014')}
            ${objRow('Estado', fields.estado_socio || '\u2014')}
            ${objRow('Pa\u00eds', fields.pais_socio || '\u2014')}
            ${objRow('Uniforme', fields.tamanho_uniforme || '\u2014')}
          </table>
          <h2 style="font-size: 1rem; color: #1d4ed8; margin: 0 0 12px;">Documentos Anexados</h2>
          <ul style="font-size:0.88rem; margin-bottom:24px;">${fileListItems.join('')}</ul>
          <h2 style="font-size: 1rem; color: #1d4ed8; margin: 0 0 12px;">Consentimentos</h2>
          <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">${consentItems}</table>
        </div>
        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 0.8rem; color: #94a3b8; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 0;">
          FOURPAY SOLUTIONS \u2014 Master Franqueado Fiserv
        </div>
      </div>
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
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      body: 'OK',
    };
  } catch (error) {
    console.error('>>> ERRO CAPTURADO:');
    console.error('>>> Nome:', error.name || 'sem nome');
    console.error('>>> Mensagem:', error.message || 'sem mensagem');
    console.error('>>> Stack:', error.stack || 'sem stack');

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      body: error.message || 'Erro desconhecido',
    };
  }
};
