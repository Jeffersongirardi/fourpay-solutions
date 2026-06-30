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

  // ===== Formulários (Netlify Forms) =====
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
          headers: { 'Accept': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString()
        }).then(() => {
          if (fields) fields.style.display = 'none';
          success.classList.add('show');
        }).catch(() => {
          if (fields) fields.style.display = 'none';
          success.classList.add('show');
        });
      }
    });
  }
  handleForm('contactForm', 'formSuccess');
  handleForm('franchiseForm', 'franchiseSuccess');
  handleForm('newsletterForm', 'newsletterSuccess');

  // ===== Navbar active link =====
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });
});
