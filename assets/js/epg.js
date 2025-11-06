/**
 * EPG (Electronic Program Guide) Main Script
 * Handles timeline display, filtering, search, and interactions
 */

class EPGViewer {
  constructor() {
    this.parser = new EPGParser(EPG_CONFIG);
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.currentTimeOffset = 0; // hours from now
    this.refreshTimer = null;
    this.channels = [];
    this.programmes = [];

    this.init();
  }

  /**
   * Initialize EPG Viewer
   */
  async init() {
    try {
      // Show loading state
      this.showLoading();

      // Fetch EPG data
      const data = await this.parser.fetchEPG();
      this.channels = data.channels;
      this.programmes = data.programmes;

      // Initialize UI
      this.setupEventListeners();
      this.updateCurrentTime();
      this.renderEPG();
      this.updateStats();

      // Hide loading state
      this.hideLoading();

      // Start auto-refresh
      this.startAutoRefresh();

      // Update current time every minute
      setInterval(() => this.updateCurrentTime(), 60000);

    } catch (error) {
      console.error('Error initializing EPG:', error);
      this.showError();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('epgSearch');
    const clearSearch = document.getElementById('clearSearch');

    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderEPG();

      // Show/hide clear button
      if (clearSearch) {
        clearSearch.classList.toggle('visible', this.searchQuery.length > 0);
      }
    });

    clearSearch?.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      clearSearch.classList.remove('visible');
      this.renderEPG();
    });

    // Category filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update category
        this.currentCategory = btn.dataset.category;
        this.renderEPG();
      });
    });

    // Time navigation
    document.getElementById('prevTime')?.addEventListener('click', () => {
      this.currentTimeOffset -= 1;
      this.renderEPG();
    });

    document.getElementById('nextTime')?.addEventListener('click', () => {
      this.currentTimeOffset += 1;
      this.renderEPG();
    });

    document.getElementById('timeJump')?.addEventListener('change', (e) => {
      const value = e.target.value;

      if (value === 'now') {
        this.currentTimeOffset = 0;
      } else if (value === 'primetime') {
        const now = new Date();
        const hours = 20 - now.getHours(); // 8 PM
        this.currentTimeOffset = Math.max(0, hours);
      } else {
        this.currentTimeOffset = parseInt(value);
      }

      this.renderEPG();
    });

    // Modal close
    document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay')?.addEventListener('click', () => this.closeModal());

    // Retry button
    document.getElementById('retryLoad')?.addEventListener('click', () => this.init());

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  /**
   * Update current time display
   */
  updateCurrentTime() {
    const currentTimeEl = document.getElementById('currentTime');
    if (!currentTimeEl) return;

    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    currentTimeEl.textContent = now.toLocaleString('en-US', options);
  }

  /**
   * Render EPG grid
   */
  renderEPG() {
    const container = document.getElementById('epgChannels');
    if (!container) return;

    // Calculate time range
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + this.currentTimeOffset);
    startTime.setMinutes(0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + EPG_CONFIG.hoursToShow);

    // Filter channels
    let filteredChannels = this.filterChannels();

    if (filteredChannels.length === 0) {
      this.showEmpty();
      return;
    }

    // Render timeline header
    this.renderTimelineHeader(startTime, endTime);

    // Clear container
    container.innerHTML = '';

    // PERFORMANCE OPTIMIZATION: Limit initial render
    const maxChannels = EPG_CONFIG.maxChannelsToRender || filteredChannels.length;
    const channelsToRender = filteredChannels.slice(0, maxChannels);
    const remainingChannels = filteredChannels.slice(maxChannels);

    // Render initial batch using DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    channelsToRender.forEach(channel => {
      const row = this.createChannelRow(channel, startTime, endTime);
      fragment.appendChild(row);
    });
    container.appendChild(fragment);

    // Show "Load More" button if there are remaining channels
    if (remainingChannels.length > 0) {
      this.showLoadMoreButton(container, remainingChannels, startTime, endTime);
    }

    // Hide empty state
    this.hideEmpty();
  }

  /**
   * Show Load More button for remaining channels
   */
  showLoadMoreButton(container, remainingChannels, startTime, endTime) {
    const loadMoreBtn = document.createElement('div');
    loadMoreBtn.className = 'epg-load-more';
    loadMoreBtn.innerHTML = `
      <button class="load-more-btn">
        Load More Channels (${remainingChannels.length} remaining)
      </button>
    `;

    loadMoreBtn.querySelector('button').addEventListener('click', () => {
      // Remove button
      loadMoreBtn.remove();

      // Render next batch
      const nextBatch = remainingChannels.splice(0, 50);
      const fragment = document.createDocumentFragment();

      nextBatch.forEach(channel => {
        const row = this.createChannelRow(channel, startTime, endTime);
        fragment.appendChild(row);
      });

      container.appendChild(fragment);

      // Show button again if more channels remain
      if (remainingChannels.length > 0) {
        this.showLoadMoreButton(container, remainingChannels, startTime, endTime);
      }
    });

    container.appendChild(loadMoreBtn);
  }

  /**
   * Render timeline header with time slots
   */
  renderTimelineHeader(startTime, endTime) {
    const header = document.getElementById('timelineHeader');
    if (!header) return;

    header.innerHTML = '';

    // Channel label column
    const channelLabel = document.createElement('div');
    channelLabel.className = 'timeline-channel-label';
    channelLabel.textContent = 'Channels';
    header.appendChild(channelLabel);

    // Time slots
    const now = new Date();
    const slotDuration = EPG_CONFIG.timeSlotDuration; // minutes

    for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + slotDuration)) {
      const slot = document.createElement('div');
      slot.className = 'timeline-slot';

      // Check if this is the current time slot
      if (time <= now && new Date(time.getTime() + slotDuration * 60000) > now) {
        slot.classList.add('current');
      }

      // Format time
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      slot.textContent = `${hours}:${minutes}`;

      header.appendChild(slot);
    }
  }

  /**
   * Create a channel row with programmes
   */
  createChannelRow(channel, startTime, endTime) {
    const row = document.createElement('div');
    row.className = 'epg-channel-row';

    // Channel info
    const channelInfo = document.createElement('div');
    channelInfo.className = 'epg-channel-info';

    if (channel.icon) {
      const logo = document.createElement('img');
      logo.src = channel.icon || EPG_CONFIG.defaultLogo;
      logo.alt = channel.displayName;
      logo.className = 'epg-channel-logo';
      logo.loading = 'lazy';
      channelInfo.appendChild(logo);
    }

    const channelDetails = document.createElement('div');
    const channelName = document.createElement('div');
    channelName.className = 'epg-channel-name';
    channelName.textContent = channel.displayName;
    channelDetails.appendChild(channelName);

    const channelCategory = document.createElement('div');
    channelCategory.className = 'epg-channel-category';
    channelCategory.textContent = channel.category;
    channelDetails.appendChild(channelCategory);

    channelInfo.appendChild(channelDetails);
    row.appendChild(channelInfo);

    // Programmes timeline
    const programmesContainer = document.createElement('div');
    programmesContainer.className = 'epg-programs';

    const programmes = this.parser.getProgrammesForChannel(channel.id, startTime, endTime);

    programmes.forEach(programme => {
      const programEl = this.createProgrammeElement(programme);
      programmesContainer.appendChild(programEl);
    });

    // Fill empty slots if needed
    if (programmes.length === 0) {
      const emptySlot = document.createElement('div');
      emptySlot.className = 'epg-program';
      emptySlot.innerHTML = '<div class="epg-program-title">No schedule available</div>';
      programmesContainer.appendChild(emptySlot);
    }

    row.appendChild(programmesContainer);

    return row;
  }

  /**
   * Create programme element
   */
  createProgrammeElement(programme) {
    const programEl = document.createElement('div');
    programEl.className = 'epg-program';

    // Check if live
    const now = new Date();
    if (programme.start <= now && programme.stop > now) {
      programEl.classList.add('live');
    }

    // Time
    const timeEl = document.createElement('div');
    timeEl.className = 'epg-program-time';
    timeEl.textContent = this.formatProgrammeTime(programme);
    programEl.appendChild(timeEl);

    // Title
    const titleEl = document.createElement('div');
    titleEl.className = 'epg-program-title';
    titleEl.textContent = programme.title || 'No title';
    programEl.appendChild(titleEl);

    // Description (truncated)
    if (programme.desc) {
      const descEl = document.createElement('div');
      descEl.className = 'epg-program-description';
      descEl.textContent = programme.desc;
      programEl.appendChild(descEl);
    }

    // Genre tag
    if (programme.category) {
      const genreEl = document.createElement('div');
      genreEl.className = 'epg-program-genre';
      genreEl.textContent = programme.category;
      programEl.appendChild(genreEl);
    }

    // Click to show details
    programEl.addEventListener('click', () => this.showProgrammeDetails(programme));

    return programEl;
  }

  /**
   * Format programme time range
   */
  formatProgrammeTime(programme) {
    const start = programme.start;
    const stop = programme.stop;

    const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
    const stopTime = `${stop.getHours().toString().padStart(2, '0')}:${stop.getMinutes().toString().padStart(2, '0')}`;

    return `${startTime} - ${stopTime}`;
  }

  /**
   * Show programme details modal
   */
  showProgrammeDetails(programme) {
    const modal = document.getElementById('programModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    // Build modal content
    modalBody.innerHTML = `
      <h2 class="modal-program-title">${programme.title || 'No title'}</h2>

      <div class="modal-program-meta">
        <div class="modal-meta-item">
          <i class="fas fa-clock"></i>
          ${this.formatProgrammeTime(programme)}
        </div>
        ${programme.category ? `
          <div class="modal-meta-item">
            <i class="fas fa-tag"></i>
            ${programme.category}
          </div>
        ` : ''}
        ${programme.rating ? `
          <div class="modal-meta-item">
            <i class="fas fa-star"></i>
            ${programme.rating}
          </div>
        ` : ''}
      </div>

      ${programme.subTitle ? `
        <h3 style="color: #b3b3b3; margin-bottom: 1rem;">${programme.subTitle}</h3>
      ` : ''}

      ${programme.desc ? `
        <p class="modal-program-description">${programme.desc}</p>
      ` : ''}

      <a href="iptv-products.html" class="modal-cta">
        Subscribe to Watch <i class="fas fa-arrow-right"></i>
      </a>
    `;

    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    // Focus trap
    const closeBtn = document.getElementById('modalClose');
    closeBtn?.focus();
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('programModal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  /**
   * Filter channels by category and search
   */
  filterChannels() {
    let filtered = this.channels;

    // Filter by category
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(ch => ch.category === this.currentCategory);
    }

    // Filter by search query
    if (this.searchQuery) {
      filtered = filtered.filter(ch => {
        const nameMatch = ch.displayName.toLowerCase().includes(this.searchQuery);

        // Also check if any programmes match
        const programmes = this.parser.getProgrammesForChannel(ch.id, new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000));
        const programmeMatch = programmes.some(p =>
          (p.title && p.title.toLowerCase().includes(this.searchQuery)) ||
          (p.desc && p.desc.toLowerCase().includes(this.searchQuery))
        );

        return nameMatch || programmeMatch;
      });
    }

    return filtered;
  }

  /**
   * Update stats
   */
  updateStats() {
    const totalChannelsEl = document.getElementById('totalChannels');
    const liveProgramsEl = document.getElementById('livePrograms');
    const upcomingProgramsEl = document.getElementById('upcomingPrograms');

    if (totalChannelsEl) {
      totalChannelsEl.textContent = this.channels.length.toLocaleString();
    }

    if (liveProgramsEl) {
      const now = new Date();
      const liveCount = this.programmes.filter(p => p.start <= now && p.stop > now).length;
      liveProgramsEl.textContent = liveCount.toLocaleString();
    }

    if (upcomingProgramsEl) {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const upcomingCount = this.programmes.filter(p => p.start > now && p.start < nextHour).length;
      upcomingProgramsEl.textContent = upcomingCount.toLocaleString();
    }
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    const interval = EPG_CONFIG.refreshInterval * 60 * 1000; // Convert to milliseconds

    this.refreshTimer = setInterval(async () => {
      if (EPG_CONFIG.debug) console.log('Auto-refreshing EPG data...');

      try {
        const data = await this.parser.fetchEPG();
        this.channels = data.channels;
        this.programmes = data.programmes;
        this.renderEPG();
        this.updateStats();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, interval);
  }

  /**
   * Show loading state
   */
  showLoading() {
    const loading = document.getElementById('epgLoading');
    const error = document.getElementById('epgError');
    const empty = document.getElementById('epgEmpty');

    if (loading) loading.style.display = 'flex';
    if (error) error.style.display = 'none';
    if (empty) empty.style.display = 'none';
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const loading = document.getElementById('epgLoading');
    if (loading) loading.style.display = 'none';
  }

  /**
   * Show error state
   */
  showError() {
    const loading = document.getElementById('epgLoading');
    const error = document.getElementById('epgError');

    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'flex';
  }

  /**
   * Show empty state (no results)
   */
  showEmpty() {
    const empty = document.getElementById('epgEmpty');
    if (empty) empty.style.display = 'flex';
  }

  /**
   * Hide empty state
   */
  hideEmpty() {
    const empty = document.getElementById('epgEmpty');
    if (empty) empty.style.display = 'none';
  }
}

// Initialize EPG viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EPGViewer();
});
