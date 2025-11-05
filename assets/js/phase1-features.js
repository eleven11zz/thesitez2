/* ===================================
   Phase 1 Features: Reviews, Comparison, Quiz
   =================================== */

// Customer Reviews - Star Rating Animation
document.addEventListener('DOMContentLoaded', function() {

  // Animate review stats on scroll
  const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px'
  };

  const animateNumbers = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const finalValue = parseFloat(target.getAttribute('data-count'));
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const currentValue = finalValue * easeOutQuart;

          if (target.classList.contains('review-stat-value')) {
            target.textContent = Math.floor(currentValue).toLocaleString();
          } else {
            target.textContent = currentValue.toFixed(1);
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
        observer.unobserve(target);
      }
    });
  };

  const statsObserver = new IntersectionObserver(animateNumbers, observerOptions);

  document.querySelectorAll('[data-count]').forEach(stat => {
    statsObserver.observe(stat);
  });

  // Review cards hover effect
  const reviewCards = document.querySelectorAll('.review-card');
  reviewCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.zIndex = '10';
    });
    card.addEventListener('mouseleave', function() {
      this.style.zIndex = '1';
    });
  });
});

// IPTV vs Cable Comparison Toggle
class ComparisonTool {
  constructor() {
    this.currentView = 'overview';
    this.init();
  }

  init() {
    const tabs = document.querySelectorAll('.comparison-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchView(e.target.getAttribute('data-view'));
      });
    });
  }

  switchView(view) {
    this.currentView = view;

    // Update active tab
    document.querySelectorAll('.comparison-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-view') === view) {
        tab.classList.add('active');
      }
    });

    // Update comparison cards
    const cards = document.querySelectorAll('.comparison-card');
    cards.forEach(card => {
      card.style.animation = 'none';
      setTimeout(() => {
        card.style.animation = 'quizSlideIn 0.5s ease';
      }, 10);
    });

    // You can add more view-specific logic here
    console.log(`Switched to ${view} view`);
  }
}

// Initialize comparison tool
if (document.querySelector('.comparison-section')) {
  new ComparisonTool();
}

// Package Recommender Quiz
class PackageQuiz {
  constructor() {
    this.currentQuestion = 0;
    this.answers = {};

    // Initialize analytics
    this.analytics = new QuizAnalytics({
      enableTracking: true,
      enableABTesting: false, // Set to true to enable A/B testing
      debug: true // Set to false in production
    });

    this.questions = [
      {
        id: 'region',
        question: 'Which region are you primarily interested in?',
        options: [
          { value: 'uk', label: '🇬🇧 UK & Ireland' },
          { value: 'europe', label: '🇪🇺 Europe (France, Germany, Italy)' },
          { value: 'scandinavia', label: '🇸🇪 Scandinavia' },
          { value: 'latam', label: '🌎 Latin America' },
          { value: 'india', label: '🇮🇳 India & South Asia' },
          { value: 'global', label: '🌍 Global / Multi-region' }
        ]
      },
      {
        id: 'content',
        question: 'What type of content matters most to you?',
        options: [
          { value: 'sports', label: '⚽ Live Sports' },
          { value: 'movies', label: '🎬 Movies & Series' },
          { value: 'news', label: '📰 News & Current Affairs' },
          { value: 'entertainment', label: '🎭 Entertainment & Variety' },
          { value: 'kids', label: '👶 Kids & Family' },
          { value: 'mixed', label: '🎯 Balanced Mix' }
        ]
      },
      {
        id: 'devices',
        question: 'How many devices will you use simultaneously?',
        options: [
          { value: '1', label: '1 Device' },
          { value: '2', label: '2 Devices' },
          { value: '3', label: '3 Devices' },
          { value: '4+', label: '4+ Devices' }
        ]
      },
      {
        id: 'quality',
        question: 'What streaming quality do you need?',
        options: [
          { value: 'hd', label: 'HD (720p-1080p)' },
          { value: '4k', label: '4K Ultra HD' },
          { value: 'adaptive', label: 'Adaptive (auto-adjust)' }
        ]
      },
      {
        id: 'budget',
        question: 'What\'s your monthly budget?',
        options: [
          { value: 'budget', label: '$ Budget-friendly' },
          { value: 'mid', label: '$$ Standard' },
          { value: 'premium', label: '$$$ Premium' },
          { value: 'unlimited', label: '$$$$ Best Available' }
        ]
      }
    ];

    this.recommendations = {
      uk: {
        name: 'Premier English IPTV',
        description: 'Perfect for UK/Ireland viewers who want comprehensive coverage of Premier League, Sky Sports, and British entertainment.',
        features: [
          'Full Sky Sports & TNT Sports coverage',
          'BBC, ITV, Channel 4/5 + regional variants',
          'Premier League, UEFA, Cricket, F1',
          '14-day catch-up functionality'
        ],
        link: './channel-lists/iptv/english.html',
        buyLink: 'https://www.lazada.co.th/products/i5910320702.html'
      },
      europe: {
        name: 'European Multi-Pack',
        description: 'Ideal for viewers wanting French, German, or Italian content with top sports and entertainment channels.',
        features: [
          'Canal+, beIN Sports, DAZN coverage',
          'Bundesliga, Serie A, Ligue 1',
          'National broadcasters across 3+ countries',
          'Multi-language audio support'
        ],
        link: './iptv-products.html',
        buyLink: 'https://www.lazada.co.th/products/i5910416482.html'
      },
      scandinavia: {
        name: 'Nordic IPTV Fabric',
        description: 'Complete Nordic bundle with Viaplay, C More, and national broadcasters from Sweden, Norway, Denmark, and Finland.',
        features: [
          'Viaplay Sport & C More Live',
          'SVT, TV4, DR, NRK, YLE channels',
          'NHL, European football, winter sports',
          'Nordic language support'
        ],
        link: './channel-lists/iptv/scandinavia.html',
        buyLink: 'https://www.lazada.co.th/products/i5910375334.html'
      },
      latam: {
        name: 'LATAM Sports & Novelas',
        description: 'Spanish and Portuguese mega-pack with fútbol, novelas, and entertainment across Latin America.',
        features: [
          'ESPN Deportes, Fox Sports, TUDN',
          'Televisa, Univision, Telemundo, Globo',
          'Liga MX, Copa Libertadores, Brazilian leagues',
          'Bilingual Spanish/Portuguese interface'
        ],
        link: './channel-lists/iptv/latin.html',
        buyLink: 'https://www.lazada.co.th/products/i5910398913.html'
      },
      india: {
        name: 'India Cricket & Cinema',
        description: 'Comprehensive Indian package with cricket, Bollywood, and regional content in Hindi, Tamil, Telugu, and more.',
        features: [
          'Star Sports Network (all languages)',
          'Zee TV, Colors, Star Plus, Sony SET',
          'Full cricket calendar + IPL coverage',
          'Regional language channels'
        ],
        link: './channel-lists/iptv/india.html',
        buyLink: 'https://www.lazada.co.th/products/i5910424055.html'
      },
      global: {
        name: 'Global Hospitality IPTV',
        description: 'Worldwide super-bundle spanning 50+ countries, perfect for multi-national households or hospitality venues.',
        features: [
          'Premium sports from 6 continents',
          'Global news: BBC, CNN, Al Jazeera, CNBC',
          '50+ country channel bouquets',
          'Scalable concurrent streams'
        ],
        link: './channel-lists/iptv/world.html',
        buyLink: 'https://www.lazada.co.th/products/i5910496099.html'
      }
    };

    this.init();
  }

  init() {
    this.analytics.startQuiz();
    this.renderQuestion();
    this.setupNavigation();
  }

  renderQuestion() {
    const container = document.querySelector('.quiz-questions-container');
    if (!container) return;

    container.innerHTML = '';

    this.questions.forEach((q, index) => {
      const questionDiv = document.createElement('div');
      questionDiv.className = `quiz-question ${index === this.currentQuestion ? 'active' : ''}`;
      questionDiv.setAttribute('data-question', index);

      let optionsHTML = '';
      q.options.forEach(option => {
        const isSelected = this.answers[q.id] === option.value;
        optionsHTML += `
          <div class="quiz-option ${isSelected ? 'selected' : ''}"
               data-question-id="${q.id}"
               data-value="${option.value}">
            ${option.label}
          </div>
        `;
      });

      questionDiv.innerHTML = `
        <h3>${q.question}</h3>
        <div class="quiz-options">
          ${optionsHTML}
        </div>
      `;

      container.appendChild(questionDiv);
    });

    // Add click handlers to options
    document.querySelectorAll('.quiz-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const questionId = e.target.getAttribute('data-question-id');
        const value = e.target.getAttribute('data-value');
        this.selectOption(questionId, value);
      });
    });

    this.updateProgress();
  }

  selectOption(questionId, value) {
    this.answers[questionId] = value;

    // Track answer
    this.analytics.answerQuestion(this.currentQuestion, questionId, value);

    // Update UI
    document.querySelectorAll(`[data-question-id="${questionId}"]`).forEach(opt => {
      opt.classList.remove('selected');
    });
    document.querySelector(`[data-question-id="${questionId}"][data-value="${value}"]`).classList.add('selected');

    // Enable next button
    document.querySelector('.quiz-btn-next').disabled = false;
  }

  setupNavigation() {
    const backBtn = document.querySelector('.quiz-btn-back');
    const nextBtn = document.querySelector('.quiz-btn-next');

    if (backBtn) {
      backBtn.addEventListener('click', () => this.previousQuestion());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    // Restart quiz
    const restartBtn = document.querySelector('.quiz-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }
  }

  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion--;
      this.analytics.navigateBack(this.currentQuestion);
      this.showQuestion(this.currentQuestion);
      this.updateProgress();
    }
  }

  nextQuestion() {
    const currentQuestionId = this.questions[this.currentQuestion].id;

    if (!this.answers[currentQuestionId]) {
      alert('Please select an option before continuing');
      return;
    }

    if (this.currentQuestion < this.questions.length - 1) {
      this.currentQuestion++;
      this.showQuestion(this.currentQuestion);
      this.updateProgress();
    } else {
      this.showResults();
    }
  }

  showQuestion(index) {
    document.querySelectorAll('.quiz-question').forEach((q, i) => {
      q.classList.toggle('active', i === index);
    });

    // Update button states
    const backBtn = document.querySelector('.quiz-btn-back');
    const nextBtn = document.querySelector('.quiz-btn-next');

    if (backBtn) {
      backBtn.style.display = index === 0 ? 'none' : 'block';
    }

    if (nextBtn) {
      const currentQuestionId = this.questions[index].id;
      nextBtn.disabled = !this.answers[currentQuestionId];
      nextBtn.textContent = index === this.questions.length - 1 ? 'See Results' : 'Next';
    }
  }

  updateProgress() {
    const progressFill = document.querySelector('.quiz-progress-fill');
    const progressText = document.querySelector('.quiz-progress-text');

    const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
    }
  }

  getRecommendation() {
    // Simple recommendation logic based on region answer
    const region = this.answers.region || 'global';
    return this.recommendations[region] || this.recommendations.global;
  }

  showResults() {
    const questionsContainer = document.querySelector('.quiz-questions-container');
    const resultsContainer = document.querySelector('.quiz-results');
    const navigation = document.querySelector('.quiz-navigation');

    if (questionsContainer) questionsContainer.style.display = 'none';
    if (navigation) navigation.style.display = 'none';
    if (resultsContainer) {
      resultsContainer.classList.add('active');

      const recommendation = this.getRecommendation();

      // Track completion
      this.analytics.completeQuiz(recommendation);

      resultsContainer.innerHTML = `
        <h3>🎉 Your Perfect IPTV Package</h3>
        <p class="quiz-results-subtitle">Based on your preferences, we recommend:</p>

        <div class="quiz-recommendation">
          <h4>${recommendation.name}</h4>
          <p>${recommendation.description}</p>

          <ul class="quiz-recommendation-features">
            ${recommendation.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>

          <a href="${recommendation.buyLink}"
             class="quiz-recommendation-cta"
             target="_blank"
             rel="noopener"
             onclick="window.quizAnalytics?.trackConversion('${recommendation.name}', 'lazada')">
            Buy on Lazada →
          </a>

          <div style="margin-top: 1rem;">
            <a href="${recommendation.link}" style="color: rgba(248, 250, 251, 0.7); text-decoration: underline; font-size: 0.9rem;">
              View full channel list
            </a>
          </div>
        </div>

        <button class="quiz-restart">Take Quiz Again</button>
      `;

      // Re-attach restart handler
      document.querySelector('.quiz-restart').addEventListener('click', () => this.restart());
    }
  }

  restart() {
    this.currentQuestion = 0;
    this.answers = {};

    const questionsContainer = document.querySelector('.quiz-questions-container');
    const resultsContainer = document.querySelector('.quiz-results');
    const navigation = document.querySelector('.quiz-navigation');

    if (questionsContainer) questionsContainer.style.display = 'block';
    if (navigation) navigation.style.display = 'flex';
    if (resultsContainer) {
      resultsContainer.classList.remove('active');
    }

    this.renderQuestion();
  }
}

// Initialize quiz when DOM is ready
if (document.querySelector('.quiz-section')) {
  document.addEventListener('DOMContentLoaded', () => {
    const quiz = new PackageQuiz();

    // Make analytics available globally for tracking
    window.quizAnalytics = quiz.analytics;

    // Log analytics dashboard in console (for development)
    if (quiz.analytics.config.debug) {
      console.log('📊 Quiz Analytics Dashboard available. Call quizAnalytics.showDashboard() to view stats.');
    }
  });
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Intersection Observer for reveal animations
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.review-card, .comparison-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

  revealObserver.observe(el);
});

// Add revealed class styling
const style = document.createElement('style');
style.textContent = `
  .revealed {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(style);
