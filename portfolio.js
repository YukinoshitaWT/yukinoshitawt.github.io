(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealTargets = document.querySelectorAll('[data-reveal]');
  let revealObserver;

  // Content remains readable when JavaScript or motion support is unavailable.
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.04, rootMargin: '0px 0px 28px 0px' });
    revealTargets.forEach((target) => revealObserver.observe(target));
    document.documentElement.classList.add('reveal-ready');
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      document.documentElement.classList.remove('reveal-ready');
      revealObserver?.disconnect();
    }
  });

  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const workCards = [...document.querySelectorAll('[data-category]')];
  const filterStatus = document.querySelector('.filter-status');
  const toolbar = document.querySelector('.work-toolbar');
  if (toolbar && filterButtons.length && workCards.length) {
    toolbar.hidden = false;
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const category = button.dataset.filter;
        let visible = 0;
        filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        workCards.forEach((card) => {
          const show = category === 'all' || card.dataset.category.split(' ').includes(category);
          card.hidden = !show;
          if (show) {
            visible += 1;
            card.classList.add('is-revealed');
          }
        });
        filterStatus.textContent = `展示 ${visible} 项作品`;
        queueScrollUpdate();
      });
    });
  }

  const gallery = document.querySelector('.gallery-track');
  const previous = document.querySelector('[data-gallery-prev]');
  const next = document.querySelector('[data-gallery-next]');
  const galleryControls = document.querySelector('.gallery-controls');
  const updateGallery = () => {
    if (!gallery || !previous || !next) return;
    previous.disabled = gallery.scrollLeft <= 2;
    next.disabled = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 3;
  };
  if (gallery && previous && next && galleryControls) {
    galleryControls.hidden = false;
    const moveGallery = (direction) => gallery.scrollBy({
      left: direction * gallery.clientWidth * 0.75,
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
    previous.addEventListener('click', () => moveGallery(-1));
    next.addEventListener('click', () => moveGallery(1));
    gallery.addEventListener('scroll', updateGallery, { passive: true });
    gallery.addEventListener('keydown', (event) => {
      if (event.target !== gallery) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        moveGallery(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    updateGallery();
  }

  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('.copy-status');
  const emailLink = document.querySelector('a[href^="mailto:"]');
  let copyReset;
  if (copyButton && emailLink && navigator.clipboard?.writeText) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(emailLink.href.replace(/^mailto:/, ''));
        copyButton.textContent = '已复制 ✓';
        copyStatus.textContent = '邮箱地址已复制';
        clearTimeout(copyReset);
        copyReset = setTimeout(() => {
          copyButton.textContent = '复制邮箱 ⧉';
          copyStatus.textContent = '';
        }, 2500);
      } catch {
        copyButton.textContent = '请手动复制';
        copyStatus.textContent = '浏览器未允许复制，请选中上方邮箱手动复制。';
      }
    });
  }

  const progress = document.querySelector('.reading-progress span');
  const sectionLinks = [...document.querySelectorAll('.topbar nav a[href^="#"]')];
  const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href')));
  let scrollPending = false;
  function updateScroll() {
    scrollPending = false;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const percent = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    if (progress) progress.style.transform = `scaleX(${percent})`;
    let current = -1;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top < window.innerHeight * 0.46) current = index;
    });
    sectionLinks.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function queueScrollUpdate() {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(updateScroll);
    }
  }
  window.addEventListener('scroll', queueScrollUpdate, { passive: true });
  window.addEventListener('resize', () => { queueScrollUpdate(); updateGallery(); }, { passive: true });
  window.addEventListener('load', () => { queueScrollUpdate(); updateGallery(); });
  updateScroll();

  const hero = document.querySelector('.hero-scene');
  const snow = document.querySelector('.snow-field');
  if (hero && snow && !reducedMotion.matches && 'IntersectionObserver' in window) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 18; i += 1) {
      const flake = document.createElement('span');
      flake.className = 'snowflake';
      flake.style.setProperty('--left', `${(i * 37 + 11) % 100}%`);
      flake.style.setProperty('--size', `${2 + i % 3}px`);
      flake.style.setProperty('--duration', `${12 + i % 7}s`);
      flake.style.setProperty('--delay', `${-(i * 1.7)}s`);
      fragment.append(flake);
    }
    snow.append(fragment);
    const heroObserver = new IntersectionObserver(([entry]) => {
      hero.classList.toggle('is-out-of-view', !entry.isIntersecting);
    });
    heroObserver.observe(hero);
  }
})();
