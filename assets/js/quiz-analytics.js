/**
 * Quiz Analytics & A/B Testing System
 *
 * Features:
 * - Track quiz start, completion, and abandonment
 * - Question-level analytics
 * - Time-on-question tracking
 * - A/B test variant assignment
 * - localStorage persistence
 * - Console dashboard for insights
 */

class QuizAnalytics {
  constructor(config = {}) {
    this.config = {
      enableTracking: config.enableTracking !== false,
      enableABTesting: config.enableABTesting || false,
      debug: config.debug || false,
      storageKey: 'tvmaster_quiz_analytics',
      sessionKey: 'tvmaster_quiz_session'
    };

    this.sessionData = this.loadSession();
    this.analytics = this.loadAnalytics();

    // A/B Test variants
    this.variants = {
      A: { name: 'Original', description: 'Standard 5-question quiz' },
      B: { name: 'Quick', description: '3-question simplified quiz' },
      C: { name: 'Detailed', description: '7-question comprehensive quiz' }
    };

    this.log('Quiz Analytics initialized', this.config);
  }

  /**
   * Initialize quiz session
   * @param {string} variant - A/B test variant (optional)
   */
  startQuiz(variant = null) {
    // Assign variant if A/B testing enabled
    if (this.config.enableABTesting && !variant) {
      variant = this.assignVariant();
    } else {
      variant = variant || 'A';
    }

    this.sessionData = {
      sessionId: this.generateSessionId(),
      variant: variant,
      startTime: Date.now(),
      endTime: null,
      completed: false,
      abandoned: false,
      currentQuestion: 0,
      totalQuestions: 5,
      answers: {},
      questionTimes: {},
      recommendation: null,
      converted: false // Did they click buy link?
    };

    this.saveSession();
    this.trackEvent('quiz_started', { variant });
    this.log('Quiz started', this.sessionData);
  }

  /**
   * Track answer to a question
   * @param {number} questionIndex - Question index
   * @param {string} questionId - Question ID
   * @param {string} answer - Selected answer
   */
  answerQuestion(questionIndex, questionId, answer) {
    if (!this.sessionData) {
      this.log('Warning: No active session', 'warn');
      return;
    }

    const now = Date.now();

    // Track answer
    this.sessionData.answers[questionId] = answer;

    // Calculate time spent on question
    if (this.sessionData.currentQuestionStartTime) {
      const timeSpent = now - this.sessionData.currentQuestionStartTime;
      this.sessionData.questionTimes[questionId] = timeSpent;
    }

    // Update current question
    this.sessionData.currentQuestion = questionIndex + 1;
    this.sessionData.currentQuestionStartTime = now;

    this.saveSession();
    this.trackEvent('question_answered', {
      questionIndex,
      questionId,
      answer,
      timeSpent: this.sessionData.questionTimes[questionId]
    });

    this.log(`Question ${questionIndex + 1} answered: ${answer}`);
  }

  /**
   * Track navigation back to previous question
   * @param {number} questionIndex - New question index
   */
  navigateBack(questionIndex) {
    if (!this.sessionData) return;

    this.sessionData.currentQuestion = questionIndex;
    this.sessionData.currentQuestionStartTime = Date.now();
    this.saveSession();
    this.trackEvent('quiz_navigation_back', { questionIndex });
  }

  /**
   * Complete quiz with recommendation
   * @param {Object} recommendation - Recommended package
   */
  completeQuiz(recommendation) {
    if (!this.sessionData) return;

    this.sessionData.endTime = Date.now();
    this.sessionData.completed = true;
    this.sessionData.recommendation = recommendation;

    const duration = this.sessionData.endTime - this.sessionData.startTime;
    const avgTimePerQuestion = duration / this.sessionData.totalQuestions;

    this.saveSession();
    this.trackEvent('quiz_completed', {
      variant: this.sessionData.variant,
      duration,
      avgTimePerQuestion,
      recommendation: recommendation.name,
      totalQuestions: this.sessionData.totalQuestions
    });

    // Save to analytics
    this.saveCompletion();

    this.log('Quiz completed', {
      duration: `${Math.round(duration / 1000)}s`,
      recommendation: recommendation.name
    });
  }

  /**
   * Track quiz abandonment
   * @param {number} questionIndex - Question where abandoned
   * @param {string} reason - Reason for abandonment (optional)
   */
  abandonQuiz(questionIndex, reason = 'unknown') {
    if (!this.sessionData || this.sessionData.completed) return;

    this.sessionData.endTime = Date.now();
    this.sessionData.abandoned = true;
    this.sessionData.abandonedAt = questionIndex;
    this.sessionData.abandonReason = reason;

    const duration = this.sessionData.endTime - this.sessionData.startTime;

    this.saveSession();
    this.trackEvent('quiz_abandoned', {
      variant: this.sessionData.variant,
      questionIndex,
      reason,
      duration,
      answeredQuestions: Object.keys(this.sessionData.answers).length
    });

    this.saveAbandonment();

    this.log('Quiz abandoned', { at: questionIndex, reason });
  }

  /**
   * Track conversion (clicked buy link)
   * @param {string} packageName - Package purchased
   * @param {string} platform - 'lazada' or other
   */
  trackConversion(packageName, platform = 'lazada') {
    if (!this.sessionData) return;

    this.sessionData.converted = true;
    this.sessionData.conversionPackage = packageName;
    this.sessionData.conversionPlatform = platform;
    this.sessionData.conversionTime = Date.now();

    this.saveSession();
    this.trackEvent('quiz_conversion', {
      variant: this.sessionData.variant,
      packageName,
      platform,
      timeToConvert: this.sessionData.conversionTime - this.sessionData.endTime
    });

    this.saveConversion();

    this.log('Conversion tracked', { packageName, platform });
  }

  /**
   * Assign A/B test variant
   * @returns {string} Variant ID (A, B, or C)
   */
  assignVariant() {
    // Check if user already has a variant assigned
    const existingVariant = localStorage.getItem('tvmaster_quiz_variant');
    if (existingVariant) {
      return existingVariant;
    }

    // Random assignment
    const variants = Object.keys(this.variants);
    const assigned = variants[Math.floor(Math.random() * variants.length)];

    localStorage.setItem('tvmaster_quiz_variant', assigned);
    this.log(`Assigned variant: ${assigned} - ${this.variants[assigned].name}`);

    return assigned;
  }

  /**
   * Track custom event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  trackEvent(eventName, data = {}) {
    if (!this.config.enableTracking) return;

    const event = {
      event: eventName,
      timestamp: Date.now(),
      sessionId: this.sessionData?.sessionId,
      variant: this.sessionData?.variant,
      data: data
    };

    // Log to console
    this.log(`Event: ${eventName}`, data);

    // Add to analytics history
    if (!this.analytics.events) {
      this.analytics.events = [];
    }
    this.analytics.events.push(event);

    // Keep only last 500 events
    if (this.analytics.events.length > 500) {
      this.analytics.events = this.analytics.events.slice(-500);
    }

    this.saveAnalytics();

    // Send to external analytics (Google Analytics, etc.) if configured
    this.sendToExternalAnalytics(eventName, data);
  }

  /**
   * Send event to external analytics platforms
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  sendToExternalAnalytics(eventName, data) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'quiz',
        event_label: this.sessionData?.variant,
        ...data
      });
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('trackCustom', eventName, data);
    }

    // Custom webhook (if configured)
    if (this.config.webhookUrl) {
      fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, data })
      }).catch(err => console.error('Webhook error:', err));
    }
  }

  /**
   * Save quiz completion to analytics
   */
  saveCompletion() {
    if (!this.analytics.completions) {
      this.analytics.completions = [];
    }

    this.analytics.completions.push({
      sessionId: this.sessionData.sessionId,
      variant: this.sessionData.variant,
      startTime: this.sessionData.startTime,
      endTime: this.sessionData.endTime,
      duration: this.sessionData.endTime - this.sessionData.startTime,
      answers: this.sessionData.answers,
      questionTimes: this.sessionData.questionTimes,
      recommendation: this.sessionData.recommendation,
      converted: false
    });

    this.saveAnalytics();
  }

  /**
   * Save quiz abandonment to analytics
   */
  saveAbandonment() {
    if (!this.analytics.abandonments) {
      this.analytics.abandonments = [];
    }

    this.analytics.abandonments.push({
      sessionId: this.sessionData.sessionId,
      variant: this.sessionData.variant,
      startTime: this.sessionData.startTime,
      endTime: this.sessionData.endTime,
      duration: this.sessionData.endTime - this.sessionData.startTime,
      abandonedAt: this.sessionData.abandonedAt,
      reason: this.sessionData.abandonReason,
      answers: this.sessionData.answers
    });

    this.saveAnalytics();
  }

  /**
   * Save conversion to analytics
   */
  saveConversion() {
    if (!this.analytics.conversions) {
      this.analytics.conversions = [];
    }

    this.analytics.conversions.push({
      sessionId: this.sessionData.sessionId,
      variant: this.sessionData.variant,
      packageName: this.sessionData.conversionPackage,
      platform: this.sessionData.conversionPlatform,
      conversionTime: this.sessionData.conversionTime,
      timeToConvert: this.sessionData.conversionTime - this.sessionData.endTime
    });

    // Update completion record
    if (this.analytics.completions) {
      const completion = this.analytics.completions.find(
        c => c.sessionId === this.sessionData.sessionId
      );
      if (completion) {
        completion.converted = true;
      }
    }

    this.saveAnalytics();
  }

  /**
   * Get analytics summary
   * @returns {Object} Analytics summary
   */
  getAnalyticsSummary() {
    const completions = this.analytics.completions || [];
    const abandonments = this.analytics.abandonments || [];
    const conversions = this.analytics.conversions || [];
    const totalStarts = completions.length + abandonments.length;

    const summary = {
      totalStarts,
      totalCompletions: completions.length,
      totalAbandonments: abandonments.length,
      totalConversions: conversions.length,
      completionRate: totalStarts > 0 ? (completions.length / totalStarts * 100).toFixed(1) : 0,
      abandonmentRate: totalStarts > 0 ? (abandonments.length / totalStarts * 100).toFixed(1) : 0,
      conversionRate: completions.length > 0 ? (conversions.length / completions.length * 100).toFixed(1) : 0,
      avgCompletionTime: this.calculateAvgCompletionTime(),
      mostCommonAbandonment: this.getMostCommonAbandonmentPoint(),
      topRecommendations: this.getTopRecommendations(),
      variantPerformance: this.getVariantPerformance()
    };

    return summary;
  }

  /**
   * Calculate average completion time
   * @returns {number} Average in milliseconds
   */
  calculateAvgCompletionTime() {
    const completions = this.analytics.completions || [];
    if (completions.length === 0) return 0;

    const totalTime = completions.reduce((sum, c) => sum + c.duration, 0);
    return Math.round(totalTime / completions.length);
  }

  /**
   * Get most common abandonment point
   * @returns {Object} Abandonment statistics
   */
  getMostCommonAbandonmentPoint() {
    const abandonments = this.analytics.abandonments || [];
    if (abandonments.length === 0) return null;

    const pointCounts = {};
    abandonments.forEach(a => {
      const point = a.abandonedAt || 0;
      pointCounts[point] = (pointCounts[point] || 0) + 1;
    });

    const mostCommon = Object.entries(pointCounts).sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? { question: parseInt(mostCommon[0]), count: mostCommon[1] } : null;
  }

  /**
   * Get top recommended packages
   * @returns {Array} Top recommendations
   */
  getTopRecommendations() {
    const completions = this.analytics.completions || [];
    if (completions.length === 0) return [];

    const recCounts = {};
    completions.forEach(c => {
      if (c.recommendation && c.recommendation.name) {
        const name = c.recommendation.name;
        recCounts[name] = (recCounts[name] || 0) + 1;
      }
    });

    return Object.entries(recCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, percentage: (count / completions.length * 100).toFixed(1) }));
  }

  /**
   * Get A/B test variant performance
   * @returns {Object} Variant performance metrics
   */
  getVariantPerformance() {
    const completions = this.analytics.completions || [];
    const abandonments = this.analytics.abandonments || [];
    const conversions = this.analytics.conversions || [];

    const variants = {};

    // Initialize variants
    Object.keys(this.variants).forEach(v => {
      variants[v] = {
        starts: 0,
        completions: 0,
        abandonments: 0,
        conversions: 0,
        completionRate: 0,
        conversionRate: 0
      };
    });

    // Count completions
    completions.forEach(c => {
      const v = c.variant || 'A';
      if (variants[v]) {
        variants[v].starts++;
        variants[v].completions++;
      }
    });

    // Count abandonments
    abandonments.forEach(a => {
      const v = a.variant || 'A';
      if (variants[v]) {
        variants[v].starts++;
        variants[v].abandonments++;
      }
    });

    // Count conversions
    conversions.forEach(c => {
      const v = c.variant || 'A';
      if (variants[v]) {
        variants[v].conversions++;
      }
    });

    // Calculate rates
    Object.keys(variants).forEach(v => {
      const data = variants[v];
      if (data.starts > 0) {
        data.completionRate = (data.completions / data.starts * 100).toFixed(1);
      }
      if (data.completions > 0) {
        data.conversionRate = (data.conversions / data.completions * 100).toFixed(1);
      }
    });

    return variants;
  }

  /**
   * Display analytics dashboard in console
   */
  showDashboard() {
    const summary = this.getAnalyticsSummary();

    console.log('%c📊 TVMaster Quiz Analytics Dashboard', 'font-size: 18px; font-weight: bold; color: #e50914;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📈 Overall Performance:');
    console.log(`  Total Quiz Starts: ${summary.totalStarts}`);
    console.log(`  Completions: ${summary.totalCompletions} (${summary.completionRate}%)`);
    console.log(`  Abandonments: ${summary.totalAbandonments} (${summary.abandonmentRate}%)`);
    console.log(`  Conversions: ${summary.totalConversions} (${summary.conversionRate}% of completions)`);
    console.log(`  Avg Completion Time: ${Math.round(summary.avgCompletionTime / 1000)}s`);

    if (summary.mostCommonAbandonment) {
      console.log(`\n⚠️  Most Common Abandonment: Question ${summary.mostCommonAbandonment.question + 1} (${summary.mostCommonAbandonment.count} times)`);
    }

    if (summary.topRecommendations.length > 0) {
      console.log('\n🎯 Top Recommendations:');
      summary.topRecommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.name}: ${rec.count} (${rec.percentage}%)`);
      });
    }

    if (this.config.enableABTesting) {
      console.log('\n🧪 A/B Test Variant Performance:');
      Object.entries(summary.variantPerformance).forEach(([variant, data]) => {
        if (data.starts > 0) {
          console.log(`  Variant ${variant}: ${data.starts} starts, ${data.completionRate}% completion, ${data.conversionRate}% conversion`);
        }
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Tip: Call quizAnalytics.exportData() to download full data');
  }

  /**
   * Export analytics data as JSON
   * @returns {string} JSON string of analytics data
   */
  exportData() {
    const data = {
      analytics: this.analytics,
      summary: this.getAnalyticsSummary(),
      exportDate: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);

    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('✅ Analytics data exported');
    return json;
  }

  /**
   * Reset all analytics data
   */
  resetAnalytics() {
    if (confirm('Are you sure you want to reset all quiz analytics data? This cannot be undone.')) {
      this.analytics = {
        completions: [],
        abandonments: [],
        conversions: [],
        events: []
      };
      this.saveAnalytics();
      localStorage.removeItem(this.config.sessionKey);
      localStorage.removeItem('tvmaster_quiz_variant');
      console.log('✅ Analytics data reset');
    }
  }

  /**
   * Session management
   */
  loadSession() {
    try {
      const stored = localStorage.getItem(this.config.sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  saveSession() {
    try {
      localStorage.setItem(this.config.sessionKey, JSON.stringify(this.sessionData));
    } catch (e) {
      console.error('Error saving session:', e);
    }
  }

  /**
   * Analytics storage management
   */
  loadAnalytics() {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      return stored ? JSON.parse(stored) : {
        completions: [],
        abandonments: [],
        conversions: [],
        events: []
      };
    } catch (e) {
      return {
        completions: [],
        abandonments: [],
        conversions: [],
        events: []
      };
    }
  }

  saveAnalytics() {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.analytics));
    } catch (e) {
      console.error('Error saving analytics:', e);
    }
  }

  /**
   * Utility: Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility: Log debug messages
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  log(message, data = null) {
    if (this.config.debug) {
      console.log(`[Quiz Analytics] ${message}`, data || '');
    }
  }
}

// Track page visibility for abandonment detection
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && window.quizAnalytics) {
      const analytics = window.quizAnalytics;
      if (analytics.sessionData && !analytics.sessionData.completed) {
        analytics.abandonQuiz(
          analytics.sessionData.currentQuestion,
          'page_hidden'
        );
      }
    }
  });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuizAnalytics;
}

if (typeof window !== 'undefined') {
  window.QuizAnalytics = QuizAnalytics;
}
