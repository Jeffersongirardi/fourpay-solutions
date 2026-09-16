// Adesão MEDPREV — lógica dedicada (não interfere no adesao franqueado)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('medprevForm');
  if (!form) return;

  // ---- Plano -> hidden + resumo + detalhe visível ----
  const planCards = document.querySelectorAll('.plan-card');
  const planoHidden = document.getElementById('plano_escolhido');
  const planoResumoTxt = document.getElementById('planoResumoTxt');
  function showPlanoDetalhe(v) {
    ['sem_antecipacao', 'com_antecipacao'].forEach(k => {
      const el = document.getElementById('detalhe-' + k);
      if (el) el.hidden = k !== v;
    });
  }
  function applyPlano(v) {
    planCards.forEach(c => c.classList.toggle('selected', c.getAttribute('data-plan') === v));
    const card = document.querySelector('.plan-card[data-plan="' + v + '"]');
    const radio = card ? card.querySelector('input[type="radio"]') : null;
    if (radio) radio.checked = true;
    if (planoHidden) planoHidden.value = v;
    if (planoResumoTxt) planoResumoTxt.textContent = v === 'com_antecipacao' ? 'Plano 2 — com antecipação 1,44%' : 'Plano 1 — sem antecipação';
    showPlanoDetalhe(v);
    updateIsenHint();
    updateOportunidade();
  }
  planCards.forEach(card => {
    card.addEventListener('click', () => {
      applyPlano(card.getAttribute('data-plan'));
      saveMedprev();
    });
  });
  showPlanoDetalhe((planoHidden && planoHidden.value) || 'com_antecipacao');

  // ---- Tooltip "!" da isenção ----
  document.querySelectorAll('.info-tip').forEach(tip => {
    const btn = tip.querySelector('.info-btn');
    const pop = tip.querySelector('.info-pop');
    if (!btn || !pop) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = pop.hidden;
      document.querySelectorAll('.info-pop').forEach(p => p.hidden = true);
      document.querySelectorAll('.info-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.info-pop').forEach(p => p.hidden = true);
    document.querySelectorAll('.info-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.info-pop').forEach(p => p.hidden = true);
      document.querySelectorAll('.info-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }
  });

  // ---- Horário Seg-Dom ----
  const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const grid = document.getElementById('horarioGrid');
  dias.forEach((d, i) => {
    const row = document.createElement('div');
    row.className = 'horario-row' + (i >= 5 ? ' fechado' : '');
    row.innerHTML =
      '<span class="dia">' + d + '</span>' +
      '<input type="time" name="h_abre_' + i + '" value="' + (i < 5 ? '08:00' : '') + '" aria-label="Abre ' + d + '" />' +
      '<input type="time" name="h_fecha_' + i + '" value="' + (i < 5 ? '18:00' : '') + '" aria-label="Fecha ' + d + '" />' +
      '<label class="mini-check"><input type="checkbox" name="h_fechado_' + i + '"' + (i >= 5 ? ' checked' : '') + ' /> Fechado</label>';
    grid.appendChild(row);
    const cb = row.querySelector('input[type="checkbox"]');
    cb.addEventListener('change', () => {
      row.classList.toggle('fechado', cb.checked);
      saveMedprev();
    });
    row.querySelectorAll('input[type="time"]').forEach(t => t.addEventListener('change', saveMedprev));
  });
  document.getElementById('btnReplica').addEventListener('click', () => {
    const abre = form.querySelector('[name="h_abre_0"]').value;
    const fecha = form.querySelector('[name="h_fecha_0"]').value;
    for (let i = 1; i <= 4; i++) {
      form.querySelector('[name="h_abre_' + i + '"]').value = abre;
      form.querySelector('[name="h_fecha_' + i + '"]').value = fecha;
      form.querySelector('[name="h_fechado_' + i + '"]').checked = false;
      form.querySelector('[name="h_fechado_' + i + '"]').closest('.horario-row').classList.remove('fechado');
    }
    saveMedprev();
  });

  // ---- Sócios dinâmicos ----
  const list = document.getElementById('sociosList');
  let socioCount = 0;
  function addSocio(data) {
    if (socioCount >= 4) return;
    socioCount++;
    const idx = socioCount;
    const div = document.createElement('div');
    div.className = 'socio-card';
    div.dataset.idx = idx;
    div.innerHTML =
      '<h4>Sócio ' + idx + (idx > 1 ? ' <button type="button" class="socio-remove">Remover</button>' : '') + '</h4>' +
      '<div class="form-row"><div class="form-group"><label>Nome completo *</label><input type="text" name="socio_nome_' + idx + '" required maxlength="120" value="' + (data?.nome || '') + '" /></div>' +
      '<div class="form-group"><label>CPF *</label><input type="text" name="socio_cpf_' + idx + '" class="mask-cpf" required placeholder="000.000.000-00" value="' + (data?.cpf || '') + '" /></div></div>' +
      '<div class="form-row"><div class="form-group"><label>Data nascimento *</label><input type="date" name="socio_nasc_' + idx + '" required value="' + (data?.nasc || '') + '" /></div>' +
      '<div class="form-group"><label>E-mail *</label><input type="email" name="socio_email_' + idx + '" class="mask-email" required value="' + (data?.email || '') + '" /></div></div>';
    list.appendChild(div);
    // aplica máscara CPF no novo campo
    const cpf = div.querySelector('.mask-cpf');
    cpf.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '');
      v = v.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
      this.value = v.substring(0, 14);
    });
    div.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', saveMedprev);
      el.addEventListener('change', saveMedprev);
    });
    const rm = div.querySelector('.socio-remove');
    if (rm) rm.addEventListener('click', () => { div.remove(); renumberSocios(); saveMedprev(); });
  }
  function renumberSocios() {
    const cards = list.querySelectorAll('.socio-card');
    socioCount = cards.length;
    cards.forEach((c, i) => {
      const n = i + 1;
      c.dataset.idx = n;
      c.querySelector('h4').childNodes[0].textContent = 'Sócio ' + n + ' ';
    });
  }
  document.getElementById('btnAddSocio').addEventListener('click', () => addSocio());
  addSocio();

  // ---- ViaCEP autofill ----
  const cepEl = document.getElementById('mp_cep');
  cepEl.addEventListener('blur', async () => {
    const cep = cepEl.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const r = await fetch('https://viacep.com.br/ws/' + cep + '/json/');
      const j = await r.json();
      if (j.erro) return;
      const set = (id, v) => { const el = document.getElementById(id); if (el && v && !el.value) el.value = v; };
      set('mp_rua', j.logradouro); set('mp_bairro', j.bairro); set('mp_cidade', j.localidade); set('mp_estado', j.uf);
      saveMedprev();
    } catch (e) {}
  });

  // ---- Banco "Outro" -> caixa de texto ----
  const bancoSel = document.getElementById('mp_banco');
  const bancoOutro = document.getElementById('mp_banco_outro');
  function toggleBancoOutro() {
    const isOutro = bancoSel && bancoSel.value === 'Outro';
    if (bancoOutro) {
      bancoOutro.style.display = isOutro ? '' : 'none';
      bancoOutro.required = !!isOutro;
      if (!isOutro) { bancoOutro.value = ''; bancoOutro.style.borderColor = ''; }
    }
  }
  function bancoNome() {
    if (bancoSel && bancoSel.value === 'Outro' && bancoOutro) return bancoOutro.value || 'Outro';
    const el = form.querySelector('[name="banco"]');
    return (el && el.value) || '—';
  }
  if (bancoSel) bancoSel.addEventListener('change', () => { toggleBancoOutro(); saveMedprev(); });
  toggleBancoOutro();

  // ---- Faturamento -> dica de isenção ----
  const fatSel = document.getElementById('mp_faturamento');
  const isenHint = document.getElementById('isenHint');
  const ISENCAO = { ate_30: 0, '30_50': 1, '50_85': 2, '85_125': 3, acima_125: 4 };
  function updateIsenHint() {
    if (!isenHint) return;
    const plano = planoHidden ? planoHidden.value : 'com_antecipacao';
    const n = fatSel && fatSel.value ? (ISENCAO[fatSel.value] ?? 0) : null;
    if (n === null) { isenHint.textContent = ''; return; }
    if (plano !== 'com_antecipacao') {
      isenHint.textContent = 'A isenção por faturamento vale para o Plano 2 (com antecipação).';
    } else if (n === 0) {
      isenHint.textContent = 'Abaixo de R$ 30 mil/mês: sem isenção — vale avaliar o Plano 1.';
    } else {
      isenHint.textContent = 'Com essa faixa, sua loja garante ' + n + ' mensalidade' + (n > 1 ? 's' : '') + ' isenta' + (n > 1 ? 's' : '') + ' no Plano 2.';
    }
  }
  if (fatSel) fatSel.addEventListener('change', () => { updateIsenHint(); updateOportunidade(); saveMedprev(); });

  // ---- Indicador de oportunidade (Plano 1 + faixa com isenção) ----
  const oportBox = document.getElementById('oportBox');
  function updateOportunidade() {
    if (!oportBox) return;
    const plano = planoHidden ? planoHidden.value : 'com_antecipacao';
    const n = fatSel && fatSel.value ? (ISENCAO[fatSel.value] ?? 0) : 0;
    if (plano === 'sem_antecipacao' && n > 0) {
      oportBox.hidden = false;
      oportBox.innerHTML =
        '<strong>💡 Oportunidade:</strong> com esse faturamento, o <strong>Plano 2</strong> te dá ' + n + ' mensalidade' + (n > 1 ? 's' : '') + ' isenta' + (n > 1 ? 's' : '') + ' + antecipação automática de 1,44%.' +
        ' <button type="button" class="btn btn-primary btn-sm" id="btnTrocaPlano">Trocar para o Plano 2</button>';
      document.getElementById('btnTrocaPlano').addEventListener('click', () => {
        applyPlano('com_antecipacao');
        saveMedprev();
        oportBox.innerHTML = '<strong>✅ Pronto!</strong> Plano 2 ativo — revisão e e-mail atualizados.';
      });
    } else {
      oportBox.hidden = true;
      oportBox.innerHTML = '';
    }
  }
  updateOportunidade();

  // ---- Qty steppers ----
  document.querySelectorAll('[data-qty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.getAttribute('data-qty'));
      let v = parseInt(inp.value || '0') + parseInt(btn.getAttribute('data-d'));
      v = Math.max(parseInt(inp.min || '0'), Math.min(parseInt(inp.max || '20'), v));
      inp.value = v;
      saveMedprev();
    });
  });

  // ---- Stepper 4 passos ----
  const steps = form.querySelectorAll('.stepper-content');
  const navSteps = document.querySelectorAll('#adesao-medprev .stepper-step');
  const lines = document.querySelectorAll('#adesao-medprev .stepper-line');
  let current = 1;
  function updateProgress(n) {
    document.getElementById('progressFill').style.width = Math.round((n / 4) * 100) + '%';
    document.getElementById('stepNum').textContent = n;
  }
  function showStep(n) {
    steps.forEach(s => s.classList.remove('active'));
    navSteps.forEach(s => s.classList.remove('active'));
    form.querySelector('.stepper-content[data-step="' + n + '"]').classList.add('active');
    const nav = document.querySelector('#adesao-medprev .stepper-step[data-step="' + n + '"]');
    if (nav) nav.classList.add('active');
    navSteps.forEach(s => s.classList.toggle('done', parseInt(s.dataset.step) < n));
    lines.forEach((l, i) => l.classList.toggle('done', i < n - 1));
    current = n; updateProgress(n);
    if (n === 4) buildReview();
    form.querySelector('.stepper-content[data-step="' + n + '"]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function markError(field) {
    const g = field.closest('.form-group') || field.closest('.socio-card');
    if (!g) return;
    field.style.borderColor = '#dc2626';
  }
  function validateStep(n) {
    const el = form.querySelector('.stepper-content[data-step="' + n + '"]');
    let ok = true;
    el.querySelectorAll('[required]').forEach(f => {
      if (f.disabled) return;
      f.style.borderColor = '';
      if (f.type === 'file') { if (!f.files.length) { ok = false; f.closest('.file-input-wrapper').style.borderColor = '#dc2626'; } }
      else if (f.type === 'checkbox') { if (!f.checked) { ok = false; f.closest('.consent-item').style.borderColor = '#dc2626'; } else f.closest('.consent-item').style.borderColor = ''; }
      else if (f.type === 'radio') {
        const grp = el.querySelectorAll('input[name="' + f.name + '"]');
        const any = Array.from(grp).some(r => r.checked);
        if (!any) ok = false;
      }
      else if (!String(f.value || '').trim()) { ok = false; markError(f); }
      else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim())) { ok = false; markError(f); }
    });
    // CPF sócio: ao menos 11 dígitos
    if (n === 2) {
      el.querySelectorAll('[name^="socio_cpf_"]').forEach(c => {
        if (c.value.replace(/\D/g, '').length !== 11) { ok = false; markError(c); }
      });
    }
    return ok;
  }
  form.querySelectorAll('.stepper-next').forEach(b => b.addEventListener('click', () => {
    if (!validateStep(current)) return;
    showStep(parseInt(b.dataset.next)); saveMedprev();
  }));
  form.querySelectorAll('.stepper-prev').forEach(b => b.addEventListener('click', () => showStep(parseInt(b.dataset.prev))));
  navSteps.forEach(b => b.addEventListener('click', () => {
    const t = parseInt(b.dataset.step);
    if (t < current) showStep(t);
  }));

  function val(name) {
    const el = form.querySelector('[name="' + name + '"]');
    if (!el) return '—';
    if (el.type === 'file') return el.files.length ? el.files[0].name : 'Não anexado';
    if (el.type === 'checkbox') return el.checked ? 'Sim' : 'Não';
    return el.value || '—';
  }
  function row(l, v) { return '<div class="review-row"><span class="review-label">' + l + '</span><span class="review-value">' + v + '</span></div>'; }
  function fatLabel() {
    const map = { ate_30: 'Até R$ 30 mil', '30_50': 'R$ 30 – 50 mil', '50_85': 'R$ 50 – 85 mil', '85_125': 'R$ 85 – 125 mil', acima_125: 'Acima de R$ 125 mil' };
    const v = fatSel ? fatSel.value : '';
    return (map[v] || '—');
  }
  function planoLabel() {
    return form.querySelector('[name="plano_escolhido"]').value === 'com_antecipacao'
      ? 'Plano 2 — com antecipação 1,44%'
      : 'Plano 1 — sem antecipação';
  }
  function buildReview() {
    const c = document.getElementById('reviewContent');
    let h = '<div class="review-section"><h4>Loja · ' + planoLabel() + '</h4>';
    h += row('CNPJ', val('cnpj')) + row('Razão social', val('razao_social')) + row('Unidade', val('unidade'));
    h += row('Endereço', val('rua') + ', ' + val('numero') + ' ' + val('complemento')) + row('Bairro/CEP', val('bairro') + ' · ' + val('cep')) + row('Cidade/UF', val('cidade') + '/' + val('estado'));
    h += row('Tel loja / Cel', val('telefone_loja') + ' · ' + val('celular')) + '</div>';
    h += '<div class="review-section"><h4>Horário</h4>';
    const nomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const f = form.querySelector('[name="h_fechado_' + i + '"]').checked;
      h += row(nomes[i], f ? 'Fechado' : (val('h_abre_' + i) + '–' + val('h_fecha_' + i)));
    }
    h += '</div><div class="review-section"><h4>Sócios</h4>';
    list.querySelectorAll('.socio-card').forEach((s, i) => {
      const g = n => (s.querySelector('[name^="' + n + '"]') || {}).value || '—';
      const nascRaw = s.querySelector('[name^="socio_nasc"]')?.value || '';
      const nascFmt = /^\d{4}-\d{2}-\d{2}$/.test(nascRaw) ? nascRaw.split('-').reverse().join('/') : (nascRaw || '—');
      h += row('Sócio ' + (i + 1), g('socio_nome') + ' · CPF ' + g('socio_cpf') + ' · Nasc. ' + nascFmt + ' · ' + g('socio_email'));
    });
    h += '</div><div class="review-section"><h4>Banco e pedido</h4>';
    h += row('Banco/Ag/Conta', bancoNome() + ' · ' + val('agencia') + ' · ' + val('conta_corrente'));
    h += row('Comprovante', val('doc_comprovante_bancario'));
    h += row('Qtd. Clover Flex', val('qtd_clover_flex'));
    h += row('Antecipação', planoHidden && planoHidden.value === 'com_antecipacao' ? 'Sim — Plano 2 (1,44%)' : 'Não — Plano 1') + row('Faturamento estimado', fatLabel()) + row('Link pagamento', val('link_pagamento')) + '</div>';
    c.innerHTML = h;
  }

  // ---- Persistência local ----
  function saveMedprev() {
    const data = {};
    form.querySelectorAll('[name]').forEach(el => {
      if (el.type === 'file') return;
      if (el.type === 'checkbox') data[el.name] = el.checked ? 'true' : '';
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else data[el.name] = el.value;
    });
    // sócios extras (cards 2+)
    data._socios = Array.from(list.querySelectorAll('.socio-card')).slice(1).map(s => ({
      nome: s.querySelector('[name^="socio_nome"]').value,
      cpf: s.querySelector('[name^="socio_cpf"]').value,
      nasc: s.querySelector('[name^="socio_nasc"]').value,
      email: s.querySelector('[name^="socio_email"]').value
    }));
    data._step = current;
    try { localStorage.setItem('medprevForm', JSON.stringify(data)); } catch (e) {}
  }
  function restoreMedprev() {
    let s; try { s = JSON.parse(localStorage.getItem('medprevForm')); } catch (e) {}
    if (!s) return;
    Object.keys(s).forEach(k => {
      if (k.startsWith('_')) return;
      const el = form.querySelector('[name="' + k + '"]');
      if (!el) return;
      if (el.type === 'checkbox') el.checked = s[k] === 'true';
      else if (el.type === 'radio') el.checked = el.value === s[k];
      else if (el.name.startsWith('h_') || !el.name.startsWith('socio_')) el.value = s[k];
    });
    // primeiro sócio
    const first = list.querySelector('.socio-card');
    if (first && s.socio_nome_1) {
      first.querySelector('[name^="socio_nome"]').value = s.socio_nome_1 || '';
      first.querySelector('[name^="socio_cpf"]').value = s.socio_cpf_1 || '';
      first.querySelector('[name^="socio_nasc"]').value = s.socio_nasc_1 || '';
      first.querySelector('[name^="socio_email"]').value = s.socio_email_1 || '';
    }
    (s._socios || []).forEach(d => addSocio(d));
    // re-aplica fechados
    document.querySelectorAll('.horario-row').forEach(r => {
      const cb = r.querySelector('input[type="checkbox"]');
      r.classList.toggle('fechado', cb.checked);
    });
    // plano visual + detalhe
    const p = s.plano_escolhido || 'com_antecipacao';
    applyPlano(p);
    toggleBancoOutro();
    updateIsenHint();
    if (s._step && s._step > 1 && s._step < 4) showStep(parseInt(s._step));
  }
  form.querySelectorAll('input:not([type="file"]), select').forEach(el => {
    el.addEventListener('change', saveMedprev);
    el.addEventListener('input', saveMedprev);
  });
  restoreMedprev();

  // ---- Submit ----
  form.addEventListener('submit', e => {
    e.preventDefault();
    for (let i = 1; i <= 3; i++) { if (!validateStep(i)) { showStep(i); return; } }
    const btn = form.querySelector('.btn-submit');
    const errBox = document.getElementById('medprevError');
    const okBox = document.getElementById('medprevSuccess');
    errBox.classList.remove('show');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'; }
    // serializa sócios + horário em JSON
    const socios = Array.from(list.querySelectorAll('.socio-card')).map(s => ({
      nome: s.querySelector('[name^="socio_nome"]').value,
      cpf: s.querySelector('[name^="socio_cpf"]').value,
      nasc: s.querySelector('[name^="socio_nasc"]').value,
      email: s.querySelector('[name^="socio_email"]').value
    }));
    const horario = [];
    for (let i = 0; i < 7; i++) {
      horario.push({
        abre: form.querySelector('[name="h_abre_' + i + '"]').value,
        fecha: form.querySelector('[name="h_fecha_' + i + '"]').value,
        fechado: form.querySelector('[name="h_fechado_' + i + '"]').checked
      });
    }
    const fd = new FormData(form);
    fd.set('antecipacao_automatica', planoHidden && planoHidden.value === 'com_antecipacao' ? 'sim' : 'nao');
    if (bancoSel && bancoSel.value === 'Outro' && bancoOutro) fd.set('banco', bancoOutro.value);
    fd.append('socios_json', JSON.stringify(socios));
    fd.append('horario_json', JSON.stringify(horario));
    fetch('/.netlify/functions/send-adesao-medprev', { method: 'POST', body: fd })
      .then(r => r.json().catch(() => ({ ok: false, message: 'Falha de conexão.' })).then(d => ({ ok: r.ok && d.ok, message: d.message })))
      .then(res => {
        if (!res.ok) {
          errBox.querySelector('.error-text').textContent = res.message || 'Erro ao enviar.';
          errBox.classList.add('show');
          if (btn) { btn.disabled = false; btn.innerHTML = 'Enviar adesão <i class="fas fa-paper-plane"></i>'; }
          return;
        }
        form.querySelectorAll('.stepper-content.active').forEach(s => s.style.display = 'none');
        document.querySelector('#adesao-medprev .stepper-nav').style.display = 'none';
        document.querySelector('#adesao-medprev .stepper-progress').style.display = 'none';
        okBox.classList.add('show');
        try { localStorage.removeItem('medprevForm'); } catch (e) {}
      });
  });

  // ---- Sticky CTA: esconde quando o formulário está visível ----
  const stickyCta = document.getElementById('stickyCta');
  const adesaoSection = document.getElementById('adesao-medprev');
  if (stickyCta && adesaoSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(entry => stickyCta.classList.toggle('hidden', entry.isIntersecting));
    }, { threshold: 0.08 }).observe(adesaoSection);
  }
});
