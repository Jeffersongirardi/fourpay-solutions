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
        let val = this.value.replace(/\D/g, '');
        val = val.replace(/^(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
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

  // ===== File input display =====
  function initFileInputs() {
    document.querySelectorAll('.file-input-wrapper input[type="file"]').forEach(input => {
      input.addEventListener('change', function () {
        const wrapper = this.closest('.file-input-wrapper');
        const placeholder = wrapper.querySelector('.file-placeholder');
        if (this.files.length) {
          placeholder.innerHTML = '<i class="fas fa-file-pdf"></i> ' + this.files[0].name;
          wrapper.classList.add('has-file');
        } else {
          placeholder.innerHTML = '<i class="fas fa-upload"></i> Clique para selecionar o arquivo';
          wrapper.classList.remove('has-file');
        }
      });
    });
  }
  initFileInputs();

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

      if (n === 5) buildReview();

      var target = form.querySelector('.stepper-content[data-step="' + n + '"]');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateStep(n) {
      var stepEl = form.querySelector('.stepper-content[data-step="' + n + '"]');
      if (!stepEl) return true;

      var requiredFields = stepEl.querySelectorAll('[required]');
      var valid = true;

      requiredFields.forEach(function (field) {
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
          if (!field.value.trim()) {
            valid = false;
            field.style.borderColor = '#dc2626';
          } else {
            field.style.borderColor = '';
          }
          if (field.type === 'email' && field.value.trim()) {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value.trim())) {
              valid = false;
              field.style.borderColor = '#dc2626';
            }
          }
        }
      });

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
        if (!el) return '';
        if (el.type === 'file') return el.files.length ? el.files[0].name : 'Não anexado';
        if (el.type === 'checkbox') return el.checked ? 'Sim' : 'Não';
        return el.value || '—';
      }

      function reviewRow(label, val) {
        return '<div class="review-row"><span class="review-label">' + label + '</span><span class="review-value">' + val + '</span></div>';
      }

      var html = '';

      html += '<div class="review-section"><h4>Dados da Empresa</h4>';
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

      html += '<div class="review-section"><h4>Dados do Sócio Operador</h4>';
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

      html += '<div class="review-section"><h4>Documentos</h4>';
      html += '<div class="review-documents">';
      html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> Contrato social / Cartão CNPJ: ' + (getVal('doc_contrato_social') || 'Não anexado') + '</div>';
      html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> RG do sócio: ' + (getVal('doc_rg') || 'Não anexado') + '</div>';
      html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> CPF do sócio: ' + (getVal('doc_cpf') || 'Não anexado') + '</div>';
      html += '<div class="review-doc-item"><i class="fas fa-file-pdf"></i> Comprovante bancário: ' + (getVal('doc_comprovante_bancario') || 'Não anexado') + '</div>';
      html += '</div></div>';

      html += '<div class="review-section"><h4>Consentimentos</h4>';
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
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep(4)) {
        showStep(4);
        return;
      }

      var btn = form.querySelector('.btn-submit');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      }

      var formData = new FormData(form);
      fetch('/.netlify/functions/send-adesao', {
        method: 'POST',
        body: formData
      }).then(function () {
        var fields = form.querySelector('.stepper-content.active');
        if (fields) fields.style.display = 'none';
        document.querySelector('.stepper-nav').style.display = 'none';
        success.classList.add('show');
      }).catch(function () {
        errorEl.classList.add('show');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = 'Enviar Adesão <i class="fas fa-paper-plane"></i>';
        }
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
