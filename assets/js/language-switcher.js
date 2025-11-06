/**
 * Language Switcher Component
 * Handles language selection and dropdown interaction
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
    const currentLang = document.querySelector('.current-lang');

    if (!languageSwitcher || !currentLang) {
      return; // Elements not found, exit gracefully
    }

    // Toggle dropdown on click
    currentLang.addEventListener('click', function(e) {
      e.stopPropagation();
      languageSwitcher.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (!languageSwitcher.contains(event.target)) {
        languageSwitcher.classList.remove('open');
      }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        languageSwitcher.classList.remove('open');
      }
    });

    // Prevent dropdown links from closing immediately
    const dropdownLinks = document.querySelectorAll('.lang-dropdown a');
    dropdownLinks.forEach(link => {
      link.addEventListener('click', function() {
        languageSwitcher.classList.remove('open');
      });
    });

    // Set current language indicator
    setCurrentLanguage();
  }

  function setCurrentLanguage() {
    // Detect current language from URL
    const path = window.location.pathname;
    let currentLangCode = 'en'; // default

    const langMap = {
      '/th/': 'th',
      '/de/': 'de',
      '/fr/': 'fr',
      '/sv/': 'sv',
      '/no/': 'no',
      '/it/': 'it',
      '/nl/': 'nl'
    };

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

    // Update button text
    const langNames = {
      'en': '🇬🇧 EN',
      'th': '🇹🇭 TH',
      'de': '🇩🇪 DE',
      'fr': '🇫🇷 FR',
      'sv': '🇸🇪 SV',
      'no': '🇳🇴 NO',
      'it': '🇮🇹 IT',
      'nl': '🇳🇱 NL'
    };

    const currentLangButton = document.querySelector('.current-lang');
    if (currentLangButton && langNames[currentLangCode]) {
      // Keep the globe icon, update the language code
      currentLangButton.innerHTML = `🌐 ${langNames[currentLangCode].split(' ')[1]}`;
    }
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

  // Auto-redirect based on browser language (optional feature)
  function autoDetectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0]; // Get 'en' from 'en-US'

    const supportedLangs = ['en', 'th', 'de', 'fr', 'sv', 'no', 'it', 'nl'];

    if (supportedLangs.includes(langCode) && langCode !== 'en') {
      const savedLang = getLanguagePreference();

      // Only redirect if user hasn't manually chosen a language before
      if (!savedLang || savedLang === 'en') {
        // Uncomment the line below to enable auto-redirect
        // window.location.href = `/${langCode}/`;
      }
    }
  }
})();
