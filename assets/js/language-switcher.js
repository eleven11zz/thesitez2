/**
 * Language Switcher Component V2
 * Completely reworked with proper positioning and language detection
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const languageSwitcher = document.querySelector('.language-switcher');
    const currentLangButton = document.querySelector('.current-lang');
    const langDropdown = document.querySelector('.lang-dropdown');

    if (!languageSwitcher || !currentLangButton || !langDropdown) {
      return; // Elements not found, exit gracefully
    }

    // Toggle dropdown on click
    currentLangButton.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();

      const isOpen = languageSwitcher.classList.toggle('open');
      currentLangButton.setAttribute('aria-expanded', isOpen);

      if (isOpen) {
        positionDropdown();
      }
    });

    // Position dropdown using fixed positioning
    function positionDropdown() {
      const buttonRect = currentLangButton.getBoundingClientRect();
      const isFloating = languageSwitcher.classList.contains('floating');
      const dropdownWidth = 200; // min-width from CSS
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (isFloating) {
        // For floating button, position dropdown above the button
        const dropdownHeight = langDropdown.offsetHeight || 300; // estimated height
        const topPosition = buttonRect.top - dropdownHeight - 10;

        // Position above the button
        langDropdown.style.bottom = (viewportHeight - buttonRect.top + 10) + 'px';
        langDropdown.style.top = 'auto';

        // Align to right edge of button
        langDropdown.style.right = (viewportWidth - buttonRect.right) + 'px';
        langDropdown.style.left = 'auto';
      } else {
        // Original behavior: position dropdown below the button
        langDropdown.style.top = (buttonRect.bottom + 5) + 'px';
        langDropdown.style.bottom = 'auto';
        langDropdown.style.left = (buttonRect.left) + 'px';

        // Check if dropdown would go off-screen to the right
        if (buttonRect.left + dropdownWidth > viewportWidth) {
          // Align to right edge of button instead
          langDropdown.style.left = 'auto';
          langDropdown.style.right = (viewportWidth - buttonRect.right) + 'px';
        }
      }
    }

    // Reposition on scroll or resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        if (languageSwitcher.classList.contains('open')) {
          positionDropdown();
        }
      }, 100);
    });

    window.addEventListener('scroll', function() {
      if (languageSwitcher.classList.contains('open')) {
        positionDropdown();
      }
    }, { passive: true });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (!languageSwitcher.contains(event.target)) {
        languageSwitcher.classList.remove('open');
        currentLangButton.setAttribute('aria-expanded', 'false');
      }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && languageSwitcher.classList.contains('open')) {
        languageSwitcher.classList.remove('open');
        currentLangButton.setAttribute('aria-expanded', 'false');
        currentLangButton.focus();
      }
    });

    // Handle dropdown link clicks
    const dropdownLinks = document.querySelectorAll('.lang-dropdown a');
    dropdownLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Allow navigation but close dropdown
        languageSwitcher.classList.remove('open');
        currentLangButton.setAttribute('aria-expanded', 'false');
      });
    });

    // Set current language indicator
    setCurrentLanguage();
  }

  function setCurrentLanguage() {
    // Detect current language from URL
    const path = window.location.pathname;
    let currentLangCode = 'en'; // default

    // Language mapping
    const langMap = {
      '/th/': 'th',
      '/de/': 'de',
      '/fr/': 'fr',
      '/sv/': 'sv',
      '/no/': 'no',
      '/it/': 'it',
      '/nl/': 'nl'
    };

    // Check which language directory we're in
    for (const [urlPath, langCode] of Object.entries(langMap)) {
      if (path.includes(urlPath)) {
        currentLangCode = langCode;
        break;
      }
    }

    // Mark active language in dropdown
    const activeLink = document.querySelector(`.lang-dropdown a[data-lang="${currentLangCode}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    // Update button text with language name
    const langNames = {
      'en': { flag: '🇬🇧', name: 'EN' },
      'th': { flag: '🇹🇭', name: 'TH' },
      'de': { flag: '🇩🇪', name: 'DE' },
      'fr': { flag: '🇫🇷', name: 'FR' },
      'sv': { flag: '🇸🇪', name: 'SV' },
      'no': { flag: '🇳🇴', name: 'NO' },
      'it': { flag: '🇮🇹', name: 'IT' },
      'nl': { flag: '🇳🇱', name: 'NL' }
    };

    const currentLangButton = document.querySelector('.current-lang');
    if (currentLangButton && langNames[currentLangCode]) {
      const lang = langNames[currentLangCode];
      // Don't override the existing after pseudo-element arrow
      const arrow = currentLangButton.querySelector('.arrow-icon') || '';
      currentLangButton.innerHTML = `${lang.flag} <span>${lang.name}</span>`;
    }

    // Update language-specific links based on current page
    updateLanguageLinks(currentLangCode, path);
  }

  function updateLanguageLinks(currentLang, currentPath) {
    // Get current page filename
    const pathParts = currentPath.split('/').filter(p => p !== '');
    const currentPage = pathParts[pathParts.length - 1] || 'index.html';

    // Determine base path (how many levels deep we are)
    const depth = pathParts.length - (currentPage.includes('.html') ? 1 : 0);
    const basePath = depth > 0 ? '../'.repeat(depth) : './';

    // Get all language links
    const langLinks = document.querySelectorAll('.lang-dropdown a[data-lang]');

    // Pages that exist in all language directories
    const commonPages = [
      'index.html',
      'blog.html',
      'epg.html',
      'faq.html',
      'iptv-products.html',
      'tv-box-products.html',
      'channel-lists.html'
    ];

    langLinks.forEach(link => {
      const targetLang = link.getAttribute('data-lang');

      if (targetLang === 'en') {
        // English: go to root version of current page
        link.href = basePath + currentPage;
      } else {
        // All other languages (th, de, fr, nl, no, sv, it) have all common pages
        if (commonPages.includes(currentPage)) {
          // Page exists in this language directory
          link.href = basePath + targetLang + '/' + currentPage;
        } else {
          // Fallback to homepage for unknown pages
          link.href = basePath + targetLang + '/index.html';
        }
      }
    });
  }

  // Store language preference
  function saveLanguagePreference(lang) {
    try {
      localStorage.setItem('tvmaster_preferred_lang', lang);
    } catch (e) {
      // localStorage might be disabled
    }
  }

  // Get stored language preference
  function getLanguagePreference() {
    try {
      return localStorage.getItem('tvmaster_preferred_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  }
})();
