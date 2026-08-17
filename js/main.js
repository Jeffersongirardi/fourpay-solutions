document.addEventListener('DOMContentLoaded', () => {

  // ===== Navbar scroll effect =====
  const navbar = document.querySelector('.navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });

  // ===== Mobile menu =====
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });
  }

  // ===== Scroll suave para links internos =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Animação ao scroll (IntersectionObserver) =====
  const animateElements = document.querySelectorAll('.animate');

  if (animateElements.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    animateElements.forEach(el => observer.observe(el));
  } else {
    animateElements.forEach(el => el.classList.add('visible'));
  }

  // ===== Máscaras de input =====
  function applyMasks() {
    document.querySelectorAll('.mask-cnpj').forEach(input => {
      input.addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '');
        val = val.replace(/^(\d{2})(\d)/, '$1.$2');
        val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        val = val.replace(/\.(\d{3})(\d)/, '.$1/$2');
        val = val.replace(/(\d{4})(\d)/, '$1-$2');
        this.value = val.substring(0, 18);
      });
    });

    document.querySelectorAll('.mask-cpf').forEach(input => {
      input.addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '');
        val = val.replace(/^(\d{3})(\d)/, '$1.$2');
        val = val.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
        val = val.replace(/\.(\d{3})(\d)/, '.$1-$2');
        this.value = val.substring(0, 14);
      });
    });

    document.querySelectorAll('.mask-tel').forEach(input => {
      input.addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '');
        if (val.length > 11) val = val.substring(0, 11);
        if (val.length > 10) {
          val = val.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (val.length > 6) {
          val = val.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (val.length > 2) {
          val = val.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        }
        this.value = val;
      });
    });

    document.querySelectorAll('.mask-rg').forEach(input => {
      input.addEventListener('input', function () {
        let val = this.value.replace(/[^0-9Xx]/g, '').toUpperCase();
        val = val.replace(/X(?=.)/g, '');
        val = val.replace(/^(\d{2})(\d{3})(\d{3})([\dX])/, '$1.$2.$3-$4');
        this.value = val.substring(0, 13);
      });
    });

    document.querySelectorAll('.mask-cep').forEach(input => {
      input.addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '');
        val = val.replace(/^(\d{5})(\d)/, '$1-$2');
        this.value = val.substring(0, 9);
      });
    });
  }
  applyMasks();
  initBlurValidation();

  // ===== File input display + validation =====
  var MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB per file
  var MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5 MB total

  function showFileError(wrapper, msg) {
    var err = wrapper.querySelector('.file-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'file-error';
      wrapper.appendChild(err);
    }
    err.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + msg;
    wrapper.classList.remove('has-file');
    wrapper.style.borderColor = '#dc2626';
    var placeholder = wrapper.querySelector('.file-placeholder');
    if (placeholder) placeholder.innerHTML = '<i class="fas fa-upload"></i> Clique para selecionar';
  }

  function clearFileError(wrapper) {
    if (!wrapper) return;
    var err = wrapper.querySelector('.file-error');
    if (err) err.remove();
    wrapper.style.borderColor = '';
  }

  function getTotalFileSize() {
    var total = 0;
    document.querySelectorAll('.file-input-wrapper input[type="file"]').forEach(function (inp) {
      if (!inp.disabled && inp.files.length) total += inp.files[0].size;
    });
    return total;
  }

  function initFileInputs() {
    document.querySelectorAll('.file-input-wrapper input[type="file"]').forEach(input => {
      input.addEventListener('change', function () {
        const wrapper = this.closest('.file-input-wrapper');
        const placeholder = wrapper.querySelector('.file-placeholder');
        var group = wrapper.closest('.form-group');

        clearFieldError(group);
        clearFileError(wrapper);

        if (this.files.length) {
          const f = this.files[0];

          if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
            showFileError(wrapper, 'Apenas arquivos PDF são aceitos.');
            this.value = '';
            return;
          }

          if (f.size > MAX_FILE_SIZE) {
            var sizeMB = (f.size / (1024 * 1024)).toFixed(1);
            showFileError(wrapper, 'Arquivo muito grande (' + sizeMB + ' MB). O limite é de 2 MB por arquivo.');
            this.value = '';
            return;
          }

          var totalSize = getTotalFileSize();
          if (totalSize > MAX_TOTAL_SIZE) {
            var totalMB = (totalSize / (1024 * 1024)).toFixed(1);
            showFileError(wrapper, 'O total dos anexos excede 5 MB (' + totalMB + ' MB). Reduza o tamanho dos arquivos.');
            this.value = '';
            return;
          }

          const size = f.size < 1048576 ? (f.size / 1024).toFixed(1) + ' KB' : (f.size / 1048576).toFixed(1) + ' MB';
          placeholder.innerHTML = '<i class="fas fa-file-pdf"></i> ' + f.name + ' <span class="file-meta">(' + size + ')</span>';
          wrapper.classList.add('has-file');
          var rmBtn = wrapper.querySelector('.file-remove');
          if (!rmBtn) {
            rmBtn = document.createElement('button');
            rmBtn.type = 'button';
            rmBtn.className = 'file-remove';
            rmBtn.textContent = 'Remover';
            rmBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              input.value = '';
              placeholder.innerHTML = '<i class="fas fa-upload"></i> Clique para selecionar';
              wrapper.classList.remove('has-file');
              wrapper.style.borderColor = '';
              rmBtn.remove();
              clearFileError(wrapper);
            });
            wrapper.appendChild(rmBtn);
          }
        } else {
          placeholder.innerHTML = '<i class="fas fa-upload"></i> Clique para selecionar';
          wrapper.classList.remove('has-file');
          var rmBtn = wrapper.querySelector('.file-remove');
          if (rmBtn) rmBtn.remove();
        }
      });
    });
  }
  initFileInputs();

  // ===== Blur validation =====
  function initBlurValidation() {
    document.querySelectorAll('.adesao-form [required], .adesao-form .mask-email').forEach(function (field) {
      field.addEventListener('blur', function () {
        validateField(this);
      });
      field.addEventListener('input', function () {
        if (this.dataset.touched) clearFieldError(this.closest('.form-group'));
      });
    });
  }

  function validateField(field) {
    var group = field.closest('.form-group');
    if (!group) return true;
    var valid = true;
    if (field.type === 'email' && field.value.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) { valid = false; }
    } else if (field.hasAttribute('required') && !field.value.trim()) {
      valid = false;
    }
    field.dataset.touched = 'true';
    if (!valid) {
      group.classList.add('has-error');
      var err = group.querySelector('.field-error');
      if (!err) {
        err = document.createElement('div');
        err.className = 'field-error';
        err.innerHTML = '<i class="fas fa-exclamation-circle"></i> Preencha este campo';
        group.appendChild(err);
      }
    } else {
      group.classList.remove('has-error');
    }
    return valid;
  }

  function clearFieldError(group) {
    if (!group) return;
    group.classList.remove('has-error');
  }

  // ===== Doc ID radio toggle =====
  function initDocIdToggle() {
    var radios = document.querySelectorAll('.doc-id-option input[name="id_option"]');
    if (!radios.length) return;
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        var selected = this.value;
        document.querySelectorAll('.doc-id-fields').forEach(function (el) {
          var isOption = el.getAttribute('data-option') === selected;
          el.style.display = isOption ? '' : 'none';
          el.querySelectorAll('input[type="file"]').forEach(function (inp) {
            if (isOption) {
              inp.disabled = false;
            } else {
              inp.value = '';
              inp.disabled = true;
              var wrapper = inp.closest('.file-input-wrapper');
              if (wrapper) {
                wrapper.classList.remove('has-file');
                wrapper.style.borderColor = '';
                var ph = wrapper.querySelector('.file-placeholder');
                if (ph) ph.innerHTML = '<i class="fas fa-upload"></i> Clique para selecionar';
                var rm = wrapper.querySelector('.file-remove');
                if (rm) rm.remove();
                clearFileError(wrapper);
              }
            }
          });
        });
      });
    });
    var checkedRadio = document.querySelector('.doc-id-option input[name="id_option"]:checked');
    if (checkedRadio) {
      document.querySelectorAll('.doc-id-fields').forEach(function (el) {
        var isOption = el.getAttribute('data-option') === checkedRadio.value;
        el.style.display = isOption ? '' : 'none';
        el.querySelectorAll('input[type="file"]').forEach(function (inp) {
          inp.disabled = !isOption;
        });
      });
    }
  }
  initDocIdToggle();

  // ===== Consent checklist =====
  function initConsentList() {
    document.querySelectorAll('.consent-item').forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      item.addEventListener('click', function (e) {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      checkbox.addEventListener('change', function () {
        if (this.checked) {
          item.classList.add('has-checked');
        } else {
          item.classList.remove('has-checked');
        }
      });
      if (checkbox.checked) item.classList.add('has-checked');
    });
  }
  initConsentList();

  // ===== Stepper (Adesao) =====
  function initStepper(formId, successId, errorId) {
    var form = document.getElementById(formId);
    var success = document.getElementById(successId);
    var errorEl = document.getElementById(errorId);
    if (!form) return;

    var steps = form.querySelectorAll('.stepper-content');
    var navSteps = document.querySelectorAll('.stepper-step');
    var lines = document.querySelectorAll('.stepper-line');
    var currentStep = 1;

    restoreForm();

    function updateProgress(n) {
      var pct = Math.round((n / 5) * 100);
      var fill = document.getElementById('progressFill');
      var num = document.getElementById('stepNum');
      if (fill) fill.style.width = pct + '%';
      if (num) num.textContent = n;
    }

    function showStep(n) {
      steps.forEach(function (s) { s.classList.remove('active'); });
      navSteps.forEach(function (s) { s.classList.remove('active'); });

      var stepEl = form.querySelector('.stepper-content[data-step="' + n + '"]');
      var navEl = document.querySelector('.stepper-step[data-step="' + n + '"]');
      if (stepEl) stepEl.classList.add('active');
      if (navEl) navEl.classList.add('active');

      navSteps.forEach(function (s) {
        var sn = parseInt(s.getAttribute('data-step'));
        if (sn < n) s.classList.add('done');
        else s.classList.remove('done');
      });

      lines.forEach(function (l, i) {
        if (i < n - 1) l.classList.add('done');
        else l.classList.remove('done');
      });

      currentStep = n;
      updateProgress(n);

      if (n === 5) buildReview();

      var target = form.querySelector('.stepper-content[data-step="' + n + '"]');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateField(field) {
      var group = field.closest('.form-group');
      if (!group) return true;
      var valid = true;
      if (field.type === 'email' && field.value.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) { valid = false; }
      } else if (field.hasAttribute('required') && !field.value.trim()) {
        valid = false;
      }
      if (!valid) {
        group.classList.add('has-error');
        var err = group.querySelector('.field-error');
        if (!err) {
          err = document.createElement('div');
          err.className = 'field-error';
          err.innerHTML = '<i class="fas fa-exclamation-circle"></i> Preencha este campo';
          group.appendChild(err);
        }
      } else {
        group.classList.remove('has-error');
      }
      return valid;
    }

    function validateStep(n) {
      var stepEl = form.querySelector('.stepper-content[data-step="' + n + '"]');
      if (!stepEl) return true;

      var requiredFields = stepEl.querySelectorAll('[required]');
      var valid = true;

      requiredFields.forEach(function (field) {
        if (field.disabled) return;
        if (field.type === 'file') {
          if (!field.files.length) {
            valid = false;
            field.closest('.file-input-wrapper').style.borderColor = '#dc2626';
          } else {
            field.closest('.file-input-wrapper').style.borderColor = '';
          }
        } else if (field.type === 'checkbox') {
          if (!field.checked) {
            valid = false;
            field.closest('.consent-item').style.borderColor = '#dc2626';
          } else {
            field.closest('.consent-item').style.borderColor = '';
          }
        } else {
          if (!validateField(field)) valid = false;
        }
      });

      if (n === 3) {
        var option = form.querySelector('input[name="id_option"]:checked');
        var isRGCPF = option && option.value === 'rg_cpf';
        var rgFile = document.getElementById('doc_rg');
        var cpfFile = document.getElementById('doc_cpf');
        var cnhFile = document.getElementById('doc_cnh');
        if (isRGCPF) {
          if ((!rgFile || !rgFile.files.length) && (!cpfFile || !cpfFile.files.length)) {
            valid = false;
            if (rgFile) rgFile.closest('.file-input-wrapper').style.borderColor = '#dc2626';
            if (cpfFile) cpfFile.closest('.file-input-wrapper').style.borderColor = '#dc2626';
          } else {
            if (rgFile) rgFile.closest('.file-input-wrapper').style.borderColor = '';
            if (cpfFile) cpfFile.closest('.file-input-wrapper').style.borderColor = '';
          }
        } else {
          if (!cnhFile || !cnhFile.files.length) {
            valid = false;
            if (cnhFile) cnhFile.closest('.file-input-wrapper').style.borderColor = '#dc2626';
          } else {
            if (cnhFile) cnhFile.closest('.file-input-wrapper').style.borderColor = '';
          }
        }
      }

      if (n === 4) {
        stepEl.querySelectorAll('.consent-item input[type="checkbox"]').forEach(function (cb) {
          if (!cb.checked) {
            valid = false;
            cb.closest('.consent-item').style.borderColor = '#dc2626';
          }
        });
      }

      return valid;
    }

    document.querySelectorAll('.stepper-next').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validateStep(currentStep)) return;
        var next = parseInt(this.getAttribute('data-next'));
        if (next) showStep(next);
        saveForm();
      });
    });

    document.querySelectorAll('.stepper-prev').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prev = parseInt(this.getAttribute('data-prev'));
        if (prev) showStep(prev);
      });
    });

    document.querySelectorAll('.stepper-step').forEach(function (navBtn) {
      navBtn.addEventListener('click', function () {
        var targetStep = parseInt(this.getAttribute('data-step'));
        if (targetStep < currentStep) {
          showStep(targetStep);
        }
      });
    });

    function buildReview() {
      var container = document.getElementById('reviewContent');
      if (!container) return;

      function getVal(name) {
        var el = form.querySelector('[name="' + name + '"]');
        if (!el) return '—';
        if (el.type === 'file') return el.files.length ? el.files[0].name : 'Não anexado';
        if (el.type === 'checkbox') return el.checked ? 'Sim' : 'Não';
        if (el.type === 'radio') {
          var checked = form.querySelector('[name="' + name + '"]:checked');
          return checked ? (checked.closest('.doc-id-option') ? checked.closest('.doc-id-option').textContent.trim() : checked.value) : '—';
        }
        return el.value || '—';
      }

      function reviewRow(label, val) {
        return '<div class="review-row"><span class="review-label">' + label + '</span><span class="review-value">' + val + '</span></div>';
      }

      function sectionHeader(title, step) {
        return '<div class="review-section-header"><h4>' + title + '</h4><button type="button" class="review-edit-btn" data-step="' + step + '"><i class="fas fa-pen"></i> Editar</button></div>';
      }

      var html = '';

      html += '<div class="review-section">' + sectionHeader('Dados da Empresa', 1);
      html += reviewRow('Razão Social', getVal('razao_social'));
      html += reviewRow('CNPJ', getVal('cnpj'));
      html += reviewRow('CEP', getVal('cep'));
      html += reviewRow('Endereço', getVal('endereco_empresa'));
      html += reviewRow('Bairro', getVal('bairro'));
      html += reviewRow('Cidade', getVal('cidade'));
      html += reviewRow('Estado', getVal('estado'));
      html += reviewRow('País', getVal('pais'));
      html += reviewRow('Banco', getVal('banco'));
      html += reviewRow('Agência', getVal('agencia'));
      html += reviewRow('Conta corrente', getVal('conta_corrente'));
      html += reviewRow('Região', getVal('regiao'));
      html += reviewRow('Trajetória', getVal('trajetoria'));
      html += '</div>';

      html += '<div class="review-section">' + sectionHeader('Dados do Sócio Operador', 2);
      html += reviewRow('Nome completo', getVal('nome_socio'));
      html += reviewRow('Nacionalidade', getVal('nacionalidade'));
      html += reviewRow('RG', getVal('rg'));
      html += reviewRow('CPF', getVal('cpf'));
      html += reviewRow('Estado civil', getVal('estado_civil'));
      html += reviewRow('Profissão', getVal('profissao'));
      html += reviewRow('Telefone', getVal('telefone'));
      html += reviewRow('E-mail', getVal('email_socio'));
      html += reviewRow('CEP', getVal('cep_socio'));
      html += reviewRow('Endereço', getVal('endereco_socio'));
      html += reviewRow('Bairro', getVal('bairro_socio'));
      html += reviewRow('Cidade', getVal('cidade_socio'));
      html += reviewRow('Estado', getVal('estado_socio'));
      html += reviewRow('País', getVal('pais_socio'));
      html += reviewRow('Uniforme', getVal('tamanho_uniforme'));
      html += '</div>';

      html += '<div class="review-section">' + sectionHeader('Documentos', 3);
      html += '<div class="review-documents">';
      html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> Contrato social / Cartão CNPJ: ' + (getVal('doc_contrato_social') || 'Não anexado') + '</div>';
      var idOpt = form.querySelector('input[name="id_option"]:checked');
      var idVal = idOpt ? idOpt.value : 'rg_cpf';
      if (idVal === 'rg_cpf') {
        html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> RG do sócio: ' + (getVal('doc_rg') || 'Não anexado') + '</div>';
        html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> CPF do sócio: ' + (getVal('doc_cpf') || 'Não anexado') + '</div>';
      } else {
        html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> CNH: ' + (getVal('doc_cnh') || 'Não anexado') + '</div>';
      }
      html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> Comprovante bancário: ' + (getVal('doc_comprovante_bancario') || 'Não anexado') + '</div>';
      html += '</div></div>';

      html += '<div class="review-section">' + sectionHeader('Consentimentos', 4);
      var consents = [
        { name: 'consent_dedicacao', label: 'Dedicação total' },
        { name: 'consent_perfil_comercial', label: 'Perfil comercial' },
        { name: 'consent_relacionamento', label: 'Relacionamento com clientes' },
        { name: 'consent_investimento', label: 'Investimento' },
        { name: 'consent_territorialidade', label: 'Territorialidade' },
        { name: 'consent_capacitacao', label: 'Capacitação' },
        { name: 'consent_veracidade', label: 'Veracidade das informações' },
        { name: 'consent_comunicacao', label: 'Comunicação (FOURPAY + Fiserv)' },
        { name: 'consent_assinatura_digital', label: 'Assinatura digital' }
      ];
      consents.forEach(function (c) {
        var checked = form.querySelector('[name="' + c.name + '"]').checked;
        html += '<div class="review-consent"><i class="fas ' + (checked ? 'fa-check-circle' : 'fa-times-circle') + '" style="color:' + (checked ? 'var(--color-success)' : '#dc2626') + '"></i> ' + c.label + '</div>';
      });
      html += '</div>';

      container.innerHTML = html;

      container.querySelectorAll('.review-edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var step = parseInt(this.getAttribute('data-step'));
          if (step) showStep(step);
        });
      });
    }

    form.querySelectorAll('input:not([type="file"]), textarea, select').forEach(function (el) {
      el.addEventListener('change', function () { saveForm(); });
      el.addEventListener('input', function () { saveForm(); });
    });

    function saveForm() {
      var data = {};
      form.querySelectorAll('[name]').forEach(function (el) {
        if (el.type === 'file') return;
        if (el.type === 'checkbox') data[el.name] = el.checked ? 'true' : '';
        else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
        else data[el.name] = el.value;
      });
      data['_step'] = currentStep;
      try { localStorage.setItem('adesaoForm', JSON.stringify(data)); } catch (e) {}
    }

    function restoreForm() {
      var saved;
      try { saved = JSON.parse(localStorage.getItem('adesaoForm')); } catch (e) {}
      if (!saved) return;
      Object.keys(saved).forEach(function (name) {
        if (name === '_step') return;
        var el = form.querySelector('[name="' + name + '"]');
        if (!el) return;
        if (el.type === 'checkbox') el.checked = saved[name] === 'true';
        else if (el.type === 'radio') { el.checked = el.value === saved[name]; }
        else el.value = saved[name];
      });
      initFileInputs();
      initConsentList();
      var restoredRadio = form.querySelector('input[name="id_option"]:checked');
      if (restoredRadio) restoredRadio.dispatchEvent(new Event('change'));
      if (saved['_step'] && saved['_step'] > 1 && saved['_step'] < 5) showStep(parseInt(saved['_step']));
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      for (var i = 1; i <= 4; i++) {
        if (!validateStep(i)) {
          showStep(i);
          return;
        }
      }

      var btn = form.querySelector('.btn-submit');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      }

      errorEl.classList.remove('show');

      var formData = new FormData(form);
      fetch('/.netlify/functions/send-adesao', {
        method: 'POST',
        body: formData
      }).then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok && data.ok, message: data.message };
        }).catch(function () {
          return { ok: false, message: 'Falha de conexão com o servidor.' };
        });
      }).then(function (result) {
        if (!result.ok) {
          var msgEl = errorEl.querySelector('.error-text');
          if (msgEl) msgEl.textContent = result.message || 'Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.';
          errorEl.classList.add('show');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Enviar Adesão <i class="fas fa-paper-plane"></i>';
          }
          return;
        }
        var fields = form.querySelector('.stepper-content.active');
        if (fields) fields.style.display = 'none';
        document.querySelector('.stepper-nav').style.display = 'none';
        var pb = document.querySelector('.stepper-progress');
        if (pb) pb.style.display = 'none';
        success.classList.add('show');
        try { localStorage.removeItem('adesaoForm'); } catch (e) {}
      });
    });
  }
  function handleForm(formId, successId) {
    const form = document.getElementById(formId);
    const success = document.getElementById(successId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;
      const fields = form.querySelectorAll('[required]');
      fields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#dc2626';
        } else {
          field.style.borderColor = '';
        }
        if (field.type === 'email' && field.value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(field.value.trim())) {
            isValid = false;
            field.style.borderColor = '#dc2626';
          }
        }
      });
      if (isValid) {
        const formData = new FormData(form);
        const fields = form.querySelector('.form-fields');
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString()
        }).then(() => {
          if (fields) fields.style.display = 'none';
          success.classList.add('show');
        }).catch(() => {
          alert('Erro ao enviar formulário. Tente novamente.');
        });
      }
    });
  }
  handleForm('contactForm', 'formSuccess');
  handleForm('franchiseForm', 'franchiseSuccess');
  handleForm('newsletterForm', 'newsletterSuccess');

  // ===== Stepper (Adesao) =====
  initStepper('adesaoForm', 'adesaoSuccess', 'adesaoError');

  // ===== Navbar active link =====
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });
});
