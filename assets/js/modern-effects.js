/**
 * Modern Effects & Animations
 * Adds scroll reveals, smooth interactions, and enhanced UX
 */

// ============================================
// 1. SCROLL REVEAL ANIMATIONS
// ============================================
function initScrollReveal() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Optionally unobserve after revealing (better performance)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with reveal classes
  const revealElements = document.querySelectorAll('.reveal, .reveal-up, .reveal-scale');
  revealElements.forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// 2. SMOOTH SCROLL BEHAVIOR
// ============================================
function initSmoothScroll() {
  // Add smooth scroll to all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ============================================
// 3. BACK TO TOP BUTTON
// ============================================
function initBackToTop() {
  // Create button if it doesn't exist
  let backToTopBtn = document.querySelector('.back-to-top');

  if (!backToTopBtn) {
    backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(backToTopBtn);
  }

  // Show/hide on scroll
  const toggleBackToTop = () => {
    if (window.pageYOffset > 500) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  // Scroll to top on click
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ============================================
// 4. ENHANCED CARD HOVER EFFECTS
// ============================================
function initEnhancedHovers() {
  const cards = document.querySelectorAll('.card, .group-card, .benefit-card');

  cards.forEach(card => {
    card.addEventListener('mouseenter', function(e) {
      this.style.setProperty('--mouse-x', e.offsetX + 'px');
      this.style.setProperty('--mouse-y', e.offsetY + 'px');
    });

    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.style.setProperty('--mouse-x', x + 'px');
      this.style.setProperty('--mouse-y', y + 'px');
    });
  });
}

// ============================================
// 5. VIDEO POSTER ZOOM EFFECT
// ============================================
function initVideoZoom() {
  const videos = document.querySelectorAll('.catalog-video, video[poster]');

  videos.forEach(video => {
    const container = video.parentElement;
    if (!container.classList.contains('video-zoom-container')) {
      container.classList.add('video-zoom-container');
    }
  });
}

// ============================================
// 6. LOADING SKELETON ENHANCEMENT
// ============================================
function enhanceLoadingStates() {
  const emptyStates = document.querySelectorAll('.empty-state.is-loading');

  emptyStates.forEach(state => {
    if (!state.querySelector('.loading-spinner')) {
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      spinner.innerHTML = `
        <svg class="spinner-svg" viewBox="0 0 50 50">
          <circle class="spinner-circle" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
        </svg>
      `;
      state.insertBefore(spinner, state.firstChild);
    }
  });
}

// ============================================
// 7. RIPPLE EFFECT ON BUTTONS
// ============================================
function initRippleEffect() {
  const buttons = document.querySelectorAll('.card-cta, .header-cta, .filter-chip, .group-chip');

  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ============================================
// 8. PARALLAX EFFECT ON HERO
// ============================================
function initParallax() {
  const parallaxElements = document.querySelectorAll('.hero, .benefits-section, .live-hero, .faq-hero');

  if (parallaxElements.length === 0) return;

  const handleScroll = () => {
    const scrolled = window.pageYOffset;

    parallaxElements.forEach(el => {
      const speed = 0.5; // Adjust for parallax intensity
      const yPos = -(scrolled * speed);
      el.style.backgroundPosition = `center ${yPos}px`;
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

// ============================================
// 9. NUMBER COUNT-UP ANIMATION
// ============================================
function animateCountUp(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString();
    }
  }, 16);
}

function initCountUpAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        const target = parseInt(entry.target.dataset.countTo);
        if (!isNaN(target)) {
          animateCountUp(entry.target, target);
          entry.target.dataset.counted = 'true';
          observer.unobserve(entry.target);
        }
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count-to]').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// 10. ENHANCED FOCUS STATES FOR ACCESSIBILITY
// ============================================
function initEnhancedFocus() {
  // Add keyboard user detection
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-user');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-user');
  });
}

// ============================================
// INITIALIZE ALL EFFECTS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Core effects
  initScrollReveal();
  initSmoothScroll();
  initBackToTop();

  // Visual enhancements
  initEnhancedHovers();
  initVideoZoom();
  enhanceLoadingStates();
  initRippleEffect();

  // Advanced effects (only if performance is good)
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    initParallax();
    initCountUpAnimations();
  }

  // Accessibility
  initEnhancedFocus();

  console.log('✨ Modern effects initialized');
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
