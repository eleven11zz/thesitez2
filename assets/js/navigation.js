/**
 * Responsive Navigation System
 * Handles mobile/tablet menu toggle and accessibility
 */

(function() {
  'use strict';

  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    const header = document.querySelector('.site-header');

    if (!navToggle || !mainNav) {
      return; // Elements not found, exit gracefully
    }

    // Toggle mobile menu
    navToggle.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      // Toggle aria-expanded
      this.setAttribute('aria-expanded', !isExpanded);

      // Toggle active class on nav
      mainNav.classList.toggle('active');

      // Toggle is-active class on burger button for animation
      this.classList.toggle('is-active');

      // Prevent body scroll when menu is open
      document.body.style.overflow = !isExpanded ? 'hidden' : '';

      // Focus first link when opening menu
      if (!isExpanded) {
        const firstLink = mainNav.querySelector('a');
        if (firstLink) {
          setTimeout(() => firstLink.focus(), 300);
        }
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      const isClickInside = header.contains(event.target);

      if (!isClickInside && mainNav.classList.contains('active')) {
        closeMenu();
      }
    });

    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && mainNav.classList.contains('active')) {
        closeMenu();
        navToggle.focus();
      }
    });

    // Close menu when clicking a nav link
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        // Small delay to allow navigation
        setTimeout(closeMenu, 100);
      });
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        // Close mobile menu if window is resized to desktop
        if (window.innerWidth > 768 && mainNav.classList.contains('active')) {
          closeMenu();
        }
      }, 250);
    });

    /**
     * Close the mobile menu
     */
    function closeMenu() {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.classList.remove('is-active');
      mainNav.classList.remove('active');
      document.body.style.overflow = '';
    }

    /**
     * Trap focus within mobile menu when open
     */
    mainNav.addEventListener('keydown', function(event) {
      if (!mainNav.classList.contains('active')) return;

      const focusableElements = mainNav.querySelectorAll('a, button');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Tab key
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    });

    // Add smooth scroll behavior to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(event) {
        const href = this.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          event.preventDefault();

          // Close mobile menu if open
          if (mainNav.classList.contains('active')) {
            closeMenu();
          }

          // Smooth scroll to target
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Update URL without jumping
          if (history.pushState) {
            history.pushState(null, null, href);
          }
        }
      });
    });

    // Sticky header on scroll
    let lastScrollTop = 0;
    const headerHeight = header.offsetHeight;

    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > headerHeight) {
        header.classList.add('scrolled');

        // Hide header when scrolling down, show when scrolling up
        if (scrollTop > lastScrollTop && scrollTop > headerHeight * 2) {
          header.style.transform = 'translateY(-100%)';
        } else {
          header.style.transform = 'translateY(0)';
        }
      } else {
        header.classList.remove('scrolled');
        header.style.transform = 'translateY(0)';
      }

      lastScrollTop = scrollTop;
    }, { passive: true });
  }
})();
