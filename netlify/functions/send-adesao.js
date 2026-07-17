import nodemailer from 'nodemailer';

console.log('>>> send-adesao.js carregado!');
console.log('>>> GMAIL_USER definido?', !!process.env.GMAIL_USER);
console.log('>>> GMAIL_PASS definido?', !!process.env.GMAIL_PASS);
console.log('>>> NOTIFICATION_EMAIL definido?', !!process.env.NOTIFICATION_EMAIL);

export default async (req) => {
  console.log('>>> Função INVOCADA');
  console.log('>>> Method:', req.method);
  console.log('>>> URL:', req.url);

  try {
    console.log('>>> Aguardando formData...');
    const data = await req.formData();
    console.log('>>> formData RECEBIDO com sucesso');

    const razaoSocial = data.get('razao_social') || '—';
    console.log('>>> razao_social:', razaoSocial);

    const fields = {
      razao_social: razaoSocial,
      cnpj: data.get('cnpj') || '—',
      endereco_empresa: data.get('endereco_empresa') || '—',
      banco: data.get('banco') || '—',
      agencia: data.get('agencia') || '—',
      conta_corrente: data.get('conta_corrente') || '—',
      regiao: data.get('regiao') || '—',
      nome_socio: data.get('nome_socio') || '—',
      nacionalidade: data.get('nacionalidade') || '—',
      rg: data.get('rg') || '—',
      cpf: data.get('cpf') || '—',
      estado_civil: data.get('estado_civil') || '—',
      profissao: data.get('profissao') || '—',
      telefone: data.get('telefone') || '—',
      email_socio: data.get('email_socio') || '—',
      endereco_socio: data.get('endereco_socio') || '—',
      tamanho_uniforme: data.get('tamanho_uniforme') || '—',
    };

    console.log('>>> Campos extraídos:', Object.keys(fields).length);

    const files = [
      { name: 'Contrato Social / Cartão CNPJ', field: data.get('doc_contrato_social') },
      { name: 'RG do sócio', field: data.get('doc_rg') },
      { name: 'CPF do sócio', field: data.get('doc_cpf') },
      { name: 'Comprovante bancário', field: data.get('doc_comprovante_bancario') },
    ];

    files.forEach(f => {
      console.log(`>>> Arquivo "${f.name}":`, f.field ? `presente (${f.field.name}, ${f.field.size} bytes)` : 'ausente');
    });

    console.log('>>> Iniciando build do email...');

    const attachments = [];
    const fileListItems = [];

    for (const f of files) {
      if (f.field && f.field.size > 0) {
        console.log(`>>> Lendo buffer do arquivo: ${f.field.name}`);
        const buffer = Buffer.from(await f.field.arrayBuffer());
        attachments.push({ filename: f.field.name, content: buffer });
        fileListItems.push(`<li><strong>${f.name}:</strong> ${f.field.name}</li>`);
      } else {
        fileListItems.push(`<li><strong>${f.name}:</strong> <em>Não anexado</em></li>`);
      }
    }

    console.log('>>> Anexos prontos:', attachments.length);

    const consents = [
      { field: data.get('consent_dedicacao'), label: 'Dedicação total' },
      { field: data.get('consent_perfil_comercial'), label: 'Perfil comercial' },
      { field: data.get('consent_relacionamento'), label: 'Relacionamento com clientes' },
      { field: data.get('consent_investimento'), label: 'Investimento' },
      { field: data.get('consent_territorialidade'), label: 'Territorialidade' },
      { field: data.get('consent_capacitacao'), label: 'Capacitação' },
      { field: data.get('consent_veracidade'), label: 'Veracidade das informações' },
      { field: data.get('consent_comunicacao'), label: 'Comunicação (FOURPAY + Fiserv)' },
      { field: data.get('consent_assinatura_digital'), label: 'Assinatura digital' },
    ];

    const consentItems = consents.map(c =>
      `<tr><td style="padding:4px 8px;color:${c.field ? '#059669' : '#dc2626'}">${c.field ? '✅' : '❌'}</td><td style="padding:4px 8px">${c.label}</td></tr>`
    ).join('');

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1d4ed8; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 1.3rem;">📋 Nova Adesão — Franqueado BIN</h1>
          <p style="margin: 4px 0 0; opacity: 0.9;">${fields.razao_social}</p>
        </div>

        <div style="padding: 24px; background: #fff; border: 1px solid #e2e8f0;">

          <h2 style="font-size: 1rem; color: #1d4ed8; margin: 0 0 12px;">Dados da Empresa</h2>
          <table style="width:100%; border-collapse:collapse; font-size:0.88rem; margin-bottom:24px;">
            ${objRow('Razão Social', fields.razao_social)}
            ${objRow('CNPJ', fields.cnpj)}
            ${objRow('Endereço', fields.endereco_empresa)}
            ${objRow('Banco', fields.banco)}
            ${objRow('Agência', fields.agencia)}
            ${objRow('Conta corrente', fields.conta_corrente)}
            ${objRow('Região', fields.regiao)}
          </table>

          <h2 style="font-size: 1rem; color: #1d4ed8; margin: 0 0 12px;">Dados do Sócio Operador</h2>
          <table style="width:100%; border-collapse:collapse; font-size:0.88rem; margin-bottom:24px;">
            ${objRow('Nome completo', fields.nome_socio)}
            ${objRow('Nacionalidade', fields.nacionalidade)}
            ${objRow('RG', fields.rg)}
            ${objRow('CPF', fields.cpf)}
            ${objRow('Estado civil', fields.estado_civil)}
            ${objRow('Profissão', fields.profissao)}
            ${objRow('Telefone', fields.telefone)}
            ${objRow('E-mail', fields.email_socio)}
            ${objRow('Endereço', fields.endereco_socio)}
            ${objRow('Uniforme', fields.tamanho_uniforme)}
          </table>

          <h2 style="font-size: 1rem; color: #1d4ed8; margin: 0 0 12px;">Documentos Anexados</h2>
          <ul style="font-size:0.88rem; margin-bottom:24px;">${fileListItems.join('')}</ul>

          <h2 style="font-size: 1rem; color: #1d4ed8; margin: 0 0 12px;">Consentimentos</h2>
          <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">${consentItems}</table>

        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 0.8rem; color: #94a3b8; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 0;">
          FOURPAY SOLUTIONS — Master Franqueado Fiserv
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
      from: `"Adesão Franqueado" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `📋 Nova Adesão — ${fields.razao_social}`,
      html,
      attachments,
    });

    console.log('>>> EMAIL ENVIADO! ID:', info.messageId);
    return new Response('OK', { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('>>> ERRO CAPTURADO:');
    console.error('>>> Nome:', error.name || 'sem nome');
    console.error('>>> Mensagem:', error.message || 'sem mensagem');
    console.error('>>> Stack:', error.stack || 'sem stack');
    return new Response(error.message || 'Erro desconhecido', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};

function objRow(label, value) {
  return `<tr><td style="padding:4px 8px; font-weight:600; color:#475569; white-space:nowrap; border-bottom:1px solid #f1f5f9;">${label}</td><td style="padding:4px 8px; border-bottom:1px solid #f1f5f9;">${value}</td></tr>`;
}

export const config = {
  path: '/send-adesao',
  method: 'POST',
};
