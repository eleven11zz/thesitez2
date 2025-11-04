const scriptEl =
  document.currentScript ||
  document.querySelector("script[data-channel-source]");

const DATA_URL =
  scriptEl?.dataset?.channelSource || "./channel-lists-data.json";
const PLACEHOLDER_LOGO =
  scriptEl?.dataset?.channelPlaceholder ||
  "../images/channel-placeholder.svg";
const DEFAULT_PACKAGE_ATTR = scriptEl?.dataset?.defaultPackage || null;

// Helper to resolve dataPath relative to DATA_URL location
function resolveDataPath(dataPath) {
  try {
    // Get the directory of the JSON file
    const baseUrl = new URL(DATA_URL, window.location.href);
    // Resolve the dataPath relative to the JSON file location
    const resolvedUrl = new URL(dataPath, baseUrl.href);
    return resolvedUrl.href;
  } catch (error) {
    // Fallback to original path if URL resolution fails
    return dataPath;
  }
}
const DEFAULT_GROUP = sanitiseGroupValue(scriptEl?.dataset?.defaultGroup);
const HIDE_PACKAGE_FILTERS =
  scriptEl?.dataset?.hidePackageFilters === "true";
const variantLabel = scriptEl?.dataset?.variantLabel || "";

const filtersEl = document.querySelector("[data-channel-filters]");
const groupFiltersEl = document.querySelector("[data-group-filters]");
const contentEl = document.querySelector("[data-channel-content]");
const summaryEl = document.querySelector("[data-channel-summary]");
const searchEl = document.querySelector("[data-channel-search]");

const state = {
  packages: {},
  generatedAt: null,
  currentPackage: null,
  currentGroup: DEFAULT_GROUP,
  searchQuery: "",
  groupCache: {},
  groupRequests: {},
};

let filtersInitialised = false;
let groupFiltersInitialised = false;
let renderPromise = Promise.resolve();

function sanitiseGroupValue(value) {
  if (value === undefined || value === null) return "all";
  const trimmed = String(value).trim();
  if (!trimmed) return "all";
  if (trimmed.toLowerCase() === "all") return "all";
  const num = Number(trimmed);
  if (Number.isInteger(num) && num >= 0) {
    return String(num);
  }
  return "all";
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plural(value) {
  return value === 1 ? "" : "s";
}

function formatNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }
  return value.toLocaleString();
}

function formatGeneratedAt(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function showLoadingState() {
  if (filtersEl && !HIDE_PACKAGE_FILTERS) {
    filtersEl.classList.remove("is-hidden");
    filtersEl.innerHTML = "";
  }
  if (groupFiltersEl) {
    groupFiltersEl.classList.add("is-hidden");
    groupFiltersEl.innerHTML = "";
  }
  if (summaryEl) {
    summaryEl.textContent = "Loading channel lineups…";
  }
  if (contentEl) {
    contentEl.innerHTML =
      '<div class="empty-state is-loading">Fetching the latest channel snapshots…</div>';
  }
}

function showErrorState(message) {
  if (summaryEl) {
    summaryEl.textContent = "";
  }
  if (contentEl) {
    contentEl.innerHTML = `<div class="empty-state error-state">${escapeHtml(
      message
    )}</div>`;
  }
  if (groupFiltersEl) {
    groupFiltersEl.classList.add("is-hidden");
    groupFiltersEl.innerHTML = "";
  }
}

async function loadChannelData() {
  const response = await fetch(DATA_URL, {
    credentials: "omit",
    cache: "no-cache",
  });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  const payload = await response.json();
  if (!payload || typeof payload !== "object" || !payload.packages) {
    throw new Error("Invalid channel data format");
  }
  state.generatedAt = payload.generatedAt || null;
  state.packages = payload.packages || {};
  return state.packages;
}

function getAvailableKeys() {
  return Object.keys(state.packages);
}

function getDefaultKey(keys) {
  if (!keys.length) return null;
  return keys.includes("english") ? "english" : keys[0];
}

function detectPackageFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const pkg = params.get("package");
    if (pkg && state.packages[pkg]) {
      return pkg;
    }
  } catch (error) {
    // ignore malformed URLs
  }
  return null;
}

function resolveInitialPackage(keys) {
  const fromUrl = detectPackageFromUrl();
  if (fromUrl) return fromUrl;
  if (DEFAULT_PACKAGE_ATTR && state.packages[DEFAULT_PACKAGE_ATTR]) {
    return DEFAULT_PACKAGE_ATTR;
  }
  return getDefaultKey(keys);
}

function updateUrlParam(key) {
  if (HIDE_PACKAGE_FILTERS) return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("package", key);
    window.history.replaceState({}, "", url);
  } catch (error) {
    // ignore history issues
  }
}

function ensureGroupCache(pkgSlug) {
  if (!state.groupCache[pkgSlug]) {
    state.groupCache[pkgSlug] = new Map();
  }
  return state.groupCache[pkgSlug];
}

function ensureGroupRequests(pkgSlug) {
  if (!state.groupRequests[pkgSlug]) {
    state.groupRequests[pkgSlug] = {};
  }
  return state.groupRequests[pkgSlug];
}

function determineIndicesToLoad(pkg) {
  const groups = Array.isArray(pkg.groups) ? pkg.groups : [];
  if (state.currentGroup === "all") {
    if (state.searchQuery.trim()) {
      return groups.map((_, index) => index);
    }
    if (
      typeof pkg.totalChannels === "number" &&
      !Number.isNaN(pkg.totalChannels) &&
      pkg.totalChannels <= 4000
    ) {
      return groups.map((_, index) => index);
    }
    return [];
  }
  const index = Number(state.currentGroup);
  if (Number.isInteger(index) && index >= 0 && index < groups.length) {
    return [index];
  }
  return [];
}

async function loadGroups(pkg, indices, onProgress) {
  if (!indices.length) return;

  const cache = ensureGroupCache(pkg.slug);
  const requests = ensureGroupRequests(pkg.slug);

  const total = indices.length;
  let completed = 0;

  const tasks = indices.map((index) => {
    if (cache.has(index)) {
      completed += 1;
      if (onProgress) onProgress(completed, total);
      return null;
    }

    if (requests[index]) {
      return requests[index].then(() => {
        completed += 1;
        if (onProgress) onProgress(completed, total);
      });
    }

    const meta = pkg.groups?.[index];
    if (!meta || !meta.dataPath) {
      completed += 1;
      if (onProgress) onProgress(completed, total);
      return null;
    }

    const resolvedPath = resolveDataPath(meta.dataPath);
    const fetchPromise = fetch(resolvedPath, {
      credentials: "omit",
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const channels = Array.isArray(data.channels) ? data.channels : [];
        cache.set(index, {
          name: data.name || meta.name || `Group ${index + 1}`,
          totalChannels: data.totalChannels ?? channels.length,
          channels,
        });
      })
      .catch((error) => {
        console.error(
          `[channel-lists] Failed to load group ${index} for ${pkg.slug}:`,
          error
        );
      })
      .finally(() => {
        completed += 1;
        if (onProgress) onProgress(completed, total);
        delete requests[index];
      });

    requests[index] = fetchPromise;
    return fetchPromise;
  });

  await Promise.all(tasks.filter(Boolean));
}

function channelMatcher(query) {
  if (!query) return () => true;
  return (channel) => {
    if (!channel) return false;
    const fields = [channel.name, channel.group];
    return fields.some((field) =>
      field ? String(field).toLowerCase().includes(query) : false
    );
  };
}

function buildRenderContext(pkg) {
  const groupsMeta = Array.isArray(pkg.groups) ? pkg.groups : [];
  const cache = ensureGroupCache(pkg.slug);

  const groups = groupsMeta.map((meta, index) => {
    const cached = cache.get(index);
    const name = meta?.name || cached?.name || `Group ${index + 1}`;
    const totalChannels =
      meta?.totalChannels ?? cached?.totalChannels ?? 0;
    const channels = cached?.channels || [];
    return {
      index,
      name,
      totalChannels,
      channels,
      dataPath: meta?.dataPath || null,
    };
  });

  const counts = groups.map((group) => group.totalChannels);

  const totalChannels =
    typeof pkg.totalChannels === "number" && !Number.isNaN(pkg.totalChannels)
      ? pkg.totalChannels
      : counts.reduce((acc, count) => acc + count, 0);

  const totalGroups = pkg.totalGroups ?? groups.length;

  let activeKey = state.currentGroup;
  if (activeKey !== "all") {
    const idx = Number(activeKey);
    if (!Number.isInteger(idx) || idx < 0 || idx >= groups.length) {
      activeKey = "all";
      state.currentGroup = "all";
    }
  }

  const queryRaw = state.searchQuery || "";
  const query = queryRaw.trim().toLowerCase();
  const hasQuery = query.length > 0;
  const match = channelMatcher(query);

  const activeIndices =
    activeKey === "all"
      ? groups.map((_, index) => index)
      : [Number(activeKey)];

  const evaluatedGroups = activeIndices.map((index) => {
    const group = groups[index];
    if (!group) {
      return {
        index,
        name: `Group ${index + 1}`,
        channels: [],
        totalChannels: 0,
      };
    }
    const filteredChannels = hasQuery
      ? group.channels.filter(match)
      : group.channels;
    return {
      index,
      name: group.name,
      channels: filteredChannels,
      totalChannels: group.totalChannels,
    };
  });

  const shouldLimitAll =
    !hasQuery && activeKey === "all" && totalChannels > 4000;

  const filteredGroups = shouldLimitAll
    ? []
    : hasQuery
    ? evaluatedGroups.filter((group) => group.channels.length > 0)
    : evaluatedGroups;

  const searchMatches = hasQuery
    ? evaluatedGroups.reduce((acc, group) => acc + group.channels.length, 0)
    : null;

  const searchGroupCount = hasQuery
    ? evaluatedGroups.filter((group) => group.channels.length > 0).length
    : null;

  return {
    groups,
    counts,
    filteredGroups,
    totalChannels,
    totalGroups,
    hasQuery,
    searchMatches,
    searchGroupCount,
    activeKey,
    shouldLimitAll,
  };
}

function renderSummary(pkg, context) {
  if (!summaryEl) return;
  summaryEl.innerHTML = "";

  const titleSpan = document.createElement("span");
  const strong = document.createElement("strong");
  strong.textContent = pkg.title || "Channel lineup";
  titleSpan.appendChild(strong);
  summaryEl.appendChild(titleSpan);

  const overviewSpan = document.createElement("span");
  const totalChannelsLabel = `${formatNumber(
    context.totalChannels
  )} channel${plural(context.totalChannels)}`;
  const totalGroupsLabel = `${context.totalGroups} group${plural(
    context.totalGroups
  )}`;
  const description = pkg.description ? ` · ${pkg.description}` : "";
  overviewSpan.textContent = `${totalGroupsLabel} · ${totalChannelsLabel}${description}`;
  summaryEl.appendChild(overviewSpan);

  if (variantLabel) {
    const variantSpan = document.createElement("span");
    variantSpan.textContent = variantLabel;
    summaryEl.appendChild(variantSpan);
  }

  if (context.hasQuery) {
    const searchSummary = document.createElement("span");
    const matches = context.searchMatches ?? 0;
    const groups = context.searchGroupCount ?? 0;
    const queryDisplay = state.searchQuery.trim();
    searchSummary.textContent = `Search “${queryDisplay}” · ${formatNumber(
      matches
    )} match${plural(matches)} in ${groups} group${plural(groups)}`;
    summaryEl.appendChild(searchSummary);
  }

  const updatedLabel = formatGeneratedAt(state.generatedAt);
  if (updatedLabel) {
    const updatedSpan = document.createElement("span");
    updatedSpan.textContent = `Snapshot updated ${updatedLabel}`;
    summaryEl.appendChild(updatedSpan);
  }
}

function createGroupChip(label, value, count) {
  const chip = document.createElement("button");
  chip.className = "group-chip";
  chip.type = "button";
  chip.dataset.group = value;

  const labelSpan = document.createElement("span");
  labelSpan.className = "group-chip-label";
  labelSpan.textContent = label;
  chip.appendChild(labelSpan);

  if (typeof count === "number" && !Number.isNaN(count)) {
    const countSpan = document.createElement("span");
    countSpan.className = "group-chip-count";
    countSpan.textContent = formatNumber(count);
    chip.appendChild(countSpan);
  }

  return chip;
}

function syncGroupFilterActive(activeKey) {
  if (!groupFiltersEl) return;
  groupFiltersEl.querySelectorAll(".group-chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.group === activeKey);
  });
}

function renderGroupFilters(context) {
  if (!groupFiltersEl) return;

  const shouldHide = context.groups.length <= 1 && !context.hasQuery;
  if (shouldHide) {
    groupFiltersEl.innerHTML = "";
    groupFiltersEl.classList.add("is-hidden");
    return;
  }

  groupFiltersEl.classList.remove("is-hidden");
  groupFiltersEl.innerHTML = "";

  const fragment = document.createDocumentFragment();
  fragment.appendChild(
    createGroupChip("All Groups", "all", context.totalChannels)
  );

  context.groups.forEach((group) => {
    fragment.appendChild(
      createGroupChip(group.name, String(group.index), group.totalChannels)
    );
  });

  groupFiltersEl.appendChild(fragment);

  if (!groupFiltersInitialised) {
    groupFiltersEl.addEventListener("click", (event) => {
      const chip = event.target.closest(".group-chip");
      if (!chip) return;
      setActiveGroup(chip.dataset.group);
    });
    groupFiltersInitialised = true;
  }

  syncGroupFilterActive(context.activeKey);
}

function createChannelList(group, context) {
  const article = document.createElement("article");
  article.className = "group-card";
  article.dataset.groupIndex = String(group.index);
  article.id = `group-${group.index}`;

  const heading = document.createElement("h2");
  const title = document.createElement("span");
  title.textContent = group.name;
  heading.appendChild(title);

  const countSpan = document.createElement("span");
  countSpan.className = "channel-count";
  const displayCount = context.hasQuery
    ? group.channels.length
    : group.totalChannels;
  const label = context.hasQuery
    ? `${formatNumber(displayCount)} match${plural(displayCount)}`
    : `${formatNumber(displayCount)} channel${plural(displayCount)}`;
  countSpan.textContent = label;
  heading.appendChild(countSpan);

  article.appendChild(heading);

  if (!group.channels.length) {
    const placeholder = document.createElement("div");
    placeholder.className = "empty-state";
    placeholder.textContent = context.hasQuery
      ? "No channels matched this search in the selected group."
      : "Channel spotlight coming soon for this group.";
    article.appendChild(placeholder);
    return article;
  }

  const list = document.createElement("ul");
  list.className = "channel-list";

  group.channels.forEach((channel) => {
    const item = document.createElement("li");

    const logoWrap = document.createElement("span");
    logoWrap.className = "channel-logo";

    const img = document.createElement("img");
    img.src = channel.logo || PLACEHOLDER_LOGO;
    img.alt = `${channel.name || "Channel"} logo`;
    img.loading = "lazy";
    img.decoding = "async";
    img.onerror = () => {
      img.onerror = null;
      img.src = PLACEHOLDER_LOGO;
    };
    logoWrap.appendChild(img);

    const nameSpan = document.createElement("span");
    nameSpan.className = "channel-name";
    nameSpan.textContent = channel.name || "Channel";

    const metaSpan = document.createElement("span");
    metaSpan.className = "channel-meta";
    metaSpan.textContent = channel.group || group.name || "";

    item.append(logoWrap, nameSpan, metaSpan);
    list.appendChild(item);
  });

  article.appendChild(list);
  return article;
}

function renderGroups(context) {
  if (!contentEl) return;
  contentEl.innerHTML = "";

  if (context.shouldLimitAll) {
    const message = document.createElement("div");
    message.className = "empty-state";
    message.innerHTML = `This package includes ${formatNumber(
      context.totalChannels
    )} channel${plural(context.totalChannels)} across ${context.totalGroups} group${plural(
      context.totalGroups
    )}. Select a group or use search to drill into the lineup.`;
    contentEl.appendChild(message);
    return;
  }

  if (!context.filteredGroups.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    if (context.hasQuery) {
      const queryDisplay = escapeHtml(state.searchQuery.trim());
      empty.innerHTML = `No channels match “${queryDisplay}”. Try a different search or switch groups.`;
    } else {
      empty.textContent =
        "Channel groups are being curated for this package. Check back shortly.";
    }
    contentEl.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  context.filteredGroups.forEach((group) => {
    fragment.appendChild(createChannelList(group, context));
  });
  contentEl.appendChild(fragment);
}

async function renderPackage(pkg, { skipUrlUpdate = false } = {}) {
  const indicesToLoad = determineIndicesToLoad(pkg);
  if (indicesToLoad.length && contentEl) {
    const label =
      indicesToLoad.length > 1
        ? `Loading ${indicesToLoad.length} groups…`
        : "Loading channels…";
    contentEl.innerHTML = `<div class="empty-state is-loading">${label}</div>`;
  }

  if (indicesToLoad.length) {
    let lastUpdate = 0;
    await loadGroups(pkg, indicesToLoad, (completed, total) => {
      if (!contentEl || total <= 1) return;
      if (completed === lastUpdate) return;
      contentEl.innerHTML = `<div class="empty-state is-loading">Loading ${completed}/${total} groups…</div>`;
      lastUpdate = completed;
    });
  }

  const context = buildRenderContext(pkg);
  renderSummary(pkg, context);
  renderGroupFilters(context);
  renderGroups(context);

  if (!skipUrlUpdate) {
    updateUrlParam(state.currentPackage);
  }
}

function updateActiveFilter(key) {
  if (!filtersEl) return;
  filtersEl.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.package === key);
  });
}

function initFilters(keys) {
  if (!filtersEl) return;

  if (HIDE_PACKAGE_FILTERS || keys.length <= 1) {
    filtersEl.innerHTML = "";
    filtersEl.classList.add("is-hidden");
    filtersInitialised = true;
    return;
  }

  filtersEl.classList.remove("is-hidden");
  filtersEl.innerHTML = "";

  keys.forEach((key) => {
    const button = document.createElement("button");
    button.className = "filter-chip";
    button.type = "button";
    button.dataset.package = key;
    button.textContent = state.packages[key]?.title || key;
    filtersEl.appendChild(button);
  });

  if (!filtersInitialised) {
    filtersEl.addEventListener("click", (event) => {
      const chip = event.target.closest(".filter-chip");
      if (!chip) return;
      const pkgKey = chip.dataset.package;
      if (!state.packages[pkgKey]) return;
      setActivePackage(pkgKey);
    });
    filtersInitialised = true;
  }
}

function queueRender(task) {
  renderPromise = renderPromise.then(() => task()).catch((error) => {
    console.error("[channel-lists] Render failed:", error);
  });
  return renderPromise;
}

function setActivePackage(
  pkgKey,
  { preserveGroup = false, skipUrlUpdate = false } = {}
) {
  const pkg = state.packages[pkgKey];
  if (!pkg) {
    showErrorState("Channel list unavailable for this package.");
    return Promise.resolve();
  }

  state.currentPackage = pkgKey;

  if (!preserveGroup) {
    state.currentGroup = DEFAULT_GROUP;
  }

  if (!HIDE_PACKAGE_FILTERS && filtersEl) {
    updateActiveFilter(pkgKey);
  }

  return queueRender(() => renderPackage(pkg, { skipUrlUpdate }));
}

function renderCurrentPackage(options = {}) {
  if (!state.currentPackage) return Promise.resolve();
  const pkg = state.packages[state.currentPackage];
  if (!pkg) return Promise.resolve();
  return renderPackage(pkg, options);
}

function setActiveGroup(value) {
  state.currentGroup = sanitiseGroupValue(value);
  return queueRender(() => renderCurrentPackage({ skipUrlUpdate: true }));
}

function setSearchQuery(value) {
  state.searchQuery = value;
  return queueRender(() => renderCurrentPackage({ skipUrlUpdate: true }));
}

async function initialise() {
  showLoadingState();
  try {
    await loadChannelData();
    const keys = getAvailableKeys();
    if (!keys.length) {
      showErrorState("No channel packages available right now.");
      return;
    }

    initFilters(keys);

    const initialKey = resolveInitialPackage(keys);
    if (!initialKey) {
      showErrorState("Unable to determine a channel package to display.");
      return;
    }

    await setActivePackage(initialKey, { skipUrlUpdate: true });

    if (!HIDE_PACKAGE_FILTERS && filtersEl && keys.length > 1) {
      updateActiveFilter(initialKey);
    }

    if (searchEl) {
      searchEl.value = state.searchQuery;
    }
  } catch (error) {
    console.error("[channel-lists] Failed to load channel data:", error);
    showErrorState(
      "We couldn't load the channel spotlight data. Please refresh or contact support."
    );
  }
}

if (searchEl) {
  searchEl.addEventListener("input", (event) => {
    setSearchQuery(event.target.value || "");
  });

  searchEl.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.target.value = "";
      setSearchQuery("");
      event.target.blur();
    }
  });
}

initialise();
