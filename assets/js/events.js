const scriptEl = document.getElementById("live-events-script");
const EVENTS_URL = scriptEl?.dataset?.eventsFeed || "/assets/js/events.json";

const state = {
  leagues: [],
  topEvents: [],
  activeSlug: "all",
};

const countdownIntervals = [];

const filtersEl = document.querySelector("[data-live-filters]");
const wrapperEl = document.querySelector("[data-live-wrapper]");
const sliderSection = document.querySelector("[data-live-slider]");
const sliderTrack = document.querySelector("[data-live-track]");
const sliderPrev = document.querySelector("[data-live-prev]");
const sliderNext = document.querySelector("[data-live-next]");

function createMetaTag(text) {
  if (!text) return null;
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function createTeamBadge(team) {
  const badge = document.createElement("div");
  badge.className = "team-badge";

  if (team?.badge) {
    const img = document.createElement("img");
    img.src = team.badge;
    img.alt = team.name || "Team badge";
    img.loading = "lazy";
    img.decoding = "async";
    badge.appendChild(img);
  } else {
    const initials = document.createElement("span");
    initials.textContent = team?.name
      ? team.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 3)
          .toUpperCase()
      : "?";
    badge.appendChild(initials);
  }

  return badge;
}

function formatLocalTime(start) {
  if (!start?.utc) return { label: start?.date || "", tooltip: "" };
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const date = new Date(start.utc);
  return {
    label: formatter.format(date),
    tooltip: `Local time: ${formatter.format(date)}`,
  };
}

function renderChannels(stations = []) {
  const container = document.createElement("div");
  container.className = "channel-chips";

  if (!stations.length) {
    const chip = document.createElement("span");
    chip.className = "channel-chip";
    chip.textContent = "Channel list tbc";
    container.appendChild(chip);
    return container;
  }

  stations.slice(0, 6).forEach((station) => {
    const chip = document.createElement("span");
    chip.className = "channel-chip";
    chip.textContent = station;
    container.appendChild(chip);
  });

  if (stations.length > 6) {
    const more = document.createElement("span");
    more.className = "channel-chip";
    more.textContent = `+${stations.length - 6} more`;
    container.appendChild(more);
  }

  return container;
}

function registerCountdown(updateFn) {
  const interval = setInterval(updateFn, 1000);
  countdownIntervals.push(interval);
  return interval;
}

function clearCountdowns() {
  countdownIntervals.forEach((id) => clearInterval(id));
  countdownIntervals.length = 0;
}

function formatDuration(diffMs) {
  if (diffMs <= 0) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function createCountdown(utc, { compact = false } = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = compact ? "card-countdown" : "countdown";

  if (!utc) {
    wrapper.textContent = "Kick-off TBC";
    return wrapper;
  }

  const label = document.createElement("span");
  label.className = "countdown-label";
  label.textContent = compact ? "Starts in" : "Kick-off in";

  const days = document.createElement("span");
  const hours = document.createElement("span");
  const minutes = document.createElement("span");
  const seconds = document.createElement("span");

  wrapper.append(label, days, hours, minutes, seconds);

  const target = new Date(utc).getTime();

  const update = () => {
    const diff = target - Date.now();
    const formatted = formatDuration(diff);
    days.textContent = `${formatted.days}d`;
    hours.textContent = `${formatted.hours}h`;
    minutes.textContent = `${formatted.minutes}m`;
    seconds.textContent = `${formatted.seconds}s`;
    if (diff <= 0) {
      clearInterval(intervalId);
      label.textContent = "Live now";
      hours.remove();
      minutes.remove();
      seconds.remove();
      days.textContent = "";
    }
  };

  update();
  const intervalId = registerCountdown(update);

  return wrapper;
}

function createEventCard(event, league) {
  const card = document.createElement("article");
  card.className = "event-card";
  const bg = event.image || "/assets/benefits-bg.webp";
  card.style.setProperty("--card-image", `url("${bg}")`);

  const content = document.createElement("div");
  content.className = "event-content";

  const metaRow = document.createElement("div");
  metaRow.className = "event-meta-row";

  const timeInfo = formatLocalTime(event.start);
  [league.label, timeInfo.label, event.city]
    .map(createMetaTag)
    .filter(Boolean)
    .forEach((el) => metaRow.appendChild(el));

  if (timeInfo.tooltip && metaRow.firstChild) {
    metaRow.firstChild.title = timeInfo.tooltip;
  }

  const title = document.createElement("h3");
  title.className = "event-title";
  title.textContent = event.title || "Upcoming fixture";

  const teamsRow = document.createElement("div");
  teamsRow.className = "teams-row";
  teamsRow.appendChild(createTeamBadge(event.homeTeam));

  const vs = document.createElement("span");
  vs.className = "vs-divider";
  vs.textContent = "vs";

  teamsRow.appendChild(vs);
  teamsRow.appendChild(createTeamBadge(event.awayTeam));

  const channelRow = renderChannels(event.tvStations);
  const countdownRow = createCountdown(event.start?.utc, { compact: true });

  const ctaRow = document.createElement("div");
  ctaRow.className = "cta-row";

  const watchCta = document.createElement("a");
  watchCta.className = "cta-button";
  watchCta.href = "/iptv-products.html#free-trial";
  watchCta.dataset.analytics = `cta-watch-${event.slug || event.id}`;
  watchCta.textContent = "Watch with TVMaster";

  const infoCta = document.createElement("a");
  infoCta.className = "cta-button cta-secondary";
  infoCta.href = event.eventUrl || "#";
  infoCta.target = "_blank";
  infoCta.rel = "noopener";
  infoCta.textContent = "Event details";

  ctaRow.append(watchCta, infoCta);

  if (event.highlights) {
    const highlightsCta = document.createElement("a");
    highlightsCta.className = "cta-button cta-secondary";
    highlightsCta.href = event.highlights;
    highlightsCta.target = "_blank";
    highlightsCta.rel = "noopener";
    highlightsCta.textContent = "Watch highlights";
    ctaRow.appendChild(highlightsCta);
  }

  if (event.mapsUrl) {
    const venueLink = document.createElement("a");
    venueLink.className = "cta-button cta-secondary";
    venueLink.href = event.mapsUrl;
    venueLink.target = "_blank";
    venueLink.rel = "noopener";
    venueLink.textContent = "Venue map";
    ctaRow.appendChild(venueLink);
  }

  if (event.odds) {
    const oddsRow = document.createElement("div");
    oddsRow.className = "channel-chips";
    const oddsTitle = document.createElement("span");
    oddsTitle.className = "channel-chip";
    oddsTitle.textContent = "Odds";
    oddsRow.appendChild(oddsTitle);

    if (event.odds.home) {
      const homeChip = document.createElement("span");
      homeChip.className = "channel-chip";
      homeChip.textContent = `Home ${event.odds.home}`;
      oddsRow.appendChild(homeChip);
    }
    if (event.odds.draw) {
      const drawChip = document.createElement("span");
      drawChip.className = "channel-chip";
      drawChip.textContent = `Draw ${event.odds.draw}`;
      oddsRow.appendChild(drawChip);
    }
    if (event.odds.away) {
      const awayChip = document.createElement("span");
      awayChip.className = "channel-chip";
      awayChip.textContent = `Away ${event.odds.away}`;
      oddsRow.appendChild(awayChip);
    }
    content.appendChild(oddsRow);
  }

  content.append(metaRow, title, teamsRow, countdownRow, channelRow, ctaRow);
  card.appendChild(content);
  return card;
}

function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function renderSkeletons() {
  clearChildren(wrapperEl);

  const section = document.createElement("section");
  section.className = "league-section";

  const grid = document.createElement("div");
  grid.className = "events-grid";

  for (let idx = 0; idx < 6; idx += 1) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card";
    grid.appendChild(skeleton);
  }

  section.appendChild(grid);
  wrapperEl.appendChild(section);
}

function renderEmptyState(message) {
  clearChildren(wrapperEl);
  const stateEl = document.createElement("div");
  stateEl.className = "empty-state";
  stateEl.textContent = message;
  wrapperEl.appendChild(stateEl);
}

function renderError(message) {
  clearChildren(wrapperEl);
  const stateEl = document.createElement("div");
  stateEl.className = "error-state";
  stateEl.textContent = message;
  wrapperEl.appendChild(stateEl);
}

function createSliderCard(event) {
  const card = document.createElement("article");
  card.className = "slider-card";
  const bg = event.image || "/assets/benefits-bg.webp";
  card.style.setProperty("--card-image", `url("${bg}")`);

  const content = document.createElement("div");
  content.className = "slider-content";

  const label = document.createElement("span");
  label.className = "slider-label";
  label.textContent = `${event.league || event.sport || "Live Sport"}`;

  const title = document.createElement("h3");
  title.className = "slider-title";
  title.textContent = event.title || "Upcoming fixture";

  const meta = document.createElement("div");
  meta.className = "slider-meta";
  const timeInfo = formatLocalTime(event.start);
  [timeInfo.label, event.venue, event.city].forEach((text) => {
    if (!text) return;
    const span = document.createElement("span");
    span.textContent = text;
    meta.appendChild(span);
  });

  const countdown = createCountdown(event.start?.utc);

  const cta = document.createElement("a");
  cta.className = "slider-cta";
  cta.href = "/iptv-products.html#free-trial";
  cta.dataset.analytics = `cta-slider-${event.slug || event.id}`;
  cta.textContent = "Start Free Trial";

  content.append(label, title, meta, countdown);

  if (event.highlights) {
    const highlights = document.createElement("a");
    highlights.className = "slider-cta";
    highlights.href = event.highlights;
    highlights.target = "_blank";
    highlights.rel = "noopener";
    highlights.textContent = "Highlights";
    content.appendChild(highlights);
  }

  if (event.mapsUrl) {
    const venue = document.createElement("a");
    venue.className = "slider-cta";
    venue.href = event.mapsUrl;
    venue.target = "_blank";
    venue.rel = "noopener";
    venue.textContent = "Venue Map";
    content.appendChild(venue);
  }

  content.appendChild(cta);
  card.appendChild(content);
  return card;
}

function filteredLeagues() {
  if (state.activeSlug === "all") return state.leagues;
  return state.leagues.filter((league) => league.slug === state.activeSlug);
}

function renderEvents() {
  clearCountdowns();
  const leaguesToShow = filteredLeagues();
  clearChildren(wrapperEl);

  if (!leaguesToShow.length) {
    renderEmptyState("No upcoming fixtures found. Check back tomorrow!");
    return;
  }

  leaguesToShow.forEach((league) => {
    if (!league.events?.length) return;

    const section = document.createElement("section");
    section.className = "league-section";
    section.dataset.league = league.slug;

    const header = document.createElement("div");
    header.className = "league-header";

    const title = document.createElement("h2");
    title.textContent = league.label;

    const meta = document.createElement("span");
    meta.className = "league-meta";
    meta.textContent = `${league.events.length} upcoming fixtures · ${league.sport}`;

    header.append(title, meta);

    const grid = document.createElement("div");
    grid.className = "events-grid";

    league.events.forEach((event) => {
      grid.appendChild(createEventCard(event, league));
    });

    section.append(header, grid);
    wrapperEl.appendChild(section);
  });
}

function renderFilters() {
  clearChildren(filtersEl);

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = `filter-chip ${
    state.activeSlug === "all" ? "is-active" : ""
  }`;
  allBtn.textContent = "All Sports";
  allBtn.addEventListener("click", () => {
    state.activeSlug = "all";
    renderFilters();
    renderEvents();
  });
  filtersEl.appendChild(allBtn);

  state.leagues.forEach((league) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `filter-chip ${
      state.activeSlug === league.slug ? "is-active" : ""
    }`;
    btn.textContent = league.label;
    btn.addEventListener("click", () => {
      state.activeSlug = league.slug;
      renderFilters();
      renderEvents();
    });
    filtersEl.appendChild(btn);
  });
}

function flattenEvents(leagues) {
  return leagues.flatMap((league) =>
    (league.events || []).map((event) => ({
      ...event,
      league: league.label,
      sport: league.sport,
    }))
  );
}

function renderSlider() {
  if (!sliderSection || !sliderTrack) return;

  const { topEvents } = state;
  if (!topEvents.length) {
    sliderSection.hidden = true;
    clearChildren(sliderTrack);
    return;
  }

  sliderSection.hidden = false;
  clearChildren(sliderTrack);
  topEvents.forEach((event) => {
    sliderTrack.appendChild(createSliderCard(event));
  });

  if (sliderPrev && sliderNext) {
    sliderPrev.onclick = () => {
      sliderTrack.scrollBy({ left: -360, behavior: "smooth" });
    };
    sliderNext.onclick = () => {
      sliderTrack.scrollBy({ left: 360, behavior: "smooth" });
    };
  }
}

async function loadEvents() {
  renderSkeletons();
  try {
    const res = await fetch(EVENTS_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load events (${res.status})`);
    }
    const data = await res.json();
    state.leagues =
      data?.leagues?.filter((league) => league.events?.length) || [];

    if (!state.leagues.length) {
      renderEmptyState("Check back later—fresh fixtures are loading.");
      renderSlider();
      return;
    }

    const allEvents = flattenEvents(state.leagues).filter(
      (event) => event.start?.utc
    );
    allEvents.sort(
      (a, b) => new Date(a.start.utc).getTime() - new Date(b.start.utc).getTime()
    );
    state.topEvents = allEvents.slice(0, 8);

    renderFilters();
    renderSlider();
    renderEvents();
  } catch (error) {
    console.error("[events] Unable to load events feed:", error);
    renderError("Could not load live fixtures. Refresh or try again later.");
    renderSlider();
  }
}

loadEvents();
